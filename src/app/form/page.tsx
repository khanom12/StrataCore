import { InspectionForm } from '@/components/form/inspection-form';

export default function FormPage() {
  return (
    <main className="shell">
      <div className="workflow-header">
        <p className="muted">Workflow step 1</p>
        <h1>Form Input</h1>
        <p>Capture the structured metadata and footing-inspection inputs used by the first prototype.</p>
      </div>
      <InspectionForm />
    </main>
  );
}

