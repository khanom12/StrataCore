# Codex prompts for the first pass

Use these one at a time.

---

## Prompt 1 — scaffold the repo
Create a local-first MVP for the StrataCore footing-inspection letter generator using Next.js and TypeScript.

Requirements:
- desktop-first internal web app
- no auth yet
- no database required yet; use in-repo seed data or mock data
- create a form screen, a preview screen, and a generate endpoint stub
- create a pure rule-engine layer separate from UI
- create placeholders for P1 to P7 and signoff/archive path
- do not implement visual polish yet
- add a clean README with run instructions

Use the AGENTS.md instructions in this repo.

---

## Prompt 2 — create domain contracts
Create typed domain contracts for:
- FormState
- SectionId
- GeneratedParagraph
- ReviewFlag
- GenerationResult
- ClauseRef
- RuleRef

Also add a minimal seed-data structure for clauses and rules so the rule engine can reference ids even before all text is finalized.

---

## Prompt 3 — implement the first working generation slice
Implement generation for:
- metadata/top block
- P1 standard intro
- P2 base excavation sentence + standard cut range
- P3 single-layer native soil path
- P4 standard footing recommendation + 140 kPa spread-footing sentence as the current working default
- P7 winter paragraph
- filename/archive path using hidden H number

For ambiguous logic, emit review flags instead of silently deciding.

---

## Prompt 4 — add P2/P5 garage derivation
Implement garage derivation rules:
- if garage mode is not None, P5 must appear
- if P4 is standard, P5 must use standard garage wording
- if P4 is modified, P5 must use modified garage wording
- no UI option should allow the garage paragraph to be manually suppressed when garage exists

Add tests.

---

## Prompt 5 — add P3 layered soil mode
Implement:
- single-layer mode
- engineered-fill-over-native mode
- native-deposit wording only when soil is native
- engineered-fill provenance wording for JRP-monitored fill
- review flag for engineered fill by others / unknown

Add tests.

---

## Prompt 6 — add review-flag UX
Add a visible review panel in the preview page that lists:
- unresolved rule decisions
- branches marked review-sensitive
- source ids involved

The preview should still render the letter draft, but clearly warn the user when review is needed.

---

## Prompt 7 — add DOCX export stub
Add a server-side DOCX export path.

For now:
- build from a placeholder template or a simple export implementation
- preserve separation between generation and export
- ensure the exported file name uses file number / H number safely
- document where the real office Word template should be dropped in later
