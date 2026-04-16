import { buildArchivePath, buildFilename } from '@/lib/export/build-filename';
import { normalizeDependentFormState } from '@/lib/form/normalize-dependent-state';
import { buildSignoffModel } from '@/lib/signoff/build-signoff-model';
import { formatSignoffName } from '@/lib/signoff/engineer-registry';
import { createReviewFlag } from '@/lib/review/flags';
import {
  deriveFrontAndRearCutRanges,
  deriveHouseCutRange,
  formatDisplayDate,
  getFoundationInspectionSubjectLine
} from '@/lib/domain/report-helpers';
import { getEngineeredFillLayer, getUnderlyingNativeLayer } from '@/lib/domain/soil-layers';
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
  SectionId,
  SoilLayerDescriptor
} from '@/types/domain';

interface RecommendationAdvisoryContext {
  requiresConditionalAdequacy: boolean;
  paragraph?: GeneratedParagraph;
  handledFrostInIssueParagraph: boolean;
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

function materialLabel(material: SoilLayerDescriptor['materialFamily']): string {
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
  plasticity1?: SoilLayerDescriptor['plasticity1'],
  plasticity2?: SoilLayerDescriptor['plasticity2']
): string {
  if (!plasticity1) {
    return '';
  }

  return plasticity2 ? `${plasticity1} to ${plasticity2} plasticity` : `${plasticity1} plasticity`;
}

function traceFeatureLabel(traceFeatures: NonNullable<SoilLayerDescriptor['traceFeatures']>): string {
  if (traceFeatures.length === 1) {
    return `featured traces of ${descriptorLabel(traceFeatures[0])}`;
  }

  const readable = traceFeatures.map(descriptorLabel);
  return `featured traces of ${readable.slice(0, -1).join(', ')} and ${readable.at(-1)}`;
}

function materialDescriptorLabel(layer: Pick<SoilLayerDescriptor, 'materialFamily' | 'clayDescriptors' | 'sandSiltDescriptors'>): string {
  const descriptors =
    layer.materialFamily === 'sand' || layer.materialFamily === 'silt'
      ? layer.sandSiltDescriptors?.map(descriptorLabel) ?? []
      : layer.clayDescriptors?.map(descriptorLabel) ?? [];

  if (descriptors.length === 0) {
    return materialLabel(layer.materialFamily);
  }

  return `${descriptors.join(', ')} ${materialLabel(layer.materialFamily)}`;
}

function buildSoilBaseDescriptor(layer: SoilLayerDescriptor): string {
  return `${layer.moisture1}${layer.moisture2 ? ` to ${layer.moisture2}` : ''}, ${colourLabel(layer.colour)}, ${materialDescriptorLabel(layer)}`;
}

function buildNativeDepositSentence(layer: SoilLayerDescriptor): string {
  const traceText = layer.traceFeatures?.length ? ` and ${traceFeatureLabel(layer.traceFeatures)}` : '';
  const plasticityText = plasticityLabel(layer.plasticity1, layer.plasticity2);
  const plasticitySegment = plasticityText ? ` of ${plasticityText}` : '';

  return `The ${materialDescriptorLabel(layer)} was a native deposit${plasticitySegment} with a ${descriptorLabel(
    layer.consistencyOrDensity
  )} consistency${traceText}.`;
}

function buildFillLayerSentence(layer: SoilLayerDescriptor): string {
  const traceText = layer.traceFeatures?.length ? ` and ${traceFeatureLabel(layer.traceFeatures)}` : '';
  const plasticityText = plasticityLabel(layer.plasticity1, layer.plasticity2);
  const plasticitySegment = plasticityText ? ` of ${plasticityText}` : '';

  return `The fill material was${plasticitySegment} with a ${descriptorLabel(layer.consistencyOrDensity)} consistency${traceText}.`;
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

function getSubjectLine(formState: FormState): string {
  return getFoundationInspectionSubjectLine(formState.topBlock.headingSuffix, formState.reportBody.structureVariant);
}

function buildLegalDescriptionLines(formState: FormState): string[] {
  if (!formState.topBlock.includeLegalDescription) {
    return formState.topBlock.streetAddress ? [formState.topBlock.streetAddress] : [];
  }

  if (formState.topBlock.legalDescriptionMode === 'custom') {
    return formState.topBlock.customLegalDescriptionLines?.filter(Boolean) ?? [];
  }

  return [
    formState.topBlock.lot && formState.topBlock.block && formState.topBlock.plan
      ? `Lot ${formState.topBlock.lot}, Block ${formState.topBlock.block}, Plan ${formState.topBlock.plan}`
      : null,
    formState.topBlock.streetAddress
  ].filter((value): value is string => Boolean(value));
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
  const legalDescriptionLines = buildLegalDescriptionLines(formState);
  const topBlockLines = [
    formatDisplayDate(formState.topBlock.letterDate),
    `File No.: ${formState.topBlock.fileNumber}`,
    '',
    formState.topBlock.clientName,
    ...formState.topBlock.clientMailingAddress,
    '',
    `Re: ${getSubjectLine(formState)}`,
    ...legalDescriptionLines,
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
  if (formState.reportBody.structureVariant !== 'standard_house') {
    return;
  }

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

  if (excavation.oversizedTrenchMode && excavation.oversizedTrenchMode !== 'none') {
    sentences.push(`An oversized service trench was noted ${trenchLocationLabel(excavation.trenchLocation)}.`);
    clauseIds.push('CL_024');
    ruleIds.push('DT_031');
  }

  if (excavation.looseMaterialMode === 'noted_only') {
    sentences.push('Loose materials were noted across the excavation floor.');
    clauseIds.push('CL_025');
    ruleIds.push('DT_032');
  }

  if (excavation.looseMaterialMode === 'standard_cleanup' || excavation.looseMaterialMode === 'thickened_footing_drainage') {
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

  if (excavation.waterIssueMode === 'rain_softened') {
    sentences.push('Surficial free water and saturated material were noted within the excavation after rainfall.');
    clauseIds.push('CL_036');
    ruleIds.push('DT_035');
  }

  if (excavation.waterIssueMode === 'exposed_electrical_trench_water_entry') {
    sentences.push('An exposed electrical service trench was noted along the front excavation wall and may provide a path for surficial water into the excavation.');
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
      'At the time of inspection, the excavation was at footing grade and strip footing forms with a footing width of approximately 450 millimetres and depth of approximately 150 millimetres had been placed.'
    );
    clauseIds.push('CL_019');
    ruleIds.push('DT_026');
  } else if (excavation.asConstructedMode === 'poured_20in') {
    sentences.push(
      'At the time of inspection, the excavation was at footing grade and strip footing forms with a footing width of approximately 500 millimetres and depth of approximately 200 millimetres had been placed.'
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

  if (cutRange.minimumM !== undefined || cutRange.maximumM !== undefined) {
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

  if (excavation.walkoutBasement) {
    appendWalkoutSentence(formState, sentences, clauseIds, ruleIds, reviewFlags);
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
  const sentences: string[] = [];
  const clauseIds = ['P3'];
  const ruleIds = ['DT_050'];

  if (soil.soilLayeringMode === 'engineered_fill_over_native') {
    const engineeredFillLayer = getEngineeredFillLayer(soil);
    const underlyingNativeLayer = getUnderlyingNativeLayer(soil);
    const fillDepthMetres = soil.fillDepthBelowFootingMm ? (soil.fillDepthBelowFootingMm / 1000).toFixed(1) : undefined;
    const fillLead =
      soil.layeredCoverageMode === 'throughout_excavation'
        ? `The soil encountered throughout the excavation floor${fillDepthMetres ? ` to a depth of approximately ${fillDepthMetres} m` : ''}`
        : `Variable portions of the excavation floor were underlain${fillDepthMetres ? ` to a depth of approximately ${fillDepthMetres} m below footing grade` : ''}`;

    sentences.push(`${fillLead} by ${buildSoilBaseDescriptor(engineeredFillLayer)} fill.`);
    sentences.push(buildFillLayerSentence(engineeredFillLayer));
    sentences.push(`Below the fill, the soil encountered was identified as ${buildSoilBaseDescriptor(underlyingNativeLayer)}.`);
    sentences.push(buildNativeDepositSentence(underlyingNativeLayer));
    clauseIds.push('CL_017');
    ruleIds.push('DT_051', 'DT_052');
  } else {
    const traceText = soil.traceFeatures?.length ? ` and ${traceFeatureLabel(soil.traceFeatures)}` : '';
    const baseDescriptor = buildSoilBaseDescriptor({
      materialFamily: soil.primaryMaterialFamily,
      clayDescriptors: soil.clayDescriptors,
      sandSiltDescriptors: soil.sandSiltDescriptors,
      moisture1: soil.moisture1,
      moisture2: soil.moisture2,
      colour: soil.colour,
      plasticity1: soil.plasticity1,
      plasticity2: soil.plasticity2,
      consistencyOrDensity: soil.consistencyOrDensity,
      traceFeatures: soil.traceFeatures
    });

    sentences.push(`The soil encountered throughout the excavation floor was identified as ${baseDescriptor}.`);

    if (soil.primarySoilOrigin === 'native') {
      sentences.push(buildNativeDepositSentence({
        materialFamily: soil.primaryMaterialFamily,
        clayDescriptors: soil.clayDescriptors,
        sandSiltDescriptors: soil.sandSiltDescriptors,
        moisture1: soil.moisture1,
        moisture2: soil.moisture2,
        colour: soil.colour,
        plasticity1: soil.plasticity1,
        plasticity2: soil.plasticity2,
        consistencyOrDensity: soil.consistencyOrDensity,
        traceFeatures: soil.traceFeatures
      }));
      ruleIds.push('DT_052');
    } else {
      sentences.push(
        `The ${materialDescriptorLabel({
          materialFamily: soil.primaryMaterialFamily,
          clayDescriptors: soil.clayDescriptors,
          sandSiltDescriptors: soil.sandSiltDescriptors
        })} was interpreted as engineered fill with a ${descriptorLabel(soil.consistencyOrDensity)} consistency${traceText}.`
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

function buildWaterDepthText(value?: number): string {
  return value !== undefined && !Number.isNaN(value) ? `${formatNumber(value)} metres below the footing elevation` : 'below the footing elevation';
}

function buildSupplementalIssueParagraph(formState: FormState, reviewFlags: ReviewFlag[]): RecommendationAdvisoryContext {
  const excavation = formState.reportBody.excavation;
  const recommendation = formState.reportBody.recommendation;
  const sentences: string[] = [];
  const clauseIds: string[] = [];
  const ruleIds: string[] = [];
  let handledFrostInIssueParagraph = false;
  let requiresConditionalAdequacy = false;

  if (
    excavation.frostDepthMm &&
    excavation.frostDepthMm > 0 &&
    (excavation.waterIssueMode !== 'none' ||
      excavation.oversizedTrenchMode === 'reinforcement' ||
      excavation.looseMaterialMode === 'thickened_footing_drainage')
  ) {
    sentences.push(
      'Due to the frost, the foundation footings should be reinforced with one row of 2-10M bars spread evenly throughout the footing. The foundation walls should be reinforced with four rows of 2-10M bars spread evenly throughout the wall.'
    );
    clauseIds.push('CL_010');
    ruleIds.push('DT_078');
    handledFrostInIssueParagraph = true;
    requiresConditionalAdequacy = true;
  }

  if (excavation.waterIssueMode === 'free_water_in_auger_holes_basic') {
    sentences.push(
      `At the time of inspection, free water was noted pooling in the auger holes approximately ${buildWaterDepthText(
        excavation.waterObservedDepthBelowFootingM
      )}. The free water must be removed from below all footings just prior to concrete placement. Temporary dewatering may be required. Due to the infiltrating water in the auger holes, the house drainage should be upgraded to include interior as well as exterior weeping tile. Care must also be taken to place the weeping tile level, with no bumps or sags and have positive flow to the sump.`
    );
    clauseIds.push('CL_026');
    ruleIds.push('DT_034', 'DT_081');
    requiresConditionalAdequacy = true;
  }

  if (excavation.waterIssueMode === 'free_water_in_auger_holes_upgraded_drainage') {
    sentences.push(
      `At the time of inspection, free water was noted pooling in the auger holes approximately ${buildWaterDepthText(
        excavation.waterObservedDepthBelowFootingM
      )}. Due to the infiltrating water in the auger holes, the house drainage should be upgraded to include a washed rock slab base and interior as well as exterior weeping tile with two laterals.`
    );

    if (recommendation.drainageDrawingAttached) {
      sentences.push('A drawing depicting the recommended drainage measures is attached.');
    }

    clauseIds.push('CL_026');
    ruleIds.push('DT_034', 'DT_081');
    requiresConditionalAdequacy = true;
  }

  if (excavation.waterIssueMode === 'rain_softened') {
    sentences.push(
      'The water softened material should be adequately dried or removed from underneath the footing areas prior to pouring. The excavated material can be accounted for by a thickened footing. Care must also be taken to place the weeping tile level, with no bumps or sags and maintain positive drainage.'
    );
    clauseIds.push('CL_036', 'CL_020');
    ruleIds.push('DT_035', 'DT_082');
    requiresConditionalAdequacy = true;
  }

  if (excavation.waterIssueMode === 'exposed_electrical_trench_water_entry') {
    sentences.push(
      'It appears that the free water is due to surficial water draining into the excavation via an exposed electrical service trench in the front excavation wall. The free water encountered should be removed from within the excavation and the excavation should be adequately dried. Also, any water softened and/or disturbed material should be excavated from beneath the footings. Care must also be taken to place the weeping tile level, with no bumps or sags.'
    );
    clauseIds.push('CL_039');
    ruleIds.push('DT_037');
    requiresConditionalAdequacy = true;
  }

  if (excavation.oversizedTrenchMode === 'reinforcement') {
    sentences.push(
      `Due to an oversized cut in the service trench ${trenchLocationLabel(
        excavation.trenchLocation
      )}, the front garage footing should be reinforced with one row of 2-10M bars spread evenly throughout the footing. The front garage wall should be reinforced with four rows of 2-10M bars, spread evenly throughout the wall.`
    );
    clauseIds.push('CL_024');
    ruleIds.push('DT_079');
    requiresConditionalAdequacy = true;
  }

  if (excavation.oversizedTrenchMode === 'fillcrete_gravel') {
    sentences.push(
      'Due to the oversized service trench, the existing trench fill materials should be removed from beneath the footing areas and backfilled with fillcrete. Another option would be to backfill the over excavated service trench to the design footing elevation with filter cloth and washed rock or crushed gravel. The foundation drainage must be modified to drain the washed rock or crushed gravel and ensure positive flow within the weeping tile towards the sump.'
    );
    clauseIds.push('CL_035');
    ruleIds.push('DT_079', 'DT_085');
    requiresConditionalAdequacy = true;
    reviewFlags.push(
      createReviewFlag({
        id: 'review-oversized-trench-fillcrete-branch',
        title: 'Fillcrete / gravel trench branch remains review-sensitive',
        message:
          getReviewDecision('DL_004')?.exactReviewQuestion ??
          'The fillcrete / washed-rock oversized-trench branch is supported, but the office still needs to confirm when it should replace the simpler reinforcement family.',
        relatedSectionId: 'P3A',
        clauseRefs: toClauseRefs(['CL_035']),
        ruleRefs: toRuleRefs(['DT_079', 'DT_085'])
      })
    );
  }

  if (excavation.oversizedTrenchMode === 'precast_review') {
    sentences.push(
      'An oversized service trench requiring an alternate pre-cast or special remediation package was selected. This branch remains visible for office review before issue.'
    );
    clauseIds.push('CL_024');
    ruleIds.push('DT_085');
    requiresConditionalAdequacy = true;
    reviewFlags.push(
      createReviewFlag({
        id: 'review-oversized-trench-precast',
        title: 'Alternate oversized-trench remediation needs review',
        message:
          getReviewDecision('DL_004')?.exactReviewQuestion ??
          'Alternate oversized-trench remediation packages remain review-sensitive in V1.',
        relatedSectionId: 'P3A',
        clauseRefs: toClauseRefs(['CL_024']),
        ruleRefs: toRuleRefs(['DT_085'])
      })
    );
  }

  if (excavation.looseMaterialMode === 'standard_cleanup') {
    sentences.push('All loose material should be removed from the footing bearing surface prior to placement of concrete.');
    clauseIds.push('CL_025');
    ruleIds.push('DT_032', 'DT_080');
  }

  if (excavation.looseMaterialMode === 'thickened_footing_drainage') {
    sentences.push(
      'Areas of loose peeling clay material should be hand removed from below the footing. The excavated material can be accounted for by a thickened footing. Care must also be taken to place the weeping tile level, with no bumps or sags and have positive flow to the sump.'
    );
    clauseIds.push('CL_025', 'CL_020');
    ruleIds.push('DT_032', 'DT_080');
    requiresConditionalAdequacy = true;
  }

  if (sentences.length === 0) {
    return {
      requiresConditionalAdequacy: false,
      handledFrostInIssueParagraph: false
    };
  }

  return {
    requiresConditionalAdequacy,
    handledFrostInIssueParagraph,
    paragraph: createParagraph({
      id: 'p3a-issue',
      sectionId: 'P3A',
      title: 'Supplemental Issue Paragraph',
      text: sentences.join(' '),
      order: 45,
      clauseIds,
      ruleIds,
      reviewSensitive: reviewFlags.some((flag) => flag.relatedSectionId === 'P3A')
    })
  };
}

function buildFrostOnlyIssueContext(formState: FormState): RecommendationAdvisoryContext {
  const excavation = formState.reportBody.excavation;
  if (!excavation.frostDepthMm || excavation.frostDepthMm <= 0) {
    return {
      requiresConditionalAdequacy: false,
      handledFrostInIssueParagraph: false
    };
  }

  return {
    requiresConditionalAdequacy: true,
    handledFrostInIssueParagraph: false,
    paragraph: createParagraph({
      id: 'p3a-frost',
      sectionId: 'P3A',
      title: 'Supplemental Issue Paragraph',
      text:
        'Due to the frost, the foundation footings should be reinforced with one row of 2-10M bars spread evenly throughout the footing. The foundation walls should be reinforced with four rows of 2-10M bars, spread evenly throughout the wall.',
      order: 45,
      clauseIds: ['CL_010'],
      ruleIds: ['DT_078']
    })
  };
}

function buildBaseHouseRecommendation(formState: FormState, reviewFlags: ReviewFlag[], useConditionalAdequacy: boolean) {
  const excavation = formState.reportBody.excavation;
  const recommendation = formState.reportBody.recommendation;
  const structureVariant = formState.reportBody.structureVariant;
  const clauseIds: string[] = [];
  const ruleIds: string[] = [];
  let text = '';

  if (structureVariant === 'rear_garage_garden_suite') {
    text =
      'The soil conditions at this site were considered adequate for the construction of a rear garage garden suite structure. A minimum strip footing width of 450 mm and a minimum depth of 150 mm are recommended for the rear garage garden suite structure. Also, a minimum cover of 2.0 m for frost protection should be provided for non-continuously heated structures or exterior isolated footings. The frost cover can be reduced to 1.5 m for continuously heated structures. As an option, frost cover can be obtained by the use of exterior rigid insulation. Insulation details can be supplied upon request.';
    clauseIds.push('CL_052');
    ruleIds.push('DT_086');

    if (useConditionalAdequacy) {
      text = applyConditionalAdequacy(text);
      ruleIds.push('DT_077');
    }

    return { text, clauseIds, ruleIds };
  }

  if (excavation.asConstructedMode === 'poured_18in') {
    text =
      'The soil conditions at this site were considered suitable for the construction of a standard house foundation. The strip footing size, as placed, was considered adequate for this residence.';
    clauseIds.push('CL_019');
    ruleIds.push('DT_072');
    return { text, clauseIds, ruleIds };
  }

  if (excavation.asConstructedMode === 'poured_20in') {
    text =
      'The soil conditions at this site were considered suitable for the construction of a standard house foundation. The strip footing size, as placed, was considered adequate for this residence.';
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
  const structureVariant = formState.reportBody.structureVariant;
  const supplementalIssueContext = buildSupplementalIssueParagraph(formState, reviewFlags);
  const frostOnlyContext = buildFrostOnlyIssueContext(formState);
  const issueContext = supplementalIssueContext.paragraph ? supplementalIssueContext : frostOnlyContext;
  const clauseIds = issueContext.paragraph ? [...issueContext.paragraph.clauseRefs.map((ref) => ref.id)] : [];
  const ruleIds = issueContext.paragraph ? [...issueContext.paragraph.ruleRefs.map((ref) => ref.id)] : [];
  const sentences: string[] = issueContext.paragraph && issueContext.handledFrostInIssueParagraph ? [] : [];
  const useConditionalAdequacy = issueContext.requiresConditionalAdequacy;

  if (!issueContext.handledFrostInIssueParagraph && formState.reportBody.excavation.frostDepthMm && formState.reportBody.excavation.frostDepthMm > 0) {
    sentences.push(
      'Due to the frost, the foundation walls should be reinforced with four rows of 2-10M bars, spread evenly throughout the wall.'
    );
    clauseIds.push('CL_010');
    ruleIds.push('DT_078');
  }

  const baseRecommendation = buildBaseHouseRecommendation(formState, reviewFlags, useConditionalAdequacy);
  sentences.push(baseRecommendation.text);
  clauseIds.push(...baseRecommendation.clauseIds);
  ruleIds.push(...baseRecommendation.ruleIds);

  if (structureVariant === 'standard_house' && recommendation.spreadFootingFamily === 'default_140_kpa') {
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

  if (structureVariant === 'standard_house' && recommendation.spreadFootingFamily === 'review_100_kpa') {
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
  const supplementalIssueContext = buildSupplementalIssueParagraph(formState, []);
  const frostOnlyContext = buildFrostOnlyIssueContext(formState);
  const issueContext = supplementalIssueContext.paragraph ? supplementalIssueContext : frostOnlyContext;

  if (formState.reportBody.structureVariant !== 'standard_house' || garage.mode === 'none') {
    return null;
  }

  const clauseIds: string[] = ['P5'];
  const ruleIds: string[] = ['DT_095'];
  const sentences: string[] = [];
  const useConditionalLead = issueContext.requiresConditionalAdequacy;

  if (excavation.asConstructedMode === 'poured_18in' || excavation.asConstructedMode === 'poured_20in') {
    sentences.push(
      'It appears the building contractor utilized a standard footing form for the attached garage. The strip footing size, as constructed, was also considered adequate for this garage.'
    );
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
    text: 'We trust this information is considered satisfactory. Should you have any questions, please contact our office.',
    order: 90,
    clauseIds: ['P8'],
    ruleIds: ['DT_111']
  });
}

function buildSignoffParagraph(formState: FormState): GeneratedParagraph {
  const signoff = buildSignoffModel(formState.signoff);
  const engineerName = formatSignoffName(signoff.signingEngineer.profile);
  const signoffLines = [
    signoff.salutation,
    '',
    signoff.organization,
    '',
    ...signoff.lines.flatMap((line) => [line.label, line.value]),
    signoff.signingEngineer.profile.memberNumber
      ? `APEGA Member #: ${signoff.signingEngineer.profile.memberNumber}`
      : 'APEGA Member #: [registry pending]',
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
  const normalizedFormState = normalizeDependentFormState(formState);
  const reviewFlags: ReviewFlag[] = [];
  const paragraphs: GeneratedParagraph[] = [];

  const topBlock = buildTopBlockParagraph(normalizedFormState);
  const p1 = buildP1Paragraph(normalizedFormState);
  const p2 = buildP2Paragraph(normalizedFormState, reviewFlags);
  const p3 = buildP3Paragraph(normalizedFormState, reviewFlags);
  const supplementalIssueContext = buildSupplementalIssueParagraph(normalizedFormState, reviewFlags);
  const frostOnlyContext = buildFrostOnlyIssueContext(normalizedFormState);
  const p3a = supplementalIssueContext.paragraph ?? frostOnlyContext.paragraph;
  const p4 = buildP4Paragraph(normalizedFormState, reviewFlags);
  const p5 = buildP5Paragraph(normalizedFormState, reviewFlags);
  const p6 = buildP6Paragraph(normalizedFormState);
  const p7 = buildP7Paragraph(normalizedFormState);
  const closing = buildClosingParagraph();
  const signoff = buildSignoffParagraph(normalizedFormState);

  paragraphs.push(topBlock, p1, p2, p3);

  if (p3a) {
    paragraphs.push(p3a);
  }

  paragraphs.push(p4);

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

  const filename = buildFilename(normalizedFormState);
  const archivePath = buildArchivePath(normalizedFormState, filename);

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
