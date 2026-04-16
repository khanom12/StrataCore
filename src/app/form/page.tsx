import { InspectionForm } from '@/components/form/inspection-form';

export default function FormPage() {
  return (
    <main className="shell">
      <div className="workflow-header">
        <p className="muted">Workflow step 1</p>
        <h1>Build the draft</h1>
        <p>Enter the project details, site observations, and recommendations that shape the first-pass letter.</p>
      </div>
      <InspectionForm />
    </main>
  );
}
