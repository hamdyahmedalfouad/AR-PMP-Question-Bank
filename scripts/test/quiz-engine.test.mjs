/**
 * Unit tests for scripts/lib/quiz-engine.mjs.
 */
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync, mkdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  loadQuestions,
  shuffle,
  selectQuestions,
  parseAnswer,
  isCorrect,
  buildSummary,
} from "../lib/quiz-engine.mjs";

const question = (overrides = {}) => ({
  id: "PROCESS-SCHEDULE-0001",
  domain: "process",
  task: "Develop schedule",
  type: "multiple-choice",
  question: "Which output of the Develop Schedule process is a common input to many other processes?",
  options: ["A. Project charter", "B. Schedule baseline", "C. Risk register", "D. Lessons learned"],
  answer: 1,
  explanation: "The schedule baseline is the approved version of the schedule model used as a basis for comparison.",
  source: "test",
  ...overrides,
});

describe("loadQuestions", () => {
  test("collects questions from nested dirs, skipping underscore files", () => {
    const dir = mkdtempSync(join(tmpdir(), "art-"));
    try {
      mkdirSync(join(dir, "process", "schedule"), { recursive: true });
      writeFileSync(join(dir, "process", "schedule", "a.json"), JSON.stringify([question()]));
      writeFileSync(join(dir, "process", "schedule", "_template.json"), JSON.stringify({ bad: true }));
      const qs = loadQuestions(dir);
      assert.equal(qs.length, 1);
      assert.equal(qs[0].id, "PROCESS-SCHEDULE-0001");
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  test("handles a single-object file as well as arrays", () => {
    const dir = mkdtempSync(join(tmpdir(), "art-"));
    try {
      writeFileSync(join(dir, "one.json"), JSON.stringify(question({ id: "PEOPLE-LEADERSHIP-0001", domain: "people" })));
      writeFileSync(join(dir, "two.json"), JSON.stringify([question(), question({ id: "PEOPLE-LEADERSHIP-0002" })]));
      assert.equal(loadQuestions(dir).length, 3);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});

describe("shuffle", () => {
  test("returns a new array with same elements and does not mutate input", () => {
    const input = [1, 2, 3, 4, 5];
    const out = shuffle(input, () => 0.2);
    assert.notEqual(out, input);
    assert.deepEqual([...out].sort(), input);
    assert.deepEqual(input, [1, 2, 3, 4, 5]); // unchanged
  });
});

describe("selectQuestions", () => {
  const qs = [
    question({ id: "P1", domain: "people" }),
    question({ id: "P2", domain: "process" }),
    question({ id: "B1", domain: "business-environment" }),
  ];

  test("filters by domain", () => {
    const out = selectQuestions(qs, { domains: ["people"], doShuffle: false });
    assert.deepEqual(out.map((q) => q.id), ["P1"]);
  });

  test("respects count", () => {
    const out = selectQuestions(qs, { count: 2, doShuffle: false });
    assert.equal(out.length, 2);
  });

  test("shuffles with a deterministic rng", () => {
    const rng = () => 0.5;
    const out = selectQuestions(qs, { count: 3, rng, doShuffle: true });
    assert.equal(out.length, 3);
    assert.deepEqual(new Set(out.map((q) => q.id)), new Set(["P1", "P2", "B1"]));
  });
});

describe("parseAnswer", () => {
  test("accepts letters, numbers, uppercase, and A. prefixes", () => {
    assert.deepEqual(parseAnswer("a", 4), [0]);
    assert.deepEqual(parseAnswer("B", 4), [1]);
    assert.deepEqual(parseAnswer("3", 4), [2]);
    assert.deepEqual(parseAnswer("A. text", 4), [0]);
  });

  test("accepts comma lists for multi-answer", () => {
    assert.deepEqual(parseAnswer("a,c", 4), [0, 2]);
    assert.deepEqual(parseAnswer("1,3", 4), [0, 2]);
  });

  test("rejects out-of-range and duplicated tokens", () => {
    assert.equal(parseAnswer("z", 4), null);
    assert.equal(parseAnswer("5", 4), null);
    assert.equal(parseAnswer("a,a", 4), null);
    assert.equal(parseAnswer("", 4), null);
  });
});

describe("isCorrect", () => {
  test("single answer", () => {
    assert.equal(isCorrect(question({ answer: 1 }), [1]), true);
    assert.equal(isCorrect(question({ answer: 1 }), [0]), false);
  });

  test("multi-answer — exact set, order independent", () => {
    const q = question({ type: "multi-answer", answer: [0, 2] });
    assert.equal(isCorrect(q, [2, 0]), true);
    assert.equal(isCorrect(q, [0]), false); // incomplete
    assert.equal(isCorrect(q, [0, 1]), false); // wrong member
  });
});

describe("buildSummary", () => {
  test("computes score, percentage, and missed list", () => {
    const q1 = question();
    const q2 = question({ id: "P2" });
    const summary = buildSummary([
      { question: q1, selected: [1], correct: true },
      { question: q2, selected: [0], correct: false },
    ]);
    assert.equal(summary.total, 2);
    assert.equal(summary.correct, 1);
    assert.equal(summary.percentage, 50);
    assert.deepEqual(summary.missed, [{ id: "P2", domain: "process", task: "Develop schedule" }]);
  });

  test("empty session does not divide by zero", () => {
    const summary = buildSummary([]);
    assert.equal(summary.percentage, 0);
    assert.equal(summary.total, 0);
  });
});