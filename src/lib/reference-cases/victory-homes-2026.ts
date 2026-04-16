import type { FormState } from '@/types/domain';

export const victoryHomes2026IssuedExample: FormState = {
  topBlock: {
    letterDate: '2026-02-04',
    fileNumber: '5478 - 1',
    clientName: 'VICTORY HOMES LTD.',
    clientMailingAddress: ['1665 - 91 Street SW', 'Edmonton, Alberta', 'T6X 0W8'],
    subjectLineFamily: 'singular',
    headingSuffix: '',
    includeLegalDescription: true,
    legalDescriptionMode: 'single',
    lot: '110',
    block: '17',
    plan: '252 2250',
    customLegalDescriptionLines: [],
    streetAddress: '607 - 30 Street SW',
    includeClientJobNumber: false,
    clientReferenceLabelFamily: 'client_job_no',
    clientJobNumber: '',
    includeSubdivision: true,
    subdivision: 'Alces Subdivision',
    municipality: 'Edmonton, Alberta'
  },
  archive: {
    hNumber: 'h38566'
  },
  reportBody: {
    inspectionDate: '2026-01-28',
    structureVariant: 'standard_house',
    excavation: {
      houseFootingCutDepthsM: {
        frontLeftM: 1.7,
        frontRightM: 1.8,
        rearLeftM: 1.8,
        rearRightM: 1.9
      },
      walkoutBasement: false,
      asConstructedMode: 'none',
      constructionStage: 'normal',
      siteHistory: 'none',
      oversizedTrenchMode: 'none',
      sloughMaterial: false,
      looseMaterialMode: 'none',
      waterIssueMode: 'none',
      waterObservedDepthBelowFootingM: undefined,
      groundHeatingSystem: false
    },
    soil: {
      soilLayeringMode: 'engineered_fill_over_native',
      primarySoilOrigin: 'engineered_fill_jrp',
      primaryMaterialFamily: 'clay',
      clayDescriptors: ['silty'],
      moisture1: 'moist',
      colour: 'brown_and_grey',
      plasticity1: 'medium',
      consistencyOrDensity: 'stiff',
      engineeredFillLayer: {
        materialFamily: 'clay',
        clayDescriptors: ['silty'],
        moisture1: 'moist',
        colour: 'brown_and_grey',
        consistencyOrDensity: 'stiff'
      },
      underlyingNativeLayer: {
        materialFamily: 'clay_till',
        clayDescriptors: ['silty'],
        moisture1: 'moist',
        colour: 'dark_grey',
        plasticity1: 'high',
        consistencyOrDensity: 'very_stiff',
        traceFeatures: ['oxides']
      },
      layeredCoverageMode: 'variable_portions',
      fillDepthBelowFootingMm: 200,
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
      slabOrganics: false
    },
    sulphate: {
      includeParagraph: false,
      sulphateClass: 'negligible'
    },
    winter: {
      includeParagraph: true
    }
  },
  signoff: {
    preparedBy: 'Doug Parth, E.I.T.',
    signingEngineer: 'Scott MacFarlane, P.Eng.'
  }
};
