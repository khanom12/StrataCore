import { buildArchivePath, buildFilename } from '@/lib/export/build-filename';
import { buildSignoffModel } from '@/lib/signoff/build-signoff-model';
import { formatSignoffName } from '@/lib/signoff/engineer-registry';
import { createReviewFlag } from '@/lib/review/flags';
import {
  deriveFrontAndRearCutRanges,
  deriveHouseCutRange,
  formatDisplayDate
} from '@/lib/domain/report-helpers';
import {
  getClauseText,
  getReviewDecision,
  toClauseRefs,
  toRuleRefs,
  uniqueClauseRefs,
  uniqueRuleRefs
} from '@/lib/seed/source-data';
import type {
  ClauseRef,
  FormState,
  GeneratedParagraph,
  GenerationResult,
  ReviewFlag,
  RuleRef,
  SectionId
} from '@/types/domain';

interface RecommendationAdvisoryContext {
  advisories: string[];
  clauseIds: string[];
  ruleIds: string[];
  requiresConditionalAdequacy: boolean;
}

function formatNumber(value?: number): string {
  if (value === undefined || Number.isNaN(value)) {
    return '[review required]';
  }

  return value.toFixed(1);
}

function formatMillimetres(value?: number): string {
  if (value === undefined || Number.isNaN(value)) {
    return '[review required]';
  }

  return `${Math.round(value)}`;
}

function materialLabel(material: FormState['reportBody']['soil']['primaryMaterialFamily']): string {
  switch (material) {
    case 'clay':
      return 'clay';
    case 'clay_till':
      return 'clay till';
    case 'sand':
      return 'sand';
    case 'silt':
      return 'silt';
    case 'clayey_sand':
      return 'clayey sand';
    case 'clayey_silt':
      return 'clayey silt';
  }
}

function descriptorLabel(value: string): string {
  return value.replaceAll('_', ' ');
}

function colourLabel(colour: FormState['reportBody']['soil']['colour']): string {
  return colour.replaceAll('_', ' ');
}

function plasticityLabel(
  plasticity1: FormState['reportBody']['soil']['plasticity1'],
  plasticity2?: FormState['reportBody']['soil']['plasticity2']
): string {
  return plasticity2 ? `${plasticity1} to ${plasticity2} plasticity` : `${plasticity1} plasticity`;
}

function traceFeatureLabel(traceFeatures: NonNullable<FormState['reportBody']['soil']['traceFeatures']>): string {
  if (traceFeatures.length === 1) {
    return `featured traces of ${descriptorLabel(traceFeatures[0])}`;
  }

  const readable = traceFeatures.map(descriptorLabel);
  return `featured traces of ${readable.slice(0, -1).join(', ')} and ${readable.at(-1)}`;
}

function materialDescriptorLabel(soil: FormState['reportBody']['soil']): string {
  const descriptors =
    soil.primaryMaterialFamily === 'sand' || soil.primaryMaterialFamily === 'silt'
      ? soil.sandSiltDescriptors?.map(descriptorLabel) ?? []
      : soil.clayDescriptors?.map(descriptorLabel) ?? [];

  if (descriptors.length === 0) {
    return materialLabel(soil.primaryMaterialFamily);
  }

  return `${descriptors.join(', ')} ${materialLabel(soil.primaryMaterialFamily)}`;
}

function trenchLocationLabel(location?: FormState['reportBody']['excavation']['trenchLocation']): string {
  switch (location) {
    case 'front':
      return 'in the front portion of the excavation';
    case 'front_left':
      return 'in the front left portion of the excavation';
    case 'front_right':
      return 'in the front right portion of the excavation';
    default:
      return 'within the footing area';
  }
}

function applyConditionalAdequacy(text: string): string {
  return text.replace('were considered adequate', 'would then be considered adequate');
}

function createParagraph(input: {
  id: string;
  sectionId: SectionId;
  title: string;
  text: string;
  order: number;
  clauseIds: string[];
  ruleIds: string[];
  reviewSensitive?: boolean;
}): GeneratedParagraph {
  return {
    id: input.id,
    sectionId: input.sectionId,
    title: input.title,
    text: input.text,
    order: input.order,
    clauseRefs: toClauseRefs(input.clauseIds),
    ruleRefs: toRuleRefs(input.ruleIds),
    reviewSensitive: input.reviewSensitive ?? false
  };
}

function buildTopBlockParagraph(formState: FormState): GeneratedParagraph {
  const topBlockLines = [
    formatDisplayDate(formState.topBlock.letterDate),
    `File No.: ${formState.topBlock.fileNumber}`,
    '',
    formState.topBlock.clientName,
    ...formState.topBlock.clientMailingAddress,
    '',
    `Re: Foundation Soil Inspection${formState.topBlock.headingSuffix ? ` - ${formState.topBlock.headingSuffix}` : ''}`,
    formState.topBlock.includeLegalDescription && formState.topBlock.lot && formState.topBlock.block && formState.topBlock.plan
      ? `Lot ${formState.topBlock.lot}, Block ${formState.topBlock.block}, Plan ${formState.topBlock.plan}`
      : null,
    formState.topBlock.streetAddress,
    formState.topBlock.includeClientJobNumber && formState.topBlock.clientJobNumber
      ? `Client Job No.: ${formState.topBlock.clientJobNumber}`
      : null,
    formState.topBlock.includeSubdivision && formState.topBlock.subdivision ? formState.topBlock.subdivision : null,
    formState.topBlock.municipality
  ]
    .filter((value): value is string => value !== null)
    .join('\n');

  return createParagraph({
    id: 'top-block',
    sectionId: 'TOP_BLOCK',
    title: 'Top Block',
    text: topBlockLines,
    order: 10,
    clauseIds: ['META_02', 'META_03', 'META_04', 'META_05', 'META_06', 'META_07', 'META_08', 'META_09', 'META_10'],
    ruleIds: ['DT_001', 'DT_002', 'DT_003', 'DT_004', 'DT_005', 'DT_006']
  });
}

function buildP1Paragraph(formState: FormState): GeneratedParagraph {
  return createParagraph({
    id: 'p1',
    sectionId: 'P1',
    title: 'P1 Intro',
    text: getClauseText('CL_000').replace('{January 28, 2026}', formatDisplayDate(formState.reportBody.inspectionDate)).trim(),
    order: 20,
    clauseIds: ['CL_000'],
    ruleIds: ['DT_010']
  });
}

function appendWalkoutSentence(
  formState: FormState,
  sentences: string[],
  clauseIds: string[],
  ruleIds: string[],
  reviewFlags: ReviewFlag[]
) {
  const frontAndRear = deriveFrontAndRearCutRanges(formState.reportBody.excavation.houseFootingCutDepthsM);

  sentences.push(
    `Rear walkout basement conditions were selected. Cuts of approximately ${formatNumber(
      frontAndRear.front.minimumM
    )} to ${formatNumber(frontAndRear.front.maximumM)} m below adjacent grade were recorded at the front of the excavation, and cuts of approximately ${formatNumber(
      frontAndRear.rear.minimumM
    )} to ${formatNumber(frontAndRear.rear.maximumM)} m below adjacent grade were recorded at the rear. Final frost-wall wording should still be confirmed during review.`
  );
  clauseIds.push('CL_018');
  ruleIds.push('DT_022');
  reviewFlags.push(
    createReviewFlag({
      id: 'review-walkout-wording',
      title: 'Walkout wording needs confirmation',
      message:
        'Walkout wording is now seeded from the recorded front and rear cut depths, but the final frost-wall wording remains review-sensitive until the office confirms the canonical branch.',
      relatedSectionId: 'P2',
      clauseRefs: toClauseRefs(['CL_018']),
      ruleRefs: toRuleRefs(['DT_022'])
    })
  );
}

function appendGarageExcavationSentence(
  formState: FormState,
  sentences: string[],
  clauseIds: string[],
  ruleIds: string[]
) {
  const garage = formState.reportBody.garage;

  if (garage.mode === 'same_elevation') {
    sentences.push(
      'In addition, the excavation had been extended into the garage footing areas, with the bottom of that excavation at the same elevation as the house excavation floor.'
    );
    clauseIds.push('CL_021');
    ruleIds.push('DT_023');
  }

  if (garage.mode === 'higher_than_house') {
    const offsetText =
      garage.offsetAboveHouseM !== undefined
        ? `at approximately ${formatNumber(garage.offsetAboveHouseM)} m above the house excavation level`
        : 'above the house excavation level';

    sentences.push(`In addition, an excavation had also been made in the garage footing area, with the excavation floor noted ${offsetText}.`);
    clauseIds.push('CL_022');
    ruleIds.push('DT_024');
  }
}

function appendExcavationConditionAddOns(
  formState: FormState,
  sentences: string[],
  clauseIds: string[],
  ruleIds: string[],
  reviewFlags: ReviewFlag[]
) {
  const excavation = formState.reportBody.excavation;

  if (excavation.siteHistory === 'infill') {
    sentences.push(getClauseText('CL_006'));
    clauseIds.push('CL_006');
    ruleIds.push('DT_039');
  }

  if (excavation.siteHistory === 'knockdown_rebuild') {
    sentences.push('It is understood that a previous residence had existed upon the site and had been removed prior to our inspection.');
    clauseIds.push('CL_027');
    ruleIds.push('DT_040');
  }

  if (excavation.oversizedTrench) {
    sentences.push(`An oversized service trench was noted ${trenchLocationLabel(excavation.trenchLocation)}.`);
    clauseIds.push('CL_024');
    ruleIds.push('DT_031');
  }

  if (excavation.loosePeelingMaterial) {
    sentences.push('Areas of loose peeling clay material were encountered throughout the excavation floor and should be treated as a footing-preparation issue.');
    clauseIds.push('CL_025');
    ruleIds.push('DT_032');
  }

  if (excavation.sloughMaterial) {
    sentences.push('Localized slough material from the excavation sidewall was encountered on the excavation floor and should be removed from the excavation.');
    clauseIds.push('CL_013');
    ruleIds.push('DT_030');
  }

  if (excavation.frostDepthMm && excavation.frostDepthMm > 0) {
    sentences.push(
      `At the time of inspection, frost was encountered throughout most of the excavation floor to a depth of approximately ${formatMillimetres(
        excavation.frostDepthMm
      )} millimetres.`
    );
    clauseIds.push('CL_010');
    ruleIds.push('DT_033');
  }

  if (excavation.rainSoftenedMode === 'saturated_soft_surficial') {
    sentences.push('The surficial material in the excavation was saturated and soft after rainfall.');
    clauseIds.push('CL_036');
    ruleIds.push('DT_035');
    reviewFlags.push(
      createReviewFlag({
        id: 'review-rain-softened-family',
        title: 'Rain-softened wording remains review-sensitive',
        message:
          getReviewDecision('DL_004')?.interimHandling ??
          'Rain-softened cases remain in scope, but the exact wording family still needs office confirmation.',
        relatedSectionId: 'P2',
        clauseRefs: toClauseRefs(['CL_036']),
        ruleRefs: toRuleRefs(['DT_035'])
      })
    );
  }

  if (excavation.rainSoftenedMode === 'standing_water_rain_softened') {
    sentences.push('The surficial material in the excavation was saturated and soft, with isolated standing water attributed to rainfall received after excavation.');
    clauseIds.push('CL_036');
    ruleIds.push('DT_035');
    reviewFlags.push(
      createReviewFlag({
        id: 'review-rain-softened-standing-water',
        title: 'Standing-water rain branch needs review',
        message:
          getReviewDecision('DL_004')?.exactReviewQuestion ??
          'Standing-water rain-softened wording and remediation selection should remain visible for review in V1.',
        relatedSectionId: 'P2',
        clauseRefs: toClauseRefs(['CL_036']),
        ruleRefs: toRuleRefs(['DT_035'])
      })
    );
  }

  if (excavation.freeWaterInAugerHoles) {
    const depthContext = excavation.waterContext ? ` ${excavation.waterContext}` : ' below footing elevation';
    sentences.push(`Free water was noted pooling in auger holes approximately${depthContext}.`);
    clauseIds.push('CL_026');
    ruleIds.push('DT_034');
  }

  if (excavation.exposedElectricalTrench) {
    sentences.push('An exposed electrical service trench was noted along the front excavation wall and may provide a path for surface water into the excavation.');
    clauseIds.push('CL_039');
    ruleIds.push('DT_037');
  }

  if (excavation.snowDepthMm && excavation.snowDepthMm > 0) {
    sentences.push(`Approximately ${formatMillimetres(excavation.snowDepthMm)} millimetres of snow covered the excavation at the time of inspection.`);
    clauseIds.push('CL_038');
    ruleIds.push('DT_036');
  }

  if (excavation.groundHeatingSystem) {
    reviewFlags.push(
      createReviewFlag({
        id: 'review-ground-heating-wording',
        title: 'Ground heating wording remains review-sensitive',
        message:
          getReviewDecision('DL_004')?.exactReviewQuestion ??
          'Ground-heating language remains in scope, but the seed file still treats the full wording as review-sensitive.',
        relatedSectionId: 'P2',
        clauseRefs: toClauseRefs(['CL_042']),
        ruleRefs: toRuleRefs(['DT_085'])
      })
    );
  }
}

function buildP2Paragraph(formState: FormState, reviewFlags: ReviewFlag[]): GeneratedParagraph {
  const excavation = formState.reportBody.excavation;
  const cutRange = deriveHouseCutRange(excavation.houseFootingCutDepthsM);
  const sentences: string[] = [];
  const clauseIds = ['P2'];
  const ruleIds = ['DT_020'];
  const liveExcavationContext = excavation.asConstructedMode === 'none' && excavation.constructionStage === 'normal';

  if (excavation.asConstructedMode === 'poured_18in') {
    sentences.push(
      'At the time of inspection, the excavation was at footing grade and a strip footing foundation with a footing width of approximately 450 millimetres and depth of approximately 150 millimetres had been poured.'
    );
    clauseIds.push('CL_019');
    ruleIds.push('DT_026');
  } else if (excavation.asConstructedMode === 'poured_20in') {
    sentences.push(
      'At the time of inspection, the excavation was at footing grade and a strip footing foundation with a footing width of approximately 500 millimetres and depth of approximately 200 millimetres had been poured.'
    );
    clauseIds.push('CL_019');
    ruleIds.push('DT_027');
  } else if (excavation.asConstructedMode === 'poured_24in') {
    sentences.push(
      'At the time of inspection, an as-constructed strip footing wider than the standard office families had already been poured and the exact wording should be confirmed during review.'
    );
    clauseIds.push('CL_019');
    ruleIds.push('DT_028');
    reviewFlags.push(
      createReviewFlag({
        id: 'review-as-constructed-24in',
        title: '24-inch as-constructed footing needs review',
        message:
          getReviewDecision('DL_003')?.exactReviewQuestion ??
          'The 24-inch as-constructed footing family remains in scope but still needs exact wording confirmation.',
        relatedSectionId: 'P2',
        clauseRefs: toClauseRefs(['CL_019']),
        ruleRefs: toRuleRefs(['DT_028'])
      })
    );
  } else if (excavation.asConstructedMode === 'walls_and_footing') {
    sentences.push('The foundation footings and basement foundation walls were already constructed prior to this inspection.');
    clauseIds.push('CL_047');
    ruleIds.push('DT_029');
    reviewFlags.push(
      createReviewFlag({
        id: 'review-as-constructed-walls-and-footing',
        title: 'Walls-and-footing as-constructed branch needs review',
        message:
          getReviewDecision('DL_003')?.interimHandling ??
          'The walls-and-footing as-constructed family should remain visible for review until the office confirms the final wording.',
        relatedSectionId: 'P2',
        clauseRefs: toClauseRefs(['CL_047']),
        ruleRefs: toRuleRefs(['DT_029'])
      })
    );
  } else if (excavation.constructionStage === 'nearly_complete') {
    sentences.push(getClauseText('CL_032'));
    clauseIds.push('CL_032');
    ruleIds.push('DT_041');
  } else if (excavation.constructionStage === 'framing') {
    sentences.push(getClauseText('CL_033'));
    clauseIds.push('CL_033');
    ruleIds.push('DT_042');
  } else {
    sentences.push('At the time of inspection, the excavation was at footing grade and was advanced by a backhoe.');
  }

  if (excavation.walkoutBasement) {
    appendWalkoutSentence(formState, sentences, clauseIds, ruleIds, reviewFlags);
  } else if (cutRange.minimumM !== undefined || cutRange.maximumM !== undefined) {
    sentences.push(
      `Cuts of approximately ${formatNumber(cutRange.minimumM)} to ${formatNumber(
        cutRange.maximumM
      )} m below the adjacent ground surface were noted in the house area.`
    );
    ruleIds.push('DT_021');
  }

  if (liveExcavationContext) {
    appendGarageExcavationSentence(formState, sentences, clauseIds, ruleIds);
  }

  appendExcavationConditionAddOns(formState, sentences, clauseIds, ruleIds, reviewFlags);

  return createParagraph({
    id: 'p2',
    sectionId: 'P2',
    title: 'P2 Excavation Conditions',
    text: sentences.join(' '),
    order: 30,
    clauseIds,
    ruleIds,
    reviewSensitive: reviewFlags.some((flag) => flag.relatedSectionId === 'P2')
  });
}

function buildP3Paragraph(formState: FormState, reviewFlags: ReviewFlag[]): GeneratedParagraph {
  const soil = formState.reportBody.soil;
  const traceText = soil.traceFeatures?.length ? ` and ${traceFeatureLabel(soil.traceFeatures)}` : '';
  const baseDescriptor = `${soil.moisture1}${soil.moisture2 ? ` to ${soil.moisture2}` : ''}, ${colourLabel(soil.colour)}, ${materialDescriptorLabel(
    soil
  )}`;
  const sentences: string[] = [];
  const clauseIds = ['P3'];
  const ruleIds = ['DT_050'];

  if (soil.soilLayeringMode === 'engineered_fill_over_native') {
    sentences.push(
      `Below the clay fill material, the soil encountered was identified as ${baseDescriptor}. The ${materialDescriptorLabel(
        soil
      )} was a native deposit of ${plasticityLabel(soil.plasticity1, soil.plasticity2)} with a ${
        soil.consistencyOrDensity
      } consistency${traceText}.`
    );
    clauseIds.push('CL_017');
    ruleIds.push('DT_051', 'DT_052');
  } else {
    sentences.push(`The soil encountered throughout the excavation floor was identified as ${baseDescriptor}.`);

    if (soil.primarySoilOrigin === 'native') {
      sentences.push(
        `The ${materialDescriptorLabel(soil)} was a native deposit of ${plasticityLabel(
          soil.plasticity1,
          soil.plasticity2
        )} with a ${soil.consistencyOrDensity} consistency${traceText}.`
      );
      ruleIds.push('DT_052');
    } else {
      sentences.push(
        `The ${materialDescriptorLabel(soil)} was interpreted as engineered fill with a ${soil.consistencyOrDensity} consistency${traceText}.`
      );
    }
  }

  switch (soil.primarySoilOrigin) {
    case 'engineered_fill_jrp':
      sentences.push(getClauseText('CL_007'));
      clauseIds.push('CL_007');
      ruleIds.push('DT_053');
      break;
    case 'engineered_fill_jrp_and_others':
      sentences.push(getClauseText('CL_008'));
      clauseIds.push('CL_008');
      ruleIds.push('DT_054');
      break;
    case 'engineered_fill_others':
      sentences.push('Engineered fill by others was selected for this site. Current approved wording remains review-sensitive and should be confirmed before issue.');
      reviewFlags.push(
        createReviewFlag({
          id: 'review-engineered-fill-by-others',
          title: 'Engineered fill by others needs review',
          message: getReviewDecision('DL_002')?.interimHandling ?? 'Engineered fill by others requires review.',
          relatedSectionId: 'P3',
          clauseRefs: toClauseRefs(['CL_029']),
          ruleRefs: toRuleRefs(['DT_055'])
        })
      );
      ruleIds.push('DT_055');
      break;
    case 'engineered_fill_unknown':
      sentences.push('Engineered fill provenance is unknown. Keep this wording visible for review rather than treating it as a resolved office-standard branch.');
      reviewFlags.push(
        createReviewFlag({
          id: 'review-engineered-fill-unknown',
          title: 'Engineered fill provenance is unresolved',
          message: getReviewDecision('DL_002')?.whyItMatters ?? 'Unknown engineered fill provenance requires review.',
          relatedSectionId: 'P3',
          clauseRefs: toClauseRefs(['CL_030', 'CL_037']),
          ruleRefs: toRuleRefs(['DT_056'])
        })
      );
      ruleIds.push('DT_056');
      break;
  }

  if (soil.highPlasticWarning) {
    sentences.push(getClauseText('CL_043'));
    clauseIds.push('CL_043');
    ruleIds.push('DT_063');
  }

  return createParagraph({
    id: 'p3',
    sectionId: 'P3',
    title: 'P3 Soil Conditions',
    text: sentences.join(' '),
    order: 40,
    clauseIds,
    ruleIds,
    reviewSensitive: reviewFlags.some((flag) => flag.relatedSectionId === 'P3')
  });
}

function buildRecommendationAdvisories(formState: FormState, reviewFlags: ReviewFlag[]): RecommendationAdvisoryContext {
  const excavation = formState.reportBody.excavation;
  const context: RecommendationAdvisoryContext = {
    advisories: [],
    clauseIds: [],
    ruleIds: [],
    requiresConditionalAdequacy: false
  };

  if (excavation.frostDepthMm && excavation.frostDepthMm > 0) {
    context.advisories.push('Due to the frost, the foundation walls should be reinforced with four rows of 2-10M bars, spread evenly throughout the wall.');
    context.clauseIds.push('CL_010');
    context.ruleIds.push('DT_078');
    context.requiresConditionalAdequacy = true;
  }

  if (excavation.oversizedTrench) {
    context.advisories.push(
      `The oversized service trench ${trenchLocationLabel(
        excavation.trenchLocation
      )} should be remediated below the footing area before concrete placement. The working V1 path assumes reinforcement at the affected footing and wall, but the exact remediation package remains review-sensitive.`
    );
    context.clauseIds.push('CL_024', 'CL_035');
    context.ruleIds.push('DT_079');
    context.requiresConditionalAdequacy = true;
    reviewFlags.push(
      createReviewFlag({
        id: 'review-oversized-trench-remediation',
        title: 'Oversized trench remediation needs review',
        message:
          getReviewDecision('DL_004')?.exactReviewQuestion ??
          'Oversized trench cases are supported in V1, but the exact reinforcement versus fillcrete package still needs review.',
        relatedSectionId: 'P4',
        clauseRefs: toClauseRefs(['CL_024', 'CL_035']),
        ruleRefs: toRuleRefs(['DT_079'])
      })
    );
  }

  if (excavation.loosePeelingMaterial) {
    context.advisories.push(
      'Any loose or peeling clay material should be hand removed from below the footing areas. The excavated material can be accounted for by a thickened footing. Care must also be taken to place the weeping tile level, with no bumps or sags and have positive flow to the sump.'
    );
    context.clauseIds.push('CL_020', 'CL_025');
    context.ruleIds.push('DT_080');
    context.requiresConditionalAdequacy = true;
  }

  if (excavation.rainSoftenedMode && excavation.rainSoftenedMode !== 'none') {
    context.advisories.push(
      'The excavation should be adequately dried and any rain-softened or otherwise disturbed material should be removed from beneath the footings before concrete placement.'
    );
    context.clauseIds.push('CL_036');
    context.ruleIds.push('DT_082');
    context.requiresConditionalAdequacy = true;
    reviewFlags.push(
      createReviewFlag({
        id: 'review-rain-softened-recommendation',
        title: 'Rain-softened recommendation family needs review',
        message:
          getReviewDecision('DL_004')?.interimHandling ??
          'Rain-softened recommendation language is supported only as a review-sensitive family in V1.',
        relatedSectionId: 'P4',
        clauseRefs: toClauseRefs(['CL_036']),
        ruleRefs: toRuleRefs(['DT_082'])
      })
    );
  }

  if (excavation.freeWaterInAugerHoles) {
    context.advisories.push(
      'The free water must be removed from below all footings just prior to concrete placement. Temporary dewatering may be required. Due to the infiltrating water in the auger holes, the house drainage should be upgraded to include interior as well as exterior weeping tile. Care must also be taken to place the weeping tile level, with no bumps or sags and have positive flow to the sump.'
    );
    context.clauseIds.push('CL_026');
    context.ruleIds.push('DT_081');
    context.requiresConditionalAdequacy = true;
  }

  if (excavation.exposedElectricalTrench) {
    context.advisories.push(
      'Any water entering along the exposed electrical service trench should be removed from the excavation, and any softened material beneath the footings should be excavated prior to placement of concrete. Care must also be taken to place the weeping tile level, with no bumps or sags.'
    );
    context.clauseIds.push('CL_039');
    context.ruleIds.push('DT_037');
    context.requiresConditionalAdequacy = true;
  }

  if (excavation.snowDepthMm && excavation.snowDepthMm > 0) {
    context.advisories.push('The snow and any softened material below the footings should be removed from the excavation prior to placement of footings.');
    context.clauseIds.push('CL_038');
    context.ruleIds.push('DT_083');
    context.requiresConditionalAdequacy = true;
  }

  return context;
}

function buildBaseHouseRecommendation(formState: FormState, reviewFlags: ReviewFlag[], useConditionalAdequacy: boolean) {
  const excavation = formState.reportBody.excavation;
  const recommendation = formState.reportBody.recommendation;
  const clauseIds: string[] = [];
  const ruleIds: string[] = [];
  let text = '';

  if (excavation.asConstructedMode === 'poured_18in') {
    text =
      'The soil conditions at this site were considered suitable for the construction of a standard house footing foundation. The strip footing size, as constructed, was considered adequate for this residence.';
    clauseIds.push('CL_019');
    ruleIds.push('DT_072');
    return { text, clauseIds, ruleIds };
  }

  if (excavation.asConstructedMode === 'poured_20in') {
    text =
      'The soil conditions at this site were considered suitable for the construction of a standard house footing foundation. The strip footing size, as constructed, was considered adequate for this residence.';
    clauseIds.push('CL_019');
    ruleIds.push('DT_073');
    return { text, clauseIds, ruleIds };
  }

  if (recommendation.footingBasis === 'modified') {
    text = getClauseText('CL_003');
    clauseIds.push('CL_003');
    ruleIds.push('DT_071');
    reviewFlags.push(
      createReviewFlag({
        id: 'review-modified-trigger',
        title: 'Modified footing trigger needs review',
        message:
          getReviewDecision('DL_007')?.exactReviewQuestion ??
          'Modified footing thresholds are still open, so this prototype treats modified footing as an explicit operator choice.',
        relatedSectionId: 'P4',
        clauseRefs: toClauseRefs(['CL_003']),
        ruleRefs: toRuleRefs(['DT_071'])
      })
    );
  } else {
    text = getClauseText('CL_002');
    clauseIds.push('CL_002');
    ruleIds.push('DT_070');
  }

  if (useConditionalAdequacy) {
    text = applyConditionalAdequacy(text);
    ruleIds.push('DT_077');
  }

  if (excavation.asConstructedMode === 'poured_24in' || excavation.asConstructedMode === 'walls_and_footing') {
    reviewFlags.push(
      createReviewFlag({
        id: 'review-special-as-constructed-recommendation',
        title: 'Special as-constructed recommendation needs review',
        message:
          getReviewDecision('DL_003')?.interimHandling ??
          'The selected as-constructed recommendation path remains review-sensitive in V1.',
        relatedSectionId: 'P4',
        clauseRefs: toClauseRefs(['CL_019', 'CL_047']),
        ruleRefs: toRuleRefs(['DT_074'])
      })
    );
    ruleIds.push('DT_074');
  }

  return { text, clauseIds, ruleIds };
}

function buildP4Paragraph(formState: FormState, reviewFlags: ReviewFlag[]): GeneratedParagraph {
  const recommendation = formState.reportBody.recommendation;
  const advisoryContext = buildRecommendationAdvisories(formState, reviewFlags);
  const clauseIds = [...advisoryContext.clauseIds];
  const ruleIds = [...advisoryContext.ruleIds];
  const sentences = [...advisoryContext.advisories];
  const baseRecommendation = buildBaseHouseRecommendation(formState, reviewFlags, advisoryContext.requiresConditionalAdequacy);

  sentences.push(baseRecommendation.text);
  clauseIds.push(...baseRecommendation.clauseIds);
  ruleIds.push(...baseRecommendation.ruleIds);

  if (recommendation.spreadFootingFamily === 'default_140_kpa') {
    sentences.push(getClauseText('CL_045'));
    clauseIds.push('CL_045');
    ruleIds.push('DT_075');
    reviewFlags.push(
      createReviewFlag({
        id: 'review-spread-footing-default',
        title: '140 kPa spread footing remains review-sensitive',
        message:
          getReviewDecision('DL_001')?.interimHandling ??
          '140 kPa is treated as the working default, but the spread-footing family is still review-sensitive.',
        relatedSectionId: 'P4',
        clauseRefs: toClauseRefs(['CL_045']),
        ruleRefs: toRuleRefs(['DT_075'])
      })
    );
  }

  if (recommendation.spreadFootingFamily === 'review_100_kpa') {
    sentences.push(getClauseText('CL_046'));
    clauseIds.push('CL_046');
    ruleIds.push('DT_076');
    reviewFlags.push(
      createReviewFlag({
        id: 'review-spread-footing-alt',
        title: '100 kPa spread footing needs review',
        message: getReviewDecision('DL_001')?.exactReviewQuestion ?? '100 kPa spread footing remains review-only.',
        relatedSectionId: 'P4',
        clauseRefs: toClauseRefs(['CL_046']),
        ruleRefs: toRuleRefs(['DT_076'])
      })
    );
  }

  return createParagraph({
    id: 'p4',
    sectionId: 'P4',
    title: 'P4 House Footing Recommendation',
    text: sentences.join(' '),
    order: 50,
    clauseIds,
    ruleIds,
    reviewSensitive: reviewFlags.some((flag) => flag.relatedSectionId === 'P4')
  });
}

function buildP5Paragraph(formState: FormState, reviewFlags: ReviewFlag[]): GeneratedParagraph | null {
  const garage = formState.reportBody.garage;
  const recommendation = formState.reportBody.recommendation;
  const excavation = formState.reportBody.excavation;
  const advisoryContext = buildRecommendationAdvisories(formState, []);

  if (garage.mode === 'none') {
    return null;
  }

  const clauseIds: string[] = ['P5'];
  const ruleIds: string[] = ['DT_095'];
  const sentences: string[] = [];
  const useConditionalLead = advisoryContext.requiresConditionalAdequacy;

  if (excavation.asConstructedMode === 'poured_18in' || excavation.asConstructedMode === 'poured_20in') {
    sentences.push('It appears the building contractor utilized a standard footing foundation for the attached garage. The strip footing size, as constructed, was also considered adequate for this garage.');
    clauseIds.push('CL_019');
    ruleIds.push('DT_072');
  } else if (recommendation.footingBasis === 'modified') {
    sentences.push(`${useConditionalLead ? 'Subject to the excavation corrections noted above, ' : ''}${getClauseText('CL_015')}`);
    clauseIds.push('CL_015');
    ruleIds.push('DT_091');
  } else {
    sentences.push(`${useConditionalLead ? 'Subject to the excavation corrections noted above, ' : ''}${getClauseText('CL_014')}`);
    clauseIds.push('CL_014');
    ruleIds.push('DT_090');
  }

  if (garage.slabOrganics) {
    sentences.push(getClauseText('CL_016'));
    clauseIds.push('CL_016');
    ruleIds.push('DT_094');
    reviewFlags.push(
      createReviewFlag({
        id: 'review-garage-slab-organics',
        title: 'Garage slab organics is a special advisory',
        message: 'Garage slab organics is included as a visible advisory because the seed files treat it as a special review-sensitive add-on.',
        relatedSectionId: 'P5',
        clauseRefs: toClauseRefs(['CL_016']),
        ruleRefs: toRuleRefs(['DT_094'])
      })
    );
  }

  return createParagraph({
    id: 'p5',
    sectionId: 'P5',
    title: 'P5 Garage Recommendation',
    text: sentences.join(' '),
    order: 60,
    clauseIds,
    ruleIds,
    reviewSensitive: reviewFlags.some((flag) => flag.relatedSectionId === 'P5')
  });
}

function buildP6Paragraph(formState: FormState): GeneratedParagraph | null {
  const sulphate = formState.reportBody.sulphate;

  if (!sulphate.includeParagraph || !sulphate.sulphateClass) {
    return null;
  }

  const clauseIdByClass = {
    negligible: 'CL_048',
    moderate: 'CL_049',
    severe: 'CL_050',
    very_severe: 'CL_051'
  } as const;

  const ruleIdByClass = {
    negligible: 'DT_100',
    moderate: 'DT_101',
    severe: 'DT_102',
    very_severe: 'DT_103'
  } as const;

  const clauseId = clauseIdByClass[sulphate.sulphateClass];
  const ruleId = ruleIdByClass[sulphate.sulphateClass];

  return createParagraph({
    id: 'p6',
    sectionId: 'P6',
    title: 'P6 Sulphate Paragraph',
    text: getClauseText(clauseId),
    order: 70,
    clauseIds: [clauseId],
    ruleIds: [ruleId]
  });
}

function buildP7Paragraph(formState: FormState): GeneratedParagraph | null {
  if (!formState.reportBody.winter.includeParagraph) {
    return null;
  }

  return createParagraph({
    id: 'p7',
    sectionId: 'P7',
    title: 'P7 Winter Paragraph',
    text: getClauseText('CL_011'),
    order: 80,
    clauseIds: ['CL_011'],
    ruleIds: ['DT_110']
  });
}

function buildClosingParagraph(): GeneratedParagraph {
  return createParagraph({
    id: 'closing',
    sectionId: 'CLOSING',
    title: 'Closing',
    text: 'We trust this information is considered satisfactory for your present requirements.',
    order: 90,
    clauseIds: ['P8'],
    ruleIds: ['DT_111']
  });
}

function buildSignoffParagraph(formState: FormState): GeneratedParagraph {
  const signoff = buildSignoffModel(formState.signoff);
  const engineerName = formatSignoffName(signoff.signingEngineer.profile);
  const signoffLines = [
    signoff.organization,
    '',
    ...signoff.lines.map((line) => `${line.label}: ${line.value}`),
    signoff.signingEngineer.profile.memberNumber ? `Member No.: ${signoff.signingEngineer.profile.memberNumber}` : 'Member No.: [registry pending]',
    signoff.signingEngineer.profile.stampAssetKey
      ? `[Engineer stamp placeholder: ${signoff.signingEngineer.profile.stampAssetKey}]`
      : `[Engineer stamp placeholder for ${engineerName}]`,
    signoff.permitToPractice.placeholderText
  ];

  return createParagraph({
    id: 'signoff',
    sectionId: 'SIGNOFF',
    title: 'Signoff',
    text: signoffLines.join('\n'),
    order: 100,
    clauseIds: ['SIG_01', 'SIG_02', 'SIG_03', 'SIG_04'],
    ruleIds: ['DT_112', 'DT_113', 'DT_114', 'DT_115']
  });
}

function collectVisibleSections(paragraphs: GeneratedParagraph[]): SectionId[] {
  return [...new Map(paragraphs.map((paragraph) => [paragraph.sectionId, paragraph.sectionId])).values()];
}

function collectClauseRefsUsed(paragraphs: GeneratedParagraph[], reviewFlags: ReviewFlag[]): ClauseRef[] {
  return uniqueClauseRefs([
    ...paragraphs.flatMap((paragraph) => paragraph.clauseRefs),
    ...reviewFlags.flatMap((flag) => flag.clauseRefs)
  ]);
}

function collectRuleRefsUsed(paragraphs: GeneratedParagraph[], reviewFlags: ReviewFlag[]): RuleRef[] {
  return uniqueRuleRefs([
    ...paragraphs.flatMap((paragraph) => paragraph.ruleRefs),
    ...reviewFlags.flatMap((flag) => flag.ruleRefs)
  ]);
}

export { deriveHouseCutRange };

export function generateLetter(formState: FormState): GenerationResult {
  const reviewFlags: ReviewFlag[] = [];
  const paragraphs: GeneratedParagraph[] = [];

  const topBlock = buildTopBlockParagraph(formState);
  const p1 = buildP1Paragraph(formState);
  const p2 = buildP2Paragraph(formState, reviewFlags);
  const p3 = buildP3Paragraph(formState, reviewFlags);
  const p4 = buildP4Paragraph(formState, reviewFlags);
  const p5 = buildP5Paragraph(formState, reviewFlags);
  const p6 = buildP6Paragraph(formState);
  const p7 = buildP7Paragraph(formState);
  const closing = buildClosingParagraph();
  const signoff = buildSignoffParagraph(formState);

  paragraphs.push(topBlock, p1, p2, p3, p4);

  if (p5) {
    paragraphs.push(p5);
  }

  if (p6) {
    paragraphs.push(p6);
  }

  if (p7) {
    paragraphs.push(p7);
  }

  paragraphs.push(closing, signoff);
  paragraphs.sort((left, right) => left.order - right.order);

  const filename = buildFilename(formState);
  const archivePath = buildArchivePath(formState, filename);

  return {
    paragraphs,
    visibleSections: collectVisibleSections(paragraphs),
    reviewFlags,
    filename,
    archivePath,
    clauseRefsUsed: collectClauseRefsUsed(paragraphs, reviewFlags),
    ruleRefsUsed: collectRuleRefsUsed(paragraphs, reviewFlags)
  };
}
