import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="shell">
      <section className="hero">
        <p className="muted">StrataCore local prototype</p>
        <h1>Build and review foundation soil inspection letters in a clean two-step workflow.</h1>
        <p>
          This prototype captures structured project details, assembles the letter preview, and keeps review-sensitive wording visible for analyst sign-off.
          It is designed for desktop review, local drafting, and a Word-first export workflow.
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
          <h2>What This Prototype Shows</h2>
          <p>
            A guided form for project details, excavation observations, soil conditions, footing recommendations, and sign-off details.
          </p>
          <p>
            A client-friendly preview surface that keeps analyst review items visible instead of hiding them behind silent logic branches.
          </p>
          <p className="note">
            The core report-generation rules stay deterministic and separate from the UI so the prototype can be reviewed without changing the underlying logic.
          </p>
        </section>

        <section className="panel">
          <h2>How To Use It</h2>
          <p>1. Open the draft builder and continue with the saved local draft or load one of the sample projects.</p>
          <p>2. Review the assembled letter preview and confirm any visible review items.</p>
          <p>3. Export the DOCX when the draft is ready for office review and sign-off.</p>
        </section>
      </div>
    </main>
  );
}
