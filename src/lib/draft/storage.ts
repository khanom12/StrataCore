import type { FormState } from '@/types/domain';
import { defaultFormState } from '@/lib/draft/default-form-state';

const STORAGE_KEY = 'stratacore-letter-draft';

export function saveDraftState(formState: FormState) {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(formState));
}

export function loadDraftState(): FormState {
  if (typeof window === 'undefined') {
    return defaultFormState;
  }

  const stored = window.localStorage.getItem(STORAGE_KEY);

  if (!stored) {
    return defaultFormState;
  }

  try {
    return JSON.parse(stored) as FormState;
  } catch {
    return defaultFormState;
  }
}

