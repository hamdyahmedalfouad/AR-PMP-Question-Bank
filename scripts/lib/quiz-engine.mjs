/**
 * Quiz engine — pure, testable logic for scripts/quiz.mjs.
 * Zero dependencies; shares the same file-walking rules as the validator.
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, dirname, extname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const REPO_ROOT = resolve(join(dirname(fileURLToPath(import.meta.url)), "..", ".."));

/** Walk a directory and collect every question object from *.json files (skipping "_*"). */
export function loadQuestions(dir = join(REPO_ROOT, "questions")) {
  const questions = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      questions.push(...loadQuestions(full));
      continue;
    }
    if (extname(entry) !== ".json" || entry.startsWith("_")) continue;
    const parsed = JSON.parse(readFileSync(full, "utf8"));
    if (Array.isArray(parsed)) questions.push(...parsed);
    else questions.push(parsed);
  }
  return questions;
}

/** Fisher–Yates shuffle; returns a NEW array, never mutates input. */
export function shuffle(arr, rng = Math.random) {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/**
 * Filter by domains, optionally shuffle, then take up to `count`.
 * count=0 or undefined → keep them all.
 */
export function selectQuestions(questions, { count = 0, domains = [], doShuffle = true, rng } = {}) {
  let pool = questions;
  if (domains.length > 0) {
    pool = pool.filter((q) => domains.includes(q.domain));
  }
  if (doShuffle) pool = shuffle(pool, rng);
  return count > 0 ? pool.slice(0, count) : pool;
}

/**
 * Parse user input into an array of option indexes.
 * Accepts "a", "A", "1", "a,c", "1,3", "A. text" (prefix tolerated).
 * Returns null when any token is invalid or out of range.
 */
export function parseAnswer(input, optionCount) {
  if (typeof input !== "string") return null;
  const tokens = input.trim().toLowerCase().split(",");
  const indexes = [];
  for (const raw of tokens) {
    const token = raw.trim();
    if (token === "") return null;
    let idx;
    if (/^[1-9]\d*$/.test(token)) {
      idx = Number(token) - 1;
    } else if (/^[a-h]$/.test(token)) {
      idx = token.charCodeAt(0) - 97;
    } else {
      const letter = token.match(/^([a-h])\b/);
      if (!letter) return null;
      idx = letter[1].charCodeAt(0) - 97;
    }
    if (idx < 0 || idx >= optionCount) return null;
    indexes.push(idx);
  }
  const unique = [...new Set(indexes)];
  return unique.length === indexes.length ? unique : null;
}

/** Compare a selection (list of indexes) against a question's answer. */
export function isCorrect(question, selectedIndexes) {
  const answer = Array.isArray(question.answer) ? [...question.answer].sort((a, b) => a - b) : [question.answer];
  const selected = [...selectedIndexes].sort((a, b) => a - b);
  return answer.length === selected.length && answer.every((v, i) => v === selected[i]);
}

/** Turn a list of { question, selected } results into a session summary. */
export function buildSummary(results) {
  const correct = results.filter((r) => r.correct).length;
  const missed = results
    .filter((r) => !r.correct)
    .map((r) => ({ id: r.question.id, domain: r.question.domain, task: r.question.task }));
  return {
    total: results.length,
    correct,
    missed,
    percentage: results.length === 0 ? 0 : Math.round((correct / results.length) * 100),
  };
}