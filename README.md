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
7. On `/form`, verify dependency behavior by toggling legal description, client job number, subdivision, garage mode, sulphate paragraph, and layered soil mode; hidden child fields should disappear and clear cleanly
8. Save a draft from `/form`, then confirm `/preview` shows the formatted draft first, with the right-aligned office/date shell, structured Re block, separated signoff labels, and a secondary analyst/debug panel
9. Click `Download DOCX` on `/preview` and expect a real `.docx` file to download
10. Compare the exported shell and preview spacing/alignment/signoff structure against the Victory reference standard
11. POST to `/api/generate` and expect normalized generation JSON
12. POST to `/api/export` and expect a DOCX attachment response

## Workflow

- `/` shows the seed-backed repo summary and routes into the workflow.
- `/form` captures the current structured inputs and can load the Victory Homes reference preset or the generic smoke-check preset.
- `/preview` shows the formatted draft first, a secondary analyst/debug panel, and the live DOCX download action.
- `/api/export` returns a first-pass DOCX generated from the composed document model.

## Dependency model

- Reveal / hide child inputs: client job number, legal description fields, subdivision, trench location, free-water context, garage offset/slab organics, sulphate class, and layered-soil children all follow one shared dependency matrix.
- Derived-only downstream logic: garage paragraph derivation and P4 advisory triggers stay generated from the current excavation/recommendation state instead of exposing duplicate operator overrides.
- Top-level document modes: standard FSI is the only active mode in V1; correction/rewrite and frost follow-up remain explicitly deferred whole-letter modes.
- Deferred/manual branches: garden suite and ground-heating branches stay preserved in the domain but out of the active V1 operator form until the office confirms the correct workflow.

## Reference standard

- The authoritative reference preset is `Victory Homes 2026`, pinned to the issued-example shell, filename/archive path, and signoff pattern.

## Known limitations

- The stable AUTO path is implemented first.
- Review-sensitive branches remain visible through review flags instead of being silently decided in code.
- DOCX export is code-generated and materially closer to the office shell, but final logo/stamp assets and template-perfect pagination are still out of scope.
- Engineer stamp and permit-to-practice assets are still text placeholders until the real office image assets are added.
- Review-only edge families such as engineered fill by others / unknown, rare remediation packages, and spread-footing conflicts remain intentionally deferred for analyst review.
- Correction/rewrite and frost follow-up whole-letter modes remain intentionally deferred.
