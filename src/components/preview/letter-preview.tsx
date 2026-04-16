'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

import { composeLetterDocument } from '@/lib/document/compose-letter-document';
import { defaultFormState } from '@/lib/draft/default-form-state';
import { loadDraftState } from '@/lib/draft/storage';
import { generateLetter } from '@/lib/generation/generate-letter';
import { identifyReferenceCasePreset } from '@/lib/reference-cases';
import type { FormState } from '@/types/domain';
import type {
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
      {block.lines.map((line, index) => (
        <p key={`${block.id}-${line}-${index}`} className={index === 0 ? 'letter-header__title' : index === 1 ? 'letter-header__subtitle' : 'letter-header__cities'}>
          {line}
        </p>
      ))}
    </header>
  );
}

function ContinuationHeaderBlock({ block }: { block: HeaderBlock }) {
  return (
    <header className="continuation-header">
      {block.lines.map((line, index) => (
        <p key={`${block.id}-${line}-${index}`} className={index === 0 ? 'continuation-header__line continuation-header__line--meta' : 'continuation-header__line'}>
          {line}
        </p>
      ))}
    </header>
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
  return (
    <section className="re-block">
      <div className="re-block__label">Re:</div>
      <div className="re-block__content">
        <p className="re-block__subject">{block.subjectLine}</p>
        {(block.detailLines ?? []).map((line) => (
          <p key={`${block.id}-${line}`}>{line}</p>
        ))}
      </div>
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
      <p className="signoff-block__supporting">{block.engineerMemberNumberLine}</p>
      <p className="signoff-block__supporting">{block.stampPlaceholderLine}</p>
      <p className="signoff-block__supporting">{block.permitToPracticeLine}</p>
    </section>
  );
}

function FooterBlockView({ block }: { block: FooterBlock }) {
  return (
    <footer className="letter-footer">
      {block.offices?.length ? (
        <div className="letter-footer__offices">
          {block.offices.map((office) => (
            <div key={`${block.id}-${office.city}`} className="letter-footer__office">
              <p>{office.city}</p>
              <p>{office.phone}</p>
            </div>
          ))}
        </div>
      ) : null}
      {block.archivePathLine ? <p className="letter-footer__archive">{block.archivePathLine}</p> : null}
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

  return (
    <article className="page-shell letter-page letter-page--continuation">
      <ContinuationHeaderBlock block={page.headerBlock} />

      {paragraphs.map((block) => (
        <BodyParagraphBlock key={block.id} block={block} />
      ))}

      {signoff ? <SignoffBlockView block={signoff} /> : null}

      <FooterBlockView block={page.footerBlock} />
    </article>
  );
}

function renderPage(page: ComposedLetterPage) {
  return page.kind === 'first_page' ? <FirstPageLayout key={page.id} page={page} /> : <ContinuationPageLayout key={page.id} page={page} />;
}

const CLIENT_PRESET_LABELS: Record<string, string> = {
  'victory-homes-2026': 'Victory Homes sample project',
  'generic-happy-path': 'Generic sample project'
};

function getDraftSourceLabel(formState: FormState) {
  const matchedPreset = identifyReferenceCasePreset(formState);

  if (!matchedPreset) {
    return 'Custom local draft';
  }

  return CLIENT_PRESET_LABELS[matchedPreset.id] ?? matchedPreset.label;
}

export function LetterPreview() {
  const [draftState, setDraftState] = useState<FormState>(defaultFormState);
  const [exportMessage, setExportMessage] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const result = useMemo(() => generateLetter(draftState), [draftState]);
  const documentModel = useMemo(() => composeLetterDocument(draftState, result), [draftState, result]);
  const draftSourceLabel = useMemo(() => getDraftSourceLabel(draftState), [draftState]);
  const readinessSummary =
    documentModel.readiness.status === 'ready'
      ? 'Ready for DOCX export'
      : documentModel.readiness.status === 'warning'
        ? 'DOCX export is available with supporting notes'
        : 'Review items remain before issue';
  const reviewSummary =
    documentModel.reviewFlags.length === 0
      ? 'No items are currently flagged for analyst review.'
      : `${documentModel.reviewFlags.length} item${documentModel.reviewFlags.length === 1 ? ' requires' : ' require'} analyst review before issue.`;

  useEffect(() => {
    setDraftState(loadDraftState());
  }, []);

  async function requestExport() {
    setIsExporting(true);
    setExportMessage(null);

    try {
      const response = await fetch('/api/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(draftState)
      });

      if (!response.ok) {
        setExportMessage('Export failed. Please review the current draft warnings and try again.');
        return;
      }

      const filename = parseFilenameFromDisposition(response.headers.get('Content-Disposition'), documentModel.filename);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      setExportMessage(`Downloaded ${filename}`);
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
            <strong>{draftSourceLabel}</strong>
          </div>
          <div className="summary-item">
            <span>Export readiness</span>
            <strong>{readinessSummary}</strong>
          </div>
          <div className="summary-item">
            <span>Review status</span>
            <strong>{reviewSummary}</strong>
          </div>
        </div>
        <div className="button-row">
          <Link className="button secondary" href="/form">
            Back to form
          </Link>
          <button type="button" onClick={requestExport} disabled={isExporting}>
            {isExporting ? 'Generating DOCX...' : 'Download DOCX'}
          </button>
        </div>
        {exportMessage ? (
          <div className="note">
            <strong>{exportMessage}</strong>
          </div>
        ) : null}
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
            <strong>DOCX notes</strong>
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
