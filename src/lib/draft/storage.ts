import { defaultFormState } from '@/lib/draft/default-form-state';
import type { FormState } from '@/types/domain';

const STORAGE_KEY = 'stratacore-letter-draft';

type LegacyFormState = {
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
    garageMode?: FormState['reportBody']['excavation']['garageMode'];
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
    footingBasis?: FormState['reportBody']['recommendations']['footingBasis'];
    spreadFootingMode?: FormState['reportBody']['recommendations']['spreadFootingFamily'];
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

function migrateLegacyFormState(legacy: LegacyFormState): FormState {
  const minimumCut = legacy.p2?.minCutM;
  const maximumCut = legacy.p2?.maxCutM;

  return {
    topBlock: {
      letterDate: legacy.meta?.letterDate ?? defaultFormState.topBlock.letterDate,
      fileNumber: legacy.meta?.fileNumber ?? defaultFormState.topBlock.fileNumber,
      clientName: legacy.meta?.clientName ?? defaultFormState.topBlock.clientName,
      clientMailingAddress: legacy.meta?.clientMailingAddress ?? defaultFormState.topBlock.clientMailingAddress,
      headingSuffix: legacy.meta?.headingSuffix ?? defaultFormState.topBlock.headingSuffix,
      legalDescription: {
        include: legacy.meta?.includeLegalDescription ?? defaultFormState.topBlock.legalDescription.include,
        lot: legacy.meta?.lot ?? defaultFormState.topBlock.legalDescription.lot,
        block: legacy.meta?.block ?? defaultFormState.topBlock.legalDescription.block,
        plan: legacy.meta?.plan ?? defaultFormState.topBlock.legalDescription.plan
      },
      streetAddress: legacy.meta?.streetAddress ?? defaultFormState.topBlock.streetAddress,
      clientJobNumber: {
        include: legacy.meta?.includeClientJobNumber ?? defaultFormState.topBlock.clientJobNumber.include,
        value: legacy.meta?.clientJobNumber ?? defaultFormState.topBlock.clientJobNumber.value
      },
      subdivision: {
        include: legacy.meta?.includeSubdivision ?? defaultFormState.topBlock.subdivision.include,
        value: legacy.meta?.subdivision ?? defaultFormState.topBlock.subdivision.value
      },
      municipality: legacy.meta?.municipality ?? defaultFormState.topBlock.municipality
    },
    archive: {
      hNumber: legacy.meta?.hNumber ?? defaultFormState.archive.hNumber
    },
    reportBody: {
      excavation: {
        inspectionDate: legacy.inspectionDate ?? defaultFormState.reportBody.excavation.inspectionDate,
        houseFootingCutDepthsM: {
          // TODO: the legacy scaffold only stored min/max. This keeps old local drafts usable
          // until the corner-level form becomes the only persisted shape.
          frontLeftM: minimumCut ?? defaultFormState.reportBody.excavation.houseFootingCutDepthsM.frontLeftM,
          frontRightM: minimumCut ?? defaultFormState.reportBody.excavation.houseFootingCutDepthsM.frontRightM,
          rearLeftM: maximumCut ?? defaultFormState.reportBody.excavation.houseFootingCutDepthsM.rearLeftM,
          rearRightM: maximumCut ?? defaultFormState.reportBody.excavation.houseFootingCutDepthsM.rearRightM
        },
        garageMode: legacy.p2?.garageMode ?? defaultFormState.reportBody.excavation.garageMode,
        garageOffsetAboveHouseM:
          legacy.p2?.garageOffsetAboveHouseM ?? defaultFormState.reportBody.excavation.garageOffsetAboveHouseM,
        walkoutBasement: legacy.p2?.walkoutBasement ?? defaultFormState.reportBody.excavation.walkoutBasement,
        gardenSuiteMode: legacy.p2?.gardenSuiteMode ?? defaultFormState.reportBody.excavation.gardenSuiteMode,
        asConstructedMode: legacy.p2?.asConstructedMode ?? defaultFormState.reportBody.excavation.asConstructedMode,
        constructionStage: legacy.p2?.constructionStage ?? defaultFormState.reportBody.excavation.constructionStage,
        siteHistory: legacy.p2?.siteHistory ?? defaultFormState.reportBody.excavation.siteHistory,
        oversizedTrench: legacy.p2?.oversizedTrench ?? defaultFormState.reportBody.excavation.oversizedTrench,
        trenchLocation: legacy.p2?.trenchLocation ?? defaultFormState.reportBody.excavation.trenchLocation,
        sloughMaterial: legacy.p2?.sloughMaterial ?? defaultFormState.reportBody.excavation.sloughMaterial,
        loosePeelingMaterial:
          legacy.p2?.loosePeelingMaterial ?? defaultFormState.reportBody.excavation.loosePeelingMaterial,
        frostDepthMm: legacy.p2?.frostDepthMm ?? defaultFormState.reportBody.excavation.frostDepthMm,
        freeWaterInAugerHoles:
          legacy.p2?.freeWaterInAugerHoles ?? defaultFormState.reportBody.excavation.freeWaterInAugerHoles,
        waterContext: legacy.p2?.waterContext ?? defaultFormState.reportBody.excavation.waterContext,
        rainSoftenedMode: legacy.p2?.rainSoftenedMode ?? defaultFormState.reportBody.excavation.rainSoftenedMode,
        snowDepthMm: legacy.p2?.snowDepthMm ?? defaultFormState.reportBody.excavation.snowDepthMm,
        exposedElectricalTrench:
          legacy.p2?.exposedElectricalTrench ?? defaultFormState.reportBody.excavation.exposedElectricalTrench,
        groundHeatingSystem:
          legacy.p2?.groundHeatingSystem ?? defaultFormState.reportBody.excavation.groundHeatingSystem
      },
      soil: legacy.p3 ?? defaultFormState.reportBody.soil,
      recommendations: {
        footingBasis: legacy.p4?.footingBasis ?? defaultFormState.reportBody.recommendations.footingBasis,
        spreadFootingFamily:
          legacy.p4?.spreadFootingMode ?? defaultFormState.reportBody.recommendations.spreadFootingFamily,
        garageSlabOrganics:
          legacy.p5?.garageSlabOrganics ?? defaultFormState.reportBody.recommendations.garageSlabOrganics
      },
      sulphate: {
        includeParagraph: legacy.p6?.includeSulphateParagraph ?? defaultFormState.reportBody.sulphate.includeParagraph,
        sulphateClass: legacy.p6?.sulphateClass ?? defaultFormState.reportBody.sulphate.sulphateClass
      },
      winterConstruction: {
        includeParagraph: legacy.p7?.includeWinterParagraph ?? defaultFormState.reportBody.winterConstruction.includeParagraph
      }
    },
    signoff: legacy.signoff ?? defaultFormState.signoff
  };
}

function isNormalizedFormState(value: unknown): value is FormState {
  return Boolean(value) && typeof value === 'object' && 'topBlock' in (value as Record<string, unknown>) && 'reportBody' in (value as Record<string, unknown>);
}

export function normalizeStoredDraftState(value: unknown): FormState {
  if (isNormalizedFormState(value)) {
    return value;
  }

  if (value && typeof value === 'object' && 'meta' in (value as Record<string, unknown>)) {
    return migrateLegacyFormState(value as LegacyFormState);
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
