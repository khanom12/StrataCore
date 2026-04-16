import type { ClientReferenceLabelFamily, GarageMode, SubjectLineFamily } from '@/types/domain';

interface SeedClauseSupplement {
  id: string;
  title: string;
  text: string;
  decisionRuleIds: string[];
  v1Handling?: string;
}

interface SeedRuleSupplement {
  id: string;
  sectionId?: string;
  seedSection: string;
  output: string;
  primaryClauseIds: string[];
  support: string;
}

export const supplementalSeedClauses: SeedClauseSupplement[] = [
  {
    id: 'CL_053',
    title: 'Spread Footings – 120 kPa',
    text: 'Spread footings may be designed utilizing a factored bearing resistance of 120 kilopascals (2500 pounds per square foot) with a geotechnical resistance factor of 0.5.',
    decisionRuleIds: ['DT_116'],
    v1Handling: 'AUTO'
  }
];

export const supplementalSeedRules: SeedRuleSupplement[] = [
  {
    id: 'DT_116',
    sectionId: 'P4',
    seedSection: 'P4',
    output: 'Append 120 kPa spread-footing sentence to P4 when the verified as-constructed family is selected.',
    primaryClauseIds: ['CL_053'],
    support: 'AUTO'
  },
  {
    id: 'DT_117',
    sectionId: 'TOP_BLOCK',
    seedSection: 'META',
    output: 'Map the selected subject-line family into the visible Re line while keeping garden suite singular with suffix.',
    primaryClauseIds: ['META_05'],
    support: 'AUTO'
  },
  {
    id: 'DT_118',
    sectionId: 'TOP_BLOCK',
    seedSection: 'META',
    output: 'Format the composed shell date using the office display-date family instead of raw ISO values.',
    primaryClauseIds: ['META_02'],
    support: 'AUTO'
  },
  {
    id: 'DT_119',
    sectionId: 'TOP_BLOCK',
    seedSection: 'META',
    output: 'Use the selected client reference-label family when the visible client reference number is included.',
    primaryClauseIds: ['META_08'],
    support: 'AUTO'
  },
  {
    id: 'DT_120',
    sectionId: 'SIGNOFF',
    seedSection: 'SIG',
    output: 'Keep stamp and permit asset warnings internal, and omit bracketed placeholder text from the visible signoff block.',
    primaryClauseIds: ['SIG_02', 'SIG_03'],
    support: 'AUTO'
  },
  {
    id: 'DT_121',
    sectionId: 'SIGNOFF',
    seedSection: 'SIG / Archive',
    output: 'Place the archive path visibly below signoff and above the office footer on the final page.',
    primaryClauseIds: ['SIG_04'],
    support: 'AUTO'
  },
  {
    id: 'DT_122',
    sectionId: 'P2',
    seedSection: 'P2',
    output: 'When walkout and garage coexist, follow the walkout-then-garage order but keep the combined historical-family ordering visible for analyst review.',
    primaryClauseIds: ['CL_018', 'CL_021', 'CL_022'],
    support: 'REVIEW'
  },
  {
    id: 'DT_123',
    sectionId: 'SIGNOFF',
    seedSection: 'SIG / Archive',
    output: 'Block DOCX export when active-field validation fails or client-facing placeholder text would leak into the issued shell.',
    primaryClauseIds: ['SIG_04'],
    support: 'AUTO'
  },
  {
    id: 'DT_124',
    sectionId: 'FMT_03',
    seedSection: 'FMT_03',
    output: 'Use a continuation header without a hard-coded total-page count and keep the company plus subject/file pattern.',
    primaryClauseIds: ['FMT_03'],
    support: 'AUTO'
  }
];

export const officeShellText = {
  companyName: 'J.R. Paine & Associates Ltd.',
  companySubtitle: 'CONSULTING AND TESTING ENGINEERS',
  companyCities: 'EDMONTON - GRANDE PRAIRIE - PEACE RIVER',
  officeAddress: ['2304 - 119 Avenue NE', 'Edmonton, Alberta', 'T6S 1B3'],
  officeContacts: [
    { city: 'EDMONTON', phone: '780-489-0700' },
    { city: 'GRANDE PRAIRIE', phone: '780-532-1515' },
    { city: 'PEACE RIVER', phone: '780-624-4966' }
  ],
  closingParagraph: 'We trust this information is considered satisfactory. Should you have any questions, please contact our office.'
} as const;

export const signoffText = {
  salutation: 'Yours truly,',
  organization: 'J.R. Paine & Associates Ltd.',
  labels: {
    preparedBy: 'Prepared by,',
    reviewedBy: 'Reviewed by,',
    signedBy: 'Signed by,',
    preparedAndSignedBy: 'Prepared and signed by,',
    memberNumber: 'APEGA Member #:'
  }
} as const;

const subjectLineTextByFamily: Record<SubjectLineFamily, string> = {
  singular: 'Foundation Soil Inspection',
  plural: 'Foundation Soils Inspection'
};

const clientReferenceLabels: Record<ClientReferenceLabelFamily, string> = {
  client_job_no: 'Client Job No.:',
  job_hash: 'Job#'
};

export function getSubjectLineText(subjectLineFamily: SubjectLineFamily, headingSuffix: string | undefined, isGardenSuite: boolean): string {
  if (isGardenSuite) {
    return 'Foundation Soil Inspection – Garden Suite';
  }

  const base = subjectLineTextByFamily[subjectLineFamily];
  return headingSuffix ? `${base} – ${headingSuffix}` : base;
}

export function getClientReferenceLabelText(labelFamily: ClientReferenceLabelFamily): string {
  return clientReferenceLabels[labelFamily];
}

export function buildWalkoutSentence(input: {
  frontMinimum: string;
  frontMaximum: string;
  rearMinimum: string;
  rearMaximum: string;
  extraRearRemoval?: string;
}) {
  const extraRearRemovalSentence = input.extraRearRemoval
    ? ` An extra ${input.extraRearRemoval} m of material was removed from the back portion of the excavation to allow for the construction of a frost wall to accommodate a rear walkout basement.`
    : ' Final frost-wall and extra-removal wording should still be confirmed during review.';

  return `Cuts of approximately ${input.frontMinimum} to ${input.frontMaximum} m below the adjacent ground surface were noted at the front of the excavation, and cuts of approximately ${input.rearMinimum} to ${input.rearMaximum} metres below the adjacent ground surface were noted at the back.${extraRearRemovalSentence}`;
}

export function buildGarageExcavationSentence(garageMode: Exclude<GarageMode, 'none'>, offsetAboveHouse?: string) {
  if (garageMode === 'same_elevation') {
    return 'In addition, the excavation had been extended into the garage footing areas, with the bottom of that excavation at the same elevation as the house excavation floor.';
  }

  return `In addition, an excavation had also been made in the garage footing area, with the excavation floor noted ${
    offsetAboveHouse ? `at approximately ${offsetAboveHouse} m above the house excavation level` : 'above the house excavation level'
  }.`;
}

export function buildAsConstructedExcavationSentence(input: { footingWidthMm: number; footingDepthMm: number }) {
  return `At the time of inspection, the excavation was at footing grade and strip footing forms with a footing width of approximately ${input.footingWidthMm} millimetres and depth of approximately ${input.footingDepthMm} millimetres had been placed.`;
}

export function buildAsConstructedHouseAdequacySentence() {
  return 'The soil conditions at this site were considered suitable for the construction of a standard house foundation. The strip footing size, as placed, was considered adequate for this residence.';
}

export function buildAsConstructedGarageAdequacySentence() {
  return 'It appears the building contractor utilized a standard footing form for the attached garage. The strip footing size, as placed, was also considered adequate for this garage.';
}

export const excavationIssueText = {
  looseMaterialNoted: 'Loose materials were noted across the excavation floor.',
  looseMaterialCleanup:
    'Areas of loose peeling clay material were encountered throughout the excavation floor and should be treated as a footing-preparation issue.',
  looseMaterialThickenedFooting:
    'Areas of loose peeling clay material should be hand removed from below the footing. The excavated material can be accounted for by a thickened footing. Care must also be taken to place the weeping tile level, with no bumps or sags and have positive flow to the sump.',
  looseMaterialPlacementCleanup: 'All loose material should be removed from the footing bearing surface prior to placement of concrete.',
  oversizedTrenchObservation: 'An oversized service trench was noted {location}.',
  oversizedTrenchReinforcement:
    'Due to an oversized cut in the service trench {location}, the front garage footing should be reinforced with one row of 2-10M bars spread evenly throughout the footing. The front garage wall should be reinforced with four rows of 2-10M bars, spread evenly throughout the wall.',
  oversizedTrenchFillcrete:
    'Due to the oversized service trench, the existing trench fill materials should be removed from beneath the footing areas and backfilled with fillcrete. Another option would be to backfill the over excavated service trench to the design footing elevation with filter cloth and washed rock or crushed gravel. The foundation drainage must be modified to drain the washed rock or crushed gravel and ensure positive flow within the weeping tile towards the sump.',
  oversizedTrenchPrecast:
    'An oversized service trench requiring an alternate pre-cast or special remediation package was selected. This branch remains visible for office review before issue.',
  rainSoftenedObservation: 'Surficial free water and saturated material were noted within the excavation after rainfall.',
  rainSoftenedRemediation:
    'The water softened material should be adequately dried or removed from underneath the footing areas prior to pouring. The excavated material can be accounted for by a thickened footing. Care must also be taken to place the weeping tile level, with no bumps or sags and maintain positive drainage.',
  exposedElectricalTrenchObservation:
    'An exposed electrical service trench was noted along the front excavation wall and may provide a path for surficial water into the excavation.',
  exposedElectricalTrenchRemediation:
    'It appears that the free water is due to surficial water draining into the excavation via an exposed electrical service trench in the front excavation wall. The free water encountered should be removed from within the excavation and the excavation should be adequately dried. Also, any water softened and/or disturbed material should be excavated from beneath the footings. Care must also be taken to place the weeping tile level, with no bumps or sags.',
  freeWaterBasic:
    'At the time of inspection, free water was noted pooling in the auger holes approximately {depth}. The free water must be removed from below all footings just prior to concrete placement. Temporary dewatering may be required. Due to the infiltrating water in the auger holes, the house drainage should be upgraded to include interior as well as exterior weeping tile. Care must also be taken to place the weeping tile level, with no bumps or sags and have positive flow to the sump.',
  freeWaterUpgradedDrainage:
    'At the time of inspection, free water was noted pooling in the auger holes approximately {depth}. Due to the infiltrating water in the auger holes, the house drainage should be upgraded to include a washed rock slab base and interior as well as exterior weeping tile with two laterals.',
  upgradedDrainageDrawing: 'A drawing depicting the recommended drainage measures is attached.'
} as const;
