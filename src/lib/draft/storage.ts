import { defaultFormState } from '@/lib/draft/default-form-state';
import type { FormState } from '@/types/domain';

const STORAGE_KEY = 'stratacore-letter-draft';

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

function mergeWithDefaultFormState(value: DeepPartial<FormState>): FormState {
  return {
    topBlock: {
      letterDate: value.topBlock?.letterDate ?? defaultFormState.topBlock.letterDate,
      fileNumber: value.topBlock?.fileNumber ?? defaultFormState.topBlock.fileNumber,
      clientName: value.topBlock?.clientName ?? defaultFormState.topBlock.clientName,
      clientMailingAddress: value.topBlock?.clientMailingAddress ?? defaultFormState.topBlock.clientMailingAddress,
      headingSuffix: value.topBlock?.headingSuffix ?? defaultFormState.topBlock.headingSuffix,
      includeLegalDescription: value.topBlock?.includeLegalDescription ?? defaultFormState.topBlock.includeLegalDescription,
      lot: value.topBlock?.lot ?? defaultFormState.topBlock.lot,
      block: value.topBlock?.block ?? defaultFormState.topBlock.block,
      plan: value.topBlock?.plan ?? defaultFormState.topBlock.plan,
      streetAddress: value.topBlock?.streetAddress ?? defaultFormState.topBlock.streetAddress,
      includeClientJobNumber: value.topBlock?.includeClientJobNumber ?? defaultFormState.topBlock.includeClientJobNumber,
      clientJobNumber: value.topBlock?.clientJobNumber ?? defaultFormState.topBlock.clientJobNumber,
      includeSubdivision: value.topBlock?.includeSubdivision ?? defaultFormState.topBlock.includeSubdivision,
      subdivision: value.topBlock?.subdivision ?? defaultFormState.topBlock.subdivision,
      municipality: value.topBlock?.municipality ?? defaultFormState.topBlock.municipality
    },
    archive: {
      hNumber: value.archive?.hNumber ?? defaultFormState.archive.hNumber
    },
    reportBody: {
      inspectionDate: value.reportBody?.inspectionDate ?? defaultFormState.reportBody.inspectionDate,
      excavation: {
        houseFootingCutDepthsM: {
          frontLeftM:
            value.reportBody?.excavation?.houseFootingCutDepthsM?.frontLeftM ??
            defaultFormState.reportBody.excavation.houseFootingCutDepthsM.frontLeftM,
          frontRightM:
            value.reportBody?.excavation?.houseFootingCutDepthsM?.frontRightM ??
            defaultFormState.reportBody.excavation.houseFootingCutDepthsM.frontRightM,
          rearLeftM:
            value.reportBody?.excavation?.houseFootingCutDepthsM?.rearLeftM ??
            defaultFormState.reportBody.excavation.houseFootingCutDepthsM.rearLeftM,
          rearRightM:
            value.reportBody?.excavation?.houseFootingCutDepthsM?.rearRightM ??
            defaultFormState.reportBody.excavation.houseFootingCutDepthsM.rearRightM
        },
        walkoutBasement: value.reportBody?.excavation?.walkoutBasement ?? defaultFormState.reportBody.excavation.walkoutBasement,
        gardenSuiteMode: value.reportBody?.excavation?.gardenSuiteMode ?? defaultFormState.reportBody.excavation.gardenSuiteMode,
        asConstructedMode: value.reportBody?.excavation?.asConstructedMode ?? defaultFormState.reportBody.excavation.asConstructedMode,
        constructionStage:
          value.reportBody?.excavation?.constructionStage ?? defaultFormState.reportBody.excavation.constructionStage,
        siteHistory: value.reportBody?.excavation?.siteHistory ?? defaultFormState.reportBody.excavation.siteHistory,
        oversizedTrench:
          value.reportBody?.excavation?.oversizedTrench ?? defaultFormState.reportBody.excavation.oversizedTrench,
        trenchLocation: value.reportBody?.excavation?.trenchLocation ?? defaultFormState.reportBody.excavation.trenchLocation,
        sloughMaterial: value.reportBody?.excavation?.sloughMaterial ?? defaultFormState.reportBody.excavation.sloughMaterial,
        loosePeelingMaterial:
          value.reportBody?.excavation?.loosePeelingMaterial ?? defaultFormState.reportBody.excavation.loosePeelingMaterial,
        frostDepthMm: value.reportBody?.excavation?.frostDepthMm ?? defaultFormState.reportBody.excavation.frostDepthMm,
        freeWaterInAugerHoles:
          value.reportBody?.excavation?.freeWaterInAugerHoles ?? defaultFormState.reportBody.excavation.freeWaterInAugerHoles,
        waterContext: value.reportBody?.excavation?.waterContext ?? defaultFormState.reportBody.excavation.waterContext,
        rainSoftenedMode:
          value.reportBody?.excavation?.rainSoftenedMode ?? defaultFormState.reportBody.excavation.rainSoftenedMode,
        snowDepthMm: value.reportBody?.excavation?.snowDepthMm ?? defaultFormState.reportBody.excavation.snowDepthMm,
        exposedElectricalTrench:
          value.reportBody?.excavation?.exposedElectricalTrench ??
          defaultFormState.reportBody.excavation.exposedElectricalTrench,
        groundHeatingSystem:
          value.reportBody?.excavation?.groundHeatingSystem ?? defaultFormState.reportBody.excavation.groundHeatingSystem
      },
      soil: {
        ...defaultFormState.reportBody.soil,
        ...(value.reportBody?.soil ?? {})
      },
      recommendation: {
        footingBasis: value.reportBody?.recommendation?.footingBasis ?? defaultFormState.reportBody.recommendation.footingBasis,
        spreadFootingFamily:
          value.reportBody?.recommendation?.spreadFootingFamily ??
          defaultFormState.reportBody.recommendation.spreadFootingFamily
      },
      garage: {
        mode: value.reportBody?.garage?.mode ?? defaultFormState.reportBody.garage.mode,
        offsetAboveHouseM: value.reportBody?.garage?.offsetAboveHouseM ?? defaultFormState.reportBody.garage.offsetAboveHouseM,
        slabOrganics: value.reportBody?.garage?.slabOrganics ?? defaultFormState.reportBody.garage.slabOrganics
      },
      sulphate: {
        includeParagraph: value.reportBody?.sulphate?.includeParagraph ?? defaultFormState.reportBody.sulphate.includeParagraph,
        sulphateClass: value.reportBody?.sulphate?.sulphateClass ?? defaultFormState.reportBody.sulphate.sulphateClass
      },
      winter: {
        includeParagraph: value.reportBody?.winter?.includeParagraph ?? defaultFormState.reportBody.winter.includeParagraph
      }
    },
    signoff: {
      preparedBy: value.signoff?.preparedBy ?? defaultFormState.signoff.preparedBy,
      signingEngineer: value.signoff?.signingEngineer ?? defaultFormState.signoff.signingEngineer
    }
  };
}

function isCanonicalFormState(value: unknown): value is FormState {
  if (!isRecord(value) || !isRecord(value.topBlock) || !isRecord(value.reportBody)) {
    return false;
  }

  return 'inspectionDate' in value.reportBody && 'recommendation' in value.reportBody && 'garage' in value.reportBody;
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
  const minimumCut = legacy.p2?.minCutM;
  const maximumCut = legacy.p2?.maxCutM;

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
