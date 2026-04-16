import { buildArchivePath, buildFilename } from '@/lib/export/build-filename';
import { createReviewFlag } from '@/lib/review/flags';
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

function formatDate(dateString: string): string {
  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) {
    return dateString;
  }

  return new Intl.DateTimeFormat('en-CA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(date);
}

function formatNumber(value?: number): string {
  if (value === undefined || Number.isNaN(value)) {
    return '[review required]';
  }

  return value.toFixed(1);
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
    return `featured traces of ${traceFeatures[0].replaceAll('_', ' ')}`;
  }

  const readable = traceFeatures.map((item) => item.replaceAll('_', ' '));
  return `featured traces of ${readable.slice(0, -1).join(', ')} and ${readable.at(-1)}`;
}

function collectCutDepthValues(cutDepths: FormState['reportBody']['excavation']['houseFootingCutDepthsM']): number[] {
  return Object.values(cutDepths).filter((value): value is number => value !== undefined && !Number.isNaN(value));
}

export function deriveHouseCutRange(cutDepths: FormState['reportBody']['excavation']['houseFootingCutDepthsM']) {
  const values = collectCutDepthValues(cutDepths);

  if (values.length === 0) {
    return { minimumM: undefined, maximumM: undefined };
  }

  return {
    minimumM: Math.min(...values),
    maximumM: Math.max(...values)
  };
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
    formatDate(formState.topBlock.letterDate),
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
    text: getClauseText('CL_000').replace('{January 28, 2026}', formatDate(formState.reportBody.inspectionDate)).trim(),
    order: 20,
    clauseIds: ['CL_000'],
    ruleIds: ['DT_010']
  });
}

function buildP2Paragraph(formState: FormState, reviewFlags: ReviewFlag[]): GeneratedParagraph {
  const excavation = formState.reportBody.excavation;
  const garage = formState.reportBody.garage;
  const cutRange = deriveHouseCutRange(excavation.houseFootingCutDepthsM);
  const sentences: string[] = ['At the time of inspection, the excavation was at footing grade and was advanced by a backhoe.'];
  const clauseIds = ['P2'];
  const ruleIds = ['DT_020'];

  if (excavation.walkoutBasement) {
    sentences.push(
      `Rear walkout basement conditions were selected. The recorded excavation range is approximately ${formatNumber(
        cutRange.minimumM
      )} to ${formatNumber(cutRange.maximumM)} m below adjacent grade, and the final front/back walkout wording should be confirmed during review.`
    );
    clauseIds.push('CL_018');
    ruleIds.push('DT_022');
    reviewFlags.push(
      createReviewFlag({
        id: 'review-walkout-wording',
        title: 'Walkout wording needs confirmation',
        message:
          'Walkout wording is in scope, but this prototype does not yet capture the full front/back cut inputs needed for the canonical CL_018 phrasing.',
        relatedSectionId: 'P2',
        clauseRefs: toClauseRefs(['CL_018']),
        ruleRefs: toRuleRefs(['DT_022'])
      })
    );
  } else {
    sentences.push(
      `Cuts of approximately ${formatNumber(cutRange.minimumM)} to ${formatNumber(
        cutRange.maximumM
      )} m below the adjacent ground surface were noted in the house area.`
    );
    ruleIds.push('DT_021');
  }

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
  const baseDescriptor = `${soil.moisture1}${soil.moisture2 ? ` to ${soil.moisture2}` : ''}, ${colourLabel(
    soil.colour
  )}, ${materialLabel(soil.primaryMaterialFamily)}`;
  const sentences: string[] = [];
  const clauseIds = ['P3'];
  const ruleIds = ['DT_050'];

  if (soil.soilLayeringMode === 'engineered_fill_over_native') {
    sentences.push(
      `Below the clay fill material, the soil encountered was identified as ${baseDescriptor}. The ${materialLabel(
        soil.primaryMaterialFamily
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
        `The ${materialLabel(soil.primaryMaterialFamily)} was a native deposit of ${plasticityLabel(
          soil.plasticity1,
          soil.plasticity2
        )} with a ${soil.consistencyOrDensity} consistency${traceText}.`
      );
      ruleIds.push('DT_052');
    } else {
      sentences.push(
        `The ${materialLabel(soil.primaryMaterialFamily)} was interpreted as engineered fill with a ${soil.consistencyOrDensity} consistency${traceText}.`
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

function buildP4Paragraph(formState: FormState, reviewFlags: ReviewFlag[]): GeneratedParagraph {
  const recommendation = formState.reportBody.recommendation;
  const clauseIds: string[] = [];
  const ruleIds: string[] = [];
  const sentences: string[] = [];

  if (recommendation.footingBasis === 'modified') {
    sentences.push(getClauseText('CL_003'));
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
    sentences.push(getClauseText('CL_002'));
    clauseIds.push('CL_002');
    ruleIds.push('DT_070');
  }

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

  if (garage.mode === 'none') {
    return null;
  }

  const clauseIds: string[] = ['P5'];
  const ruleIds: string[] = ['DT_095'];
  const sentences: string[] = [];

  if (recommendation.footingBasis === 'modified') {
    sentences.push(getClauseText('CL_015'));
    clauseIds.push('CL_015');
    ruleIds.push('DT_091');
  } else {
    sentences.push(getClauseText('CL_014'));
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
  const signoffLines = [
    'J.R. Paine & Associates Ltd.',
    '',
    formState.signoff.preparedBy ? `Prepared by: ${formState.signoff.preparedBy}` : null,
    `Reviewed by: ${formState.signoff.signingEngineer}`,
    'Permit to practice: [blank signatory area placeholder]'
  ]
    .filter((line): line is string => Boolean(line))
    .join('\n');

  return createParagraph({
    id: 'signoff',
    sectionId: 'SIGNOFF',
    title: 'Signoff',
    text: signoffLines,
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
