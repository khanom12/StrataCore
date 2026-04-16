import { buildSignoffModel } from '@/lib/signoff/build-signoff-model';
import { formatSignoffName } from '@/lib/signoff/engineer-registry';
import { getReportSectionDefinition, toClauseRefs, toRuleRefs } from '@/lib/seed/source-data';
import type { FormState, GeneratedParagraph, GenerationResult, SectionId } from '@/types/domain';
import type { ComposedLetterDocument, FooterBlock, HeaderBlock, LetterDocumentBodyBlock, MetadataBlock, ParagraphBlock, SignoffBlock } from '@/types/document';

function splitLines(value: string): string[] {
  return value
    .split('\n')
    .map((line) => line.trimEnd())
    .filter((line, index, lines) => line.length > 0 || (index > 0 && lines[index - 1].length > 0));
}

function buildParagraphBlock(paragraph: GeneratedParagraph): ParagraphBlock {
  return {
    id: `paragraph-${paragraph.id}`,
    kind: 'paragraph_block',
    title: paragraph.title,
    text: paragraph.text,
    sectionId: paragraph.sectionId,
    clauseRefs: paragraph.clauseRefs,
    ruleRefs: paragraph.ruleRefs,
    reviewSensitive: paragraph.reviewSensitive
  };
}

function buildMetadataBlock(paragraph: GeneratedParagraph): MetadataBlock {
  return {
    id: 'metadata-top-block',
    kind: 'metadata_block',
    title: paragraph.title,
    lines: splitLines(paragraph.text),
    sectionId: paragraph.sectionId,
    clauseRefs: paragraph.clauseRefs,
    ruleRefs: paragraph.ruleRefs
  };
}

function buildOfficeAddressBlock(): { block: MetadataBlock; warnings: string[] } {
  const definition = getReportSectionDefinition('META_01');

  return {
    block: {
      id: 'metadata-office-address',
      kind: 'metadata_block',
      title: definition?.name ?? 'Office Address Block',
      lines: ['J.R. Paine & Associates Ltd.', 'Edmonton office block placeholder', 'Exact office address lines to be confirmed.'],
      clauseRefs: toClauseRefs(['META_01']),
      ruleRefs: toRuleRefs(['DT_001'])
    },
    warnings: ['The fixed Edmonton office address block is still using a text placeholder until the exact office lines/assets are confirmed.']
  };
}

function buildFirstPageHeader(): HeaderBlock {
  return {
    id: 'header-first-page',
    kind: 'header_block',
    title: 'First-page header',
    lines: ['J.R. Paine & Associates Ltd.', 'Foundation Soil Inspection Letter', 'First-page header placeholder']
  };
}

function buildContinuationHeader(): HeaderBlock {
  return {
    id: 'header-continuation-page',
    kind: 'header_block',
    title: 'Continuation header',
    lines: ['J.R. Paine & Associates Ltd.', 'Foundation Soil Inspection Letter (continued)']
  };
}

function buildFirstPageFooter(archivePath: string): FooterBlock {
  return {
    id: 'footer-first-page',
    kind: 'footer_block',
    title: 'First-page footer',
    lines: ['First-page office footer placeholder', archivePath],
    clauseRefs: toClauseRefs(['FMT_02', 'SIG_04']),
    ruleRefs: toRuleRefs(['DT_115'])
  };
}

function buildContinuationFooter(filename: string, archivePath: string): FooterBlock {
  return {
    id: 'footer-continuation-page',
    kind: 'footer_block',
    title: 'Continuation footer',
    lines: [`Export filename: ${filename}`, archivePath],
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
      title: paragraph.title,
      organization: signoff.organization,
      lines: signoff.lines,
      engineerMemberNumberLine: signoff.signingEngineer.profile.memberNumber
        ? `Member No.: ${signoff.signingEngineer.profile.memberNumber}`
        : 'Member No.: [registry pending]',
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
  const firstPageBodySections: SectionId[] = ['P1', 'P2', 'P3', 'P4'];
  const topBlock = getParagraphBySection(result, 'TOP_BLOCK');
  const closing = getParagraphBySection(result, 'CLOSING');
  const signoffParagraph = getParagraphBySection(result, 'SIGNOFF');
  const officeAddress = buildOfficeAddressBlock();

  exportWarnings.push(...officeAddress.warnings);

  if (topBlock) {
    firstPageBodyBlocks.push(officeAddress.block);
    firstPageBodyBlocks.push(buildMetadataBlock(topBlock));
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

  exportWarnings.push('First-page and continuation footer branding remain text-only placeholders until office assets are added.');

  return {
    pages: [
      {
        id: 'page-1',
        kind: 'first_page',
        headerBlock: buildFirstPageHeader(),
        bodyBlocks: firstPageBodyBlocks,
        footerBlock: buildFirstPageFooter(result.archivePath)
      },
      {
        id: 'page-2',
        kind: 'continuation_page',
        headerBlock: buildContinuationHeader(),
        bodyBlocks: continuationBodyBlocks,
        footerBlock: buildContinuationFooter(result.filename, result.archivePath)
      }
    ],
    filename: result.filename,
    archivePath: result.archivePath,
    visibleSections: result.visibleSections,
    reviewFlags: result.reviewFlags,
    clauseRefsUsed: result.clauseRefsUsed,
    ruleRefsUsed: result.ruleRefsUsed,
    exportWarnings: [...new Set(exportWarnings)],
    readiness: collectReadinessLabel(result.reviewFlags.length, [...new Set(exportWarnings)].length)
  };
}
