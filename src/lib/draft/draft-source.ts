import { blankWorkingDraftFormState } from '@/lib/draft/default-form-state';
import type { DraftSessionState } from '@/lib/draft/draft-session';
import { identifyReferenceCasePreset, getReferenceCasePreset } from '@/lib/reference-cases';
import type { FormState } from '@/types/domain';

export type DraftSourceKind = 'sample_loaded' | 'edited_from_sample' | 'blank_working_draft' | 'custom_local_draft';

export interface DraftSourceSummary {
  kind: DraftSourceKind;
  label: string;
  detail: string;
  presetId?: string;
}

const CLIENT_PRESET_LABELS: Record<string, string> = {
  'victory-homes-2026': 'Victory Homes sample',
  'generic-happy-path': 'Generic sample'
};

function getPresetLabel(presetId: string, fallbackLabel: string) {
  return CLIENT_PRESET_LABELS[presetId] ?? fallbackLabel;
}

function isBlankWorkingDraft(formState: FormState) {
  return JSON.stringify(formState) === JSON.stringify(blankWorkingDraftFormState);
}

export function describeDraftSource(formState: FormState, sessionState: DraftSessionState): DraftSourceSummary {
  const matchedPreset = identifyReferenceCasePreset(formState);

  if (matchedPreset) {
    const label = getPresetLabel(matchedPreset.id, matchedPreset.label);

    return {
      kind: 'sample_loaded',
      label: `${label} loaded`,
      detail: 'This local draft currently matches one of the built-in sample presets exactly.',
      presetId: matchedPreset.id
    };
  }

  if (sessionState.sourcePresetId) {
    const preset = getReferenceCasePreset(sessionState.sourcePresetId);
    const label = preset ? getPresetLabel(preset.id, preset.label) : 'sample preset';

    return {
      kind: 'edited_from_sample',
      label: `Edited from ${label}`,
      detail: 'This local draft started from a sample preset and now includes local edits.',
      presetId: preset?.id
    };
  }

  if (isBlankWorkingDraft(formState)) {
    return {
      kind: 'blank_working_draft',
      label: 'Blank working draft',
      detail: 'This draft is ready for a fresh operator entry and has not been seeded from a sample preset.'
    };
  }

  return {
    kind: 'custom_local_draft',
    label: 'Custom local draft',
    detail: 'This draft is being built locally outside the sample presets.'
  };
}
