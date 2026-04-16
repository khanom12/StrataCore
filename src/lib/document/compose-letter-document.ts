import { buildSignoffModel } from '@/lib/signoff/build-signoff-model';
import { formatDisplayDate, getFoundationInspectionSubjectLine } from '@/lib/domain/report-helpers';
import { validateDraftForClientOutput } from '@/lib/form/validate-draft';
import { getClientReferenceLabelText, officeShellText } from '@/lib/seed/letter-surfaces';
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
    lines: [officeShellText.companyName, officeShellText.companySubtitle, officeShellText.companyCities]
  };
}

function buildContinuationHeader(formState: FormState): HeaderBlock {
  const subjectLine = getSubjectLine(formState);
  const fileNumberLine = `File No. ${formState.topBlock.fileNumber}`;

  return {
    id: 'header-continuation-page',
    kind: 'header_block',
    role: 'continuation_subject',
    alignment: 'left',
    title: 'Continuation header',
    lines: [officeShellText.companyName, `${subjectLine}\t${fileNumberLine}`],
    subjectLine,
    fileNumberLine
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

function buildContinuationFooter(archivePathLine?: string): FooterBlock {
  const offices = buildOfficeContacts();

  return {
    id: 'footer-continuation-page',
    kind: 'footer_block',
    role: 'continuation_footer',
    alignment: 'center',
    title: 'Continuation footer',
    lines: offices.flatMap((office) => [office.city, office.phone]),
    offices,
    archivePathLine,
    clauseRefs: toClauseRefs(['FMT_03', 'SIG_04']),
    ruleRefs: toRuleRefs(['DT_115', 'DT_121'])
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

function collectReadinessLabel(validationIssueCount: number, reviewFlagCount: number): ComposedLetterDocument['readiness'] {
  if (validationIssueCount > 0) {
    return {
      status: 'blocked',
      label: `Export blocked (${validationIssueCount})`
    };
  }

  if (reviewFlagCount > 0) {
    return {
      status: 'review_required',
      label: `Review flags present (${reviewFlagCount})`
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
  const validationIssues = validateDraftForClientOutput(formState, result);
  const exportWarnings: string[] = [];
  const firstPageBodyBlocks: LetterDocumentBodyBlock[] = [];
  const continuationParagraphBlocks: LetterDocumentBodyBlock[] = [];
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
      continuationParagraphBlocks.push(buildParagraphBlock(paragraph));
    }
  }

  if (closing) {
    continuationParagraphBlocks.push(buildParagraphBlock(closing));
  }

  let signoffBlock: ReturnType<typeof buildSignoffBlock> | undefined;
  if (signoffParagraph) {
    signoffBlock = buildSignoffBlock(formState, signoffParagraph);
    exportWarnings.push(...signoffBlock.warnings);
  }

  const uniqueWarnings = [...new Set(exportWarnings)];
  const pages: ComposedLetterDocument['pages'] = [
    {
      id: 'page-1',
      kind: 'first_page',
      headerBlock: buildFirstPageHeader(),
      bodyBlocks: firstPageBodyBlocks,
      footerBlock: buildFirstPageFooter()
    }
  ];

  const continuationChunks: LetterDocumentBodyBlock[][] = [];
  const chunkSize = 4;

  for (let index = 0; index < continuationParagraphBlocks.length; index += chunkSize) {
    continuationChunks.push(continuationParagraphBlocks.slice(index, index + chunkSize));
  }

  if (continuationChunks.length === 0 && signoffBlock) {
    continuationChunks.push([]);
  }

  continuationChunks.forEach((chunk, index) => {
    const isLastContinuationPage = index === continuationChunks.length - 1;
    const bodyBlocks = [...chunk];

    if (isLastContinuationPage && signoffBlock) {
      bodyBlocks.push(signoffBlock.block);
    }

    pages.push({
      id: `page-${index + 2}`,
      kind: 'continuation_page',
      headerBlock: buildContinuationHeader(formState),
      bodyBlocks,
      footerBlock: buildContinuationFooter(isLastContinuationPage ? result.archivePath : undefined)
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
    readiness: collectReadinessLabel(validationIssues.length, result.reviewFlags.length)
  };
}
