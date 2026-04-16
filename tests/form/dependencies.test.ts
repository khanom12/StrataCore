import { describe, expect, it } from 'vitest';

import { normalizeStoredDraftState } from '@/lib/draft/storage';
import { getFormInputVisibility } from '@/lib/form/dependencies';
import { normalizeDependentFormState } from '@/lib/form/normalize-dependent-state';
import { genericHappyPath } from '@/lib/reference-cases/generic-happy-path';
import type { FormState } from '@/types/domain';

function cloneFormState(formState: FormState): FormState {
  return JSON.parse(JSON.stringify(formState)) as FormState;
}

describe('form dependency model', () => {
  it('hides and clears the client job number when it is not included', () => {
    const formState = cloneFormState(genericHappyPath);
    formState.topBlock.includeClientJobNumber = false;
    formState.topBlock.clientJobNumber = 'JOB-999';

    const normalized = normalizeDependentFormState(formState);

    expect(getFormInputVisibility(normalized).topBlock.showClientJobNumber).toBe(false);
    expect(normalized.topBlock.clientJobNumber).toBeUndefined();
  });

  it('hides and clears lot / block / plan when the legal description is not included', () => {
    const formState = cloneFormState(genericHappyPath);
    formState.topBlock.includeLegalDescription = false;
    formState.topBlock.lot = '9';
    formState.topBlock.block = '10';
    formState.topBlock.plan = '123 4567';

    const normalized = normalizeDependentFormState(formState);

    expect(getFormInputVisibility(normalized).topBlock.showLegalDescriptionMode).toBe(false);
    expect(getFormInputVisibility(normalized).topBlock.showSingleLotFields).toBe(false);
    expect(normalized.topBlock.lot).toBeUndefined();
    expect(normalized.topBlock.block).toBeUndefined();
    expect(normalized.topBlock.plan).toBeUndefined();
  });

  it('switches to custom legal-description mode and clears stale single-lot values', () => {
    const formState = cloneFormState(genericHappyPath);
    formState.topBlock.legalDescriptionMode = 'custom';
    formState.topBlock.customLegalDescriptionLines = ['Lots 1 & 2, Block 3, Plan 123 4567', '12 & 14 Example Street'];

    const normalized = normalizeDependentFormState(formState);

    expect(getFormInputVisibility(normalized).topBlock.showCustomLegalDescriptionLines).toBe(true);
    expect(getFormInputVisibility(normalized).topBlock.showSingleLotFields).toBe(false);
    expect(normalized.topBlock.lot).toBeUndefined();
    expect(normalized.topBlock.block).toBeUndefined();
    expect(normalized.topBlock.plan).toBeUndefined();
    expect(normalized.topBlock.streetAddress).toBe('');
    expect(normalized.topBlock.customLegalDescriptionLines).toEqual(['Lots 1 & 2, Block 3, Plan 123 4567', '12 & 14 Example Street']);
  });

  it('hides and clears subdivision when it is not included', () => {
    const formState = cloneFormState(genericHappyPath);
    formState.topBlock.includeSubdivision = false;
    formState.topBlock.subdivision = 'Should clear';

    const normalized = normalizeDependentFormState(formState);

    expect(getFormInputVisibility(normalized).topBlock.showSubdivision).toBe(false);
    expect(normalized.topBlock.subdivision).toBeUndefined();
  });

  it('uses garage mode to govern slab-organics and offset child fields', () => {
    const formState = cloneFormState(genericHappyPath);
    formState.reportBody.garage.mode = 'none';
    formState.reportBody.garage.offsetAboveHouseM = 0.8;
    formState.reportBody.garage.slabOrganics = true;

    const noneNormalized = normalizeDependentFormState(formState);

    expect(getFormInputVisibility(noneNormalized).reportBody.garage.showSlabOrganics).toBe(false);
    expect(getFormInputVisibility(noneNormalized).reportBody.garage.showOffsetAboveHouseM).toBe(false);
    expect(noneNormalized.reportBody.garage.offsetAboveHouseM).toBeUndefined();
    expect(noneNormalized.reportBody.garage.slabOrganics).toBeUndefined();

    formState.reportBody.garage.mode = 'higher_than_house';
    formState.reportBody.garage.offsetAboveHouseM = 0.8;
    formState.reportBody.garage.slabOrganics = true;
    const elevatedNormalized = normalizeDependentFormState(formState);

    expect(getFormInputVisibility(elevatedNormalized).reportBody.garage.showOffsetAboveHouseM).toBe(true);
    expect(getFormInputVisibility(elevatedNormalized).reportBody.garage.showSlabOrganics).toBe(true);
    expect(elevatedNormalized.reportBody.garage.offsetAboveHouseM).toBe(0.8);
    expect(elevatedNormalized.reportBody.garage.slabOrganics).toBe(true);
  });

  it('hides and clears the sulphate class when the sulphate paragraph is disabled', () => {
    const formState = cloneFormState(genericHappyPath);
    formState.reportBody.sulphate.includeParagraph = false;
    formState.reportBody.sulphate.sulphateClass = 'very_severe';

    const normalized = normalizeDependentFormState(formState);

    expect(getFormInputVisibility(normalized).reportBody.sulphate.showSulphateClass).toBe(false);
    expect(normalized.reportBody.sulphate.sulphateClass).toBeUndefined();
  });

  it('clears layered child inputs and incompatible descriptor collections when engineered-fill mode is switched off', () => {
    const formState = cloneFormState(genericHappyPath);
    formState.reportBody.soil.soilLayeringMode = 'engineered_fill_over_native';
    formState.reportBody.soil.engineeredFillLayer = {
      materialFamily: 'sand',
      clayDescriptors: ['silty'],
      sandSiltDescriptors: ['fine'],
      moisture1: 'moist',
      colour: 'brown',
      consistencyOrDensity: 'dense'
    };
    formState.reportBody.soil.underlyingNativeLayer = {
      materialFamily: 'clay',
      clayDescriptors: ['very_silty'],
      sandSiltDescriptors: ['fine'],
      moisture1: 'moist',
      colour: 'grey',
      plasticity1: 'high',
      consistencyOrDensity: 'stiff'
    };
    formState.reportBody.soil.fillDepthBelowFootingMm = 250;
    formState.reportBody.soil.primaryMaterialFamily = 'sand';
    formState.reportBody.soil.clayDescriptors = ['silty'];
    formState.reportBody.soil.sandSiltDescriptors = ['medium'];

    const layeredNormalized = normalizeDependentFormState(formState);

    expect(layeredNormalized.reportBody.soil.engineeredFillLayer?.clayDescriptors).toBeUndefined();
    expect(layeredNormalized.reportBody.soil.underlyingNativeLayer?.sandSiltDescriptors).toBeUndefined();
    expect(layeredNormalized.reportBody.soil.clayDescriptors).toBeUndefined();
    expect(layeredNormalized.reportBody.soil.sandSiltDescriptors).toEqual(['medium']);

    layeredNormalized.reportBody.soil.soilLayeringMode = 'single_layer';
    const singleLayerNormalized = normalizeDependentFormState(layeredNormalized);

    expect(singleLayerNormalized.reportBody.soil.engineeredFillLayer).toBeUndefined();
    expect(singleLayerNormalized.reportBody.soil.underlyingNativeLayer).toBeUndefined();
    expect(singleLayerNormalized.reportBody.soil.fillDepthBelowFootingMm).toBeUndefined();
  });

  it('strips stale child values from canonical-looking stored drafts during normalization', () => {
    const normalized = normalizeStoredDraftState({
      topBlock: {
        includeClientJobNumber: false,
        clientJobNumber: 'STALE-JOB',
        includeLegalDescription: false,
        legalDescriptionMode: 'custom',
        lot: '99',
        block: '77',
        plan: 'OLD PLAN',
        customLegalDescriptionLines: ['Legacy multi-lot line'],
        includeSubdivision: false,
        subdivision: 'STALE SUBDIVISION'
      },
      archive: {
        hNumber: 'h12345'
      },
      reportBody: {
        inspectionDate: '2026-04-20',
        structureVariant: 'rear_garage_garden_suite',
        excavation: {
          oversizedTrenchMode: 'none',
          trenchLocation: 'front_left',
          waterIssueMode: 'none',
          waterObservedDepthBelowFootingM: 0.3,
          houseFootingCutDepthsM: {
            frontLeftM: 1.5,
            frontRightM: 1.5,
            rearLeftM: 1.8,
            rearRightM: 1.8
          }
        },
        soil: {
          soilLayeringMode: 'single_layer',
          engineeredFillLayer: {
            materialFamily: 'clay',
            moisture1: 'moist',
            colour: 'grey',
            plasticity1: 'medium',
            consistencyOrDensity: 'stiff'
          },
          underlyingNativeLayer: {
            materialFamily: 'clay',
            moisture1: 'moist',
            colour: 'grey',
            plasticity1: 'medium',
            consistencyOrDensity: 'stiff'
          }
        },
        recommendation: {
          footingBasis: 'standard',
          drainageUpgradeVariant: 'washed_rock_interior_exterior_two_laterals',
          drainageDrawingAttached: true
        },
        garage: {
          mode: 'higher_than_house',
          offsetAboveHouseM: 0.5,
          slabOrganics: true
        },
        sulphate: {
          includeParagraph: false,
          sulphateClass: 'moderate'
        }
      },
      signoff: {
        signingEngineer: 'Scott MacFarlane, P.Eng.'
      }
    });

    expect(normalized.topBlock.clientJobNumber).toBeUndefined();
    expect(normalized.topBlock.lot).toBeUndefined();
    expect(normalized.topBlock.block).toBeUndefined();
    expect(normalized.topBlock.plan).toBeUndefined();
    expect(normalized.topBlock.customLegalDescriptionLines).toBeUndefined();
    expect(normalized.topBlock.subdivision).toBeUndefined();
    expect(normalized.reportBody.excavation.trenchLocation).toBeUndefined();
    expect(normalized.reportBody.excavation.waterObservedDepthBelowFootingM).toBeUndefined();
    expect(normalized.reportBody.garage.offsetAboveHouseM).toBeUndefined();
    expect(normalized.reportBody.garage.slabOrganics).toBeUndefined();
    expect(normalized.reportBody.recommendation.drainageUpgradeVariant).toBe('none');
    expect(normalized.reportBody.recommendation.drainageDrawingAttached).toBeUndefined();
    expect(normalized.reportBody.sulphate.sulphateClass).toBeUndefined();
    expect(normalized.reportBody.soil.engineeredFillLayer).toBeUndefined();
    expect(normalized.reportBody.soil.underlyingNativeLayer).toBeUndefined();
  });
});
