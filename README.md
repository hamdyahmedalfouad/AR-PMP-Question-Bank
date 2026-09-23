# AR-PMP-Question-Bank — PMP Exam Architect

A self-contained PMP® practice app: **296 questions** with instant explanations, a
performance dashboard, review mode, bookmarks, an exam simulator, and CSV export —
all in **one standalone HTML file** that works offline (double-click it) and is
also hosted **100% free** on GitHub Pages.

Built around the domain structure of the [Andrew Ramdayal (AR) PMP Exam Prep course](https://www.udemy.com/course/pmp-certification-exam-prep-seminar/),
with every question written in our own words and a `source`-style provenance
(`section` + `difficulty`) recorded in the data.

## Live app

**https://hamdyahmedalfouad.github.io/AR-PMP-Question-Bank/**

## Features

| Feature | Details |
| --- | --- |
| Question bank | 296 validated questions across 24 PM sections, 4 difficulties (Easy / Medium / Hard / PMP Real Exam) |
| Practice modes | Filtered quiz (by section + difficulty), Full bank, Review (missed queue), Bookmarks, **Exam Simulator (180 Q / 230 min countdown, auto-submit)** |
| Multi-answer | `correct_answer` supports a single index **or an array** — multi-select questions flag themselves and require a Submit step |
| Instant rationale | Every question shows an explanation after answering |
| Performance dashboard | KPIs, accuracy band, per-difficulty & per-section breakdowns (accuracy computed on **answered** questions only) |
| Keyboard | `A–D` / `1–4` select an option, `←` / `→` navigate |
| Offline-ready | Tailwind CSS + Inter font are inlined by the build — zero CDN dependencies |
| **Download app (HTML)** | One click on the dashboard downloads the **entire app as a single HTML file** (`PMP-Question-Bank.html`) — all 296 questions + styles + fonts included, works offline by double-click |
| Export | Full bank or review queue as CSV (Excel-compatible, BOM + quoted cells) |
| Persistence | Your progress, missed queue, and bookmarks live in `localStorage` — nothing leaves your machine |

## Run it

```bash
# Live-reload dev server for editing (or just double-click index.html)
npx serve .

# Rebuild standalone index.html after editing (regenerates inlined CSS + font)
npm run build

# Automated checks: validate bank + unit tests
npm run validate && npm test
```

> Edit `index.html` directly — it is the source of truth. After adding or changing
> Tailwind classes, run `npm run build` once to refresh the inlined stylesheet.

## Question format (embedded bank, `questionBank` in index.html)

```js
{
  "id": "PMP-137",                       // unique, stable ID (never rename — progress keys off it)
  "section": "Project",                  // matches the dashboard section filter
  "difficulty": "Medium",                // Easy | Medium | Hard | PMP Real Exam
  "question_text": "Which of the following …",
  "options": ["…", "…", "…", "…"],
  "correct_answer": [0, 1, 3],           // single int OR array of ints (multi-answer)
  "explanation": "Why this is correct…"
}
```

Rules: 4 options per question; IDs are `PMP-###`; add new questions at the end of
the array (or reuse a deleted ID like `PMP-137`–`PMP-140`, which are filled);
never rename an existing ID or edit existing `correct_answer` without bumping the
question content — saved history is keyed by ID.

## Repository layout

```
.
├── index.html                # The entire app + embedded question bank (standalone, offline)
├── assets/fonts/             # Inter variable font, inlined at build time
├── scripts/
│   ├── build-standalone.mjs  # npm run build — inlines Tailwind CSS + font, strips CDN refs
│   ├── quiz.mjs              # (optional) zero-dependency CLI quiz for the JSON bank below
│   ├── validate-questions.mjs# (optional) validator for the JSON bank below
│   └── test/                 # unit tests for the tooling
├── questions/                # (optional) the same bank as validated JSON, one file per topic
├── schema/question.schema.json
├── tailwind.config.js        # mirror of the app's original inline Tailwind config
└── .github/workflows/
    ├── pages.yml             # builds + deploys index.html to GitHub Pages
    └── validate.yml          # CI: validates questions + runs unit tests on push/PR
```

## Roadmap

- [x] Standalone single-file app + GitHub Pages hosting (free)
- [x] Multi-answer support, keyboard navigation, exam simulator, bookmarks, CSV export
- [x] Accuracy-on-answered metrics fix, ID gaps `PMP-137–140` filled (+2 new multi-answer questions)
- [ ] Grow the bank from the remaining section study PDFs (4 questions per concept)
- [ ] Web/Anki export of the full bank

## License

MIT — see [LICENSE](LICENSE). PMP and PMBOK are registered marks of the Project
Management Institute; this project is an independent study tool and is not
affiliated with or endorsed by PMI.