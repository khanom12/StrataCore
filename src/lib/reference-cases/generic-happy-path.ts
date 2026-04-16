import type { FormState } from '@/types/domain';

export const genericHappyPath: FormState = {
  topBlock: {
    letterDate: '2026-04-15',
    fileNumber: '9000 - 1',
    clientName: 'GENERIC BUILDER LTD.',
    clientMailingAddress: ['100 Example Avenue SW', 'Edmonton, Alberta', 'T6X 0X0'],
    headingSuffix: '',
    includeLegalDescription: true,
    legalDescriptionMode: 'single',
    lot: '10',
    block: '2',
    plan: '242 1234',
    customLegalDescriptionLines: [],
    streetAddress: '10 Example Crescent SW',
    includeClientJobNumber: false,
    clientJobNumber: '',
    includeSubdivision: true,
    subdivision: 'Example Estates',
    municipality: 'Edmonton, Alberta'
  },
  archive: {
    hNumber: 'h40001'
  },
  reportBody: {
    inspectionDate: '2026-04-10',
    structureVariant: 'standard_house',
    excavation: {
      houseFootingCutDepthsM: {
        frontLeftM: 1.4,
        frontRightM: 1.5,
        rearLeftM: 1.7,
        rearRightM: 1.8
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
      spreadFootingFamily: 'default_140_kpa',
      drainageUpgradeVariant: 'none',
      drainageDrawingAttached: false
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
