import type { FormState } from '@/types/domain';

export interface DocxExportStub {
  status: 'not_implemented';
  message: string;
  nextStep: string;
  requestedFileNumber: string;
}

export function buildDocx(_formState: FormState): DocxExportStub {
  return {
    status: 'not_implemented',
    message: 'DOCX export is intentionally stubbed in this first prototype.',
    nextStep: 'Connect the pure GenerationResult output to a Word template merge once the paragraph set is approved.',
    requestedFileNumber: _formState.topBlock.fileNumber
  };
}
