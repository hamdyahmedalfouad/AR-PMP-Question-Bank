# AR-PMP-Question-Bank

A community-maintained PMP® question bank built around the popular [Andrew Ramdayal (AR) PMP Exam Prep course on Udemy](https://www.udemy.com/course/pmp-certification-exam-prep-seminar/).

The bank stores every question as structured, versioned JSON: scenario, options, correct answer, and AR-style explanations ("why this is the best answer, why the others are wrong") — all organized by PMBOK® Guide domain, so it is easy to review, extend, and reuse.

## Why structured JSON?

| Goal | How the format helps |
| --- | --- |
| Review & study | Questions can be rendered by any tool; explanations travel with each question |
| Independence | JSON is tool-agnostic — render in a web app, Anki, CLI quiz, or flashcards |
| Quality | Every file is validated against `schema/question.schema.json` in CI before merge |
| Provenance | Each question records its source (AR course unit, TIA mock exam style, etc.) |

## Repository layout

```
.
├── questions/          # The question bank — one JSON file per domain/topic
├── schema/             # JSON Schema that every question file must satisfy
├── scripts/            # Validation tooling (zero-dependency Node)
├── .github/workflows/  # CI: validates all questions on push & PR
├── CONTRIBUTING.md     # How to add or edit questions
└── README.md
```

## Question format

A single question looks like this (see `questions/_template.json` for the full shape):

```json
{
  "id": "PEOPLE-MANAGE-CONFLICT-0001",
  "domain": "people",
  "task": "Manage conflict",
  "question": "During a sprint, two team members disagree...",
  "options": ["Escalate to the project sponsor", "Facilitate a discussion", "...", "..."],
  "answer": 1,
  "explanation": "The PM should act as a facilitator...",
  "source": "AR Udemy — Unit 3: Mindset",
  "tags": ["agile", "conflict", "mindset"]
}
```

## Getting started

```bash
# Validate the whole bank (requires Node 18+)
node scripts/validate-questions.mjs

# Validate a single file
node scripts/validate-questions.mjs questions/path/to/file.json
```

## Roadmap

- [ ] Seed initial question set (mindset + first AR units)
- [ ] CLI quiz runner (`npm run quiz`)
- [ ] Web/Anki export
- [ ] Progress tracking & missed-question review

## License & disclaimer

PMP is a registered trademark of the Project Management Institute, Inc. This project is an independent study aid. The questions are original; where questions are inspired by the AR course or TIA mock exams, they are cited in the `source` field of each entry and should **not** be copied verbatim from copyrighted materials.

Code, schema, and tooling: [MIT](LICENSE).