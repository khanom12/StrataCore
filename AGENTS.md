# StrataCore repository instructions

## Product context
This repository is the first release of an internal J.R. Paine report-writing tool for foundation soil inspection letters.

The tool converts structured inspection/report-writing inputs into a Word-first letter draft for human review, signature, printing, and filing.

This is not the field-inspection app. This is not the client booking portal. This is not a mobile-first product.

## Primary goal
Build a local-first, desktop-first internal web app that:
- captures structured inputs
- generates deterministic report sections
- shows review flags where logic is unresolved
- previews the assembled letter
- exports DOCX later

## Non-negotiable scope rules
- Keep V1 desktop-first and web-first.
- Keep V1 local-first with in-repo seed data.
- Preserve the human review/signoff workflow.
- Output is DOCX-first, not PDF-first.
- Hidden H number affects filename and archive path, not visible body text.
- Business logic must be implemented in pure TypeScript domain functions.
- UI must not contain core business rules.
- DOCX export must be separate from generation logic.
- Never silently choose an ambiguous branch. Emit a review flag instead.
- Keep changes minimal, readable, and testable.

## Product boundaries
### Build now
- metadata / top block
- P1 intro
- P2 excavation conditions core
- P3 soil conditions core
- P4 house footing recommendation core
- P5 derived garage recommendation core
- P6 sulphate paragraph
- P7 winter paragraph
- closing/signoff/archive path
- review flag UI
- local testable prototype

### Build but mark as review-sensitive
- spread-footing wording conflicts
- engineered fill by others / unknown wording
- rare remediation packages
- special advisories
- as-constructed edge cases

### Exclude from V1 UI
- correction/rewrite letters
- piles / GGB workflows
- uncontrolled fill mode
- client self-booking
- field-capture app
- deployment/auth/database overbuild

## Rule expectations
- Garage paragraph is derived.
- If P2 indicates garage exists, P5 must appear.
- P5 must mirror the footing basis selected in P4 unless a future explicit special mode overrides that.
- If logic is unresolved, generation should continue but include explicit review flags.
- Generated output must preserve clause/rule traceability.

## Required types
Maintain typed contracts for:
- FormState
- SectionId
- GeneratedParagraph
- ReviewFlag
- GenerationResult
- ClauseRef
- RuleRef

## Required result structure
GenerationResult must contain at minimum:
- visible sections / paragraphs in final order
- clause ids used
- rule ids used
- review flags
- filename
- archive path

## Engineering style
- Prefer small commits and focused changes.
- Avoid inventing product requirements not present in repo docs or seed files.
- Prefer deterministic functions over clever abstractions.
- Keep naming plain and descriptive.
- Add tests for each rule slice before widening scope.
- Use seed files as initial source-of-truth inputs.
- If a file or rule is unclear, leave a TODO plus review flag instead of guessing.

## Testing expectations
Add gold-case tests that assert:
- required sections appear
- forbidden sections do not appear
- key phrases appear
- review flags are raised when expected
- garage derivation behaves correctly
- filename/archive path behave correctly

## UX expectations
- Keep the UI plain and functional.
- Prioritize clarity over styling.
- Provide a form page and a preview page.
- Provide a visible review panel that explains unresolved decisions.
- Do not hide risky ambiguities from the user.

## Seed data usage
Use in-repo seed files before hardcoding text.
Prefer auto_core files for first implementation.
Keep review_rules visible and traceable rather than silently baking them in.

## Workflow for Codex
For each task:
1. read AGENTS.md and README_START_HERE.md first
2. inspect relevant files before editing
3. make the smallest coherent change
4. run local checks/tests if available
5. summarize what changed and any unresolved items

When a requested feature is larger than a small change, first produce a short implementation plan, then execute it.
