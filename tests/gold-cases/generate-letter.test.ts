import { describe, expect, it } from 'vitest';

import { defaultFormState } from '@/lib/draft/default-form-state';
import { generateLetter } from '@/lib/generation/generate-letter';
import type { FormState } from '@/types/domain';

function cloneFormState(): FormState {
  return JSON.parse(JSON.stringify(defaultFormState)) as FormState;
}

describe('generateLetter', () => {
  it('builds the stable house-plus-garage path and enforces P5 derivation', () => {
    const formState = cloneFormState();
    const result = generateLetter(formState);

    expect(result.visibleSections).toEqual(['META', 'P1', 'P2', 'P3', 'P4', 'P5', 'P7', 'P8', 'SIG']);
    expect(result.paragraphs.find((paragraph) => paragraph.section === 'P1')?.text).toContain(
      'has conducted an inspection of the above noted excavation'
    );
    expect(result.paragraphs.find((paragraph) => paragraph.section === 'P5')?.text).toContain(
      'standard footing foundation for the attached garage'
    );
    expect(result.paragraphs.find((paragraph) => paragraph.section === 'P6')).toBeUndefined();
    expect(result.reviewFlags.map((flag) => flag.code)).toContain('REVIEW_SPREAD_FOOTING_DEFAULT');
    expect(result.filename).toContain('h38566');
    expect(result.archivePath).toContain('H:/2026/Housing/VICTORY HOMES LTD.');
  });

  it('omits the garage paragraph when no garage exists and inserts the sulphate paragraph when requested', () => {
    const formState = cloneFormState();
    formState.p2.garageMode = 'none';
    formState.p6 = {
      includeSulphateParagraph: true,
      sulphateClass: 'moderate'
    };

    const result = generateLetter(formState);

    expect(result.visibleSections).not.toContain('P5');
    expect(result.paragraphs.find((paragraph) => paragraph.section === 'P6')?.text).toContain(
      'moderate concentration of sulphates'
    );
  });

  it('raises review flags instead of silently resolving ambiguous engineered-fill provenance', () => {
    const formState = cloneFormState();
    formState.p3.primarySoilOrigin = 'engineered_fill_unknown';

    const result = generateLetter(formState);

    expect(result.paragraphs.find((paragraph) => paragraph.section === 'P3')?.text).toContain(
      'Engineered fill provenance is unknown'
    );
    expect(result.reviewFlags.map((flag) => flag.code)).toContain('REVIEW_ENGINEERED_FILL_UNKNOWN');
  });

  it('keeps the hidden H number out of the visible letter body while using it in filename and archive path', () => {
    const formState = cloneFormState();
    const result = generateLetter(formState);
    const visibleBody = result.paragraphs.map((paragraph) => paragraph.text).join('\n');

    expect(visibleBody).not.toContain('h38566');
    expect(result.filename).toContain('h38566');
    expect(result.archivePath).toContain('h38566');
  });
});
