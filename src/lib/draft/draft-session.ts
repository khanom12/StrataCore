export interface DraftSessionState {
  sourcePresetId?: string;
}

const SESSION_STORAGE_KEY = 'stratacore-letter-draft-session';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

export function normalizeDraftSessionState(value: unknown): DraftSessionState {
  if (!isRecord(value)) {
    return {};
  }

  return {
    sourcePresetId: typeof value.sourcePresetId === 'string' ? value.sourcePresetId : undefined
  };
}

export function saveDraftSessionState(sessionState: DraftSessionState) {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(normalizeDraftSessionState(sessionState)));
}

export function loadDraftSessionState(): DraftSessionState {
  if (typeof window === 'undefined') {
    return {};
  }

  const stored = window.localStorage.getItem(SESSION_STORAGE_KEY);

  if (!stored) {
    return {};
  }

  try {
    return normalizeDraftSessionState(JSON.parse(stored));
  } catch {
    return {};
  }
}
