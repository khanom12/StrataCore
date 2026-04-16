import { buildSignoffModel } from '@/lib/signoff/build-signoff-model';
import { getFoundationInspectionSubjectLine } from '@/lib/domain/report-helpers';
import { formatSignoffName } from '@/lib/signoff/engineer-registry';
import { getReportSectionDefinition, toClauseRefs, toRuleRefs } from '@/lib/seed/source-data';
import type { FormState, GeneratedParagraph, GenerationResult, SectionId } from '@/types/domain';
import type {
  ComposedLetterDocument,
  FooterBlock,
  HeaderBlock,
  LetterDocumentBodyBlock,
  MetadataBlock,
  ParagraphBlock,
  SignoffBlock
} from '@/types/document';

function getSubjectLine(formState: FormState) {
  return getFoundationInspectionSubjectLine(formState.topBlock.headingSuffix, formState.reportBody.structureVariant);
}

function buildLegalDescriptionLines(formState: FormState) {
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

function buildParagraphBlock(paragraph: GeneratedParagraph): ParagraphBlock {
  return {
    id: `paragraph-${paragraph.id}`,
    kind: 'paragraph_block',
    role: paragraph.sectionId === 'CLOSING' ? 'closing' : 'body',
    alignment: 'left',
    title: paragraph.title,
    text: paragraph.text,
    sectionId: paragraph.sectionId,
    clauseRefs: paragraph.clauseRefs,
    ruleRefs: paragraph.ruleRefs,
    reviewSensitive: paragraph.reviewSensitive
  };
}

function buildOfficeAddressBlock(topBlock?: GeneratedParagraph): MetadataBlock {
  const definition = getReportSectionDefinition('META_01');

  return {
    id: 'metadata-office-address',
    kind: 'metadata_block',
    role: 'office_address',
    alignment: 'right',
    title: definition?.name ?? 'Office Address Block',
    lines: ['2304 - 119 Avenue NE', 'Edmonton, Alberta', 'T6S 1B3'],
    emphasisLineIndexes: [],
    sectionId: topBlock?.sectionId,
    clauseRefs: topBlock?.clauseRefs ?? toClauseRefs(['META_01']),
    ruleRefs: topBlock?.ruleRefs ?? toRuleRefs(['DT_001'])
  };
}

function buildDateAndFileBlock(formState: FormState, topBlock: GeneratedParagraph): MetadataBlock {
  const dateLine = formState.topBlock.letterDate;
  const fileNumberLine = `File No. ${formState.topBlock.fileNumber}`;

  return {
    id: 'metadata-date-file',
    kind: 'metadata_block',
    role: 'date_file',
    alignment: 'right',
    title: 'Date and file number',
    lines: [dateLine, fileNumberLine],
    dateLine,
    fileNumberLine,
    sectionId: topBlock.sectionId,
    clauseRefs: topBlock.clauseRefs,
    ruleRefs: topBlock.ruleRefs
  };
}

function buildClientAddressBlock(formState: FormState, topBlock: GeneratedParagraph): MetadataBlock {
  const lines = [formState.topBlock.clientName, ...formState.topBlock.clientMailingAddress];

  return {
    id: 'metadata-client-address',
    kind: 'metadata_block',
    role: 'client_address',
    alignment: 'left',
    title: 'Client address block',
    lines,
    emphasisLineIndexes: [0],
    sectionId: topBlock.sectionId,
    clauseRefs: topBlock.clauseRefs,
    ruleRefs: topBlock.ruleRefs
  };
}

function buildReBlock(formState: FormState, topBlock: GeneratedParagraph): MetadataBlock {
  const detailLines = [
    ...buildLegalDescriptionLines(formState),
    formState.topBlock.includeSubdivision && formState.topBlock.subdivision ? formState.topBlock.subdivision : null,
    formState.topBlock.municipality,
    formState.topBlock.includeClientJobNumber && formState.topBlock.clientJobNumber
      ? `Client Job No.: ${formState.topBlock.clientJobNumber}`
      : null
  ].filter((value): value is string => Boolean(value));

  return {
    id: 'metadata-re-block',
    kind: 'metadata_block',
    role: 're_block',
    alignment: 'left',
    title: 'Re block',
    lines: [`Re: ${getSubjectLine(formState)}`, ...detailLines],
    subjectLine: getSubjectLine(formState),
    detailLines,
    sectionId: topBlock.sectionId,
    clauseRefs: topBlock.clauseRefs,
    ruleRefs: topBlock.ruleRefs
  };
}

function buildFirstPageHeader(): HeaderBlock {
  return {
    id: 'header-first-page',
    kind: 'header_block',
    role: 'first_page_identity',
    alignment: 'center',
    title: 'First-page header',
    lines: ['J.R. Paine & Associates Ltd.', 'CONSULTING AND TESTING ENGINEERS', 'EDMONTON - GRANDE PRAIRIE - PEACE RIVER']
  };
}

function buildContinuationHeader(formState: FormState, pageNumber: number, totalPages: number): HeaderBlock {
  const subjectLine = getSubjectLine(formState);
  const fileNumberLine = `File No. ${formState.topBlock.fileNumber}`;

  return {
    id: 'header-continuation-page',
    kind: 'header_block',
    role: 'continuation_subject',
    alignment: 'left',
    title: 'Continuation header',
    lines: [`J.R. Paine & Associates Ltd.\tPage ${pageNumber} of ${totalPages}`, `${subjectLine}\t${fileNumberLine}`],
    subjectLine,
    fileNumberLine
  };
}

function buildOfficeContacts() {
  return [
    { city: 'EDMONTON', phone: '780-489-0700' },
    { city: 'GRANDE PRAIRIE', phone: '780-532-1515' },
    { city: 'PEACE RIVER', phone: '780-624-4966' }
  ];
}

function buildFirstPageFooter(): FooterBlock {
  const offices = buildOfficeContacts();

  return {
    id: 'footer-first-page',
    kind: 'footer_block',
    role: 'office_contacts',
    alignment: 'center',
    title: 'First-page footer',
    lines: offices.flatMap((office) => [office.city, office.phone]),
    offices,
    clauseRefs: toClauseRefs(['FMT_02', 'SIG_04']),
    ruleRefs: toRuleRefs(['DT_115'])
  };
}

function buildContinuationFooter(): FooterBlock {
  const offices = buildOfficeContacts();

  return {
    id: 'footer-continuation-page',
    kind: 'footer_block',
    role: 'continuation_footer',
    alignment: 'center',
    title: 'Continuation footer',
    lines: offices.flatMap((office) => [office.city, office.phone]),
    offices,
    clauseRefs: toClauseRefs(['FMT_03', 'SIG_04']),
    ruleRefs: toRuleRefs(['DT_115'])
  };
}

function buildSignoffBlock(formState: FormState, paragraph: GeneratedParagraph): { block: SignoffBlock; warnings: string[] } {
  const signoff = buildSignoffModel(formState.signoff);
  const engineerName = formatSignoffName(signoff.signingEngineer.profile);

  return {
    block: {
      id: 'signoff-block',
      kind: 'signoff_block',
      alignment: 'left',
      title: paragraph.title,
      salutationLine: signoff.salutation,
      organization: signoff.organization,
      lines: signoff.lines,
      engineerMemberNumberLine: signoff.signingEngineer.profile.memberNumber
        ? `APEGA Member #: ${signoff.signingEngineer.profile.memberNumber}`
        : 'APEGA Member #: [registry pending]',
      stampPlaceholderLine: signoff.signingEngineer.profile.stampAssetKey
        ? `[Engineer stamp placeholder: ${signoff.signingEngineer.profile.stampAssetKey}]`
        : `[Engineer stamp placeholder for ${engineerName}]`,
      permitToPracticeLine: signoff.permitToPractice.placeholderText,
      sectionId: 'SIGNOFF',
      clauseRefs: paragraph.clauseRefs,
      ruleRefs: paragraph.ruleRefs
    },
    warnings: signoff.warnings
  };
}

function collectReadinessLabel(reviewFlagCount: number, exportWarningCount: number): ComposedLetterDocument['readiness'] {
  if (reviewFlagCount > 0) {
    return {
      status: 'review_required',
      label: `Review flags present (${reviewFlagCount})`
    };
  }

  if (exportWarningCount > 0) {
    return {
      status: 'warning',
      label: `Export generated with warnings (${exportWarningCount})`
    };
  }

  return {
    status: 'ready',
    label: 'Ready for export'
  };
}

function getParagraphBySection(result: GenerationResult, sectionId: SectionId): GeneratedParagraph | undefined {
  return result.paragraphs.find((paragraph) => paragraph.sectionId === sectionId);
}

export function composeLetterDocument(formState: FormState, result: GenerationResult): ComposedLetterDocument {
  const exportWarnings: string[] = [];
  const firstPageBodyBlocks: LetterDocumentBodyBlock[] = [];
  const continuationBodyBlocks: LetterDocumentBodyBlock[] = [];
  const firstPageBodySections: SectionId[] = ['P1', 'P2', 'P3', 'P3A', 'P4'];
  const topBlock = getParagraphBySection(result, 'TOP_BLOCK');
  const closing = getParagraphBySection(result, 'CLOSING');
  const signoffParagraph = getParagraphBySection(result, 'SIGNOFF');

  if (topBlock) {
    firstPageBodyBlocks.push(buildOfficeAddressBlock(topBlock));
    firstPageBodyBlocks.push(buildDateAndFileBlock(formState, topBlock));
    firstPageBodyBlocks.push(buildClientAddressBlock(formState, topBlock));
    firstPageBodyBlocks.push(buildReBlock(formState, topBlock));
  }

  for (const paragraph of result.paragraphs) {
    if (paragraph.sectionId === 'TOP_BLOCK' || paragraph.sectionId === 'CLOSING' || paragraph.sectionId === 'SIGNOFF') {
      continue;
    }

    if (firstPageBodySections.includes(paragraph.sectionId)) {
      firstPageBodyBlocks.push(buildParagraphBlock(paragraph));
    } else {
      continuationBodyBlocks.push(buildParagraphBlock(paragraph));
    }
  }

  if (closing) {
    continuationBodyBlocks.push(buildParagraphBlock(closing));
  }

  if (signoffParagraph) {
    const signoffBlock = buildSignoffBlock(formState, signoffParagraph);
    continuationBodyBlocks.push(signoffBlock.block);
    exportWarnings.push(...signoffBlock.warnings);
  }

  const uniqueWarnings = [...new Set(exportWarnings)];

  return {
    pages: [
      {
        id: 'page-1',
        kind: 'first_page',
        headerBlock: buildFirstPageHeader(),
        bodyBlocks: firstPageBodyBlocks,
        footerBlock: buildFirstPageFooter()
      },
      {
        id: 'page-2',
        kind: 'continuation_page',
        headerBlock: buildContinuationHeader(formState, 2, 2),
        bodyBlocks: continuationBodyBlocks,
        footerBlock: buildContinuationFooter()
      }
    ],
    filename: result.filename,
    archivePath: result.archivePath,
    visibleSections: result.visibleSections,
    reviewFlags: result.reviewFlags,
    clauseRefsUsed: result.clauseRefsUsed,
    ruleRefsUsed: result.ruleRefsUsed,
    exportWarnings: uniqueWarnings,
    readiness: collectReadinessLabel(result.reviewFlags.length, uniqueWarnings.length)
  };
}
