import { LetterPreview } from '@/components/preview/letter-preview';

export default function PreviewPage() {
  return (
    <main className="shell">
      <div className="workflow-header">
        <p className="muted">Workflow step 2</p>
        <h1>Letter Preview</h1>
        <p>Preview the assembled draft, review flags, clause/rule trace, and the derived archive output.</p>
      </div>
      <LetterPreview />
    </main>
  );
}

