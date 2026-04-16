import type { ClauseRef, ReviewFlag, RuleRef, SectionId } from '@/types/domain';

export type DocumentPageKind = 'first_page' | 'continuation_page';
export type DocumentReadinessStatus = 'ready' | 'warning' | 'review_required';
export type DocumentAlignment = 'left' | 'center' | 'right';
export type DocumentBlockKind =
  | 'header_block'
  | 'metadata_block'
  | 'paragraph_block'
  | 'signoff_block'
  | 'footer_block'
  | 'spacer_block'
  | 'trace_block';

interface DocumentBlockBase {
  id: string;
  kind: DocumentBlockKind;
  alignment?: DocumentAlignment;
}

export interface HeaderBlock extends DocumentBlockBase {
  kind: 'header_block';
  title: string;
  lines: string[];
}

export interface MetadataBlock extends DocumentBlockBase {
  kind: 'metadata_block';
  title: string;
  lines: string[];
  sectionId?: SectionId;
  clauseRefs: ClauseRef[];
  ruleRefs: RuleRef[];
}

export interface ParagraphBlock extends DocumentBlockBase {
  kind: 'paragraph_block';
  title: string;
  text: string;
  sectionId: SectionId;
  clauseRefs: ClauseRef[];
  ruleRefs: RuleRef[];
  reviewSensitive: boolean;
}

export interface SignoffBlock extends DocumentBlockBase {
  kind: 'signoff_block';
  title: string;
  salutationLine: string;
  organization: string;
  lines: Array<{
    label: string;
    value: string;
  }>;
  engineerMemberNumberLine: string;
  stampPlaceholderLine: string;
  permitToPracticeLine: string;
  sectionId: 'SIGNOFF';
  clauseRefs: ClauseRef[];
  ruleRefs: RuleRef[];
}

export interface FooterBlock extends DocumentBlockBase {
  kind: 'footer_block';
  title: string;
  lines: string[];
  clauseRefs: ClauseRef[];
  ruleRefs: RuleRef[];
}

export interface SpacerBlock extends DocumentBlockBase {
  kind: 'spacer_block';
  size: 'small' | 'medium' | 'large';
}

export interface TraceBlock extends DocumentBlockBase {
  kind: 'trace_block';
  title: string;
  lines: string[];
}

export type LetterDocumentBodyBlock = MetadataBlock | ParagraphBlock | SignoffBlock | SpacerBlock | TraceBlock;

export interface ComposedLetterPage {
  id: string;
  kind: DocumentPageKind;
  headerBlock: HeaderBlock;
  bodyBlocks: LetterDocumentBodyBlock[];
  footerBlock: FooterBlock;
}

export interface ComposedLetterDocument {
  pages: ComposedLetterPage[];
  filename: string;
  archivePath: string;
  visibleSections: SectionId[];
  reviewFlags: ReviewFlag[];
  clauseRefsUsed: ClauseRef[];
  ruleRefsUsed: RuleRef[];
  exportWarnings: string[];
  readiness: {
    status: DocumentReadinessStatus;
    label: string;
  };
}
