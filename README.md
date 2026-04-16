# StrataCore prototype

This repository contains the current local-first prototype for the StrataCore footing-inspection letter generator.

Current scope in this prototype:
- Next.js + TypeScript desktop-first web app scaffold
- plain landing page, form page, and preview page
- pure TypeScript generation logic outside React
- pure TypeScript document-composition layer between generation and preview/export
- pure TypeScript dependency model for reveal/hide inputs, cleanup, and derived-only rules
- review flag handling for unresolved rule families
- seed-backed clause/rule usage
- first-pass DOCX export built from the composed letter shell
- explicit reference presets, including the Victory Homes 2026 issued-example fixture
- historical output letters used as regression fixtures for real JR Paine wording and shell fidelity

## Run locally

1. Install dependencies:

```bash
npm install
```

2. Run the tests:

```bash
npm test
```

3. Run a production build check:

```bash
npm run build
```

4. Start the app:

```bash
npm run dev
```

## Local smoke checklist

1. Run `npm install`
2. Run `npm test`
3. Run `npm run build`
4. Run `npm run dev`
5. Open `/form` and `/preview` in the local Next.js URL shown in the terminal
6. On `/form`, load `Victory Homes 2026`
7. On `/form`, verify dependency behavior by toggling legal description mode, client job number, subdivision, garage mode, sulphate paragraph, water issue mode, and layered soil mode; hidden child fields should disappear and clear cleanly
8. Save a draft from `/form`, then confirm `/preview` shows the formatted draft first, with the centered JR Paine identity block, right-aligned office/date shell, structured Re block, continuation header, separated signoff lines, and a secondary analyst/debug panel
9. Click `Download DOCX` on `/preview` and expect a real `.docx` file to download
10. Compare the exported shell and preview spacing/alignment/signoff structure against the Victory reference standard and the historical letters in `reference-letters/legacy`
11. POST to `/api/generate` and expect normalized generation JSON
12. POST to `/api/export` and expect a DOCX attachment response

## Workflow

- `/` shows the seed-backed repo summary and routes into the workflow.
- `/form` captures the current structured inputs and can load the Victory Homes reference preset or the generic smoke-check preset.
- `/preview` shows the formatted draft first, a secondary analyst/debug panel, and the live DOCX download action.
- `/api/export` returns a first-pass DOCX generated from the composed document model.

## Dependency model

- Reveal / hide child inputs: client job number, single-lot vs custom legal description fields, subdivision, trench location, water-issue depth/drainage fields, garage offset/slab organics, sulphate class, and layered-soil children all follow one shared dependency matrix.
- Derived-only downstream logic: garage paragraph derivation and P4 advisory triggers stay generated from the current excavation/recommendation state instead of exposing duplicate operator overrides.
- Top-level document modes: standard FSI is the only active mode in V1; correction/rewrite and frost follow-up remain explicitly deferred whole-letter modes.
- Deferred/manual branches: ground-heating and other review-only edge branches stay preserved in the domain until the office confirms the exact wording family.

## Reference standard

- The authoritative reference preset is `Victory Homes 2026`, pinned to the issued-example shell, filename/archive path, and signoff pattern.
- Historical output letters in `reference-letters/legacy/` are part of the regression strategy. Add a matching manifest entry in `src/lib/reference-cases/legacy-output-cases.ts` when a new legacy letter is added.
- The lightweight operating note for those fixtures lives in `docs/legacy-output-cases/README.md`.

## Rules-based fixture workflow

- The working ruleset, clause bank, and decision surfaces remain the source of truth for generation behavior.
- Historical letters validate the system, expose wording gaps, and improve regression coverage.
- Historical letters do not silently override the rule system. If a historical sample conflicts with the current rule surfaces, keep the case review-sensitive until the rule surfaces are updated explicitly.

When adding a new historical reference:
- Place the source document in `reference-letters/legacy/`.
- Add or update the manifest and `formState` fixture in `src/lib/reference-cases/legacy-output-cases.ts`.
- Classify the case honestly as `supported`, `partial`, `unsupported`, or `pending-file`.
- Add or update focused semantic regression tests under `tests/legacy-output-cases/`, `tests/gold-cases/`, or the closest shell/export test file.
- Add DOCX-level assertions when the case proves a shell/signoff/export behavior rather than a paragraph-only wording branch.

## Known limitations

- The stable AUTO path is implemented first.
- Review-sensitive branches remain visible through review flags instead of being silently decided in code.
- DOCX export is code-generated and materially closer to the office shell, but final logo/stamp assets and template-perfect pagination are still out of scope.
- Historical cases marked `partial` in the legacy-output matrix still need tighter wording fidelity before they should be treated as fully office-equivalent.
- Review-only edge families such as engineered fill by others / unknown, rare remediation packages, and spread-footing conflicts remain intentionally deferred for analyst review.
- Correction/rewrite and frost follow-up whole-letter modes remain intentionally deferred.
