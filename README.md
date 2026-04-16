# StrataCore prototype

This repository contains the current local-first prototype for the StrataCore footing-inspection letter generator.

Current scope in this prototype:
- Next.js + TypeScript desktop-first web app scaffold
- plain landing page, form page, and preview page
- pure TypeScript generation logic outside React
- pure TypeScript document-composition layer between generation and preview/export
- review flag handling for unresolved rule families
- seed-backed clause/rule usage
- first-pass DOCX export built from the composed letter shell

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
6. Save a draft from `/form`, then confirm `/preview` shows export readiness, review flags/trace, and the composed draft pages
7. Click `Download DOCX` on `/preview` and expect a real `.docx` file to download
8. POST to `/api/generate` and expect normalized generation JSON
9. POST to `/api/export` and expect a DOCX attachment response

## Workflow

- `/` shows the seed-backed repo summary and routes into the workflow.
- `/form` captures the current structured inputs.
- `/preview` shows the analyst/debug panel, the composed draft shell, and the live DOCX download action.
- `/api/export` returns a first-pass DOCX generated from the composed document model.

## Notes

- The stable AUTO path is implemented first.
- Review-sensitive branches remain visible through review flags instead of being silently decided in code.
- DOCX export is code-generated, not template-perfect yet.
- Office address/footer branding and some engineer asset details still use typed placeholders until the exact assets are confirmed.
