'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

import { defaultFormState } from '@/lib/draft/default-form-state';
import { loadDraftState } from '@/lib/draft/storage';
import { generateLetter } from '@/lib/generation/generate-letter';
import type { DocxExportStub } from '@/lib/export/build-docx';
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
            <div key={flag.code} className="flag">
              <strong>{flag.code}</strong>
              <p>{flag.message}</p>
              <p className="mono">
                Rules: {(flag.sourceRuleIds ?? []).join(', ') || 'n/a'} | Clauses:{' '}
                {(flag.sourceClauseIds ?? []).join(', ') || 'n/a'}
              </p>
            </div>
          ))}
        </section>
      </div>

      <section className="preview-card">
        <h2>Letter Draft</h2>
        {result.paragraphs.map((paragraph) => (
          <article key={paragraph.id} className="section-card">
            <p className="muted">
              {paragraph.section} {paragraph.needsReview ? '• review-sensitive' : ''}
            </p>
            <h3>{paragraph.title}</h3>
            <div className="letter-block">{paragraph.text}</div>
            <div className="trace-list">
              {paragraph.clauseIds.map((clauseId) => (
                <span key={`${paragraph.id}-${clauseId}`} className="trace-pill">
                  {clauseId}
                </span>
              ))}
            </div>
          </article>
        ))}
      </section>

      <section className="preview-card">
        <h2>Clause / Rule Trace</h2>
        <p className="mono">Sections: {result.visibleSections.join(', ')}</p>
        <p className="mono">Clauses: {result.clauseIds.join(', ')}</p>
        <p className="mono">Rules: {result.ruleIds.join(', ')}</p>
      </section>
    </>
  );
}
