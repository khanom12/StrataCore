import { buildFallbackSoilLayer } from '@/lib/domain/soil-layers';
import { getFormInputVisibility, isClayFamilyMaterial } from '@/lib/form/dependencies';
import type { FormState, SoilInputs, SoilLayerDescriptor } from '@/types/domain';

function normalizeDescriptorCollections<T extends Pick<SoilInputs, 'primaryMaterialFamily' | 'clayDescriptors' | 'sandSiltDescriptors'>>(
  input: T
): T {
  if (isClayFamilyMaterial(input.primaryMaterialFamily)) {
    return {
      ...input,
      sandSiltDescriptors: undefined
    };
  }

  return {
    ...input,
    clayDescriptors: undefined
  };
}

function normalizeLayerDescriptor(layer: SoilLayerDescriptor): SoilLayerDescriptor {
  if (isClayFamilyMaterial(layer.materialFamily)) {
    return {
      ...layer,
      sandSiltDescriptors: undefined
    };
  }

  return {
    ...layer,
    clayDescriptors: undefined
  };
}

export function normalizeDependentFormState(formState: FormState): FormState {
  const visibility = getFormInputVisibility(formState);
  const normalizedTopBlock = {
    ...formState.topBlock,
    clientJobNumber: visibility.topBlock.showClientJobNumber ? formState.topBlock.clientJobNumber : undefined,
    lot: visibility.topBlock.showSingleLotFields ? formState.topBlock.lot : undefined,
    block: visibility.topBlock.showSingleLotFields ? formState.topBlock.block : undefined,
    plan: visibility.topBlock.showSingleLotFields ? formState.topBlock.plan : undefined,
    customLegalDescriptionLines: visibility.topBlock.showCustomLegalDescriptionLines
      ? formState.topBlock.customLegalDescriptionLines?.filter(Boolean)
      : undefined,
    streetAddress: visibility.topBlock.showStreetAddress ? formState.topBlock.streetAddress : '',
    subdivision: visibility.topBlock.showSubdivision ? formState.topBlock.subdivision : undefined
  };
  const normalizedExcavation = {
    ...formState.reportBody.excavation,
    trenchLocation: visibility.reportBody.excavation.showTrenchLocation ? formState.reportBody.excavation.trenchLocation : undefined,
    waterObservedDepthBelowFootingM: visibility.reportBody.excavation.showWaterIssueDepth
      ? formState.reportBody.excavation.waterObservedDepthBelowFootingM
      : undefined
  };
  const normalizedGarage = visibility.reportBody.showStandardHouseInputs
    ? {
        ...formState.reportBody.garage,
        offsetAboveHouseM: visibility.reportBody.garage.showOffsetAboveHouseM ? formState.reportBody.garage.offsetAboveHouseM : undefined,
        slabOrganics: visibility.reportBody.garage.showSlabOrganics ? formState.reportBody.garage.slabOrganics : undefined
      }
    : {
        ...formState.reportBody.garage,
        mode: 'none' as const,
        offsetAboveHouseM: undefined,
        slabOrganics: undefined
      };
  const normalizedRecommendation = {
    ...formState.reportBody.recommendation,
    drainageUpgradeVariant: visibility.reportBody.recommendation.showDrainageUpgradeVariant
      ? formState.reportBody.recommendation.drainageUpgradeVariant
      : 'none',
    drainageDrawingAttached: visibility.reportBody.recommendation.showDrainageDrawingAttached
      ? formState.reportBody.recommendation.drainageDrawingAttached
      : undefined
  };
  const baseSoil = normalizeDescriptorCollections({
    ...formState.reportBody.soil
  });

  if (visibility.reportBody.soil.showLayeredInputs) {
    const fillLayer = normalizeLayerDescriptor(baseSoil.engineeredFillLayer ?? buildFallbackSoilLayer(baseSoil));
    const nativeLayer = normalizeLayerDescriptor(baseSoil.underlyingNativeLayer ?? buildFallbackSoilLayer(baseSoil));

    return {
      ...formState,
      topBlock: normalizedTopBlock,
      reportBody: {
        ...formState.reportBody,
        excavation: normalizedExcavation,
        recommendation: normalizedRecommendation,
        garage: normalizedGarage,
        sulphate: {
          ...formState.reportBody.sulphate,
          sulphateClass: visibility.reportBody.sulphate.showSulphateClass ? formState.reportBody.sulphate.sulphateClass : undefined
        },
        soil: {
          ...baseSoil,
          engineeredFillLayer: fillLayer,
          underlyingNativeLayer: nativeLayer,
          layeredCoverageMode: visibility.reportBody.soil.showLayeredCoverageMode
            ? baseSoil.layeredCoverageMode ?? 'variable_portions'
            : undefined,
          fillDepthBelowFootingMm: baseSoil.fillDepthBelowFootingMm
        }
      }
    };
  }

  return {
    ...formState,
    topBlock: normalizedTopBlock,
    reportBody: {
      ...formState.reportBody,
      excavation: normalizedExcavation,
      recommendation: normalizedRecommendation,
      garage: normalizedGarage,
      sulphate: {
        ...formState.reportBody.sulphate,
        sulphateClass: visibility.reportBody.sulphate.showSulphateClass ? formState.reportBody.sulphate.sulphateClass : undefined
      },
      soil: {
        ...baseSoil,
        engineeredFillLayer: undefined,
        underlyingNativeLayer: undefined,
        layeredCoverageMode: undefined,
        fillDepthBelowFootingMm: undefined
      }
    }
  };
}
