import type {
  FormState,
  PrimaryMaterialFamily,
  SoilLayerDescriptor,
  WaterIssueMode
} from '@/types/domain';

export type DependencyCategory =
  | 'reveal_hide_child_input'
  | 'derived_only_downstream_logic'
  | 'top_level_document_mode'
  | 'deferred_manual_branch';

export interface DependencyDefinition {
  id: string;
  category: DependencyCategory;
  parentPath?: string;
  childPaths?: string[];
  description: string;
}

export interface DocumentModeDefinition {
  id: 'standard_fsi' | 'correction_rewrite' | 'frost_follow_up';
  category: 'top_level_document_mode';
  status: 'active' | 'deferred';
  description: string;
}

export interface DeferredManualBranchDefinition {
  id: string;
  category: 'deferred_manual_branch';
  fieldPath: string;
  description: string;
}

export interface FormInputVisibility {
  topBlock: {
    showLegalDescriptionMode: boolean;
    showClientJobNumber: boolean;
    showSingleLotFields: boolean;
    showStreetAddress: boolean;
    showCustomLegalDescriptionLines: boolean;
    showSubdivision: boolean;
  };
  reportBody: {
    showStandardHouseInputs: boolean;
    excavation: {
      showTrenchLocation: boolean;
      showWaterIssueDepth: boolean;
      showWalkoutExtraRearRemovalM: boolean;
    };
    recommendation: {
      showDrainageUpgradeVariant: boolean;
      showDrainageDrawingAttached: boolean;
    };
    garage: {
      showGarageMode: boolean;
      showOffsetAboveHouseM: boolean;
      showSlabOrganics: boolean;
    };
    sulphate: {
      showSulphateClass: boolean;
    };
    soil: {
      showLayeredInputs: boolean;
      showLayeredCoverageMode: boolean;
      primary: {
        showClayDescriptors: boolean;
        showSandSiltDescriptors: boolean;
      };
      engineeredFillLayer: {
        showClayDescriptors: boolean;
        showSandSiltDescriptors: boolean;
      };
      underlyingNativeLayer: {
        showClayDescriptors: boolean;
        showSandSiltDescriptors: boolean;
      };
    };
  };
}

export const TOP_LEVEL_DOCUMENT_MODES: DocumentModeDefinition[] = [
  {
    id: 'standard_fsi',
    category: 'top_level_document_mode',
    status: 'active',
    description: 'Standard foundation soil inspection letters remain the active V1 document mode.'
  },
  {
    id: 'correction_rewrite',
    category: 'top_level_document_mode',
    status: 'deferred',
    description: 'Correction / rewrite letters stay classified as whole-letter alternates and remain outside the active V1 UI.'
  },
  {
    id: 'frost_follow_up',
    category: 'top_level_document_mode',
    status: 'deferred',
    description: 'Frost follow-up letters remain a deferred whole-letter mode rather than a nested standard-FSI branch.'
  }
];

export const DEFERRED_MANUAL_BRANCHES: DeferredManualBranchDefinition[] = [
  {
    id: 'ground-heating-system',
    category: 'deferred_manual_branch',
    fieldPath: 'reportBody.excavation.groundHeatingSystem',
    description: 'Ground heating remains a special manual-review branch until the office confirms the supported wording family.'
  }
];

export const DEPENDENCY_MATRIX: DependencyDefinition[] = [
  {
    id: 'top-block-client-job-number',
    category: 'reveal_hide_child_input',
    parentPath: 'topBlock.includeClientJobNumber',
    childPaths: ['topBlock.clientJobNumber'],
    description: 'The client job number field is only relevant when the top block explicitly includes it.'
  },
  {
    id: 'top-block-single-legal-description',
    category: 'reveal_hide_child_input',
    parentPath: 'topBlock.legalDescriptionMode',
    childPaths: ['topBlock.lot', 'topBlock.block', 'topBlock.plan', 'topBlock.streetAddress'],
    description: 'Single-lot legal description inputs are only active when the visible legal description uses the standard single-lot mode.'
  },
  {
    id: 'top-block-custom-legal-description',
    category: 'reveal_hide_child_input',
    parentPath: 'topBlock.legalDescriptionMode',
    childPaths: ['topBlock.customLegalDescriptionLines'],
    description: 'Custom legal-description lines are only active when the top block is switched to the multiple-lot/custom mode.'
  },
  {
    id: 'top-block-subdivision',
    category: 'reveal_hide_child_input',
    parentPath: 'topBlock.includeSubdivision',
    childPaths: ['topBlock.subdivision'],
    description: 'Subdivision remains hidden until the top block explicitly includes it.'
  },
  {
    id: 'structure-variant-garden-suite',
    category: 'top_level_document_mode',
    parentPath: 'reportBody.structureVariant',
    childPaths: ['reportBody.garage'],
    description: 'Rear garage garden-suite letters are structure variants that suppress the ordinary attached-garage recommendation path.'
  },
  {
    id: 'excavation-oversized-trench-location',
    category: 'reveal_hide_child_input',
    parentPath: 'reportBody.excavation.oversizedTrenchMode',
    childPaths: ['reportBody.excavation.trenchLocation'],
    description: 'Trench location is only relevant when an oversized trench remediation mode is active.'
  },
  {
    id: 'walkout-extra-rear-removal',
    category: 'reveal_hide_child_input',
    parentPath: 'reportBody.excavation.walkoutBasement',
    childPaths: ['reportBody.excavation.walkoutExtraRearRemovalM'],
    description: 'Rear walkout extra-removal depth is only collected when the walkout wording family is active.'
  },
  {
    id: 'water-issue-depth',
    category: 'reveal_hide_child_input',
    parentPath: 'reportBody.excavation.waterIssueMode',
    childPaths: ['reportBody.excavation.waterObservedDepthBelowFootingM'],
    description: 'Water depth below footing is only collected for the auger-hole water issue families.'
  },
  {
    id: 'drainage-upgrade-variant',
    category: 'reveal_hide_child_input',
    parentPath: 'reportBody.excavation.waterIssueMode',
    childPaths: ['reportBody.recommendation.drainageUpgradeVariant'],
    description: 'The drainage-upgrade selector is only relevant for the upgraded auger-hole drainage family.'
  },
  {
    id: 'drainage-drawing-attached',
    category: 'reveal_hide_child_input',
    parentPath: 'reportBody.recommendation.drainageUpgradeVariant',
    childPaths: ['reportBody.recommendation.drainageDrawingAttached'],
    description: 'The drawing-attached flag is only relevant when the upgraded drainage variant is selected.'
  },
  {
    id: 'garage-offset',
    category: 'reveal_hide_child_input',
    parentPath: 'reportBody.garage.mode',
    childPaths: ['reportBody.garage.offsetAboveHouseM'],
    description: 'Garage offset is only collected when the garage excavation sits above the house excavation.'
  },
  {
    id: 'garage-slab-organics',
    category: 'reveal_hide_child_input',
    parentPath: 'reportBody.garage.mode',
    childPaths: ['reportBody.garage.slabOrganics'],
    description: 'Garage slab organics is only relevant when a garage exists.'
  },
  {
    id: 'sulphate-class',
    category: 'reveal_hide_child_input',
    parentPath: 'reportBody.sulphate.includeParagraph',
    childPaths: ['reportBody.sulphate.sulphateClass'],
    description: 'Sulphate class is only shown when the sulphate paragraph is included.'
  },
  {
    id: 'layered-soil-mode',
    category: 'reveal_hide_child_input',
    parentPath: 'reportBody.soil.soilLayeringMode',
    childPaths: [
      'reportBody.soil.engineeredFillLayer',
      'reportBody.soil.underlyingNativeLayer',
      'reportBody.soil.layeredCoverageMode',
      'reportBody.soil.fillDepthBelowFootingMm'
    ],
    description: 'Layered soil child inputs are only active when engineered fill over native soil is selected.'
  },
  {
    id: 'primary-clay-descriptors',
    category: 'reveal_hide_child_input',
    parentPath: 'reportBody.soil.primaryMaterialFamily',
    childPaths: ['reportBody.soil.clayDescriptors'],
    description: 'Primary clay descriptors are only shown for clay-family material selections.'
  },
  {
    id: 'primary-sand-silt-descriptors',
    category: 'reveal_hide_child_input',
    parentPath: 'reportBody.soil.primaryMaterialFamily',
    childPaths: ['reportBody.soil.sandSiltDescriptors'],
    description: 'Primary sand/silt descriptors are only shown for sand or silt families.'
  },
  {
    id: 'engineered-fill-layer-clay-descriptors',
    category: 'reveal_hide_child_input',
    parentPath: 'reportBody.soil.engineeredFillLayer.materialFamily',
    childPaths: ['reportBody.soil.engineeredFillLayer.clayDescriptors'],
    description: 'Engineered fill-layer clay descriptors are only shown for clay-family layer materials.'
  },
  {
    id: 'engineered-fill-layer-sand-silt-descriptors',
    category: 'reveal_hide_child_input',
    parentPath: 'reportBody.soil.engineeredFillLayer.materialFamily',
    childPaths: ['reportBody.soil.engineeredFillLayer.sandSiltDescriptors'],
    description: 'Engineered fill-layer sand/silt descriptors are only shown for sand or silt layer materials.'
  },
  {
    id: 'underlying-native-layer-clay-descriptors',
    category: 'reveal_hide_child_input',
    parentPath: 'reportBody.soil.underlyingNativeLayer.materialFamily',
    childPaths: ['reportBody.soil.underlyingNativeLayer.clayDescriptors'],
    description: 'Underlying native-layer clay descriptors are only shown for clay-family layer materials.'
  },
  {
    id: 'underlying-native-layer-sand-silt-descriptors',
    category: 'reveal_hide_child_input',
    parentPath: 'reportBody.soil.underlyingNativeLayer.materialFamily',
    childPaths: ['reportBody.soil.underlyingNativeLayer.sandSiltDescriptors'],
    description: 'Underlying native-layer sand/silt descriptors are only shown for sand or silt layer materials.'
  },
  {
    id: 'garage-paragraph-derived',
    category: 'derived_only_downstream_logic',
    description: 'Garage recommendation paragraphs remain derived from structure variant, garage mode, and the P4 footing basis rather than exposing a manual override.'
  },
  {
    id: 'issue-paragraph-derived',
    category: 'derived_only_downstream_logic',
    description: 'Water, trench, loose-material, and frost issue paragraphs remain generated from the current excavation and recommendation state instead of duplicated user toggles.'
  }
];

function isSandOrSilt(materialFamily: PrimaryMaterialFamily) {
  return materialFamily === 'sand' || materialFamily === 'silt';
}

export function isClayFamilyMaterial(materialFamily: PrimaryMaterialFamily) {
  return !isSandOrSilt(materialFamily);
}

export function getSoilDescriptorVisibility(materialFamily: PrimaryMaterialFamily) {
  return {
    showClayDescriptors: isClayFamilyMaterial(materialFamily),
    showSandSiltDescriptors: isSandOrSilt(materialFamily)
  };
}

function getLayerVisibility(layer?: SoilLayerDescriptor) {
  return getSoilDescriptorVisibility(layer?.materialFamily ?? 'clay');
}

export function getActiveDocumentMode() {
  return TOP_LEVEL_DOCUMENT_MODES.find((mode) => mode.status === 'active') ?? TOP_LEVEL_DOCUMENT_MODES[0];
}

function usesWaterDepth(mode?: WaterIssueMode) {
  return mode === 'free_water_in_auger_holes_basic' || mode === 'free_water_in_auger_holes_upgraded_drainage';
}

export function getFormInputVisibility(formState: FormState): FormInputVisibility {
  const includeLegalDescription = Boolean(formState.topBlock.includeLegalDescription);
  const includeClientJobNumber = Boolean(formState.topBlock.includeClientJobNumber);
  const includeSubdivision = Boolean(formState.topBlock.includeSubdivision);
  const showSingleLotFields = includeLegalDescription && formState.topBlock.legalDescriptionMode === 'single';
  const showCustomLegalDescriptionLines = includeLegalDescription && formState.topBlock.legalDescriptionMode === 'custom';
  const showStandardHouseInputs = formState.reportBody.structureVariant === 'standard_house';
  const showDrainageUpgradeVariant = formState.reportBody.excavation.waterIssueMode === 'free_water_in_auger_holes_upgraded_drainage';

  return {
    topBlock: {
      showLegalDescriptionMode: includeLegalDescription,
      showClientJobNumber: includeClientJobNumber,
      showSingleLotFields,
      showStreetAddress: showSingleLotFields,
      showCustomLegalDescriptionLines,
      showSubdivision: includeSubdivision
    },
    reportBody: {
      showStandardHouseInputs,
      excavation: {
        showTrenchLocation: formState.reportBody.excavation.oversizedTrenchMode !== 'none',
        showWaterIssueDepth: usesWaterDepth(formState.reportBody.excavation.waterIssueMode),
        showWalkoutExtraRearRemovalM: Boolean(formState.reportBody.excavation.walkoutBasement)
      },
      recommendation: {
        showDrainageUpgradeVariant,
        showDrainageDrawingAttached:
          showDrainageUpgradeVariant &&
          formState.reportBody.recommendation.drainageUpgradeVariant === 'washed_rock_interior_exterior_two_laterals'
      },
      garage: {
        showGarageMode: showStandardHouseInputs,
        showOffsetAboveHouseM: showStandardHouseInputs && formState.reportBody.garage.mode === 'higher_than_house',
        showSlabOrganics: showStandardHouseInputs && formState.reportBody.garage.mode !== 'none'
      },
      sulphate: {
        showSulphateClass: formState.reportBody.sulphate.includeParagraph
      },
      soil: {
        showLayeredInputs: formState.reportBody.soil.soilLayeringMode === 'engineered_fill_over_native',
        showLayeredCoverageMode: formState.reportBody.soil.soilLayeringMode === 'engineered_fill_over_native',
        primary: getSoilDescriptorVisibility(formState.reportBody.soil.primaryMaterialFamily),
        engineeredFillLayer: getLayerVisibility(formState.reportBody.soil.engineeredFillLayer),
        underlyingNativeLayer: getLayerVisibility(formState.reportBody.soil.underlyingNativeLayer)
      }
    }
  };
}
