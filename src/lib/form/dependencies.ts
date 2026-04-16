import type { FormState, PrimaryMaterialFamily, SoilLayerDescriptor } from '@/types/domain';

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
    showClientJobNumber: boolean;
    showLegalDescriptionFields: boolean;
    showSubdivision: boolean;
  };
  reportBody: {
    excavation: {
      showTrenchLocation: boolean;
      showWaterContext: boolean;
    };
    garage: {
      showOffsetAboveHouseM: boolean;
      showSlabOrganics: boolean;
    };
    sulphate: {
      showSulphateClass: boolean;
    };
    soil: {
      showLayeredInputs: boolean;
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
    description: 'Standard foundation soil inspection letters are the active V1 document mode.'
  },
  {
    id: 'correction_rewrite',
    category: 'top_level_document_mode',
    status: 'deferred',
    description: 'Correction / rewrite letters remain structurally separate document modes and stay out of the active V1 UI.'
  },
  {
    id: 'frost_follow_up',
    category: 'top_level_document_mode',
    status: 'deferred',
    description: 'Frost follow-up letters remain a deferred whole-letter mode rather than a nested standard-FSI checkbox branch.'
  }
];

export const DEFERRED_MANUAL_BRANCHES: DeferredManualBranchDefinition[] = [
  {
    id: 'garden-suite-mode',
    category: 'deferred_manual_branch',
    fieldPath: 'reportBody.excavation.gardenSuiteMode',
    description: 'Garden suite logic is preserved in the domain but remains outside the active V1 operator form.'
  },
  {
    id: 'ground-heating-system',
    category: 'deferred_manual_branch',
    fieldPath: 'reportBody.excavation.groundHeatingSystem',
    description: 'Ground heating is still review-sensitive and remains deferred rather than half-wired into the standard V1 form.'
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
    id: 'top-block-legal-description',
    category: 'reveal_hide_child_input',
    parentPath: 'topBlock.includeLegalDescription',
    childPaths: ['topBlock.lot', 'topBlock.block', 'topBlock.plan'],
    description: 'Lot / block / plan only appear when the visible legal description is included.'
  },
  {
    id: 'top-block-subdivision',
    category: 'reveal_hide_child_input',
    parentPath: 'topBlock.includeSubdivision',
    childPaths: ['topBlock.subdivision'],
    description: 'Subdivision stays hidden until the top block explicitly includes it.'
  },
  {
    id: 'excavation-oversized-trench-location',
    category: 'reveal_hide_child_input',
    parentPath: 'reportBody.excavation.oversizedTrench',
    childPaths: ['reportBody.excavation.trenchLocation'],
    description: 'Trench location is only relevant when an oversized trench is recorded.'
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
    id: 'free-water-context',
    category: 'reveal_hide_child_input',
    parentPath: 'reportBody.excavation.freeWaterInAugerHoles',
    childPaths: ['reportBody.excavation.waterContext'],
    description: 'Water context is only collected when free water in auger holes is recorded.'
  },
  {
    id: 'layered-soil-mode',
    category: 'reveal_hide_child_input',
    parentPath: 'reportBody.soil.soilLayeringMode',
    childPaths: [
      'reportBody.soil.engineeredFillLayer',
      'reportBody.soil.underlyingNativeLayer',
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
    description: 'P5 remains derived from garage presence plus the P4 footing basis; the UI does not expose an override.'
  },
  {
    id: 'p4-advisory-derived',
    category: 'derived_only_downstream_logic',
    description: 'Frost, oversized trench, loose peeling, and water-softened conditions remain downstream P4 advisory triggers rather than duplicated operator choices.'
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

export function getFormInputVisibility(formState: FormState): FormInputVisibility {
  return {
    topBlock: {
      showClientJobNumber: formState.topBlock.includeClientJobNumber,
      showLegalDescriptionFields: formState.topBlock.includeLegalDescription,
      showSubdivision: formState.topBlock.includeSubdivision
    },
    reportBody: {
      excavation: {
        showTrenchLocation: Boolean(formState.reportBody.excavation.oversizedTrench),
        showWaterContext: Boolean(formState.reportBody.excavation.freeWaterInAugerHoles)
      },
      garage: {
        showOffsetAboveHouseM: formState.reportBody.garage.mode === 'higher_than_house',
        showSlabOrganics: formState.reportBody.garage.mode !== 'none'
      },
      sulphate: {
        showSulphateClass: formState.reportBody.sulphate.includeParagraph
      },
      soil: {
        showLayeredInputs: formState.reportBody.soil.soilLayeringMode === 'engineered_fill_over_native',
        primary: getSoilDescriptorVisibility(formState.reportBody.soil.primaryMaterialFamily),
        engineeredFillLayer: getLayerVisibility(formState.reportBody.soil.engineeredFillLayer),
        underlyingNativeLayer: getLayerVisibility(formState.reportBody.soil.underlyingNativeLayer)
      }
    }
  };
}
