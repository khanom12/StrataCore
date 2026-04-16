import type { FormState } from '@/types/domain';

export const defaultFormState: FormState = {
  meta: {
    letterDate: '2026-04-15',
    fileNumber: '5478 - 1',
    clientName: 'VICTORY HOMES LTD.',
    clientMailingAddress: ['1665 - 91 Street SW', 'Edmonton, Alberta', 'T6X 0W8'],
    headingSuffix: '',
    includeLegalDescription: true,
    lot: '110',
    block: '17',
    plan: '252 2250',
    streetAddress: '607 - 30 Street SW',
    includeClientJobNumber: false,
    clientJobNumber: '',
    includeSubdivision: true,
    subdivision: 'Alces Subdivision',
    municipality: 'Edmonton, Alberta',
    hNumber: 'h38566'
  },
  inspectionDate: '2026-01-28',
  p2: {
    minCutM: 1.7,
    maxCutM: 1.9,
    garageMode: 'same_elevation',
    garageOffsetAboveHouseM: 0.7,
    walkoutBasement: false,
    gardenSuiteMode: false,
    asConstructedMode: 'none',
    constructionStage: 'normal',
    siteHistory: 'none',
    oversizedTrench: false,
    sloughMaterial: false,
    loosePeelingMaterial: false,
    freeWaterInAugerHoles: false,
    rainSoftenedMode: 'none',
    exposedElectricalTrench: false,
    groundHeatingSystem: false
  },
  p3: {
    soilLayeringMode: 'single_layer',
    primarySoilOrigin: 'native',
    primaryMaterialFamily: 'clay',
    moisture1: 'moist',
    colour: 'brown_and_grey',
    plasticity1: 'medium',
    consistencyOrDensity: 'stiff',
    traceFeatures: ['oxides'],
    highPlasticWarning: false
  },
  p4: {
    footingBasis: 'standard',
    spreadFootingMode: 'default_140_kpa'
  },
  p5: {
    garageSlabOrganics: false
  },
  p6: {
    includeSulphateParagraph: false,
    sulphateClass: 'negligible'
  },
  p7: {
    includeWinterParagraph: true
  },
  signoff: {
    preparedBy: 'Drafted by office staff',
    signingEngineer: 'Reviewing Engineer, P.Eng.'
  }
};

