'use client';

import { useEffect, useMemo, useState } from 'react';

import { composeLetterDocument } from '@/lib/document/compose-letter-document';
import { defaultFormState } from '@/lib/draft/default-form-state';
import { describeDraftSource } from '@/lib/draft/draft-source';
import { loadDraftSessionState, type DraftSessionState } from '@/lib/draft/draft-session';
import { loadDraftState } from '@/lib/draft/storage';
import { getFieldPathHash } from '@/lib/form/field-paths';
import { generateLetter } from '@/lib/generation/generate-letter';
import type { FormState } from '@/types/domain';
import type {
  ArchivePathBlock,
  ComposedLetterPage,
  FooterBlock,
  HeaderBlock,
  LetterDocumentBodyBlock,
  MetadataBlock,
  ParagraphBlock,
  SignoffBlock
} from '@/types/document';

function parseFilenameFromDisposition(headerValue: string | null, fallback: string) {
  const match = /filename="?([^"]+)"?/.exec(headerValue ?? '');
  return match?.[1] ?? fallback;
}

function splitMarkerLine(value?: string) {
  if (!value) {
    return { left: '', right: '' };
  }

  const [left, right] = value.split('\t');
  return { left, right: right ?? '' };
}

function getMetadataBlock(page: ComposedLetterPage, role: MetadataBlock['role']) {
  return page.bodyBlocks.find((block): block is MetadataBlock => block.kind === 'metadata_block' && block.role === role);
}

function getParagraphBlocks(page: ComposedLetterPage) {
  return page.bodyBlocks.filter((block): block is ParagraphBlock => block.kind === 'paragraph_block');
}

function getSignoffBlock(page: ComposedLetterPage) {
  return page.bodyBlocks.find((block): block is SignoffBlock => block.kind === 'signoff_block');
}

function FirstPageHeaderBlock({ block }: { block: HeaderBlock }) {
  return (
    <header className="letter-header letter-header--first">
      <div className="letter-header__logo-panel">
        {block.logoAsset ? <img className="letter-header__logo" src={block.logoAsset.publicPath} alt={block.logoAsset.altText} /> : null}
      </div>
      <div className="letter-header__identity">
        {block.lines.map((line, index) => (
          <p key={`${block.id}-${line}-${index}`} className={index === 0 ? 'letter-header__title' : index === 1 ? 'letter-header__subtitle' : 'letter-header__cities'}>
            {line}
          </p>
        ))}
      </div>
    </header>
  );
}

function ContinuationHeaderBlock({ block }: { block: HeaderBlock }) {
  return (
    <header className="continuation-header">
      <p className="continuation-header__line continuation-header__line--company">{block.lines[0]}</p>
      {block.pageNumberText ? <p className="continuation-page-number">{block.pageNumberText}</p> : null}
    </header>
  );
}

function ArchivePathBlockView({ block }: { block: ArchivePathBlock }) {
  return (
    <section className="archive-path-block">
      <p>{block.text}</p>
    </section>
  );
}

function ContinuationFooterBlock({ block }: { block: FooterBlock }) {
  const marker = splitMarkerLine(block.continuationMarkerLine);

  return (
    <footer className="letter-footer letter-footer--continuation">
      <p className="letter-footer__continuation-marker">
        <span>{marker.left}</span>
        <span>{marker.right}</span>
      </p>
    </footer>
  );
}

function OfficeAddressBlock({ block }: { block: MetadataBlock }) {
  return (
    <section className="office-address-block">
      {block.lines.map((line) => (
        <p key={`${block.id}-${line}`}>{line}</p>
      ))}
    </section>
  );
}

function DateAndFileNumberBlock({ block }: { block: MetadataBlock }) {
  return (
    <section className="date-file-block">
      <p>{block.dateLine ?? block.lines[0]}</p>
      <p>{block.fileNumberLine ?? block.lines[1]}</p>
    </section>
  );
}

function ClientAddressBlock({ block }: { block: MetadataBlock }) {
  return (
    <section className="client-address-block">
      {block.lines.map((line, index) => (
        <p key={`${block.id}-${line}-${index}`} className={block.emphasisLineIndexes?.includes(index) ? 'client-address-block__name' : undefined}>
          {line}
        </p>
      ))}
    </section>
  );
}

function ReBlock({ block }: { block: MetadataBlock }) {
  const reStyle = {
    ['--re-headline-indent' as string]: `${block.reLayout?.previewHeadlineIndentPx ?? 22}px`,
    ['--re-label-width' as string]: `${block.reLayout?.previewLabelWidthPx ?? 54}px`,
    ['--re-detail-indent' as string]: `${block.reLayout?.previewDetailIndentPx ?? 96}px`
  };

  return (
    <section className="re-block" style={reStyle}>
      <p className="re-block__headline">
        <span className="re-block__label">{block.reLabel ?? 'Re:'}</span>
        <span className="re-block__subject">{block.subjectLine}</span>
      </p>
      {(block.detailLines ?? []).map((line) => (
        <p key={`${block.id}-${line}`} className="re-block__detail">
          {line}
        </p>
      ))}
    </section>
  );
}

function BodyParagraphBlock({ block }: { block: ParagraphBlock }) {
  return (
    <section className={`body-paragraph-block ${block.role === 'closing' ? 'body-paragraph-block--closing' : ''}`}>
      <p>{block.text}</p>
    </section>
  );
}

function SignoffBlockView({ block }: { block: SignoffBlock }) {
  return (
    <section className="signoff-block">
      <p>{block.salutationLine}</p>
      <p className="signoff-block__organization">{block.organization}</p>
      {block.lines.map((line) => (
        <div key={`${block.id}-${line.label}-${line.value}`} className="signoff-block__line-group">
          <p className="signoff-block__label">{line.label}</p>
          <p className="signoff-block__value">{line.value}</p>
        </div>
      ))}
      {block.engineerMemberNumberLine ? <p className="signoff-block__supporting">{block.engineerMemberNumberLine}</p> : null}
    </section>
  );
}

function FooterBlockView({ block }: { block: FooterBlock }) {
  if (block.role === 'continuation_footer') {
    return <ContinuationFooterBlock block={block} />;
  }

  return (
    <footer className="letter-footer letter-footer--office">
      {block.offices?.length ? (
        <table className="letter-footer__office-table">
          <tbody>
            <tr>
              {block.offices.map((office) => (
                <td key={`${block.id}-${office.city}-city`}>{office.city}</td>
              ))}
            </tr>
            <tr>
              {block.offices.map((office) => (
                <td key={`${block.id}-${office.city}-phone`}>{office.phone}</td>
              ))}
            </tr>
          </tbody>
        </table>
      ) : null}
    </footer>
  );
}

function FirstPageLayout({ page }: { page: ComposedLetterPage }) {
  const officeAddress = getMetadataBlock(page, 'office_address');
  const dateFile = getMetadataBlock(page, 'date_file');
  const clientAddress = getMetadataBlock(page, 'client_address');
  const reBlock = getMetadataBlock(page, 're_block');
  const paragraphs = getParagraphBlocks(page);

  return (
    <article className="page-shell letter-page">
      <FirstPageHeaderBlock block={page.headerBlock} />

      <div className="first-page-meta">
        <div />
        <div className="first-page-meta__right">
          {officeAddress ? <OfficeAddressBlock block={officeAddress} /> : null}
          {dateFile ? <DateAndFileNumberBlock block={dateFile} /> : null}
        </div>
      </div>

      {clientAddress ? <ClientAddressBlock block={clientAddress} /> : null}
      {reBlock ? <ReBlock block={reBlock} /> : null}

      {paragraphs.map((block) => (
        <BodyParagraphBlock key={block.id} block={block} />
      ))}

      <FooterBlockView block={page.footerBlock} />
    </article>
  );
}

function ContinuationPageLayout({ page }: { page: ComposedLetterPage }) {
  const signoff = getSignoffBlock(page);
  const paragraphs = getParagraphBlocks(page);
  const archivePath = page.bodyBlocks.find((block): block is ArchivePathBlock => block.kind === 'archive_path_block');

  return (
    <article className="page-shell letter-page letter-page--continuation">
      <div className="continuation-header-shell">
        <ContinuationHeaderBlock block={page.headerBlock} />
      </div>

      {paragraphs.map((block) => (
        <BodyParagraphBlock key={block.id} block={block} />
      ))}

      {signoff ? <SignoffBlockView block={signoff} /> : null}
      {archivePath ? <ArchivePathBlockView block={archivePath} /> : null}

      <FooterBlockView block={page.footerBlock} />
    </article>
  );
}

function renderPage(page: ComposedLetterPage) {
  return page.kind === 'first_page' ? (
    <FirstPageLayout key={page.id} page={page} />
  ) : (
    <ContinuationPageLayout key={page.id} page={page} />
  );
}

export function LetterPreview() {
  const [draftState, setDraftState] = useState<FormState>(defaultFormState);
  const [draftSession, setDraftSession] = useState<DraftSessionState>({});
  const [exportFeedback, setExportFeedback] = useState<{
    status: 'success' | 'error';
    title: string;
    detail?: string;
    archivePath?: string;
  } | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const result = useMemo(() => generateLetter(draftState), [draftState]);
  const documentModel = useMemo(() => composeLetterDocument(draftState, result), [draftState, result]);
  const draftSource = useMemo(() => describeDraftSource(draftState, draftSession), [draftSession, draftState]);
  const readinessSummary =
    documentModel.readiness.status === 'ready'
      ? 'Ready for DOCX export'
      : documentModel.readiness.status === 'blocked'
        ? 'Export is blocked until required fields are completed'
        : 'Review items remain before issue';
  const reviewSummary =
    documentModel.reviewFlags.length === 0
      ? 'No items are currently flagged for analyst review.'
      : `${documentModel.reviewFlags.length} item${documentModel.reviewFlags.length === 1 ? ' requires' : ' require'} analyst review before issue.`;
  const validationSummary =
    documentModel.validationIssues.length === 0
      ? 'No blocking draft issues are currently present.'
      : `${documentModel.validationIssues.length} blocking issue${documentModel.validationIssues.length === 1 ? ' is' : 's are'} preventing export.`;
  const firstBlockingIssue = documentModel.validationIssues[0];
  const repairHref = firstBlockingIssue?.fieldPath ? `/form${getFieldPathHash(firstBlockingIssue.fieldPath)}` : '/form#workflow-status';

  useEffect(() => {
    setDraftState(loadDraftState());
    setDraftSession(loadDraftSessionState());
  }, []);

  async function requestExport() {
    setIsExporting(true);
    setExportFeedback(null);

    try {
      const response = await fetch('/api/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(draftState)
      });

      if (!response.ok) {
        try {
          const payload = (await response.json()) as { message?: string };
          setExportFeedback({
            status: 'error',
            title: payload.message ?? 'Export failed. Please review the current draft warnings and try again.',
            detail: 'Return to the form to resolve the active blocking issues. Your draft remains saved locally.'
          });
        } catch {
          setExportFeedback({
            status: 'error',
            title: 'Export failed. Please review the current draft warnings and try again.',
            detail: 'Return to the form to resolve the active blocking issues. Your draft remains saved locally.'
          });
        }
        return;
      }

      const filename = parseFilenameFromDisposition(response.headers.get('Content-Disposition'), documentModel.filename);
      const archivePath = response.headers.get('X-StrataCore-Archive-Path') ?? documentModel.archivePath;
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      setExportFeedback({
        status: 'success',
        title: 'DOCX export completed',
        detail: filename,
        archivePath
      });
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <>
      <section className="preview-card">
        <div className="section-heading">
          <p className="muted">Preview summary</p>
          <h2>Draft overview</h2>
          <p className="section-intro">Review the current draft status, then inspect the assembled letter below.</p>
        </div>
        <div className="summary-grid">
          <div className="summary-item">
            <span>Draft source</span>
            <strong>{draftSource.label}</strong>
          </div>
          <div className="summary-item">
            <span>Export readiness</span>
            <strong>{readinessSummary}</strong>
          </div>
          <div className="summary-item">
            <span>Review status</span>
            <strong>{reviewSummary}</strong>
          </div>
          <div className="summary-item">
            <span>Blocking issues</span>
            <strong>{validationSummary}</strong>
          </div>
        </div>
        <div className="button-row">
          <a className="button secondary" href={repairHref}>
            {documentModel.readiness.status === 'blocked' ? 'Back to form to fix issues' : 'Back to form'}
          </a>
          <button type="button" onClick={requestExport} disabled={isExporting || documentModel.readiness.status === 'blocked'}>
            {isExporting ? 'Generating DOCX...' : 'Download DOCX'}
          </button>
        </div>
        {exportFeedback ? (
          <div className={`status-banner status-banner--${exportFeedback.status === 'success' ? 'success' : 'blocked'}`}>
            <strong>{exportFeedback.title}</strong>
            {exportFeedback.detail ? <p>{exportFeedback.detail}</p> : null}
            {exportFeedback.archivePath ? <p>Archive location: {exportFeedback.archivePath}</p> : null}
          </div>
        ) : null}
      </section>

      <section className="preview-card">
        <div className="section-heading">
          <p className="muted">Readiness panel</p>
          <h2>Blocking issues</h2>
          <p className="section-intro">Preview can continue, but export stays blocked until these active draft issues are resolved.</p>
        </div>
        {documentModel.validationIssues.length === 0 ? (
          <div className="note">
            <strong>No blocking issues are currently preventing export.</strong>
          </div>
        ) : (
          documentModel.validationIssues.map((issue) => (
            <div key={issue.id} className="flag">
              <strong>{issue.title}</strong>
              <p>{issue.message}</p>
              {issue.fieldPath ? (
                <p className="mono">
                  Field: {issue.fieldPath} | <a href={`/form${getFieldPathHash(issue.fieldPath)}`}>Jump back to form</a>
                </p>
              ) : null}
            </div>
          ))
        )}
      </section>

      <section className="preview-card">
        <div className="section-heading">
          <p className="muted">Review panel</p>
          <h2>Items to review</h2>
          <p className="section-intro">The draft continues to generate even when wording still needs analyst review.</p>
        </div>
        {documentModel.reviewFlags.length === 0 ? (
          <div className="note">
            <strong>No review items are currently flagged.</strong>
          </div>
        ) : (
          documentModel.reviewFlags.map((flag) => (
            <div key={flag.id} className="flag">
              <strong>
                {flag.title} ({flag.severity})
              </strong>
              <p>{flag.message}</p>
              <p className="mono">
                Section: {flag.relatedSectionId ?? 'n/a'} | Rules: {flag.ruleRefs.map((ref) => ref.id).join(', ') || 'n/a'} | Clauses:{' '}
                {flag.clauseRefs.map((ref) => ref.id).join(', ') || 'n/a'}
              </p>
            </div>
          ))
        )}
      </section>

      <section className="preview-card">
        <div className="section-heading">
          <p className="muted">Letter output</p>
          <h2>Letter preview</h2>
        </div>
        {documentModel.pages.map((page) => renderPage(page))}
      </section>

      <details className="preview-card internal-details">
        <summary>
          <strong>Internal details</strong>
        </summary>
        <div className="summary-grid">
          <div className="summary-item">
            <span>Filename</span>
            <strong className="mono">{documentModel.filename}</strong>
          </div>
          <div className="summary-item">
            <span>Archive path</span>
            <strong className="mono">{documentModel.archivePath}</strong>
          </div>
        </div>
        {documentModel.exportWarnings.length > 0 ? (
          <div className="note">
            <strong>Internal signoff and asset notes</strong>
            {documentModel.exportWarnings.map((warning) => (
              <p key={warning}>{warning}</p>
            ))}
          </div>
        ) : null}
        <p className="mono">Sections: {documentModel.visibleSections.join(', ')}</p>
        <p className="mono">Clauses: {documentModel.clauseRefsUsed.map((ref) => ref.id).join(', ')}</p>
        <p className="mono">Rules: {documentModel.ruleRefsUsed.map((ref) => ref.id).join(', ')}</p>
      </details>
    </>
  );
}
