/**
 * Unit tests for scripts/validate-questions.mjs.
 * Spawns the validator against temp fixture trees and asserts exit codes.
 */
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, writeFileSync, mkdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const validator = join(root, "validate-questions.mjs");

function runValidator(tree) {
  const dir = mkdtempSync(join(tmpdir(), "arv-"));
  for (const [relPath, content] of Object.entries(tree)) {
    const full = join(dir, relPath);
    mkdirSync(dirname(full), { recursive: true });
    writeFileSync(full, typeof content === "string" ? content : JSON.stringify(content, null, 2));
  }
  try {
    const stdout = execFileSync(process.execPath, [validator], { cwd: dir, encoding: "utf8" });
    return { code: 0, stdout };
  } catch (err) {
    rmSync(dir, { recursive: true, force: true });
    // execFileSync throws with .status on non-zero exit
    if (err.status !== undefined) return { code: err.status, stdout: err.stdout };
    throw err;
  }
}

const validQuestion = {
  id: "PEOPLE-CONFLICT-0001",
  domain: "people",
  task: "Manage conflict",
  type: "multiple-choice",
  question: "Two team members disagree on the best technical approach and the debate is slowing the sprint. What should the project manager do first?",
  options: [
    "A. Assign the work to one team member",
    "B. Facilitate a discussion between the two team members",
    "C. Escalate to the project sponsor",
    "D. Ask the team to vote on the approach"
  ],
  answer: 1,
  explanation: "The project manager should facilitate a discussion to help the team members resolve the disagreement, keeping the team self-organizing. Assigning work, escalating, or voting sidesteps the conflict instead of resolving it.",
  source: "AR Udemy — Unit 3: Mindset (original, modeled)",
  difficulty: "medium",
  tags: ["conflict", "agile"]
};

describe("validate-questions.mjs", () => {
  test("accepts a valid question file", () => {
    const { code, stdout } = runValidator({ "questions/people/conflict/a.json": validQuestion });
    assert.equal(code, 0);
    assert.match(stdout, /Validation passed/);
  });

  test("rejects a duplicate id across files", () => {
    const { code } = runValidator({
      "questions/people/conflict/a.json": validQuestion,
      "questions/process/scope/b.json": { ...validQuestion, id: "PEOPLE-CONFLICT-0001", domain: "process" },
    });
    assert.equal(code, 1);
  });

  test("rejects an out-of-range answer index", () => {
    const bad = { ...validQuestion, answer: 9 };
    const { code } = runValidator({ "questions/a.json": bad });
    assert.equal(code, 1);
  });

  test("rejects multi-answer with a scalar answer", () => {
    const bad = { ...validQuestion, type: "multi-answer", answer: 1 };
    const { code } = runValidator({ "questions/a.json": bad });
    assert.equal(code, 1);
  });

  test("rejects unknown tags and unknown domain", () => {
    const badTags = { ...validQuestion, tags: ["nope"] };
    assert.equal(runValidator({ "questions/a.json": badTags }).code, 1);
    const badDomain = { ...validQuestion, domain: "magic" };
    assert.equal(runValidator({ "questions/a.json": badDomain }).code, 1);
  });

  test("ignores files starting with underscore", () => {
    const bad = { ...validQuestion, answer: 99 };
    const { code } = runValidator({ "questions/_template.json": bad });
    assert.equal(code, 0);
  });

  test("rejects invalid JSON", () => {
    const { code } = runValidator({ "questions/a.json": "{not json" });
    assert.equal(code, 1);
  });

  test("rejects missing required field", () => {
    const { question, ...missing } = validQuestion;
    const { code } = runValidator({ "questions/a.json": missing });
    assert.equal(code, 1);
  });
});