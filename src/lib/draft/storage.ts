import { defaultFormState } from '@/lib/draft/default-form-state';
import type { FormState } from '@/types/domain';

const STORAGE_KEY = 'stratacore-letter-draft';

const GARAGE_MODES = ['none', 'same_elevation', 'higher_than_house'] as const;
const AS_CONSTRUCTED_MODES = ['none', 'poured_18in', 'poured_20in', 'poured_24in', 'walls_and_footing'] as const;
const CONSTRUCTION_STAGES = ['normal', 'nearly_complete', 'framing'] as const;
const SITE_HISTORY_VALUES = ['none', 'infill', 'knockdown_rebuild'] as const;
const TRENCH_LOCATIONS = ['front', 'front_left', 'front_right'] as const;
const RAIN_SOFTENED_MODES = ['none', 'saturated_soft_surficial', 'standing_water_rain_softened'] as const;
const SOIL_LAYERING_MODES = ['single_layer', 'engineered_fill_over_native'] as const;
const PRIMARY_SOIL_ORIGINS = [
  'native',
  'engineered_fill_jrp',
  'engineered_fill_jrp_and_others',
  'engineered_fill_others',
  'engineered_fill_unknown'
] as const;
const PRIMARY_MATERIAL_FAMILIES = ['clay', 'clay_till', 'sand', 'silt', 'clayey_sand', 'clayey_silt'] as const;
const CLAY_DESCRIPTORS = ['silty', 'very_silty', 'sandy', 'very_sandy'] as const;
const SAND_SILT_DESCRIPTORS = ['coarse', 'medium', 'fine', 'well_graded', 'poorly_graded'] as const;
const MOISTURE_DESCRIPTORS = ['damp', 'moist', 'very_moist', 'wet'] as const;
const SOIL_COLOURS = ['brown', 'grey', 'brown_and_grey', 'brown_and_dark_grey', 'dark_grey', 'black', 'reddish_brown'] as const;
const PLASTICITY_DESCRIPTORS = ['low', 'medium', 'high'] as const;
const CONSISTENCY_DENSITY_DESCRIPTORS = [
  'soft',
  'firm',
  'stiff',
  'very_stiff',
  'hard',
  'very_loose',
  'loose',
  'compact',
  'dense',
  'very_dense'
] as const;
const TRACE_FEATURES = ['oxides', 'white_precipitates', 'coal', 'gravel', 'organics', 'rootlets'] as const;
const FOOTING_BASIS_OPTIONS = ['standard', 'modified'] as const;
const SPREAD_FOOTING_FAMILIES = ['omit', 'default_140_kpa', 'review_100_kpa'] as const;
const SULPHATE_CLASSES = ['negligible', 'moderate', 'severe', 'very_severe'] as const;

type LegacyScaffoldDraft = {
  meta?: {
    letterDate?: string;
    fileNumber?: string;
    clientName?: string;
    clientMailingAddress?: string[];
    headingSuffix?: string;
    includeLegalDescription?: boolean;
    lot?: string;
    block?: string;
    plan?: string;
    streetAddress?: string;
    includeClientJobNumber?: boolean;
    clientJobNumber?: string;
    includeSubdivision?: boolean;
    subdivision?: string;
    municipality?: string;
    hNumber?: string;
  };
  inspectionDate?: string;
  p2?: {
    minCutM?: number;
    maxCutM?: number;
    garageMode?: FormState['reportBody']['garage']['mode'];
    garageOffsetAboveHouseM?: number;
    walkoutBasement?: boolean;
    gardenSuiteMode?: boolean;
    asConstructedMode?: FormState['reportBody']['excavation']['asConstructedMode'];
    constructionStage?: FormState['reportBody']['excavation']['constructionStage'];
    siteHistory?: FormState['reportBody']['excavation']['siteHistory'];
    oversizedTrench?: boolean;
    trenchLocation?: FormState['reportBody']['excavation']['trenchLocation'];
    sloughMaterial?: boolean;
    loosePeelingMaterial?: boolean;
    frostDepthMm?: number;
    freeWaterInAugerHoles?: boolean;
    waterContext?: string;
    rainSoftenedMode?: FormState['reportBody']['excavation']['rainSoftenedMode'];
    snowDepthMm?: number;
    exposedElectricalTrench?: boolean;
    groundHeatingSystem?: boolean;
  };
  p3?: FormState['reportBody']['soil'];
  p4?: {
    footingBasis?: FormState['reportBody']['recommendation']['footingBasis'];
    spreadFootingMode?: FormState['reportBody']['recommendation']['spreadFootingFamily'];
  };
  p5?: {
    garageSlabOrganics?: boolean;
  };
  p6?: {
    includeSulphateParagraph?: boolean;
    sulphateClass?: FormState['reportBody']['sulphate']['sulphateClass'];
  };
  p7?: {
    includeWinterParagraph?: boolean;
  };
  signoff?: FormState['signoff'];
};

type InterimNormalizedDraft = {
  topBlock?: {
    letterDate?: string;
    fileNumber?: string;
    clientName?: string;
    clientMailingAddress?: string[];
    headingSuffix?: string;
    legalDescription?: {
      include?: boolean;
      lot?: string;
      block?: string;
      plan?: string;
    };
    streetAddress?: string;
    clientJobNumber?: {
      include?: boolean;
      value?: string;
    };
    subdivision?: {
      include?: boolean;
      value?: string;
    };
    municipality?: string;
  };
  archive?: {
    hNumber?: string;
  };
  reportBody?: {
    excavation?: {
      inspectionDate?: string;
      houseFootingCutDepthsM?: FormState['reportBody']['excavation']['houseFootingCutDepthsM'];
      garageMode?: FormState['reportBody']['garage']['mode'];
      garageOffsetAboveHouseM?: number;
      walkoutBasement?: boolean;
      gardenSuiteMode?: boolean;
      asConstructedMode?: FormState['reportBody']['excavation']['asConstructedMode'];
      constructionStage?: FormState['reportBody']['excavation']['constructionStage'];
      siteHistory?: FormState['reportBody']['excavation']['siteHistory'];
      oversizedTrench?: boolean;
      trenchLocation?: FormState['reportBody']['excavation']['trenchLocation'];
      sloughMaterial?: boolean;
      loosePeelingMaterial?: boolean;
      frostDepthMm?: number;
      freeWaterInAugerHoles?: boolean;
      waterContext?: string;
      rainSoftenedMode?: FormState['reportBody']['excavation']['rainSoftenedMode'];
      snowDepthMm?: number;
      exposedElectricalTrench?: boolean;
      groundHeatingSystem?: boolean;
    };
    soil?: FormState['reportBody']['soil'];
    recommendations?: {
      footingBasis?: FormState['reportBody']['recommendation']['footingBasis'];
      spreadFootingFamily?: FormState['reportBody']['recommendation']['spreadFootingFamily'];
      garageSlabOrganics?: boolean;
    };
    sulphate?: FormState['reportBody']['sulphate'];
    winterConstruction?: {
      includeParagraph?: boolean;
    };
  };
  signoff?: FormState['signoff'];
};

type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends Array<infer U>
    ? U[]
    : T[K] extends object
      ? DeepPartial<T[K]>
      : T[K];
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object';
}

function readString(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined;
}

function readBoolean(value: unknown): boolean | undefined {
  return typeof value === 'boolean' ? value : undefined;
}

function readNumber(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

function readStringArray(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) {
    return undefined;
  }

  const items = value.filter((item): item is string => typeof item === 'string');
  return items.length ? items : undefined;
}

function readEnum<T extends readonly string[]>(value: unknown, options: T): T[number] | undefined {
  return typeof value === 'string' && options.includes(value as T[number]) ? (value as T[number]) : undefined;
}

function readEnumArray<T extends readonly string[]>(value: unknown, options: T): T[number][] | undefined {
  if (!Array.isArray(value)) {
    return undefined;
  }

  const items = value.filter((item): item is T[number] => typeof item === 'string' && options.includes(item as T[number]));
  return items.length ? items : undefined;
}

function mergeWithDefaultFormState(value: DeepPartial<FormState> | unknown): FormState {
  const root = isRecord(value) ? value : {};
  const topBlock = isRecord(root.topBlock) ? root.topBlock : {};
  const archive = isRecord(root.archive) ? root.archive : {};
  const reportBody = isRecord(root.reportBody) ? root.reportBody : {};
  const excavation = isRecord(reportBody.excavation) ? reportBody.excavation : {};
  const cutDepths = isRecord(excavation.houseFootingCutDepthsM) ? excavation.houseFootingCutDepthsM : {};
  const soil = isRecord(reportBody.soil) ? reportBody.soil : {};
  const recommendation = isRecord(reportBody.recommendation) ? reportBody.recommendation : {};
  const garage = isRecord(reportBody.garage) ? reportBody.garage : {};
  const sulphate = isRecord(reportBody.sulphate) ? reportBody.sulphate : {};
  const winter = isRecord(reportBody.winter) ? reportBody.winter : {};
  const signoff = isRecord(root.signoff) ? root.signoff : {};

  return {
    topBlock: {
      letterDate: readString(topBlock.letterDate) ?? defaultFormState.topBlock.letterDate,
      fileNumber: readString(topBlock.fileNumber) ?? defaultFormState.topBlock.fileNumber,
      clientName: readString(topBlock.clientName) ?? defaultFormState.topBlock.clientName,
      clientMailingAddress: readStringArray(topBlock.clientMailingAddress) ?? defaultFormState.topBlock.clientMailingAddress,
      headingSuffix: readString(topBlock.headingSuffix) ?? defaultFormState.topBlock.headingSuffix,
      includeLegalDescription: readBoolean(topBlock.includeLegalDescription) ?? defaultFormState.topBlock.includeLegalDescription,
      lot: readString(topBlock.lot) ?? defaultFormState.topBlock.lot,
      block: readString(topBlock.block) ?? defaultFormState.topBlock.block,
      plan: readString(topBlock.plan) ?? defaultFormState.topBlock.plan,
      streetAddress: readString(topBlock.streetAddress) ?? defaultFormState.topBlock.streetAddress,
      includeClientJobNumber: readBoolean(topBlock.includeClientJobNumber) ?? defaultFormState.topBlock.includeClientJobNumber,
      clientJobNumber: readString(topBlock.clientJobNumber) ?? defaultFormState.topBlock.clientJobNumber,
      includeSubdivision: readBoolean(topBlock.includeSubdivision) ?? defaultFormState.topBlock.includeSubdivision,
      subdivision: readString(topBlock.subdivision) ?? defaultFormState.topBlock.subdivision,
      municipality: readString(topBlock.municipality) ?? defaultFormState.topBlock.municipality
    },
    archive: {
      hNumber: readString(archive.hNumber) ?? defaultFormState.archive.hNumber
    },
    reportBody: {
      inspectionDate: readString(reportBody.inspectionDate) ?? defaultFormState.reportBody.inspectionDate,
      excavation: {
        houseFootingCutDepthsM: {
          frontLeftM: readNumber(cutDepths.frontLeftM) ?? defaultFormState.reportBody.excavation.houseFootingCutDepthsM.frontLeftM,
          frontRightM: readNumber(cutDepths.frontRightM) ?? defaultFormState.reportBody.excavation.houseFootingCutDepthsM.frontRightM,
          rearLeftM: readNumber(cutDepths.rearLeftM) ?? defaultFormState.reportBody.excavation.houseFootingCutDepthsM.rearLeftM,
          rearRightM: readNumber(cutDepths.rearRightM) ?? defaultFormState.reportBody.excavation.houseFootingCutDepthsM.rearRightM
        },
        walkoutBasement: readBoolean(excavation.walkoutBasement) ?? defaultFormState.reportBody.excavation.walkoutBasement,
        gardenSuiteMode: readBoolean(excavation.gardenSuiteMode) ?? defaultFormState.reportBody.excavation.gardenSuiteMode,
        asConstructedMode: readEnum(excavation.asConstructedMode, AS_CONSTRUCTED_MODES) ?? defaultFormState.reportBody.excavation.asConstructedMode,
        constructionStage: readEnum(excavation.constructionStage, CONSTRUCTION_STAGES) ?? defaultFormState.reportBody.excavation.constructionStage,
        siteHistory: readEnum(excavation.siteHistory, SITE_HISTORY_VALUES) ?? defaultFormState.reportBody.excavation.siteHistory,
        oversizedTrench: readBoolean(excavation.oversizedTrench) ?? defaultFormState.reportBody.excavation.oversizedTrench,
        trenchLocation: readEnum(excavation.trenchLocation, TRENCH_LOCATIONS) ?? defaultFormState.reportBody.excavation.trenchLocation,
        sloughMaterial: readBoolean(excavation.sloughMaterial) ?? defaultFormState.reportBody.excavation.sloughMaterial,
        loosePeelingMaterial: readBoolean(excavation.loosePeelingMaterial) ?? defaultFormState.reportBody.excavation.loosePeelingMaterial,
        frostDepthMm: readNumber(excavation.frostDepthMm) ?? defaultFormState.reportBody.excavation.frostDepthMm,
        freeWaterInAugerHoles: readBoolean(excavation.freeWaterInAugerHoles) ?? defaultFormState.reportBody.excavation.freeWaterInAugerHoles,
        waterContext: readString(excavation.waterContext) ?? defaultFormState.reportBody.excavation.waterContext,
        rainSoftenedMode: readEnum(excavation.rainSoftenedMode, RAIN_SOFTENED_MODES) ?? defaultFormState.reportBody.excavation.rainSoftenedMode,
        snowDepthMm: readNumber(excavation.snowDepthMm) ?? defaultFormState.reportBody.excavation.snowDepthMm,
        exposedElectricalTrench: readBoolean(excavation.exposedElectricalTrench) ?? defaultFormState.reportBody.excavation.exposedElectricalTrench,
        groundHeatingSystem: readBoolean(excavation.groundHeatingSystem) ?? defaultFormState.reportBody.excavation.groundHeatingSystem
      },
      soil: {
        soilLayeringMode: readEnum(soil.soilLayeringMode, SOIL_LAYERING_MODES) ?? defaultFormState.reportBody.soil.soilLayeringMode,
        primarySoilOrigin: readEnum(soil.primarySoilOrigin, PRIMARY_SOIL_ORIGINS) ?? defaultFormState.reportBody.soil.primarySoilOrigin,
        primaryMaterialFamily:
          readEnum(soil.primaryMaterialFamily, PRIMARY_MATERIAL_FAMILIES) ?? defaultFormState.reportBody.soil.primaryMaterialFamily,
        clayDescriptors: readEnumArray(soil.clayDescriptors, CLAY_DESCRIPTORS) ?? defaultFormState.reportBody.soil.clayDescriptors,
        sandSiltDescriptors:
          readEnumArray(soil.sandSiltDescriptors, SAND_SILT_DESCRIPTORS) ?? defaultFormState.reportBody.soil.sandSiltDescriptors,
        moisture1: readEnum(soil.moisture1, MOISTURE_DESCRIPTORS) ?? defaultFormState.reportBody.soil.moisture1,
        moisture2: readEnum(soil.moisture2, MOISTURE_DESCRIPTORS.filter((item) => item !== 'damp') as ['moist', 'very_moist', 'wet']) ?? defaultFormState.reportBody.soil.moisture2,
        colour: readEnum(soil.colour, SOIL_COLOURS) ?? defaultFormState.reportBody.soil.colour,
        plasticity1: readEnum(soil.plasticity1, PLASTICITY_DESCRIPTORS) ?? defaultFormState.reportBody.soil.plasticity1,
        plasticity2:
          readEnum(soil.plasticity2, PLASTICITY_DESCRIPTORS.filter((item) => item !== 'low') as ['medium', 'high']) ??
          defaultFormState.reportBody.soil.plasticity2,
        consistencyOrDensity:
          readEnum(soil.consistencyOrDensity, CONSISTENCY_DENSITY_DESCRIPTORS) ??
          defaultFormState.reportBody.soil.consistencyOrDensity,
        traceFeatures: readEnumArray(soil.traceFeatures, TRACE_FEATURES) ?? defaultFormState.reportBody.soil.traceFeatures,
        highPlasticWarning: readBoolean(soil.highPlasticWarning) ?? defaultFormState.reportBody.soil.highPlasticWarning
      },
      recommendation: {
        footingBasis: readEnum(recommendation.footingBasis, FOOTING_BASIS_OPTIONS) ?? defaultFormState.reportBody.recommendation.footingBasis,
        spreadFootingFamily:
          readEnum(recommendation.spreadFootingFamily, SPREAD_FOOTING_FAMILIES) ??
          defaultFormState.reportBody.recommendation.spreadFootingFamily
      },
      garage: {
        mode: readEnum(garage.mode, GARAGE_MODES) ?? defaultFormState.reportBody.garage.mode,
        offsetAboveHouseM: readNumber(garage.offsetAboveHouseM) ?? defaultFormState.reportBody.garage.offsetAboveHouseM,
        slabOrganics: readBoolean(garage.slabOrganics) ?? defaultFormState.reportBody.garage.slabOrganics
      },
      sulphate: {
        includeParagraph: readBoolean(sulphate.includeParagraph) ?? defaultFormState.reportBody.sulphate.includeParagraph,
        sulphateClass: readEnum(sulphate.sulphateClass, SULPHATE_CLASSES) ?? defaultFormState.reportBody.sulphate.sulphateClass
      },
      winter: {
        includeParagraph: readBoolean(winter.includeParagraph) ?? defaultFormState.reportBody.winter.includeParagraph
      }
    },
    signoff: {
      preparedBy: readString(signoff.preparedBy) ?? defaultFormState.signoff.preparedBy,
      signingEngineer: readString(signoff.signingEngineer) ?? defaultFormState.signoff.signingEngineer
    }
  };
}

function isCanonicalFormState(value: unknown): value is FormState {
  return (
    isRecord(value) &&
    isRecord(value.topBlock) &&
    isRecord(value.archive) &&
    isRecord(value.reportBody) &&
    isRecord(value.signoff) &&
    'inspectionDate' in value.reportBody &&
    'recommendation' in value.reportBody &&
    'garage' in value.reportBody
  );
}

function isInterimNormalizedDraft(value: unknown): value is InterimNormalizedDraft {
  if (!isRecord(value) || !isRecord(value.topBlock) || !isRecord(value.reportBody)) {
    return false;
  }

  return 'recommendations' in value.reportBody || 'winterConstruction' in value.reportBody;
}

function isLegacyScaffoldDraft(value: unknown): value is LegacyScaffoldDraft {
  return isRecord(value) && 'meta' in value;
}

function migrateLegacyScaffoldDraft(legacy: LegacyScaffoldDraft): FormState {
  const minimumCut = readNumber(legacy.p2?.minCutM);
  const maximumCut = readNumber(legacy.p2?.maxCutM);

  return mergeWithDefaultFormState({
    topBlock: {
      letterDate: legacy.meta?.letterDate,
      fileNumber: legacy.meta?.fileNumber,
      clientName: legacy.meta?.clientName,
      clientMailingAddress: legacy.meta?.clientMailingAddress,
      headingSuffix: legacy.meta?.headingSuffix,
      includeLegalDescription: legacy.meta?.includeLegalDescription,
      lot: legacy.meta?.lot,
      block: legacy.meta?.block,
      plan: legacy.meta?.plan,
      streetAddress: legacy.meta?.streetAddress,
      includeClientJobNumber: legacy.meta?.includeClientJobNumber,
      clientJobNumber: legacy.meta?.clientJobNumber,
      includeSubdivision: legacy.meta?.includeSubdivision,
      subdivision: legacy.meta?.subdivision,
      municipality: legacy.meta?.municipality
    },
    archive: {
      hNumber: legacy.meta?.hNumber
    },
    reportBody: {
      inspectionDate: legacy.inspectionDate,
      excavation: {
        houseFootingCutDepthsM: {
          // Legacy fallback only: Prompt 1 drafts stored min/max cuts instead of corner values.
          frontLeftM: minimumCut,
          frontRightM: minimumCut,
          rearLeftM: maximumCut,
          rearRightM: maximumCut
        },
        walkoutBasement: legacy.p2?.walkoutBasement,
        gardenSuiteMode: legacy.p2?.gardenSuiteMode,
        asConstructedMode: legacy.p2?.asConstructedMode,
        constructionStage: legacy.p2?.constructionStage,
        siteHistory: legacy.p2?.siteHistory,
        oversizedTrench: legacy.p2?.oversizedTrench,
        trenchLocation: legacy.p2?.trenchLocation,
        sloughMaterial: legacy.p2?.sloughMaterial,
        loosePeelingMaterial: legacy.p2?.loosePeelingMaterial,
        frostDepthMm: legacy.p2?.frostDepthMm,
        freeWaterInAugerHoles: legacy.p2?.freeWaterInAugerHoles,
        waterContext: legacy.p2?.waterContext,
        rainSoftenedMode: legacy.p2?.rainSoftenedMode,
        snowDepthMm: legacy.p2?.snowDepthMm,
        exposedElectricalTrench: legacy.p2?.exposedElectricalTrench,
        groundHeatingSystem: legacy.p2?.groundHeatingSystem
      },
      soil: legacy.p3,
      recommendation: {
        footingBasis: legacy.p4?.footingBasis,
        spreadFootingFamily: legacy.p4?.spreadFootingMode
      },
      garage: {
        mode: legacy.p2?.garageMode,
        offsetAboveHouseM: legacy.p2?.garageOffsetAboveHouseM,
        slabOrganics: legacy.p5?.garageSlabOrganics
      },
      sulphate: {
        includeParagraph: legacy.p6?.includeSulphateParagraph,
        sulphateClass: legacy.p6?.sulphateClass
      },
      winter: {
        includeParagraph: legacy.p7?.includeWinterParagraph
      }
    },
    signoff: legacy.signoff
  });
}

function migrateInterimNormalizedDraft(interim: InterimNormalizedDraft): FormState {
  return mergeWithDefaultFormState({
    topBlock: {
      letterDate: interim.topBlock?.letterDate,
      fileNumber: interim.topBlock?.fileNumber,
      clientName: interim.topBlock?.clientName,
      clientMailingAddress: interim.topBlock?.clientMailingAddress,
      headingSuffix: interim.topBlock?.headingSuffix,
      includeLegalDescription: interim.topBlock?.legalDescription?.include,
      lot: interim.topBlock?.legalDescription?.lot,
      block: interim.topBlock?.legalDescription?.block,
      plan: interim.topBlock?.legalDescription?.plan,
      streetAddress: interim.topBlock?.streetAddress,
      includeClientJobNumber: interim.topBlock?.clientJobNumber?.include,
      clientJobNumber: interim.topBlock?.clientJobNumber?.value,
      includeSubdivision: interim.topBlock?.subdivision?.include,
      subdivision: interim.topBlock?.subdivision?.value,
      municipality: interim.topBlock?.municipality
    },
    archive: {
      hNumber: interim.archive?.hNumber
    },
    reportBody: {
      inspectionDate: interim.reportBody?.excavation?.inspectionDate,
      excavation: {
        houseFootingCutDepthsM: interim.reportBody?.excavation?.houseFootingCutDepthsM,
        walkoutBasement: interim.reportBody?.excavation?.walkoutBasement,
        gardenSuiteMode: interim.reportBody?.excavation?.gardenSuiteMode,
        asConstructedMode: interim.reportBody?.excavation?.asConstructedMode,
        constructionStage: interim.reportBody?.excavation?.constructionStage,
        siteHistory: interim.reportBody?.excavation?.siteHistory,
        oversizedTrench: interim.reportBody?.excavation?.oversizedTrench,
        trenchLocation: interim.reportBody?.excavation?.trenchLocation,
        sloughMaterial: interim.reportBody?.excavation?.sloughMaterial,
        loosePeelingMaterial: interim.reportBody?.excavation?.loosePeelingMaterial,
        frostDepthMm: interim.reportBody?.excavation?.frostDepthMm,
        freeWaterInAugerHoles: interim.reportBody?.excavation?.freeWaterInAugerHoles,
        waterContext: interim.reportBody?.excavation?.waterContext,
        rainSoftenedMode: interim.reportBody?.excavation?.rainSoftenedMode,
        snowDepthMm: interim.reportBody?.excavation?.snowDepthMm,
        exposedElectricalTrench: interim.reportBody?.excavation?.exposedElectricalTrench,
        groundHeatingSystem: interim.reportBody?.excavation?.groundHeatingSystem
      },
      soil: interim.reportBody?.soil,
      recommendation: {
        footingBasis: interim.reportBody?.recommendations?.footingBasis,
        spreadFootingFamily: interim.reportBody?.recommendations?.spreadFootingFamily
      },
      garage: {
        mode: interim.reportBody?.excavation?.garageMode,
        offsetAboveHouseM: interim.reportBody?.excavation?.garageOffsetAboveHouseM,
        slabOrganics: interim.reportBody?.recommendations?.garageSlabOrganics
      },
      sulphate: interim.reportBody?.sulphate,
      winter: {
        includeParagraph: interim.reportBody?.winterConstruction?.includeParagraph
      }
    },
    signoff: interim.signoff
  });
}

export function normalizeStoredDraftState(value: unknown): FormState {
  if (isCanonicalFormState(value)) {
    return mergeWithDefaultFormState(value);
  }

  if (isInterimNormalizedDraft(value)) {
    return migrateInterimNormalizedDraft(value);
  }

  if (isLegacyScaffoldDraft(value)) {
    return migrateLegacyScaffoldDraft(value);
  }

  return defaultFormState;
}

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
    return normalizeStoredDraftState(JSON.parse(stored));
  } catch {
    return defaultFormState;
  }
}
