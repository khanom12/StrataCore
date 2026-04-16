import type { FormState } from '@/types/domain';

export const defaultFormState: FormState = {
  topBlock: {
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
    municipality: 'Edmonton, Alberta'
  },
  archive: {
    hNumber: 'h38566'
  },
  reportBody: {
    inspectionDate: '2026-01-28',
    excavation: {
      houseFootingCutDepthsM: {
        frontLeftM: 1.7,
        frontRightM: 1.8,
        rearLeftM: 1.8,
        rearRightM: 1.9
      },
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
    recommendation: {
      footingBasis: 'standard',
      spreadFootingFamily: 'default_140_kpa'
    },
    garage: {
      mode: 'same_elevation',
      offsetAboveHouseM: 0.7,
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
