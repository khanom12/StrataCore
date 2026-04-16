import { describe, expect, it } from 'vitest';

import { generateLetter } from '@/lib/generation/generate-letter';
import { genericHappyPath } from '@/lib/reference-cases/generic-happy-path';
import { victoryHomes2026IssuedExample } from '@/lib/reference-cases/victory-homes-2026';
import type { FormState } from '@/types/domain';

function cloneFormState(formState: FormState): FormState {
  return JSON.parse(JSON.stringify(formState)) as FormState;
}

describe('generateLetter', () => {
  it('returns the expected normalized GenerationResult for the Victory Homes 2026 reference case', () => {
    const result = generateLetter(cloneFormState(victoryHomes2026IssuedExample));
    const topBlockText = result.paragraphs.find((paragraph) => paragraph.sectionId === 'TOP_BLOCK')?.text ?? '';
    const p1Text = result.paragraphs.find((paragraph) => paragraph.sectionId === 'P1')?.text ?? '';

    expect(result.visibleSections).toEqual(['TOP_BLOCK', 'P1', 'P2', 'P3', 'P4', 'P7', 'CLOSING', 'SIGNOFF']);
    expect(result.paragraphs.find((paragraph) => paragraph.sectionId === 'P5')).toBeUndefined();
    expect(result.paragraphs.find((paragraph) => paragraph.sectionId === 'P6')).toBeUndefined();
    expect(topBlockText).toContain('February 4, 2026');
    expect(p1Text).toContain('January 28, 2026');
    expect(result.filename).toBe('h38566vic.docx');
    expect(result.archivePath).toBe('H:\\DATA 2026\\00 Housing 2026\\5478 - 1 VICTORY HOMES LTD.\\h38566vic.docx');
    expect(result.clauseRefsUsed.some((ref) => ref.id === 'CL_007')).toBe(true);
    expect(result.ruleRefsUsed.some((ref) => ref.id === 'DT_051')).toBe(true);
  });

  it('keeps the generic happy path garage paragraph active for smoke-check use', () => {
    const result = generateLetter(cloneFormState(genericHappyPath));

    expect(result.visibleSections).toContain('P5');
    expect(result.paragraphs.find((paragraph) => paragraph.sectionId === 'P5')?.text).toContain(
      'standard footing foundation for the attached garage'
    );
  });

  it('omits the garage paragraph when no garage exists and inserts the sulphate paragraph when requested', () => {
    const formState = cloneFormState(genericHappyPath);
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
    const formState = cloneFormState(genericHappyPath);
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
    const result = generateLetter(cloneFormState(victoryHomes2026IssuedExample));
    const visibleBody = result.paragraphs.map((paragraph) => paragraph.text).join('\n');

    expect(visibleBody).not.toContain('h38566');
    expect(result.filename).toContain('h38566');
    expect(result.archivePath).toContain('h38566');
  });

  it('derives the P2 cut range from the four recorded corner cut values', () => {
    const formState = cloneFormState(genericHappyPath);
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

  it('adds oversized trench remediation to P4 and switches the recommendation to conditional adequacy wording', () => {
    const formState = cloneFormState(genericHappyPath);
    formState.reportBody.excavation.oversizedTrenchMode = 'reinforcement';
    formState.reportBody.excavation.trenchLocation = 'front_left';

    const result = generateLetter(formState);
    const p3aText = result.paragraphs.find((paragraph) => paragraph.sectionId === 'P3A')?.text ?? '';
    const p4Text = result.paragraphs.find((paragraph) => paragraph.sectionId === 'P4')?.text ?? '';

    expect(p3aText).toContain('oversized cut in the service trench');
    expect(p3aText).toContain('front garage footing should be reinforced');
    expect(p4Text).toContain('would then be considered adequate');
    expect(result.visibleSections).toContain('P3A');
  });

  it('adds frost reinforcement wording ahead of the base P4 recommendation', () => {
    const formState = cloneFormState(genericHappyPath);
    formState.reportBody.excavation.frostDepthMm = 200;

    const result = generateLetter(formState);
    const p3aText = result.paragraphs.find((paragraph) => paragraph.sectionId === 'P3A')?.text ?? '';
    const p4Text = result.paragraphs.find((paragraph) => paragraph.sectionId === 'P4')?.text ?? '';

    expect(p3aText).toContain('Due to the frost');
    expect(p4Text).toContain('would then be considered adequate');
  });

  it('uses conditional signoff wording and the registry-backed Scott member number', () => {
    const formState = cloneFormState(genericHappyPath);
    formState.signoff.preparedBy = '';

    const result = generateLetter(formState);
    const signoffText = result.paragraphs.find((paragraph) => paragraph.sectionId === 'SIGNOFF')?.text ?? '';

    expect(signoffText).toContain('Yours truly,');
    expect(signoffText).toContain('Signed by,');
    expect(signoffText).toContain('Scott MacFarlane, P.Eng.');
    expect(signoffText).toContain('APEGA Member #: 89667');
    expect(signoffText).not.toContain('Reviewed by,');
  });

  it('threads secondary moisture, plasticity, and descriptors into the single-layer P3 output', () => {
    const formState = cloneFormState(genericHappyPath);
    formState.reportBody.soil.moisture2 = 'wet';
    formState.reportBody.soil.plasticity2 = 'high';
    formState.reportBody.soil.clayDescriptors = ['silty'];

    const result = generateLetter(formState);
    const p3Text = result.paragraphs.find((paragraph) => paragraph.sectionId === 'P3')?.text ?? '';

    expect(p3Text).toContain('moist to wet');
    expect(p3Text).toContain('silty clay');
    expect(p3Text).toContain('medium to high plasticity');
  });
});
