import type { ClauseRef, ReviewFlag, RuleRef, SectionId, ValidationIssue } from '@/types/domain';

export type DocumentPageKind = 'first_page' | 'continuation_page';
export type DocumentReadinessStatus = 'ready' | 'review_required' | 'blocked';
export type DocumentAlignment = 'left' | 'center' | 'right';
export type HeaderBlockRole = 'first_page_identity' | 'continuation_subject';
export type MetadataBlockRole = 'office_address' | 'date_file' | 'client_address' | 're_block';
export type ParagraphBlockRole = 'body' | 'closing';
export type FooterBlockRole = 'office_contacts' | 'continuation_footer';
export type DocumentBlockKind =
  | 'header_block'
  | 'metadata_block'
  | 'paragraph_block'
  | 'archive_path_block'
  | 'signoff_block'
  | 'footer_block'
  | 'spacer_block'
  | 'trace_block';

interface DocumentBlockBase {
  id: string;
  kind: DocumentBlockKind;
  alignment?: DocumentAlignment;
}

export interface LogoAssetMetadata {
  publicPath: string;
  filePath: string;
  widthPx: number;
  heightPx: number;
  altText: string;
}

export interface ReBlockLayoutMetadata {
  label: string;
  leadTabCount: number;
  detailTabCount: number;
  tabStopTwips: number[];
  previewHeadlineIndentPx: number;
  previewLabelWidthPx: number;
  previewDetailIndentPx: number;
}

export interface HeaderBlock extends DocumentBlockBase {
  kind: 'header_block';
  role: HeaderBlockRole;
  title: string;
  lines: string[];
  subjectLine?: string;
  fileNumberLine?: string;
  pageNumberText?: string;
  logoAsset?: LogoAssetMetadata;
}

export interface MetadataBlock extends DocumentBlockBase {
  kind: 'metadata_block';
  role: MetadataBlockRole;
  title: string;
  lines: string[];
  dateLine?: string;
  fileNumberLine?: string;
  subjectLine?: string;
  reLabel?: string;
  detailLines?: string[];
  reLayout?: ReBlockLayoutMetadata;
  emphasisLineIndexes?: number[];
  sectionId?: SectionId;
  clauseRefs: ClauseRef[];
  ruleRefs: RuleRef[];
}

export interface ParagraphBlock extends DocumentBlockBase {
  kind: 'paragraph_block';
  role: ParagraphBlockRole;
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
  engineerMemberNumberLine?: string;
  sectionId: 'SIGNOFF';
  clauseRefs: ClauseRef[];
  ruleRefs: RuleRef[];
}

export interface ArchivePathBlock extends DocumentBlockBase {
  kind: 'archive_path_block';
  text: string;
}

export interface FooterBlock extends DocumentBlockBase {
  kind: 'footer_block';
  role: FooterBlockRole;
  title: string;
  lines: string[];
  continuationMarkerLine?: string;
  offices?: Array<{
    city: string;
    phone: string;
  }>;
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

export type LetterDocumentBodyBlock = MetadataBlock | ParagraphBlock | ArchivePathBlock | SignoffBlock | SpacerBlock | TraceBlock;

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
  validationIssues: ValidationIssue[];
  readiness: {
    status: DocumentReadinessStatus;
    label: string;
  };
}
