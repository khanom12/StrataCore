import { describe, expect, it } from 'vitest';

import { defaultFormState } from '@/lib/draft/default-form-state';
import { generateLetter } from '@/lib/generation/generate-letter';
import type { FormState } from '@/types/domain';

function cloneFormState(): FormState {
  return JSON.parse(JSON.stringify(defaultFormState)) as FormState;
}

describe('generateLetter', () => {
  it('returns a normalized GenerationResult for the current happy path', () => {
    const formState = cloneFormState();
    const result = generateLetter(formState);

    expect(result.visibleSectionIds).toEqual([
      'TOP_BLOCK',
      'P1',
      'P2',
      'P3',
      'P4',
      'P5',
      'P7',
      'CLOSING',
      'SIGNOFF'
    ]);
    expect(result.orderedParagraphs.map((paragraph) => paragraph.order)).toEqual([10, 20, 30, 40, 50, 60, 80, 90, 100]);
    expect(result.orderedParagraphs.find((paragraph) => paragraph.sectionId === 'P1')?.text).toContain(
      'has conducted an inspection of the above noted excavation'
    );
    expect(result.orderedParagraphs.find((paragraph) => paragraph.sectionId === 'P5')?.text).toContain(
      'standard footing foundation for the attached garage'
    );
    expect(result.orderedParagraphs.find((paragraph) => paragraph.sectionId === 'P6')).toBeUndefined();
    expect(result.filename).toContain('h38566');
    expect(result.archivePath).toContain('H:/2026/Housing/VICTORY HOMES LTD.');
    expect(result.clauseRefsUsed.some((ref) => ref.id === 'CL_000')).toBe(true);
    expect(result.ruleRefsUsed.some((ref) => ref.id === 'DT_010')).toBe(true);
  });

  it('omits the garage paragraph when no garage exists and inserts the sulphate paragraph when requested', () => {
    const formState = cloneFormState();
    formState.reportBody.excavation.garageMode = 'none';
    formState.reportBody.sulphate = {
      includeParagraph: true,
      sulphateClass: 'moderate'
    };

    const result = generateLetter(formState);

    expect(result.visibleSectionIds).not.toContain('P5');
    expect(result.orderedParagraphs.find((paragraph) => paragraph.sectionId === 'P6')?.text).toContain(
      'moderate concentration of sulphates'
    );
  });

  it('attaches typed review flags to related sections instead of silently resolving ambiguous branches', () => {
    const formState = cloneFormState();
    formState.reportBody.soil.primarySoilOrigin = 'engineered_fill_unknown';
    formState.reportBody.recommendations.spreadFootingFamily = 'review_100_kpa';

    const result = generateLetter(formState);
    const soilFlag = result.reviewFlags.find((flag) => flag.id === 'review-engineered-fill-unknown');
    const footingFlag = result.reviewFlags.find((flag) => flag.id === 'review-spread-footing-alt');

    expect(soilFlag?.relatedSectionId).toBe('P3');
    expect(soilFlag?.clauseRefs.map((ref) => ref.id)).toEqual(['CL_030', 'CL_037']);
    expect(soilFlag?.ruleRefs.map((ref) => ref.id)).toEqual(['DT_056']);
    expect(footingFlag?.relatedSectionId).toBe('P4');
    expect(footingFlag?.clauseRefs.map((ref) => ref.id)).toEqual(['CL_046']);
    expect(footingFlag?.ruleRefs.map((ref) => ref.id)).toEqual(['DT_076']);
  });

  it('keeps the hidden H number out of visible letter paragraphs while using it in filename and archive path', () => {
    const formState = cloneFormState();
    const result = generateLetter(formState);
    const visibleBody = result.orderedParagraphs.map((paragraph) => paragraph.text).join('\n');

    expect(visibleBody).not.toContain('h38566');
    expect(result.filename).toContain('h38566');
    expect(result.archivePath).toContain('h38566');
  });
});

