#!/usr/bin/env node
/**
 * AR-PMP-Question-Bank validator.
 *
 * Zero-dependency Node script. Walks every *.json file under `questions/`
 * (skipping files whose name starts with `_`) and checks it against the
 * rules declared in schema/question.schema.json.
 *
 * Usage:
 *   node scripts/validate-questions.mjs
 *   node scripts/validate-questions.mjs questions/people/conflict.json
 */

import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, resolve, extname, basename } from "node:path";

const DOMAINS = ["people", "process", "business-environment"];
const TYPES = ["multiple-choice", "multi-answer"];
const DIFFICULTIES = ["easy", "medium", "hard"];
const TAGS = [
  "agile", "predictive", "hybrid", "mindset", "exam-strategy",
  "integration", "scope", "schedule", "cost", "quality",
  "resources", "communications", "risk", "procurement", "stakeholders",
  "conflict", "leadership", "ethics",
];
const REQUIRED_FIELDS = [
  "id", "domain", "task", "type", "question",
  "options", "answer", "explanation", "source",
];
const ID_PATTERN = /^[A-Z0-9]+-[A-Z0-9]+(-[A-Z0-9]+)*-\d{4,}$/;

const seenIds = new Set();
let fileCount = 0;
let errorCount = 0;

function fail(file, message) {
  console.error(`  ✗ ${file}: ${message}`);
  errorCount += 1;
}

function walk(dir) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      walk(full);
    } else if (extname(entry) === ".json" && !entry.startsWith("_")) {
      validateFile(full);
    }
  }
}

function validateFile(file) {
  fileCount += 1;
  let q;
  try {
    q = JSON.parse(readFileSync(file, "utf8"));
  } catch (err) {
    fail(file, `unparseable JSON: ${err.message}`);
    return;
  }

  for (const field of REQUIRED_FIELDS) {
    if (q[field] === undefined) fail(file, `missing required field "${field}"`);
  }

  if (typeof q.id !== "string" || !ID_PATTERN.test(q.id)) {
    fail(file, `id "${q.id}" must match ${ID_PATTERN}`);
  } else if (seenIds.has(q.id)) {
    fail(file, `duplicate id "${q.id}"`);
  } else {
    seenIds.add(q.id);
  }

  if (!DOMAINS.includes(q.domain)) fail(file, `domain "${q.domain}" must be one of ${DOMAINS.join(", ")}`);
  if (!TYPES.includes(q.type)) fail(file, `type "${q.type}" must be one of ${TYPES.join(", ")}`);

  if (typeof q.question !== "string" || q.question.trim().length < 10) {
    fail(file, "question must be a non-empty string (>= 10 chars)");
  }

  if (!Array.isArray(q.options) || q.options.length < 2 || q.options.length > 6) {
    fail(file, "options must be an array of 2–6 strings");
  } else {
    q.options.forEach((opt, i) => {
      if (typeof opt !== "string" || opt.trim().length === 0) {
        fail(file, `options[${i}] must be a non-empty string`);
      }
    });
  }

  const answers = Array.isArray(q.answer) ? q.answer : [q.answer];
  for (const a of answers) {
    if (!Number.isInteger(a) || a < 0 || a >= (Array.isArray(q.options) ? q.options.length : 0)) {
      fail(file, `answer index ${a} out of range for ${q.options?.length ?? 0} options`);
    }
  }
  if (Array.isArray(q.answer)) {
    if (new Set(q.answer).size !== q.answer.length) fail(file, "multi-answer: duplicate answer indexes");
    if (q.type !== "multi-answer") fail(file, `answer is an array but type is "${q.type}"`);
  } else if (q.type === "multi-answer") {
    fail(file, "multi-answer requires answer to be an array of indexes");
  }

  if (typeof q.explanation !== "string" || q.explanation.trim().length < 20) {
    fail(file, "explanation must be a string (>= 20 chars)");
  }
  if (typeof q.source !== "string" || q.source.trim().length === 0) {
    fail(file, "source must be a non-empty string");
  }
  if (q.difficulty !== undefined && !DIFFICULTIES.includes(q.difficulty)) {
    fail(file, `difficulty "${q.difficulty}" must be one of ${DIFFICULTIES.join(", ")}`);
  }
  if (q.tags !== undefined) {
    if (!Array.isArray(q.tags) || new Set(q.tags).size !== q.tags.length) {
      fail(file, "tags must be an array of unique strings");
    } else {
      for (const t of q.tags) {
        if (!TAGS.includes(t)) fail(file, `unknown tag "${t}" — add it to TAGS in scripts/validate-questions.mjs and schema/question.schema.json`);
      }
    }
  }
}

const targets = process.argv.slice(2);
if (targets.length === 0) {
  walk(resolve(process.cwd(), "questions"));
} else {
  for (const t of targets) validateFile(resolve(process.cwd(), t));
}

const summary = `${fileCount} file(s), ${errorCount} error(s)`;
if (errorCount > 0) {
  console.error(`\n✗ Validation failed — ${summary}`);
  process.exit(1);
}
console.log(`✓ Validation passed — ${summary}`);