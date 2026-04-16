# Legacy Output Regression Cases

Historical J.R. Paine output letters in `/Users/omar/Projects/StrataCore/reference-letters/legacy` are now part of the regression strategy for this repo.

## How to use them

1. Add the historical source letter to `reference-letters/legacy/`.
2. Add or update the matching manifest and `formState` fixture in `/Users/omar/Projects/StrataCore/src/lib/reference-cases/legacy-output-cases.ts`.
3. Mark the case honestly as `supported`, `partial`, `unsupported`, or `pending-file`.
4. Add or update focused semantic tests under `/Users/omar/Projects/StrataCore/tests/legacy-output-cases/` or the closest existing test file.

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

## Intentionally deferred

- correction / rewrite whole-letter modes
- frost follow-up confirmation letters
- uncontrolled fill / piles / GGB families
- logo / stamp image assets beyond text placeholders
