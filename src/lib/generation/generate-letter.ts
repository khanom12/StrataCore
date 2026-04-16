import { buildArchivePath, buildFilename } from '@/lib/export/build-filename';
import { createReviewFlag } from '@/lib/review/flags';
import { getClauseText, getReviewDecision } from '@/lib/seed/source-data';
import type { FormState, GeneratedParagraph, GenerationResult, ReviewFlag } from '@/types/domain';

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

function materialLabel(material: FormState['p3']['primaryMaterialFamily']): string {
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

function colourLabel(colour: FormState['p3']['colour']): string {
  return colour.replaceAll('_', ' ');
}

function plasticityLabel(
  plasticity1: FormState['p3']['plasticity1'],
  plasticity2?: FormState['p3']['plasticity2']
): string {
  return plasticity2 ? `${plasticity1} to ${plasticity2} plasticity` : `${plasticity1} plasticity`;
}

function traceFeatureLabel(traceFeatures: NonNullable<FormState['p3']['traceFeatures']>): string {
  if (traceFeatures.length === 1) {
    return `featured traces of ${traceFeatures[0].replaceAll('_', ' ')}`;
  }

  const readable = traceFeatures.map((item) => item.replaceAll('_', ' '));
  return `featured traces of ${readable.slice(0, -1).join(', ')} and ${readable.at(-1)}`;
}

function buildMetaBlock(formState: FormState): GeneratedParagraph {
  const metaLines = [
    formatDate(formState.meta.letterDate),
    `File No.: ${formState.meta.fileNumber}`,
    '',
    formState.meta.clientName,
    ...formState.meta.clientMailingAddress,
    '',
    `Re: Foundation Soil Inspection${formState.meta.headingSuffix ? ` - ${formState.meta.headingSuffix}` : ''}`,
    formState.meta.includeLegalDescription && formState.meta.lot && formState.meta.block && formState.meta.plan
      ? `Lot ${formState.meta.lot}, Block ${formState.meta.block}, Plan ${formState.meta.plan}`
      : null,
    formState.meta.streetAddress,
    formState.meta.includeClientJobNumber && formState.meta.clientJobNumber
      ? `Client Job No.: ${formState.meta.clientJobNumber}`
      : null,
    formState.meta.includeSubdivision && formState.meta.subdivision ? formState.meta.subdivision : null,
    formState.meta.municipality
  ]
    .filter((value): value is string => value !== null)
    .join('\n');

  return {
    id: 'meta-block',
    section: 'META',
    title: 'Metadata / Top Block',
    text: metaLines,
    clauseIds: ['META_02', 'META_03', 'META_04', 'META_05', 'META_06', 'META_07', 'META_08', 'META_09', 'META_10'],
    ruleIds: ['DT_001', 'DT_002', 'DT_003', 'DT_004', 'DT_005', 'DT_006']
  };
}

function buildP1Paragraph(formState: FormState): GeneratedParagraph {
  const baseText = getClauseText('CL_000').replace('{January 28, 2026}', formatDate(formState.inspectionDate));

  return {
    id: 'p1',
    section: 'P1',
    title: 'P1 Intro',
    text: baseText.trim(),
    clauseIds: ['CL_000'],
    ruleIds: ['DT_010']
  };
}

function buildP2Paragraph(formState: FormState, reviewFlags: ReviewFlag[]): GeneratedParagraph {
  const sentences: string[] = ['At the time of inspection, the excavation was at footing grade and was advanced by a backhoe.'];
  const clauseIds = ['Report_Skeleton P2'];
  const ruleIds = ['DT_020'];

  if (formState.p2.walkoutBasement) {
    sentences.push(
      `Rear walkout basement conditions were selected. The recorded excavation range is approximately ${formatNumber(
        formState.p2.minCutM
      )} to ${formatNumber(formState.p2.maxCutM)} m below adjacent grade, and the final front/back walkout wording should be confirmed during review.`
    );
    clauseIds.push('CL_018');
    ruleIds.push('DT_022');
    reviewFlags.push(
      createReviewFlag({
        code: 'REVIEW_WALKOUT_WORDING',
        message:
          'Walkout wording is in scope, but this prototype does not yet capture the full front/back cut inputs needed for the canonical CL_018 phrasing.',
        sourceRuleIds: ['DT_022'],
        sourceClauseIds: ['CL_018']
      })
    );
  } else {
    sentences.push(
      `Cuts of approximately ${formatNumber(formState.p2.minCutM)} to ${formatNumber(
        formState.p2.maxCutM
      )} m below the adjacent ground surface were noted in the house area.`
    );
    ruleIds.push('DT_021');
  }

  if (formState.p2.garageMode === 'same_elevation') {
    sentences.push(
      'In addition, the excavation had been extended into the garage footing areas, with the bottom of that excavation at the same elevation as the house excavation floor.'
    );
    clauseIds.push('CL_021');
    ruleIds.push('DT_023');
  }

  if (formState.p2.garageMode === 'higher_than_house') {
    const offsetText =
      formState.p2.garageOffsetAboveHouseM !== undefined
        ? `at approximately ${formatNumber(formState.p2.garageOffsetAboveHouseM)} m above the house excavation level`
        : 'above the house excavation level';

    sentences.push(`In addition, an excavation had also been made in the garage footing area, with the excavation floor noted ${offsetText}.`);
    clauseIds.push('CL_022');
    ruleIds.push('DT_024');
  }

  return {
    id: 'p2',
    section: 'P2',
    title: 'P2 Excavation Conditions',
    text: sentences.join(' '),
    clauseIds,
    ruleIds,
    needsReview: reviewFlags.some((flag) => flag.code === 'REVIEW_WALKOUT_WORDING')
  };
}

function buildP3Paragraph(formState: FormState, reviewFlags: ReviewFlag[]): GeneratedParagraph {
  const traceText = formState.p3.traceFeatures?.length ? ` and ${traceFeatureLabel(formState.p3.traceFeatures)}` : '';
  const baseDescriptor = `${formState.p3.moisture1}${formState.p3.moisture2 ? ` to ${formState.p3.moisture2}` : ''}, ${colourLabel(
    formState.p3.colour
  )}, ${materialLabel(formState.p3.primaryMaterialFamily)}`;

  const sentences: string[] = [];
  const clauseIds = ['Report_Skeleton P3'];
  const ruleIds = ['DT_050'];

  if (formState.p3.soilLayeringMode === 'engineered_fill_over_native') {
    sentences.push(
      `Below the clay fill material, the soil encountered was identified as ${baseDescriptor}. The ${materialLabel(
        formState.p3.primaryMaterialFamily
      )} was a native deposit of ${plasticityLabel(formState.p3.plasticity1, formState.p3.plasticity2)} with a ${
        formState.p3.consistencyOrDensity
      } consistency${traceText}.`
    );
    clauseIds.push('CL_017');
    ruleIds.push('DT_051', 'DT_052');
  } else {
    sentences.push(`The soil encountered throughout the excavation floor was identified as ${baseDescriptor}.`);

    if (formState.p3.primarySoilOrigin === 'native') {
      sentences.push(
        `The ${materialLabel(formState.p3.primaryMaterialFamily)} was a native deposit of ${plasticityLabel(
          formState.p3.plasticity1,
          formState.p3.plasticity2
        )} with a ${formState.p3.consistencyOrDensity} consistency${traceText}.`
      );
      ruleIds.push('DT_052');
    } else {
      sentences.push(
        `The ${materialLabel(formState.p3.primaryMaterialFamily)} was interpreted as engineered fill with a ${
          formState.p3.consistencyOrDensity
        } consistency${traceText}.`
      );
    }
  }

  switch (formState.p3.primarySoilOrigin) {
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
          code: 'REVIEW_ENGINEERED_FILL_BY_OTHERS',
          message: getReviewDecision('DL_002')?.['Interim handling'] ?? 'Engineered fill by others requires review.',
          sourceRuleIds: ['DT_055'],
          sourceClauseIds: ['CL_029']
        })
      );
      ruleIds.push('DT_055');
      break;
    case 'engineered_fill_unknown':
      sentences.push('Engineered fill provenance is unknown. Keep this wording visible for review rather than treating it as a resolved office-standard branch.');
      reviewFlags.push(
        createReviewFlag({
          code: 'REVIEW_ENGINEERED_FILL_UNKNOWN',
          message: getReviewDecision('DL_002')?.['Why it matters'] ?? 'Unknown engineered fill provenance requires review.',
          sourceRuleIds: ['DT_056'],
          sourceClauseIds: ['CL_030', 'CL_037']
        })
      );
      ruleIds.push('DT_056');
      break;
  }

  if (formState.p3.highPlasticWarning) {
    sentences.push(getClauseText('CL_043'));
    clauseIds.push('CL_043');
    ruleIds.push('DT_063');
  }

  return {
    id: 'p3',
    section: 'P3',
    title: 'P3 Soil Conditions',
    text: sentences.join(' '),
    clauseIds,
    ruleIds,
    needsReview: reviewFlags.some((flag) =>
      ['REVIEW_ENGINEERED_FILL_BY_OTHERS', 'REVIEW_ENGINEERED_FILL_UNKNOWN'].includes(flag.code)
    )
  };
}

function buildP4Paragraph(formState: FormState, reviewFlags: ReviewFlag[]): GeneratedParagraph {
  const clauseIds: string[] = [];
  const ruleIds: string[] = [];
  const sentences: string[] = [];

  if (formState.p4.footingBasis === 'modified') {
    sentences.push(getClauseText('CL_003'));
    clauseIds.push('CL_003');
    ruleIds.push('DT_071');
    reviewFlags.push(
      createReviewFlag({
        code: 'REVIEW_MODIFIED_TRIGGER',
        message:
          getReviewDecision('DL_007')?.['Exact review question'] ??
          'Modified footing thresholds are still open, so this prototype treats modified footing as an explicit operator choice.',
        sourceRuleIds: ['DT_071'],
        sourceClauseIds: ['CL_003']
      })
    );
  } else {
    sentences.push(getClauseText('CL_002'));
    clauseIds.push('CL_002');
    ruleIds.push('DT_070');
  }

  if (formState.p4.spreadFootingMode === 'default_140_kpa') {
    sentences.push(getClauseText('CL_045'));
    clauseIds.push('CL_045');
    ruleIds.push('DT_075');
    reviewFlags.push(
      createReviewFlag({
        code: 'REVIEW_SPREAD_FOOTING_DEFAULT',
        message:
          getReviewDecision('DL_001')?.['Interim handling'] ??
          '140 kPa is treated as the working default, but the spread-footing family is still review-sensitive.',
        sourceRuleIds: ['DT_075'],
        sourceClauseIds: ['CL_045']
      })
    );
  }

  if (formState.p4.spreadFootingMode === 'review_100_kpa') {
    sentences.push(getClauseText('CL_046'));
    clauseIds.push('CL_046');
    ruleIds.push('DT_076');
    reviewFlags.push(
      createReviewFlag({
        code: 'REVIEW_SPREAD_FOOTING_ALT',
        message: getReviewDecision('DL_001')?.['Exact review question'] ?? '100 kPa spread footing remains review-only.',
        sourceRuleIds: ['DT_076'],
        sourceClauseIds: ['CL_046']
      })
    );
  }

  return {
    id: 'p4',
    section: 'P4',
    title: 'P4 House Footing Recommendation',
    text: sentences.join(' '),
    clauseIds,
    ruleIds,
    needsReview: reviewFlags.some((flag) => flag.code.startsWith('REVIEW_SPREAD_FOOTING') || flag.code === 'REVIEW_MODIFIED_TRIGGER')
  };
}

function buildP5Paragraph(formState: FormState, reviewFlags: ReviewFlag[]): GeneratedParagraph | null {
  if (formState.p2.garageMode === 'none') {
    return null;
  }

  const clauseIds: string[] = [];
  const ruleIds: string[] = ['DT_095'];
  const sentences: string[] = [];

  if (formState.p4.footingBasis === 'modified') {
    sentences.push(getClauseText('CL_015'));
    clauseIds.push('CL_015');
    ruleIds.push('DT_091');
  } else {
    sentences.push(getClauseText('CL_014'));
    clauseIds.push('CL_014');
    ruleIds.push('DT_090');
  }

  if (formState.p5?.garageSlabOrganics) {
    sentences.push(getClauseText('CL_016'));
    clauseIds.push('CL_016');
    ruleIds.push('DT_094');
    reviewFlags.push(
      createReviewFlag({
        code: 'REVIEW_GARAGE_SLAB_ORGANICS',
        message: 'Garage slab organics is included as a visible advisory because the seed files treat it as a special review-sensitive add-on.',
        sourceRuleIds: ['DT_094'],
        sourceClauseIds: ['CL_016']
      })
    );
  }

  return {
    id: 'p5',
    section: 'P5',
    title: 'P5 Garage Recommendation',
    text: sentences.join(' '),
    clauseIds,
    ruleIds,
    needsReview: Boolean(formState.p5?.garageSlabOrganics)
  };
}

function buildP6Paragraph(formState: FormState): GeneratedParagraph | null {
  if (!formState.p6?.includeSulphateParagraph || !formState.p6.sulphateClass) {
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

  const clauseId = clauseIdByClass[formState.p6.sulphateClass];
  const ruleId = ruleIdByClass[formState.p6.sulphateClass];

  return {
    id: 'p6',
    section: 'P6',
    title: 'P6 Sulphate Paragraph',
    text: getClauseText(clauseId),
    clauseIds: [clauseId],
    ruleIds: [ruleId]
  };
}

function buildP7Paragraph(formState: FormState): GeneratedParagraph | null {
  if (!formState.p7.includeWinterParagraph) {
    return null;
  }

  return {
    id: 'p7',
    section: 'P7',
    title: 'P7 Winter Paragraph',
    text: getClauseText('CL_011'),
    clauseIds: ['CL_011'],
    ruleIds: ['DT_110']
  };
}

function buildClosingParagraph(): GeneratedParagraph {
  return {
    id: 'p8',
    section: 'P8',
    title: 'Closing',
    text: 'We trust this information is considered satisfactory for your present requirements.',
    clauseIds: ['Report_Skeleton P8'],
    ruleIds: ['DT_111']
  };
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

  return {
    id: 'sig',
    section: 'SIG',
    title: 'Signoff / Archive',
    text: signoffLines,
    clauseIds: ['Report_Skeleton SIG_01', 'Report_Skeleton SIG_02', 'Report_Skeleton SIG_03', 'Report_Skeleton SIG_04'],
    ruleIds: ['DT_112', 'DT_113', 'DT_114', 'DT_115']
  };
}

export function generateLetter(formState: FormState): GenerationResult {
  const reviewFlags: ReviewFlag[] = [];
  const paragraphs: GeneratedParagraph[] = [];

  const meta = buildMetaBlock(formState);
  const p1 = buildP1Paragraph(formState);
  const p2 = buildP2Paragraph(formState, reviewFlags);
  const p3 = buildP3Paragraph(formState, reviewFlags);
  const p4 = buildP4Paragraph(formState, reviewFlags);
  const p5 = buildP5Paragraph(formState, reviewFlags);
  const p6 = buildP6Paragraph(formState);
  const p7 = buildP7Paragraph(formState);
  const closing = buildClosingParagraph();
  const signoff = buildSignoffParagraph(formState);

  paragraphs.push(meta, p1, p2, p3, p4);

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

  const filename = buildFilename(formState);
  const archivePath = buildArchivePath(formState, filename);

  return {
    visibleSections: paragraphs.map((paragraph) => paragraph.section),
    paragraphs,
    clauseIds: [...new Set(paragraphs.flatMap((paragraph) => paragraph.clauseIds))],
    ruleIds: [...new Set(paragraphs.flatMap((paragraph) => paragraph.ruleIds))],
    reviewFlags,
    filename,
    archivePath
  };
}
