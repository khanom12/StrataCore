import type { FormState, SectionId } from '@/types/domain';

import { genericHappyPath } from '@/lib/reference-cases/generic-happy-path';
import { victoryHomes2026IssuedExample } from '@/lib/reference-cases/victory-homes-2026';

export type LegacyOutputCaseStatus = 'supported' | 'partial' | 'unsupported' | 'pending-file';

export interface LegacyOutputCaseManifest {
  slug: string;
  sourceFilename: string;
  sourcePath: string;
  status: LegacyOutputCaseStatus;
  familyTags: string[];
  expectedHeadingVariant: string;
  expectedLegalDescriptionMode: 'single' | 'custom';
  expectedVisibleSections: SectionId[];
  expectedPositiveTextCues: string[];
  expectedAbsentTextCues: string[];
  expectedSpecialShellBehaviors: string[];
  notes: string[];
  currentCapabilitySummary: {
    canCurrentCodeReproduce: boolean;
    missingDomainFields: string[];
    inputDependencies: string[];
    generationGaps: string[];
    compositionGaps: string[];
    recommendedTests: string[];
  };
  formState: FormState;
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends Array<infer U>
    ? U[]
    : T[K] extends object
      ? DeepPartial<T[K]>
      : T[K];
};

function withOverrides(base: FormState, overrides: DeepPartial<FormState>): FormState {
  return {
    ...clone(base),
    ...overrides,
    topBlock: {
      ...base.topBlock,
      ...overrides.topBlock
    },
    archive: {
      ...base.archive,
      ...overrides.archive
    },
    reportBody: {
      ...base.reportBody,
      ...overrides.reportBody,
      excavation: {
        ...base.reportBody.excavation,
        ...overrides.reportBody?.excavation
      },
      soil: {
        ...base.reportBody.soil,
        ...overrides.reportBody?.soil
      },
      recommendation: {
        ...base.reportBody.recommendation,
        ...overrides.reportBody?.recommendation
      },
      garage: {
        ...base.reportBody.garage,
        ...overrides.reportBody?.garage
      },
      sulphate: {
        ...base.reportBody.sulphate,
        ...overrides.reportBody?.sulphate
      },
      winter: {
        ...base.reportBody.winter,
        ...overrides.reportBody?.winter
      }
    },
    signoff: {
      ...base.signoff,
      ...overrides.signoff
    }
  };
}

const standardHouseBase = clone(genericHappyPath);
const victoryBase = clone(victoryHomes2026IssuedExample);

export const legacyOutputCases: LegacyOutputCaseManifest[] = [
  {
    slug: 'water-in-auger-holes-upgraded-drainage',
    sourceFilename: 'water in auger holes - upgraded drainage sys.docx',
    sourcePath: 'reference-letters/legacy/water in auger holes - upgraded drainage sys.docx',
    status: 'supported',
    familyTags: ['water', 'drainage-upgrade', 'supplemental-issue-paragraph', 'modified-footing', 'garage'],
    expectedHeadingVariant: 'Foundation Soils Inspection',
    expectedLegalDescriptionMode: 'single',
    expectedVisibleSections: ['TOP_BLOCK', 'P1', 'P2', 'P3', 'P3A', 'P4', 'P5', 'P7', 'CLOSING', 'SIGNOFF'],
    expectedPositiveTextCues: [
      'free water was noted pooling in the auger holes',
      'washed rock slab base',
      'interior as well as exterior weeping tile with two laterals',
      'A drawing depicting the recommended drainage measures is attached.'
    ],
    expectedAbsentTextCues: ['APEGA Member #: [registry pending]'],
    expectedSpecialShellBehaviors: ['Reviewed by signoff block', 'Continuation header uses subject + file number'],
    notes: ['Historical sample uses a dedicated issue paragraph between soil description and footing recommendation.'],
    currentCapabilitySummary: {
      canCurrentCodeReproduce: true,
      missingDomainFields: [],
      inputDependencies: ['waterIssueMode -> waterObservedDepthBelowFootingM', 'waterIssueMode -> drainageUpgradeVariant -> drainageDrawingAttached'],
      generationGaps: [],
      compositionGaps: [],
      recommendedTests: ['issue paragraph appears as P3A', 'P4 remains conditional', 'garage recommendation stays derived']
    },
    formState: withOverrides(standardHouseBase, {
      topBlock: {
        letterDate: '2026-04-07',
        fileNumber: '4460 - 1',
        clientName: 'Oasis Engineering GROUP Ltd.',
        clientMailingAddress: ['202, 10335 - 178 Street NW', 'Edmonton, Alberta', 'T5S 1S2'],
        includeLegalDescription: true,
        legalDescriptionMode: 'single',
        lot: '16',
        block: '12',
        plan: '252 1068',
        streetAddress: '1433 Osprey Court NW',
        includeSubdivision: true,
        subdivision: 'Hawks Ridge Subdivision',
        municipality: 'Edmonton, Alberta'
      },
      archive: { hNumber: 'h38862' },
      reportBody: {
        inspectionDate: '2026-03-24',
        excavation: {
          houseFootingCutDepthsM: { frontLeftM: 1.9, frontRightM: 2.0, rearLeftM: 2.3, rearRightM: 2.4 },
          walkoutBasement: false,
          waterIssueMode: 'free_water_in_auger_holes_upgraded_drainage',
          waterObservedDepthBelowFootingM: 0.2
        },
        recommendation: {
          footingBasis: 'modified',
          spreadFootingFamily: 'review_100_kpa',
          drainageUpgradeVariant: 'washed_rock_interior_exterior_two_laterals',
          drainageDrawingAttached: true
        },
        garage: { mode: 'same_elevation', slabOrganics: false }
      },
      signoff: {
        preparedBy: 'Doug Parth, E.I.T.',
        signingEngineer: 'Scott MacFarlane, P.Eng.'
      }
    })
  },
  {
    slug: 'saturated-material-comment',
    sourceFilename: 'saturated material comment.docx',
    sourcePath: 'reference-letters/legacy/saturated material comment.docx',
    status: 'supported',
    familyTags: ['rain-softened', 'frost', 'supplemental-issue-paragraph', 'garage'],
    expectedHeadingVariant: 'Foundation Soils Inspection',
    expectedLegalDescriptionMode: 'single',
    expectedVisibleSections: ['TOP_BLOCK', 'P1', 'P2', 'P3', 'P3A', 'P4', 'P5', 'P7', 'CLOSING', 'SIGNOFF'],
    expectedPositiveTextCues: ['Due to the frost', 'water softened material should be adequately dried or removed', 'thickened footing'],
    expectedAbsentTextCues: ['Foundation Soil Inspection – Garden Suite'],
    expectedSpecialShellBehaviors: ['Reviewed by signoff block'],
    notes: ['Historical sample combines frost reinforcement and rain-softened remediation in a single issue paragraph.'],
    currentCapabilitySummary: {
      canCurrentCodeReproduce: true,
      missingDomainFields: [],
      inputDependencies: ['waterIssueMode drives issue-paragraph inputs'],
      generationGaps: [],
      compositionGaps: [],
      recommendedTests: ['frost + rain-softened produce one supplemental paragraph']
    },
    formState: withOverrides(standardHouseBase, {
      topBlock: {
        letterDate: '2026-04-07',
        fileNumber: '3343 - 1',
        clientName: 'BEDROCK HOMES LTD.',
        clientMailingAddress: ['1253 - 91 Street SW', 'Edmonton, Alberta', 'T6X 1E9'],
        includeLegalDescription: true,
        lot: '98',
        block: '1',
        plan: '262 0213',
        streetAddress: '17240 - 5 Street NW',
        includeClientJobNumber: true,
        clientJobNumber: 'MAR - 2 - 036449',
        includeSubdivision: true,
        subdivision: 'Marquis Subdivision',
        municipality: 'Edmonton, Alberta'
      },
      archive: { hNumber: 'h38894' },
      reportBody: {
        inspectionDate: '2026-04-01',
        excavation: {
          houseFootingCutDepthsM: { frontLeftM: 2.0, frontRightM: 2.0, rearLeftM: 2.1, rearRightM: 2.1 },
          frostDepthMm: 150,
          waterIssueMode: 'rain_softened'
        },
        garage: { mode: 'same_elevation', slabOrganics: false }
      },
      signoff: {
        preparedBy: 'Darren Wang, E.I.T.',
        signingEngineer: 'Scott MacFarlane, P.Eng.'
      }
    })
  },
  {
    slug: 'loose-material-comment',
    sourceFilename: 'loose material commment.docx',
    sourcePath: 'reference-letters/legacy/loose material commment.docx',
    status: 'supported',
    familyTags: ['loose-material', 'garage', 'sulphate'],
    expectedHeadingVariant: 'Foundation Soils Inspection',
    expectedLegalDescriptionMode: 'single',
    expectedVisibleSections: ['TOP_BLOCK', 'P1', 'P2', 'P3', 'P4', 'P5', 'P6', 'P7', 'CLOSING', 'SIGNOFF'],
    expectedPositiveTextCues: ['Loose materials were noted across the excavation floor.', 'Type GU cement may be used'],
    expectedAbsentTextCues: ['washed rock slab base', 'Reviewed by,'],
    expectedSpecialShellBehaviors: ['Single engineer signoff fallback'],
    notes: ['This family stays as a direct P2 observation rather than requiring a separate issue paragraph.'],
    currentCapabilitySummary: {
      canCurrentCodeReproduce: true,
      missingDomainFields: [],
      inputDependencies: ['looseMaterialMode drives whether the issue stays in P2 or becomes a supplemental paragraph'],
      generationGaps: [],
      compositionGaps: [],
      recommendedTests: ['noted_only loose-material mode does not force P3A']
    },
    formState: withOverrides(standardHouseBase, {
      topBlock: {
        letterDate: '2026-04-07',
        fileNumber: '4460 - 1',
        clientName: 'OASIS ENGINEERING GROUP LTD.',
        clientMailingAddress: ['#202, 10335 – 178 Street NW', 'Edmonton, Alberta', 'T5S 1S2'],
        includeLegalDescription: true,
        lot: '3',
        block: '15',
        plan: '252 1961',
        streetAddress: '9789 Elves Place',
        includeSubdivision: true,
        subdivision: 'Edgemont Subdivision',
        municipality: 'Edmonton, Alberta'
      },
      archive: { hNumber: 'h38905' },
      reportBody: {
        inspectionDate: '2026-04-01',
        excavation: {
          houseFootingCutDepthsM: { frontLeftM: 1.5, frontRightM: 1.5, rearLeftM: 1.9, rearRightM: 1.9 },
          looseMaterialMode: 'noted_only'
        },
        garage: { mode: 'same_elevation', slabOrganics: false },
        sulphate: {
          includeParagraph: true,
          sulphateClass: 'negligible'
        }
      },
      signoff: {
        preparedBy: '',
        signingEngineer: 'John Tsoi, P.Eng.'
      }
    })
  },
  {
    slug: 'frost-on-site',
    sourceFilename: 'frost on site.doc',
    sourcePath: 'reference-letters/legacy/frost on site.doc',
    status: 'supported',
    familyTags: ['frost', 'supplemental-issue-paragraph', 'garage', 'sulphate'],
    expectedHeadingVariant: 'Foundation Soils Inspection',
    expectedLegalDescriptionMode: 'single',
    expectedVisibleSections: ['TOP_BLOCK', 'P1', 'P2', 'P3', 'P3A', 'P4', 'P5', 'P6', 'P7', 'CLOSING', 'SIGNOFF'],
    expectedPositiveTextCues: ['frost was encountered', 'would then be considered suitable', 'Reviewed by,'],
    expectedAbsentTextCues: ['LETTER - CONTINUED'],
    expectedSpecialShellBehaviors: ['Continuation shell uses company + subject/file pattern'],
    notes: ['Follow-up frost-free confirmation remains deferred; this fixture covers active frost on site only.'],
    currentCapabilitySummary: {
      canCurrentCodeReproduce: true,
      missingDomainFields: [],
      inputDependencies: ['frostDepthMm -> supplemental issue paragraph'],
      generationGaps: [],
      compositionGaps: [],
      recommendedTests: ['frost-only branch emits P3A and conditional adequacy']
    },
    formState: withOverrides(standardHouseBase, {
      topBlock: {
        letterDate: '2026-04-10',
        fileNumber: '4504 - 1',
        clientName: 'CANTIRO HOMES LP',
        clientMailingAddress: ['700 – 10240 124 Street NW', 'Edmonton, Alberta', 'T5N 3W6'],
        includeLegalDescription: true,
        lot: '5',
        block: '9',
        plan: '252 1964',
        streetAddress: '423 - 31 Street SW',
        includeSubdivision: true,
        subdivision: 'Alces Subdivision',
        municipality: 'Edmonton, Alberta'
      },
      archive: { hNumber: 'h38926' },
      reportBody: {
        inspectionDate: '2026-04-09',
        excavation: {
          houseFootingCutDepthsM: { frontLeftM: 1.8, frontRightM: 1.8, rearLeftM: 2.0, rearRightM: 2.0 },
          frostDepthMm: 300
        },
        garage: { mode: 'same_elevation', slabOrganics: false },
        sulphate: { includeParagraph: true, sulphateClass: 'negligible' }
      },
      signoff: {
        preparedBy: 'Muhammad Huzaifa, E.I.T.',
        signingEngineer: 'Scott MacFarlane, P.Eng.'
      }
    })
  },
  {
    slug: 'house-garage-with-walkout',
    sourceFilename: 'house garage with walkout example.docx',
    sourcePath: 'reference-letters/legacy/house garage with walkout example.docx',
    status: 'partial',
    familyTags: ['walkout', 'garage', 'winter'],
    expectedHeadingVariant: 'Foundation Soils Inspection',
    expectedLegalDescriptionMode: 'single',
    expectedVisibleSections: ['TOP_BLOCK', 'P1', 'P2', 'P3', 'P4', 'P5', 'P7', 'CLOSING', 'SIGNOFF'],
    expectedPositiveTextCues: ['rear walkout basement', 'garage footing area', 'frost wall'],
    expectedAbsentTextCues: ['P3A'],
    expectedSpecialShellBehaviors: ['Reviewed by signoff block'],
    notes: ['The exact “extra material removed at the back for the frost wall” phrasing still remains review-sensitive.'],
    currentCapabilitySummary: {
      canCurrentCodeReproduce: false,
      missingDomainFields: ['explicit walkout frost-wall delta/removal wording'],
      inputDependencies: ['walkoutBasement + garage mode must coexist cleanly'],
      generationGaps: ['P2 wording is structurally close but not yet a line-for-line historical match'],
      compositionGaps: [],
      recommendedTests: ['walkout and garage sentences remain in historical order']
    },
    formState: withOverrides(victoryBase, {
      topBlock: {
        letterDate: '2026-02-27',
        fileNumber: '5478 - 1',
        clientName: 'VICTORY HOMES LTD.',
        clientMailingAddress: ['1665 – 91 Street SW', 'Edmonton, Alberta', 'T6X 0W8'],
        includeLegalDescription: true,
        lot: '60',
        block: '3',
        plan: '252 2509',
        streetAddress: '4220 – 63 Street',
        includeSubdivision: true,
        subdivision: 'Ruisseau Subdivision',
        municipality: 'Beaumont, Alberta'
      },
      archive: { hNumber: 'h38696' },
      reportBody: {
        inspectionDate: '2026-02-26',
        excavation: {
          houseFootingCutDepthsM: { frontLeftM: 1.3, frontRightM: 1.3, rearLeftM: 1.9, rearRightM: 1.9 },
          walkoutBasement: true,
          walkoutExtraRearRemovalM: 1.2
        },
        garage: { mode: 'same_elevation', slabOrganics: false }
      },
      signoff: {
        preparedBy: 'Doug Parth, E.I.T.',
        signingEngineer: 'Patrick Winski, P.Eng.'
      }
    })
  },
  {
    slug: 'garden-suite',
    sourceFilename: 'garden suit example.docx',
    sourcePath: 'reference-letters/legacy/garden suit example.docx',
    status: 'supported',
    familyTags: ['garden-suite', 'layered-soil', 'engineered-fill', 'winter'],
    expectedHeadingVariant: 'Foundation Soil Inspection – Garden Suite',
    expectedLegalDescriptionMode: 'single',
    expectedVisibleSections: ['TOP_BLOCK', 'P1', 'P2', 'P3', 'P4', 'P7', 'CLOSING', 'SIGNOFF'],
    expectedPositiveTextCues: ['Foundation Soil Inspection – Garden Suite', 'rear garage garden suite structure', 'high plastic clay is highly susceptible'],
    expectedAbsentTextCues: ['P5', 'attached garage'],
    expectedSpecialShellBehaviors: ['Reviewed by signoff block'],
    notes: ['This is now a real structure variant, not just a hidden excavation toggle.'],
    currentCapabilitySummary: {
      canCurrentCodeReproduce: true,
      missingDomainFields: [],
      inputDependencies: ['structureVariant suppresses ordinary attached-garage controls and P5'],
      generationGaps: [],
      compositionGaps: [],
      recommendedTests: ['garden-suite heading and recommendation family remain locked']
    },
    formState: withOverrides(victoryBase, {
      topBlock: {
        letterDate: '2026-03-06',
        fileNumber: '5478 - 1',
        headingSuffix: '',
        includeLegalDescription: true,
        lot: '110',
        block: '17',
        plan: '252 2250',
        streetAddress: '607 – 30 Street SW',
        includeSubdivision: true,
        subdivision: 'Alces Subdivision',
        municipality: 'Edmonton, Alberta'
      },
      archive: { hNumber: 'h38733' },
      reportBody: {
        inspectionDate: '2026-03-05',
        structureVariant: 'rear_garage_garden_suite',
        excavation: {
          houseFootingCutDepthsM: { frontLeftM: 1.2, frontRightM: 1.2, rearLeftM: 1.7, rearRightM: 1.7 }
        },
        soil: {
          ...victoryBase.reportBody.soil,
          soilLayeringMode: 'engineered_fill_over_native',
          primarySoilOrigin: 'engineered_fill_jrp',
          layeredCoverageMode: 'throughout_excavation',
          fillDepthBelowFootingMm: 300,
          engineeredFillLayer: {
            materialFamily: 'clay',
            clayDescriptors: ['silty', 'sandy'],
            moisture1: 'moist',
            colour: 'brown_and_dark_grey',
            plasticity1: 'medium',
            plasticity2: 'high',
            consistencyOrDensity: 'very_stiff',
            traceFeatures: ['oxides', 'organics']
          },
          underlyingNativeLayer: {
            materialFamily: 'clay_till',
            clayDescriptors: ['silty', 'sandy'],
            moisture1: 'moist',
            colour: 'brown',
            plasticity1: 'medium',
            consistencyOrDensity: 'stiff',
            traceFeatures: ['oxides', 'coal', 'gravel']
          },
          highPlasticWarning: true
        },
        garage: { mode: 'none', slabOrganics: false }
      },
      signoff: {
        preparedBy: 'Muhammad Huzaifa, E.I.T.',
        signingEngineer: 'Scott MacFarlane, P.Eng.'
      }
    })
  },
  {
    slug: 'multiple-lots',
    sourceFilename: 'multiple lots.doc',
    sourcePath: 'reference-letters/legacy/multiple lots.doc',
    status: 'supported',
    familyTags: ['multiple-lots', 'custom-legal-description', 'engineered-fill', 'winter', 'sulphate'],
    expectedHeadingVariant: 'Foundation Soils Inspection',
    expectedLegalDescriptionMode: 'custom',
    expectedVisibleSections: ['TOP_BLOCK', 'P1', 'P2', 'P3', 'P4', 'P6', 'P7', 'CLOSING', 'SIGNOFF'],
    expectedPositiveTextCues: ['Lot 5, 6, 7 & 8, Block 12, Plan 252 2670', '2020, 2022, 2024 & 2026 - 212 Street NW'],
    expectedAbsentTextCues: ['Lot undefined', 'Block undefined'],
    expectedSpecialShellBehaviors: ['Custom legal-description lines render in the Re block without exposing H-number'],
    notes: ['This case establishes the custom / multiple-lot top-block path.'],
    currentCapabilitySummary: {
      canCurrentCodeReproduce: true,
      missingDomainFields: [],
      inputDependencies: ['legalDescriptionMode custom hides lot/block/plan fields and reveals custom lines'],
      generationGaps: [],
      compositionGaps: [],
      recommendedTests: ['custom legal-description lines replace standard single-lot legal description']
    },
    formState: withOverrides(standardHouseBase, {
      topBlock: {
        letterDate: '2026-04-11',
        fileNumber: '4504-1',
        clientName: 'CANTIRO HOMES LP',
        clientMailingAddress: ['700 – 10240 124 Street NW', 'Edmonton, Alberta', 'T5N 3W6'],
        includeLegalDescription: true,
        legalDescriptionMode: 'custom',
        customLegalDescriptionLines: [
          'Lot 5, 6, 7 & 8, Block 12, Plan 252 2670',
          '2020, 2022, 2024 & 2026 - 212 Street NW'
        ],
        includeSubdivision: true,
        subdivision: 'Alces Subdivision',
        municipality: 'Edmonton, Alberta'
      },
      archive: { hNumber: 'h38921' },
      reportBody: {
        inspectionDate: '2026-04-07',
        excavation: {
          houseFootingCutDepthsM: { frontLeftM: 1.6, frontRightM: 1.6, rearLeftM: 1.9, rearRightM: 1.9 }
        },
        soil: {
          ...standardHouseBase.reportBody.soil,
          primarySoilOrigin: 'engineered_fill_jrp',
          primaryMaterialFamily: 'clay',
          clayDescriptors: ['silty', 'sandy'],
          moisture1: 'moist',
          colour: 'brown_and_grey',
          plasticity1: 'medium',
          consistencyOrDensity: 'very_stiff',
          traceFeatures: ['oxides', 'coal', 'gravel', 'organics']
        },
        garage: { mode: 'none', slabOrganics: false },
        sulphate: { includeParagraph: true, sulphateClass: 'negligible' }
      },
      signoff: {
        preparedBy: 'Doug Parth, E.I.T.',
        signingEngineer: 'Scott MacFarlane, P.Eng.'
      }
    })
  },
  {
    slug: 'over-excavated-service-trench',
    sourceFilename: 'over excavted service trench.docx',
    sourcePath: 'reference-letters/legacy/over excavted service trench.docx',
    status: 'supported',
    familyTags: ['oversized-trench', 'supplemental-issue-paragraph', 'custom-legal-description', 'garage'],
    expectedHeadingVariant: 'Foundation Soils Inspection',
    expectedLegalDescriptionMode: 'custom',
    expectedVisibleSections: ['TOP_BLOCK', 'P1', 'P2', 'P3', 'P3A', 'P4', 'P5', 'P7', 'CLOSING', 'SIGNOFF'],
    expectedPositiveTextCues: ['Due to an oversized cut in the service trench', 'front garage footing should be reinforced'],
    expectedAbsentTextCues: ['washed rock slab base'],
    expectedSpecialShellBehaviors: ['Continuation shell uses office continuation pattern'],
    notes: ['Historical sample uses a dedicated issue paragraph and multiple-lot custom legal description.'],
    currentCapabilitySummary: {
      canCurrentCodeReproduce: true,
      missingDomainFields: [],
      inputDependencies: ['oversizedTrenchMode reveals trenchLocation'],
      generationGaps: [],
      compositionGaps: [],
      recommendedTests: ['oversized trench reinforcement path remains conditional']
    },
    formState: withOverrides(standardHouseBase, {
      topBlock: {
        letterDate: '2026-04-09',
        fileNumber: '4460 - 1',
        clientName: 'Oasis Engineering GROUP Ltd.',
        clientMailingAddress: ['202, 10335 - 178 Street NW', 'Edmonton, Alberta', 'T5S 1S2'],
        includeLegalDescription: true,
        legalDescriptionMode: 'custom',
        customLegalDescriptionLines: ['Lots 92 & 93, Block 21, Plan 242 2238', '2222 & 2224 Chokecherry Close SW'],
        includeSubdivision: true,
        subdivision: 'Orchards Subdivision',
        municipality: 'Edmonton, Alberta'
      },
      archive: { hNumber: 'h38935' },
      reportBody: {
        inspectionDate: '2026-04-08',
        excavation: {
          houseFootingCutDepthsM: { frontLeftM: 1.0, frontRightM: 1.0, rearLeftM: 1.4, rearRightM: 1.4 },
          oversizedTrenchMode: 'reinforcement',
          trenchLocation: 'front'
        },
        garage: { mode: 'same_elevation', slabOrganics: false }
      },
      signoff: {
        preparedBy: 'Muhammad Huzaifa, E.I.T.',
        signingEngineer: 'Scott MacFarlane, P.Eng.'
      }
    })
  },
  {
    slug: 'clay-fill-then-other-soils-below',
    sourceFilename: 'clay fill then other soils below example.docx',
    sourcePath: 'reference-letters/legacy/clay fill then other soils below example.docx',
    status: 'supported',
    familyTags: ['layered-soil', 'engineered-fill', 'garage', 'sulphate', 'winter'],
    expectedHeadingVariant: 'Foundation Soils Inspection',
    expectedLegalDescriptionMode: 'custom',
    expectedVisibleSections: ['TOP_BLOCK', 'P1', 'P2', 'P3', 'P4', 'P5', 'P6', 'P7', 'CLOSING', 'SIGNOFF'],
    expectedPositiveTextCues: ['to a depth of approximately 0.8 m', 'Below the fill', 'engineered fill program monitored and tested by our firm'],
    expectedAbsentTextCues: ['P3A'],
    expectedSpecialShellBehaviors: ['Reviewed by signoff block'],
    notes: ['This case hardens the two-layer soil path without turning it into an arbitrary N-layer system.'],
    currentCapabilitySummary: {
      canCurrentCodeReproduce: true,
      missingDomainFields: [],
      inputDependencies: ['soilLayeringMode reveals layered descriptors and fill depth'],
      generationGaps: [],
      compositionGaps: [],
      recommendedTests: ['fill layer and native-below-fill wording both survive']
    },
    formState: withOverrides(standardHouseBase, {
      topBlock: {
        letterDate: '2026-03-12',
        fileNumber: '4460 - 1',
        clientName: 'Oasis Engineering GROUP Ltd.',
        clientMailingAddress: ['202, 10335 - 178 Street NW', 'Edmonton, Alberta', 'T5S 1S2'],
        includeLegalDescription: true,
        legalDescriptionMode: 'custom',
        customLegalDescriptionLines: ['Lot 11 and 12 Block 28, Plan 242 2337', '18115 and 18117 – 74 Street NW'],
        includeSubdivision: true,
        subdivision: 'Crystallina Nera Subdivision',
        municipality: 'Edmonton, Alberta'
      },
      archive: { hNumber: 'h38764' },
      reportBody: {
        inspectionDate: '2026-03-10',
        excavation: {
          houseFootingCutDepthsM: { frontLeftM: 1.5, frontRightM: 1.5, rearLeftM: 3.2, rearRightM: 3.2 }
        },
        soil: {
          ...standardHouseBase.reportBody.soil,
          soilLayeringMode: 'engineered_fill_over_native',
          primarySoilOrigin: 'engineered_fill_jrp',
          layeredCoverageMode: 'throughout_excavation',
          fillDepthBelowFootingMm: 800,
          engineeredFillLayer: {
            materialFamily: 'clay',
            clayDescriptors: ['silty'],
            moisture1: 'moist',
            colour: 'brown',
            plasticity1: 'medium',
            consistencyOrDensity: 'very_stiff',
            traceFeatures: ['organics']
          },
          underlyingNativeLayer: {
            materialFamily: 'clay',
            clayDescriptors: ['silty'],
            moisture1: 'moist',
            colour: 'brown',
            plasticity1: 'medium',
            consistencyOrDensity: 'stiff'
          }
        },
        garage: { mode: 'same_elevation', slabOrganics: false },
        sulphate: { includeParagraph: true, sulphateClass: 'severe' }
      },
      signoff: {
        preparedBy: 'Andrew R. Klein, B. Sc.',
        signingEngineer: 'Alan Lang, P.Eng.'
      }
    })
  },
  {
    slug: 'already-poured-footing',
    sourceFilename: 'already poured footing example.docx',
    sourcePath: 'reference-letters/legacy/already poured footing example.docx',
    status: 'supported',
    familyTags: ['as-constructed', 'garage', 'winter'],
    expectedHeadingVariant: 'Foundation Soils Inspection',
    expectedLegalDescriptionMode: 'single',
    expectedVisibleSections: ['TOP_BLOCK', 'P1', 'P2', 'P3', 'P4', 'P5', 'P7', 'CLOSING', 'SIGNOFF'],
    expectedPositiveTextCues: ['strip footing forms', 'as placed, was considered adequate', '2500 pounds per square foot', 'Job#'],
    expectedAbsentTextCues: ['P3A'],
    expectedSpecialShellBehaviors: ['Reviewed by signoff block'],
    notes: ['The canonical enum names still use “poured” for backward compatibility even though the real wording is “forms ... had been placed.”'],
    currentCapabilitySummary: {
      canCurrentCodeReproduce: true,
      missingDomainFields: [],
      inputDependencies: ['asConstructedMode suppresses the normal live-excavation branch'],
      generationGaps: [],
      compositionGaps: [],
      recommendedTests: ['as-constructed wording uses “as placed” and preserves garage derivation', '120 kPa family remains visible when selected']
    },
    formState: withOverrides(standardHouseBase, {
      topBlock: {
        letterDate: '2026-04-13',
        fileNumber: '3343 - 1',
        clientName: 'LAUNCH HOMES INC.',
        clientMailingAddress: ['9310 – 62 Avenue NW', 'Edmonton, Alberta', 'T6E 0C9'],
        includeLegalDescription: true,
        lot: '7',
        block: '10',
        plan: '252 1945',
        streetAddress: '26 Cuddie Drive',
        includeClientJobNumber: true,
        clientReferenceLabelFamily: 'job_hash',
        clientJobNumber: 'CBR-6223',
        includeSubdivision: true,
        subdivision: 'Keswick Subdivision',
        municipality: 'Edmonton, Alberta'
      },
      archive: { hNumber: 'h38937' },
      reportBody: {
        inspectionDate: '2026-04-08',
        excavation: {
          houseFootingCutDepthsM: { frontLeftM: 1.5, frontRightM: 1.5, rearLeftM: 2.9, rearRightM: 2.9 },
          asConstructedMode: 'poured_18in'
        },
        recommendation: {
          spreadFootingFamily: 'default_120_kpa'
        },
        garage: { mode: 'same_elevation', slabOrganics: false }
      },
      signoff: {
        preparedBy: 'Andrew R. Klein, B. Sc.',
        signingEngineer: 'Rick Evans, P.Eng.'
      }
    })
  }
];

export function getLegacyOutputCase(slug: string): LegacyOutputCaseManifest | undefined {
  return legacyOutputCases.find((fixture) => fixture.slug === slug);
}

export function getLegacyOutputCaseMatrixSummary() {
  return legacyOutputCases.map((fixture) => ({
    slug: fixture.slug,
    status: fixture.status,
    canCurrentCodeReproduce: fixture.currentCapabilitySummary.canCurrentCodeReproduce,
    missingDomainFields: fixture.currentCapabilitySummary.missingDomainFields,
    inputDependencies: fixture.currentCapabilitySummary.inputDependencies,
    generationGaps: fixture.currentCapabilitySummary.generationGaps,
    compositionGaps: fixture.currentCapabilitySummary.compositionGaps,
    recommendedTests: fixture.currentCapabilitySummary.recommendedTests
  }));
}
