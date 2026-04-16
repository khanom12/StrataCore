# StrataCore prototype

This repository now contains the first runnable local prototype for the StrataCore footing-inspection letter generator.

Current scope in this prototype:
- Next.js + TypeScript desktop-first web app scaffold
- plain landing page, form page, and preview page
- pure TypeScript generation logic outside React
- review flag handling for unresolved rule families
- seed-backed clause/rule usage
- DOCX export stub for the later template merge step

## Run locally

1. Install dependencies:

```bash
npm install
```

2. Start the prototype:

```bash
npm run dev
```

3. Open the app:

`http://localhost:3000`

4. Run the generator tests:

```bash
npm test
```

## Workflow

- `/` shows the seed-backed repo summary and routes into the workflow.
- `/form` captures the current structured inputs.
- `/preview` assembles the current draft, review flags, clause/rule trace, filename, and archive path.

## Notes

- The stable AUTO path is implemented first.
- Review-sensitive branches remain visible through review flags instead of being silently decided in code.
- DOCX export is intentionally stubbed so generation logic stays separate from export logic.
