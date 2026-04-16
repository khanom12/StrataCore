import type { FormState } from '@/types/domain';

export const defaultFormState: FormState = {
  topBlock: {
    letterDate: '2026-04-15',
    fileNumber: '5478 - 1',
    clientName: 'VICTORY HOMES LTD.',
    clientMailingAddress: ['1665 - 91 Street SW', 'Edmonton, Alberta', 'T6X 0W8'],
    headingSuffix: '',
    legalDescription: {
      include: true,
      lot: '110',
      block: '17',
      plan: '252 2250'
    },
    streetAddress: '607 - 30 Street SW',
    clientJobNumber: {
      include: false,
      value: ''
    },
    subdivision: {
      include: true,
      value: 'Alces Subdivision'
    },
    municipality: 'Edmonton, Alberta'
  },
  archive: {
    hNumber: 'h38566'
  },
  reportBody: {
    excavation: {
      inspectionDate: '2026-01-28',
      houseFootingCutDepthsM: {
        frontLeftM: 1.7,
        frontRightM: 1.8,
        rearLeftM: 1.8,
        rearRightM: 1.9
      },
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
    soil: {
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
    recommendations: {
      footingBasis: 'standard',
      spreadFootingFamily: 'default_140_kpa',
      garageSlabOrganics: false
    },
    sulphate: {
      includeParagraph: false,
      sulphateClass: 'negligible'
    },
    winterConstruction: {
      includeParagraph: true
    }
  },
  signoff: {
    preparedBy: 'Drafted by office staff',
    signingEngineer: 'Reviewing Engineer, P.Eng.'
  }
};
