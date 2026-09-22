# Contributing to AR-PMP-Question-Bank

Thanks for helping grow the bank! Every question must be **original**, **accurate**, and **validated**.

## Adding a question

1. Start from the template: copy `questions/_template.json`.
2. Give it a unique `id` following `DOMAIN-TASK-####` (e.g. `PROCESS-SCHEDULE-0007`).
3. Fill in every required field — see the JSON Schema at `schema/question.schema.json`.
4. **No verbatim copying.** Questions inspired by the AR course or TIA mock exams must
   be reworded and their origin cited in `source`.
5. Write the explanation AR-style: state the best answer, why it is best, and—where
   useful—why each distractor is wrong.
6. Save it under `questions/<domain>/<topic>/`.

## Rules of the bank

- Single best answer per question (`"type": "multiple-choice"`) unless it is a real
  multi-answer item (`"type": "multi-answer"`).
- `answer` is the **index (or indexes)** into `options` — valid, in-range, and unique.
- `source` should identify the AR course unit / section that the question maps to
  (e.g. `AR Udemy — Unit 3: The Mindset`).
- Tags follow a fixed vocabulary (agile, predictive, hybrid, risk, schedule, cost,
  quality, resources, communications, procurement, stakeholders, integration,
  mindset, conflict, leadership, exam-strategy). Need a new tag? Propose it in the PR.

## Workflow

```bash
node scripts/validate-questions.mjs            # run locally before pushing
git checkout -b feat/add-questions
git add questions/…
git commit -m "feat(questions): add <topic> questions"
git push -u origin feat/add-questions         # open a PR
```

CI runs the same validator on every push; a PR with invalid questions will not merge.

## Question quality checklist

- [ ] Scenario is realistic and matches the AR/PMBOK® style
- [ ] Only ONE defensible best answer (unless multi-answer)
- [ ] Explanation teaches the underlying concept, not just "A is correct"
- [ ] No copyrighted text copied verbatim
- [ ] `node scripts/validate-questions.mjs` passes