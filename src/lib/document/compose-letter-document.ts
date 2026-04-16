import { buildSignoffModel } from '@/lib/signoff/build-signoff-model';
import { formatDisplayDate, getFoundationInspectionSubjectLine } from '@/lib/domain/report-helpers';
import { buildDraftReadinessState } from '@/lib/form/build-draft-workflow';
import { validateDraftForClientOutput } from '@/lib/form/validate-draft';
import { getClientReferenceLabelText, officeShellLayout, officeShellText } from '@/lib/seed/letter-surfaces';
import { getReportSectionDefinition, toClauseRefs, toRuleRefs } from '@/lib/seed/source-data';
import type { FormState, GeneratedParagraph, GenerationResult, SectionId } from '@/types/domain';
import type {
  ArchivePathBlock,
  ComposedLetterDocument,
  FooterBlock,
  HeaderBlock,
  LetterDocumentBodyBlock,
  MetadataBlock,
  ParagraphBlock,
  SignoffBlock
} from '@/types/document';

function getSubjectLine(formState: FormState) {
  return getFoundationInspectionSubjectLine(
    formState.topBlock.subjectLineFamily,
    formState.topBlock.headingSuffix,
    formState.reportBody.structureVariant
  );
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
    lines: [...officeShellText.officeAddress],
    emphasisLineIndexes: [],
    sectionId: topBlock?.sectionId,
    clauseRefs: topBlock?.clauseRefs ?? toClauseRefs(['META_01']),
    ruleRefs: topBlock?.ruleRefs ?? toRuleRefs(['DT_001'])
  };
}

function buildDateAndFileBlock(formState: FormState, topBlock: GeneratedParagraph): MetadataBlock {
  const dateLine = formatDisplayDate(formState.topBlock.letterDate);
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
  const subjectLine = getSubjectLine(formState);
  const detailLines = [
    ...buildLegalDescriptionLines(formState),
    formState.topBlock.includeClientJobNumber && formState.topBlock.clientJobNumber
      ? `${getClientReferenceLabelText(formState.topBlock.clientReferenceLabelFamily)} ${formState.topBlock.clientJobNumber}`
      : null,
    formState.topBlock.includeSubdivision && formState.topBlock.subdivision ? formState.topBlock.subdivision : null,
    formState.topBlock.municipality
  ].filter((value): value is string => Boolean(value));

  return {
    id: 'metadata-re-block',
    kind: 'metadata_block',
    role: 're_block',
    alignment: 'left',
    title: 'Re block',
    lines: [subjectLine, ...detailLines],
    subjectLine,
    reLabel: officeShellLayout.reBlock.label,
    detailLines,
    reLayout: {
      label: officeShellLayout.reBlock.label,
      leadTabCount: officeShellLayout.reBlock.leadTabCount,
      detailTabCount: officeShellLayout.reBlock.detailTabCount,
      tabStopTwips: [...officeShellLayout.reBlock.tabStopTwips],
      previewHeadlineIndentPx: officeShellLayout.reBlock.previewHeadlineIndentPx,
      previewLabelWidthPx: officeShellLayout.reBlock.previewLabelWidthPx,
      previewDetailIndentPx: officeShellLayout.reBlock.previewDetailIndentPx
    },
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
    lines: [officeShellText.companyName, officeShellText.companySubtitle, officeShellText.companyCities],
    logoAsset: officeShellLayout.firstPageHeader.logo
  };
}

function buildContinuationHeader(formState: FormState, currentPage: number, totalPages: number): HeaderBlock {
  return {
    id: 'header-continuation-page',
    kind: 'header_block',
    role: 'continuation_subject',
    alignment: 'left',
    title: 'Continuation header',
    lines: [officeShellText.companyName],
    pageNumberText: `Page ${currentPage} of ${totalPages}`
  };
}

function buildOfficeContacts() {
  return [...officeShellText.officeContacts];
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

function buildContinuationFooter(formState: FormState): FooterBlock {
  const subjectLine = getSubjectLine(formState);
  const fileNumberLine = `File No. ${formState.topBlock.fileNumber}`;

  return {
    id: 'footer-continuation-page',
    kind: 'footer_block',
    role: 'continuation_footer',
    alignment: 'left',
    title: 'Continuation footer',
    lines: [],
    continuationMarkerLine: `${subjectLine}\t${fileNumberLine}`,
    clauseRefs: toClauseRefs(['FMT_03', 'SIG_04']),
    ruleRefs: toRuleRefs(['DT_115', 'DT_124'])
  };
}

function buildArchivePathBlock(archivePath: string): ArchivePathBlock {
  return {
    id: 'archive-path-block',
    kind: 'archive_path_block',
    alignment: 'left',
    text: archivePath
  };
}

function buildSignoffBlock(formState: FormState, paragraph: GeneratedParagraph): { block: SignoffBlock; warnings: string[] } {
  const signoff = buildSignoffModel(formState.signoff);

  return {
    block: {
      id: 'signoff-block',
      kind: 'signoff_block',
      alignment: 'left',
      title: paragraph.title,
      salutationLine: signoff.salutation,
      organization: signoff.organization,
      lines: signoff.lines,
      engineerMemberNumberLine: signoff.signingEngineer.profile.memberNumber ? `APEGA Member #: ${signoff.signingEngineer.profile.memberNumber}` : undefined,
      sectionId: 'SIGNOFF',
      clauseRefs: paragraph.clauseRefs,
      ruleRefs: [...paragraph.ruleRefs, ...toRuleRefs(['DT_120'])]
    },
    warnings: signoff.warnings
  };
}

const FIRST_PAGE_BODY_BUDGET = 124;
const CONTINUATION_PAGE_BUDGET = 118;

function estimateBodyBlockUnits(block: LetterDocumentBodyBlock) {
  switch (block.kind) {
    case 'metadata_block': {
      if (block.role === 'office_address') {
        return 14;
      }

      if (block.role === 'date_file') {
        return 12;
      }

      if (block.role === 'client_address') {
        return 10 + block.lines.length * 3;
      }

      return 12 + (block.detailLines?.length ?? 0) * 3;
    }
    case 'paragraph_block': {
      const baseUnits = block.role === 'closing' ? 12 : 14;
      const lengthUnits = Math.ceil(block.text.length / 220) * 6;

      return baseUnits + lengthUnits + (block.reviewSensitive ? 2 : 0);
    }
    case 'signoff_block':
      return 26 + block.lines.length * 10 + (block.engineerMemberNumberLine ? 4 : 0);
    case 'archive_path_block':
      return 8;
    case 'spacer_block':
      return block.size === 'large' ? 12 : block.size === 'medium' ? 8 : 4;
    case 'trace_block':
      return 0;
  }
}

function takeBlocksWithinBudget(blocks: LetterDocumentBodyBlock[], budget: number) {
  const acceptedBlocks: LetterDocumentBodyBlock[] = [];
  let consumedUnits = 0;

  for (const block of blocks) {
    const blockUnits = estimateBodyBlockUnits(block);

    if (acceptedBlocks.length > 0 && consumedUnits + blockUnits > budget) {
      break;
    }

    acceptedBlocks.push(block);
    consumedUnits += blockUnits;
  }

  return {
    acceptedBlocks,
    remainingBlocks: blocks.slice(acceptedBlocks.length),
    consumedUnits
  };
}

function paginateContinuationBlocks(blocks: LetterDocumentBodyBlock[]) {
  const pages: LetterDocumentBodyBlock[][] = [];
  let remainingBlocks = [...blocks];

  while (remainingBlocks.length > 0) {
    const { acceptedBlocks, remainingBlocks: nextRemainingBlocks } = takeBlocksWithinBudget(
      remainingBlocks,
      CONTINUATION_PAGE_BUDGET
    );

    pages.push(acceptedBlocks);
    remainingBlocks = nextRemainingBlocks;
  }

  return pages;
}

function getParagraphBySection(result: GenerationResult, sectionId: SectionId): GeneratedParagraph | undefined {
  return result.paragraphs.find((paragraph) => paragraph.sectionId === sectionId);
}

export function composeLetterDocument(formState: FormState, result: GenerationResult): ComposedLetterDocument {
  const validationIssues = validateDraftForClientOutput(formState, result);
  const exportWarnings: string[] = [];
  const firstPageMetadataBlocks: LetterDocumentBodyBlock[] = [];
  const candidateBodyBlocks: LetterDocumentBodyBlock[] = [];
  const continuationSeedBlocks: LetterDocumentBodyBlock[] = [];
  const topBlock = getParagraphBySection(result, 'TOP_BLOCK');
  const closing = getParagraphBySection(result, 'CLOSING');
  const signoffParagraph = getParagraphBySection(result, 'SIGNOFF');

  if (topBlock) {
    firstPageMetadataBlocks.push(buildOfficeAddressBlock(topBlock));
    firstPageMetadataBlocks.push(buildDateAndFileBlock(formState, topBlock));
    firstPageMetadataBlocks.push(buildClientAddressBlock(formState, topBlock));
    firstPageMetadataBlocks.push(buildReBlock(formState, topBlock));
  }

  for (const paragraph of result.paragraphs) {
    if (paragraph.sectionId === 'TOP_BLOCK' || paragraph.sectionId === 'CLOSING' || paragraph.sectionId === 'SIGNOFF') {
      continue;
    }

    candidateBodyBlocks.push(buildParagraphBlock(paragraph));
  }

  if (closing) {
    continuationSeedBlocks.push(buildParagraphBlock(closing));
  }

  let signoffBlock: ReturnType<typeof buildSignoffBlock> | undefined;
  if (signoffParagraph) {
    signoffBlock = buildSignoffBlock(formState, signoffParagraph);
    exportWarnings.push(...signoffBlock.warnings);
  }

  const uniqueWarnings = [...new Set(exportWarnings)];
  const firstPageBudgetUsed = firstPageMetadataBlocks.reduce((total, block) => total + estimateBodyBlockUnits(block), 0);
  const { acceptedBlocks: firstPageParagraphBlocks, remainingBlocks: remainingBodyBlocks } = takeBlocksWithinBudget(
    candidateBodyBlocks,
    Math.max(FIRST_PAGE_BODY_BUDGET - firstPageBudgetUsed, 0)
  );
  const firstPageBodyBlocks = [...firstPageMetadataBlocks, ...firstPageParagraphBlocks];
  const continuationParagraphBlocks = [...remainingBodyBlocks, ...continuationSeedBlocks];
  const pages: ComposedLetterDocument['pages'] = [
    {
      id: 'page-1',
      kind: 'first_page',
      headerBlock: buildFirstPageHeader(),
      bodyBlocks: firstPageBodyBlocks,
      footerBlock: buildFirstPageFooter()
    }
  ];

  const continuationChunks = paginateContinuationBlocks(continuationParagraphBlocks);

  if (continuationChunks.length === 0 && signoffBlock) {
    continuationChunks.push([]);
  }

  if (signoffBlock) {
    const lastChunk = continuationChunks.at(-1);

    if (!lastChunk) {
      continuationChunks.push([signoffBlock.block]);
    } else if (
      lastChunk.reduce((total, block) => total + estimateBodyBlockUnits(block), 0) + estimateBodyBlockUnits(signoffBlock.block) <=
      CONTINUATION_PAGE_BUDGET
    ) {
      lastChunk.push(signoffBlock.block);
    } else {
      continuationChunks.push([signoffBlock.block]);
    }
  }

  const archivePathBlock = buildArchivePathBlock(result.archivePath);
  const finalChunk = continuationChunks.at(-1);

  if (!finalChunk) {
    continuationChunks.push([archivePathBlock]);
  } else if (
    finalChunk.reduce((total, block) => total + estimateBodyBlockUnits(block), 0) + estimateBodyBlockUnits(archivePathBlock) <=
    CONTINUATION_PAGE_BUDGET
  ) {
    finalChunk.push(archivePathBlock);
  } else {
    continuationChunks.push([archivePathBlock]);
  }

  continuationChunks.forEach((chunk, index) => {
    const currentPage = index + 2;
    const totalPages = continuationChunks.length + 1;

    pages.push({
      id: `page-${index + 2}`,
      kind: 'continuation_page',
      headerBlock: buildContinuationHeader(formState, currentPage, totalPages),
      bodyBlocks: [...chunk],
      footerBlock: buildContinuationFooter(formState)
    });
  });

  return {
    pages,
    filename: result.filename,
    archivePath: result.archivePath,
    visibleSections: result.visibleSections,
    reviewFlags: result.reviewFlags,
    clauseRefsUsed: result.clauseRefsUsed,
    ruleRefsUsed: result.ruleRefsUsed,
    exportWarnings: uniqueWarnings,
    validationIssues,
    readiness: buildDraftReadinessState(validationIssues.length, result.reviewFlags.length)
  };
}
