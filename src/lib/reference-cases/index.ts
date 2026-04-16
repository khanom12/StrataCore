import type { FormState } from '@/types/domain';

import { genericHappyPath } from '@/lib/reference-cases/generic-happy-path';
import { victoryHomes2026IssuedExample } from '@/lib/reference-cases/victory-homes-2026';

export interface ReferenceCasePreset {
  id: string;
  label: string;
  description: string;
  presetKind: 'reference' | 'generic';
  isDefaultDraft: boolean;
  formState: FormState;
}

export function cloneFormState(formState: FormState): FormState {
  return JSON.parse(JSON.stringify(formState)) as FormState;
}

export const referenceCasePresets: ReferenceCasePreset[] = [
  {
    id: 'victory-homes-2026',
    label: 'Victory Homes 2026 issued example',
    description: 'Authoritative office reference case aligned to the issued Victory Homes letter path.',
    presetKind: 'reference',
    isDefaultDraft: true,
    formState: victoryHomes2026IssuedExample
  },
  {
    id: 'generic-happy-path',
    label: 'Generic happy path',
    description: 'Simpler internal smoke-check preset with the stable garage path turned on.',
    presetKind: 'generic',
    isDefaultDraft: false,
    formState: genericHappyPath
  }
];

function stableSerialize(formState: FormState): string {
  return JSON.stringify(formState);
}

export function getReferenceCasePreset(id: string): ReferenceCasePreset | undefined {
  return referenceCasePresets.find((preset) => preset.id === id);
}

export function getDefaultDraftPreset(): ReferenceCasePreset {
  return referenceCasePresets.find((preset) => preset.isDefaultDraft) ?? referenceCasePresets[0];
}

export function identifyReferenceCasePreset(formState: FormState): ReferenceCasePreset | undefined {
  const serializedFormState = stableSerialize(formState);

  return referenceCasePresets.find((preset) => stableSerialize(preset.formState) === serializedFormState);
}
