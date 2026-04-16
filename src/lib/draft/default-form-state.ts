import type { FormState } from '@/types/domain';

import { cloneFormState, getDefaultDraftPreset } from '@/lib/reference-cases';

// The default draft is intentionally pinned to the authoritative Victory Homes
// reference case so localhost, preview, and export all have one unambiguous
// office-aligned baseline.
export const defaultFormState: FormState = cloneFormState(getDefaultDraftPreset().formState);
