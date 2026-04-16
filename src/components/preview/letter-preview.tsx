'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

import type { DocxExportStub } from '@/lib/export/build-docx';
import { defaultFormState } from '@/lib/draft/default-form-state';
import { loadDraftState } from '@/lib/draft/storage';
import { generateLetter } from '@/lib/generation/generate-letter';
import type { FormState } from '@/types/domain';

export function LetterPreview() {
  const [draftState, setDraftState] = useState<FormState>(defaultFormState);
  const [exportMessage, setExportMessage] = useState<DocxExportStub | null>(null);
  const result = useMemo(() => generateLetter(draftState), [draftState]);

  useEffect(() => {
    setDraftState(loadDraftState());
  }, []);

  async function requestExportStub() {
    const response = await fetch('/api/export', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(draftState)
    });

    const payload = (await response.json()) as DocxExportStub;
    setExportMessage(payload);
  }

  return (
    <>
      <div className="preview-meta">
        <section className="preview-card">
          <h2>Derived Output</h2>
          <p>
            <strong>Filename</strong>
          </p>
          <p className="mono">{result.filename}</p>
          <p>
            <strong>Archive path</strong>
          </p>
          <p className="mono">{result.archivePath}</p>
          <div className="button-row">
            <Link className="button secondary" href="/form">
              Back to form
            </Link>
            <button type="button" onClick={requestExportStub}>
              Run export stub
            </button>
          </div>
          {exportMessage ? (
            <div className="note">
              <strong>{exportMessage.message}</strong>
              <p>{exportMessage.nextStep}</p>
            </div>
          ) : null}
        </section>

        <section className="preview-card">
          <h2>Review Panel</h2>
          {result.reviewFlags.length === 0 ? <p>No review flags were raised for this draft.</p> : null}
          {result.reviewFlags.map((flag) => (
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
        <h2>Letter Draft</h2>
        {result.orderedParagraphs.map((paragraph) => (
          <article key={paragraph.id} className="section-card">
            <p className="muted">
              {paragraph.sectionId} {paragraph.reviewSensitive ? '• review-sensitive' : ''}
            </p>
            <h3>{paragraph.label ?? paragraph.sectionId}</h3>
            <div className="letter-block">{paragraph.text}</div>
            <div className="trace-list">
              {paragraph.clauseRefs.map((clauseRef) => (
                <span key={`${paragraph.id}-${clauseRef.id}`} className="trace-pill">
                  {clauseRef.id}
                </span>
              ))}
              {paragraph.ruleRefs.map((ruleRef) => (
                <span key={`${paragraph.id}-${ruleRef.id}`} className="trace-pill">
                  {ruleRef.id}
                </span>
              ))}
            </div>
          </article>
        ))}
      </section>

      <section className="preview-card">
        <h2>Clause / Rule Trace</h2>
        <p className="mono">Sections: {result.visibleSectionIds.join(', ')}</p>
        <p className="mono">Clauses: {result.clauseRefsUsed.map((ref) => ref.id).join(', ')}</p>
        <p className="mono">Rules: {result.ruleRefsUsed.map((ref) => ref.id).join(', ')}</p>
      </section>
    </>
  );
}
