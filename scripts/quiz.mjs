#!/usr/bin/env node
/**
 * Interactive PMP quiz runner.
 *
 *   npm run quiz
 *   npm run quiz -- --count 10
 *   npm run quiz -- --domains people,process --count 5 --no-shuffle
 *
 * Answer with a letter ("a"), a number ("1"), or a comma list for multi-answer
 * ("a,c" / "1,3"). Type "q" to quit early.
 */
import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";
import {
  loadQuestions,
  selectQuestions,
  parseAnswer,
  isCorrect,
  buildSummary,
} from "./lib/quiz-engine.mjs";

function usage(message) {
  if (message) console.error(`✗ ${message}\n`);
  console.log(`Usage: npm run quiz -- [options]

Options:
  -n, --count <n>       Number of questions to present (default: all)
  -d, --domains <list>  Comma-separated domains: people,process,business-environment
      --no-shuffle      Present questions in file order
  -h, --help            Show this help`);
  process.exit(message ? 1 : 0);
}

function parseArgs(argv) {
  const opts = { count: 0, domains: [], doShuffle: true };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    const next = () => argv[++i];
    if (arg === "-h" || arg === "--help") usage();
    else if (arg === "-n" || arg === "--count") {
      const v = Number(next());
      if (!Number.isInteger(v) || v < 1) usage(`invalid --count value "${v}"`);
      opts.count = v;
    } else if (arg === "-d" || arg === "--domains") {
      opts.domains = next().split(",").map((s) => s.trim()).filter(Boolean);
    } else if (arg === "--no-shuffle") opts.doShuffle = false;
    else usage(`unknown argument "${arg}"`);
  }
  return opts;
}

const letter = (i) => String.fromCharCode(97 + i);
const shownText = (opt) => opt.replace(/^[a-h][.)]\s*/i, "");

async function main() {
  const opts = parseArgs(process.argv.slice(2));

  let all;
  try {
    all = loadQuestions();
  } catch (err) {
    console.error(`✗ Could not load questions: ${err.message}`);
    process.exit(1);
  }
  const questions = selectQuestions(all, opts);
  if (questions.length === 0) {
    console.error("✗ No questions found matching your criteria. Add questions under questions/ first.");
    process.exit(1);
  }
  console.log(`\n${questions.length} question(s) — ${opts.doShuffle ? "shuffled" : "in file order"}.\n`);

  const rl = createInterface({ input: stdin, output: stdout });
  const results = [];
  let quitEarly = false;

  for (const [qi, q] of questions.entries()) {
    const multi = q.type === "multi-answer";
    console.log(`Q${qi + 1}  [${q.domain}] ${q.task}  (id: ${q.id})`);
    if (q.stimulus) console.log(`    ${q.stimulus}`);
    console.log(`    ${q.question}\n`);
    q.options.forEach((opt, i) => console.log(`    ${letter(i)}) ${shownText(opt)}`));

    let selected = null;
    while (selected === null) {
      const prompt = `\n  Answer ${multi ? "(comma list allowed, e.g. a,c) " : ""}(a-${letter(q.options.length - 1)}, q to quit): `;
      const raw = await rl.question(prompt);
      if (raw === null || raw.trim().toLowerCase() === "q" || raw.trim().toLowerCase() === "quit") {
        quitEarly = true;
        break;
      }
      selected = parseAnswer(raw, q.options.length);
      if (selected === null) console.log("  ✗ Invalid answer. Try letters (a, b…) or numbers (1, 2…), comma-separated.");
    }
    if (quitEarly) break;

    const correct = isCorrect(q, selected);
    const answerIdx = Array.isArray(q.answer) ? q.answer : [q.answer];
    const answerText = answerIdx.map((i) => `${letter(i).toUpperCase()}: ${shownText(q.options[i])}`).join("; ");
    results.push({ question: q, selected, correct });

    console.log(`  ${correct ? "✓ Correct" : "✗ Incorrect"} — correct answer: ${answerText}\n`);
    console.log(`  ${q.explanation}\n`);
    console.log("  " + "-".repeat(60) + "\n");
  }

  rl.close();
  const summary = buildSummary(results);
  console.log(`Session complete${quitEarly ? " (quit early)" : ""}:`);
  console.log(`  Score: ${summary.correct}/${summary.total} (${summary.percentage}%)`);
  if (summary.missed.length > 0) {
    console.log(`  Missed: ${(summary.missed.map((m) => `${m.id} [${m.domain}]`)).join(", ")}`);
    console.log("  Review these ids in the questions/ folder and try again.");
  }
  console.log("");
}

main().catch((err) => {
  console.error(`✗ Unexpected error: ${err.message}`);
  process.exit(1);
});