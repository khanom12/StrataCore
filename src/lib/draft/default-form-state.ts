import type { FormState } from '@/types/domain';

import { cloneFormState, getDefaultDraftPreset } from '@/lib/reference-cases';

// The default draft is intentionally pinned to the authoritative Victory Homes
// reference case so localhost, preview, and export all have one unambiguous
// office-aligned baseline.
export const defaultFormState: FormState = cloneFormState(getDefaultDraftPreset().formState);

export const blankWorkingDraftFormState: FormState = {
  topBlock: {
    letterDate: '',
    fileNumber: '',
    clientName: '',
    clientMailingAddress: [],
    subjectLineFamily: 'singular',
    headingSuffix: '',
    includeLegalDescription: true,
    legalDescriptionMode: 'single',
    lot: '',
    block: '',
    plan: '',
    customLegalDescriptionLines: [],
    streetAddress: '',
    includeClientJobNumber: false,
    clientReferenceLabelFamily: 'client_job_no',
    clientJobNumber: '',
    includeSubdivision: false,
    subdivision: '',
    municipality: ''
  },
  archive: {
    hNumber: ''
  },
  reportBody: {
    inspectionDate: '',
    structureVariant: 'standard_house',
    excavation: {
      houseFootingCutDepthsM: {},
      walkoutBasement: false,
      walkoutExtraRearRemovalM: undefined,
      asConstructedMode: 'none',
      constructionStage: 'normal',
      siteHistory: 'none',
      oversizedTrenchMode: 'none',
      trenchLocation: undefined,
      sloughMaterial: false,
      looseMaterialMode: 'none',
      frostDepthMm: undefined,
      waterIssueMode: 'none',
      waterObservedDepthBelowFootingM: undefined,
      snowDepthMm: undefined,
      groundHeatingSystem: false
    },
    soil: {
      soilLayeringMode: 'single_layer',
      primarySoilOrigin: 'native',
      primaryMaterialFamily: 'clay',
      clayDescriptors: [],
      sandSiltDescriptors: [],
      moisture1: 'moist',
      colour: 'brown',
      plasticity1: 'medium',
      consistencyOrDensity: 'stiff',
      traceFeatures: [],
      engineeredFillLayer: undefined,
      underlyingNativeLayer: undefined,
      layeredCoverageMode: undefined,
      fillDepthBelowFootingMm: undefined,
      highPlasticWarning: false
    },
    recommendation: {
      footingBasis: 'standard',
      spreadFootingFamily: 'default_140_kpa',
      drainageUpgradeVariant: 'none',
      drainageDrawingAttached: false
    },
    garage: {
      mode: 'none',
      offsetAboveHouseM: undefined,
      slabOrganics: false
    },
    sulphate: {
      includeParagraph: false,
      sulphateClass: 'negligible'
    },
    winter: {
      includeParagraph: false
    }
  },
  signoff: {
    preparedBy: '',
    signingEngineer: ''
  }
};
