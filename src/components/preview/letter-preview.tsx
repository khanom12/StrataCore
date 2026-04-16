'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

import { composeLetterDocument } from '@/lib/document/compose-letter-document';
import { defaultFormState } from '@/lib/draft/default-form-state';
import { loadDraftState } from '@/lib/draft/storage';
import { generateLetter } from '@/lib/generation/generate-letter';
import type { FormState } from '@/types/domain';
import type { ComposedLetterPage, LetterDocumentBodyBlock } from '@/types/document';

function parseFilenameFromDisposition(headerValue: string | null, fallback: string) {
  const match = /filename="?([^"]+)"?/.exec(headerValue ?? '');
  return match?.[1] ?? fallback;
}

function renderBodyBlock(block: LetterDocumentBodyBlock) {
  switch (block.kind) {
    case 'metadata_block':
      return <div className="letter-block">{block.lines.join('\n')}</div>;
    case 'paragraph_block':
      return <div className="letter-block">{block.text}</div>;
    case 'signoff_block':
      return (
        <div className="letter-block">
          {[block.organization, '', ...block.lines.map((line) => `${line.label}: ${line.value}`), block.engineerMemberNumberLine, block.stampPlaceholderLine, block.permitToPracticeLine].join('\n')}
        </div>
      );
    case 'spacer_block':
      return <div className="letter-block">&nbsp;</div>;
    case 'trace_block':
      return null;
  }
}

function renderPage(page: ComposedLetterPage) {
  return (
    <article key={page.id} className="page-shell">
      <div className="page-chrome">
        <p className="muted">{page.kind === 'first_page' ? 'First page' : 'Continuation page'}</p>
        <div className="letter-block">{page.headerBlock.lines.join('\n')}</div>
      </div>

      {page.bodyBlocks.map((block) => (
        <section key={block.id} className="page-block">
          {renderBodyBlock(block)}
        </section>
      ))}

      <div className="page-chrome footer-block">
        <div className="letter-block">{page.footerBlock.lines.join('\n')}</div>
      </div>
    </article>
  );
}

export function LetterPreview() {
  const [draftState, setDraftState] = useState<FormState>(defaultFormState);
  const [exportMessage, setExportMessage] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const result = useMemo(() => generateLetter(draftState), [draftState]);
  const documentModel = useMemo(() => composeLetterDocument(draftState, result), [draftState, result]);

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
      <div className="preview-meta">
        <section className="preview-card">
          <h2>Export Readiness</h2>
          <p>
            <strong>Status</strong>
          </p>
          <p className="mono">{documentModel.readiness.label}</p>
          <p>
            <strong>Filename</strong>
          </p>
          <p className="mono">{documentModel.filename}</p>
          <p>
            <strong>Archive path</strong>
          </p>
          <p className="mono">{documentModel.archivePath}</p>
          <div className="button-row">
            <Link className="button secondary" href="/form">
              Back to form
            </Link>
            <button type="button" onClick={requestExport} disabled={isExporting}>
              {isExporting ? 'Generating DOCX...' : 'Download DOCX'}
            </button>
          </div>
          {exportMessage ? <div className="note"><strong>{exportMessage}</strong></div> : null}
          {documentModel.exportWarnings.length > 0 ? (
            <div className="note">
              <strong>Export warnings</strong>
              {documentModel.exportWarnings.map((warning) => (
                <p key={warning}>{warning}</p>
              ))}
            </div>
          ) : null}
        </section>

        <section className="preview-card">
          <h2>Analyst / Debug View</h2>
          <p className="mono">Sections: {documentModel.visibleSections.join(', ')}</p>
          <p className="mono">Clauses: {documentModel.clauseRefsUsed.map((ref) => ref.id).join(', ')}</p>
          <p className="mono">Rules: {documentModel.ruleRefsUsed.map((ref) => ref.id).join(', ')}</p>
          {documentModel.reviewFlags.length === 0 ? <p>No review flags were raised for this draft.</p> : null}
          {documentModel.reviewFlags.map((flag) => (
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
          ))}
        </section>
      </div>

      <section className="preview-card">
        <h2>Formatted Draft View</h2>
        {documentModel.pages.map((page) => renderPage(page))}
      </section>
    </>
  );
}
