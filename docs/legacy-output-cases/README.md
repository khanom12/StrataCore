# Legacy Output Regression Cases

Historical J.R. Paine output letters in `reference-letters/legacy/` are part of the regression strategy for this repo.

The working ruleset, clause bank, and decision surfaces remain the source of truth.
Historical letters validate the implementation and expose grounded gaps, but they do not silently override the rules-based system.

## How to use them

1. Add the historical source letter to `reference-letters/legacy/`.
2. Add or update the matching manifest and `formState` fixture in `src/lib/reference-cases/legacy-output-cases.ts`.
3. Mark the case honestly as `supported`, `partial`, `unsupported`, or `pending-file`.
4. Add or update focused semantic tests under `tests/legacy-output-cases/` or the closest existing test file.
5. Add or update XML-level DOCX assertions in `tests/export/` when the case proves shell or export fidelity instead of paragraph wording alone.

## What each manifest should capture

- source filename and slug
- whether the file is actually present
- expected visible section order
- positive and absent text cues
- known generation / dependency / composition gaps
- the exact fixture state used to reproduce the case locally

## Current reference standard

- The Victory Homes 2026 issued example remains the baseline office reference preset.
- Historical output letters are now used as regression fixtures to refine real-letter behavior where they expose gaps.

## Support classification guidance

- `supported`: the generated preview/export matches the important visible wording and shell behavior for the case without unresolved client-facing drift.
- `partial`: the case is materially represented, but a grounded wording/order/shell branch is still unresolved and should remain visible through review flags or gap notes.
- `unsupported`: the case family is understood, but current generation/composition does not yet represent it faithfully enough to treat as covered.
- `pending-file`: the manifest stub exists, but the source reference file has not been added yet.

## Intentionally deferred

- correction / rewrite whole-letter modes
- frost follow-up confirmation letters
- uncontrolled fill / piles / GGB families
