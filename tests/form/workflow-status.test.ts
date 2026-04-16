import { describe, expect, it } from 'vitest';

import { blankWorkingDraftFormState } from '@/lib/draft/default-form-state';
import { describeDraftSource } from '@/lib/draft/draft-source';
import type { DraftSessionState } from '@/lib/draft/draft-session';
import { ANALYST_CONTROL_GROUPS } from '@/lib/form/analyst-controls';
import { buildDraftWorkflowState } from '@/lib/form/build-draft-workflow';
import { genericHappyPath } from '@/lib/reference-cases/generic-happy-path';
import { getLegacyOutputCase } from '@/lib/reference-cases/legacy-output-cases';
import { victoryHomes2026IssuedExample } from '@/lib/reference-cases/victory-homes-2026';
import type { FormState } from '@/types/domain';

function cloneFormState(formState: FormState): FormState {
  return JSON.parse(JSON.stringify(formState)) as FormState;
}

describe('draft workflow status helpers', () => {
  it('reports ready, review-required, and blocked readiness states from the shared workflow model', () => {
    const readyWorkflow = buildDraftWorkflowState(cloneFormState(getLegacyOutputCase('already-poured-footing')!.formState));

    expect(readyWorkflow.readiness.status).toBe('ready');
    expect(readyWorkflow.validationIssues).toHaveLength(0);
    expect(readyWorkflow.reviewFlags).toHaveLength(0);

    const reviewFormState = cloneFormState(genericHappyPath);
    reviewFormState.reportBody.soil.primarySoilOrigin = 'engineered_fill_unknown';
    const reviewWorkflow = buildDraftWorkflowState(reviewFormState);

    expect(reviewWorkflow.readiness.status).toBe('review_required');
    expect(reviewWorkflow.reviewFlags.some((flag) => flag.id === 'review-engineered-fill-unknown')).toBe(true);

    const blockedFormState = cloneFormState(victoryHomes2026IssuedExample);
    blockedFormState.reportBody.excavation.walkoutBasement = true;
    blockedFormState.reportBody.excavation.walkoutExtraRearRemovalM = undefined;
    const blockedWorkflow = buildDraftWorkflowState(blockedFormState);

    expect(blockedWorkflow.readiness.status).toBe('blocked');
    expect(blockedWorkflow.validationIssues.some((issue) => issue.id === 'walkout-extra-rear-removal')).toBe(true);
  });

  it('describes blank, sample-loaded, edited-from-sample, and custom draft sources', () => {
    const blankSource = describeDraftSource(blankWorkingDraftFormState, {});
    const sampleSource = describeDraftSource(victoryHomes2026IssuedExample, { sourcePresetId: 'victory-homes-2026' });

    const editedFromSample = cloneFormState(victoryHomes2026IssuedExample);
    editedFromSample.topBlock.clientName = 'VICTORY HOMES LTD. (LOCAL EDIT)';
    const editedSource = describeDraftSource(editedFromSample, { sourcePresetId: 'victory-homes-2026' });

    const customDraft = cloneFormState(genericHappyPath);
    customDraft.topBlock.clientName = 'OPERATOR CUSTOM DRAFT';
    const customSource = describeDraftSource(customDraft, {} as DraftSessionState);

    expect(blankSource.kind).toBe('blank_working_draft');
    expect(sampleSource.kind).toBe('sample_loaded');
    expect(editedSource.kind).toBe('edited_from_sample');
    expect(customSource.kind).toBe('custom_local_draft');
  });

  it('keeps the analyst-control split explicit for shell and recommendation overrides', () => {
    expect(ANALYST_CONTROL_GROUPS).toEqual([
      expect.objectContaining({
        id: 'letter-shell-overrides',
        fieldPaths: ['topBlock.subjectLineFamily', 'topBlock.headingSuffix', 'topBlock.clientReferenceLabelFamily']
      }),
      expect.objectContaining({
        id: 'recommendation-overrides',
        fieldPaths: ['reportBody.recommendation.footingBasis', 'reportBody.recommendation.spreadFootingFamily']
      })
    ]);
  });
});
