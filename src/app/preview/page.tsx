import { LetterPreview } from '@/components/preview/letter-preview';

export default function PreviewPage() {
  return (
    <main className="shell">
      <div className="workflow-header">
        <p className="muted">Workflow step 2</p>
        <h1>Review the draft</h1>
        <p>Check the assembled letter, confirm any review items, and export the DOCX when the draft is ready.</p>
      </div>
      <LetterPreview />
    </main>
  );
}
