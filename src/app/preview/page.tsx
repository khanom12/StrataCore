import { LetterPreview } from '@/components/preview/letter-preview';

export default function PreviewPage() {
  return (
    <main className="shell">
      <div className="workflow-header">
        <p className="muted">Workflow step 2</p>
        <h1>Letter Preview</h1>
        <p>Review the composed draft shell, analyst trace panel, and the real DOCX export output before issue.</p>
      </div>
      <LetterPreview />
    </main>
  );
}
