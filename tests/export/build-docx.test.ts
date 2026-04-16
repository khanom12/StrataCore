import { describe, expect, it } from 'vitest';

import { composeLetterDocument } from '@/lib/document/compose-letter-document';
import { defaultFormState } from '@/lib/draft/default-form-state';
import { buildDocx } from '@/lib/export/build-docx';
import { generateLetter } from '@/lib/generation/generate-letter';
import type { FormState } from '@/types/domain';

function cloneFormState(): FormState {
  return JSON.parse(JSON.stringify(defaultFormState)) as FormState;
}

describe('buildDocx', () => {
  it('returns a real DOCX byte payload for the composed letter document', async () => {
    const formState = cloneFormState();
    const result = generateLetter(formState);
    const document = composeLetterDocument(formState, result);
    const docx = await buildDocx(document);

    expect(docx.contentType).toBe('application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    expect(docx.filename).toBe('h38566vic.docx');
    expect(docx.buffer.byteLength).toBeGreaterThan(100);
    expect(docx.buffer[0]).toBe(0x50);
    expect(docx.buffer[1]).toBe(0x4b);
  });
});
