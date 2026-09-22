# Questions

This directory is the bank. One JSON file per domain/topic, one JSON object per question.

## Layout

```
questions/
└── <domain>/              # people | process | business-environment
    └── <topic>/           # e.g. conflict, scope, risk
        └── <file>.json    # array of question objects (or a single object)
```

Files whose name starts with `_` (e.g. `_template.json`) are ignored by the
validator — use them as scratch or templates.

## Rules

- Every file is validated by `node scripts/validate-questions.mjs` (and in CI).
- IDs are unique across the whole bank: `DOMAIN-TASK-####`.
- `answer` is an index into `options`; `multi-answer` uses an array of indexes.
- Questions must be original; the AR course / TIA mock exam influence goes in
  the `source` field, never copied verbatim.
- Add a new topic folder when you have 5+ questions on it; otherwise co-locate
  with the nearest existing topic.