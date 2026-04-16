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

    expect(result.visibleSections).toEqual([
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
    expect(result.paragraphs.map((paragraph) => paragraph.order)).toEqual([10, 20, 30, 40, 50, 60, 80, 90, 100]);
    expect(result.paragraphs.find((paragraph) => paragraph.sectionId === 'P1')?.text).toContain(
      'has conducted an inspection of the above noted excavation'
    );
    expect(result.paragraphs.find((paragraph) => paragraph.sectionId === 'P5')?.text).toContain(
      'standard footing foundation for the attached garage'
    );
    expect(result.paragraphs.find((paragraph) => paragraph.sectionId === 'P6')).toBeUndefined();
    expect(result.filename).toContain('h38566');
    expect(result.archivePath).toContain('H:/2026/Housing/VICTORY HOMES LTD.');
    expect(result.clauseRefsUsed.some((ref) => ref.id === 'CL_000')).toBe(true);
    expect(result.ruleRefsUsed.some((ref) => ref.id === 'DT_010')).toBe(true);
  });

  it('omits the garage paragraph when no garage exists and inserts the sulphate paragraph when requested', () => {
    const formState = cloneFormState();
    formState.reportBody.garage.mode = 'none';
    formState.reportBody.sulphate = {
      includeParagraph: true,
      sulphateClass: 'moderate'
    };

    const result = generateLetter(formState);

    expect(result.visibleSections).not.toContain('P5');
    expect(result.paragraphs.find((paragraph) => paragraph.sectionId === 'P6')?.text).toContain(
      'moderate concentration of sulphates'
    );
  });

  it('attaches typed review flags to related sections instead of silently resolving ambiguous branches', () => {
    const formState = cloneFormState();
    formState.reportBody.soil.primarySoilOrigin = 'engineered_fill_unknown';
    formState.reportBody.recommendation.spreadFootingFamily = 'review_100_kpa';

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
    const visibleBody = result.paragraphs.map((paragraph) => paragraph.text).join('\n');

    expect(visibleBody).not.toContain('h38566');
    expect(result.filename).toContain('h38566');
    expect(result.archivePath).toContain('h38566');
  });

  it('derives the P2 cut range from the four recorded corner cut values', () => {
    const formState = cloneFormState();
    formState.reportBody.excavation.houseFootingCutDepthsM = {
      frontLeftM: 1.2,
      frontRightM: 1.4,
      rearLeftM: 2.0,
      rearRightM: 1.7
    };

    const result = generateLetter(formState);
    const p2Text = result.paragraphs.find((paragraph) => paragraph.sectionId === 'P2')?.text ?? '';

    expect(p2Text).toContain('1.2 to 2.0 m below the adjacent ground surface');
  });
});
