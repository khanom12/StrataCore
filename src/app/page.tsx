import Link from 'next/link';

import { getSeedSummary } from '@/lib/seed/source-data';

export default function HomePage() {
  const summary = getSeedSummary();
  const autoScope = summary.scopeItems.filter((item) => item.support === 'AUTO').length;
  const reviewScope = summary.scopeItems.filter((item) => item.support.includes('REVIEW')).length;

  return (
    <main className="shell">
      <section className="hero">
        <p className="muted">StrataCore local prototype</p>
        <h1>Foundation soil inspection letters, scaffolded around the repo&apos;s seed rules.</h1>
        <p>
          This first runnable slice keeps the app desktop-first, local-first, and intentionally plain. The
          workflow uses the in-repo seed files for clause families, stable AUTO scope, and visible review
          flags where the source material is still unresolved. The current default draft is pinned to the
          Victory Homes 2026 issued example, and a generic smoke-check preset can be loaded from the form.
        </p>
        <div className="action-row">
          <Link className="button" href="/form">
            Start a draft
          </Link>
          <Link className="button secondary" href="/preview">
            Open preview
          </Link>
        </div>
      </section>

      <div className="grid-two">
        <section className="panel">
          <h2>Repo-State Summary</h2>
          <p>
            Seed inventory: <strong>{summary.clauseCount}</strong> clauses, <strong>{summary.ruleCount}</strong>{' '}
            rules, and <strong>{summary.reviewDecisionCount}</strong> tracked review decisions.
          </p>
          <p>
            V1 source shape: <strong>{autoScope}</strong> AUTO capability families and <strong>{reviewScope}</strong>{' '}
            REVIEW-sensitive families are already documented in the repo.
          </p>
          <p className="note">
            This prototype implements the normal letter path first, keeps business rules in pure TypeScript,
            and leaves review-sensitive branches visible instead of silently baking them into the UI.
          </p>
        </section>

        <section className="panel">
          <h2>Workflow Shape</h2>
          <p>1. Load the Victory Homes reference case or the generic happy path from the form page.</p>
          <p>2. Review the assembled letter preview, clause trace, filename, archive path, and warnings.</p>
          <p>3. Review the composed letter shell on the preview page and download the first-pass DOCX export.</p>
        </section>
      </div>
    </main>
  );
}
