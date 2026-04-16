# StrataCore dev starter

## Recommendation
Build the first release as a **desktop-first internal web app** that generates a **DOCX letter** for review, signature, printing, and filing.

Do **not** start with a native iPadOS app.

Why:
- the current target workflow is the **report-writing end** of the process, not the field-capture app
- the output must remain **Word-first**
- the tool will likely be used on office desktops/laptops first
- a web app can still be used on an iPad browser later, and can become a PWA if needed

## Build strategy
Treat the workbook as a **rule source**, not as the app itself.

Start development now, but split scope into:
1. **AUTO core** — safe to generate directly
2. **REVIEW branches** — generate with visible warning badges / review flags
3. **V2 deferred** — exclude from first release UI

## First milestone
Ship a local prototype that can:
- collect metadata + P1/P2/P3/P4/P5/P6/P7 inputs
- generate paragraph text and review flags
- preview the assembled letter sections
- export a DOCX based on a template
- show filename + archive path using hidden H number

## Suggested stack
- **App medium:** web app
- **Shape:** desktop-first, internal, local-first
- **Framework:** Next.js + TypeScript
- **Persistence for first pass:** file-based seed data or SQLite
- **Core logic:** pure TypeScript rule engine, separate from UI
- **Export:** DOCX template merge on the server side

## First repo structure
\`\`\`
/AGENTS.md
/docs/
  workbook-notes.md
  review-queue.md
/src/
  app/
    page.tsx
    preview/page.tsx
    api/generate/route.ts
  components/
    form/
    preview/
  lib/
    schema/
      input-model.ts
      clauses.ts
      rules.ts
    rules/
      generate-letter.ts
      section-p1.ts
      section-p2.ts
      section-p3.ts
      section-p4.ts
      section-p5.ts
      section-p6.ts
      section-p7.ts
    export/
      build-docx.ts
      build-filename.ts
    review/
      flags.ts
  types/
    domain.ts
/tests/
  gold-cases/
  rules/
\`\`\`

## First working slice
Implement these in order:
1. metadata/top block
2. standard P1 intro
3. P2 base excavation + garage mode + walkout
4. P3 single-layer native + engineered-fill-over-native
5. P4 standard/modified recommendation + current 140 kPa default branch
6. P5 derived garage paragraph
7. P6 sulphate optional paragraph
8. P7 winter paragraph
9. filename/archive-path generation
10. DOCX export

## What to postpone
Keep out of the first UI:
- correction / rewrite letters
- pile / GGB families
- uncontrolled fill mode
- client self-booking
- field inspection capture app


## Seed data included
The starter pack also includes a `seed/` folder with JSON and CSV exports from the workbook so you can feed Codex machine-readable inputs instead of a raw spreadsheet. Use these files as the initial source for:
- scope
- inputs
- clauses
- rules
- review queue

Recommended use:
- start from `seed/auto_core_rules.json` and `seed/auto_core_clauses.json`
- keep `seed/review_rules.json` and `seed/review_log.json` visible, but do not silently hardcode them

## How to use this starter
1. Create a fresh repo.
2. Copy `AGENTS.md` into the repo root.
3. Copy `domain-contracts.ts` into `/src/types/domain.ts`.
4. Open the repo with Codex in VS Code, the Codex app, or Codex CLI.
5. Use the prompt file `CODEX_FIRST_PASS_PROMPTS.md` one prompt at a time.
6. Commit after each milestone.
