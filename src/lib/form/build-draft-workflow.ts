import { normalizeDependentFormState } from '@/lib/form/normalize-dependent-state';
import { DEFERRED_MANUAL_BRANCHES } from '@/lib/form/dependencies';
import { readValueAtPath } from '@/lib/form/field-paths';
import { validateDraftForClientOutput } from '@/lib/form/validate-draft';
import { generateLetter } from '@/lib/generation/generate-letter';
import type {
  FormState,
  GenerationResult,
  ReviewFlag,
  ValidationIssue
} from '@/types/domain';
import type { DocumentReadinessStatus } from '@/types/document';

export interface DraftReadinessState {
  status: DocumentReadinessStatus;
  label: string;
}

export interface DeferredManualBranchStatus {
  id: string;
  description: string;
  fieldPath: string;
  active: boolean;
}

export interface DraftWorkflowState {
  normalizedFormState: FormState;
  generationResult: GenerationResult;
  validationIssues: ValidationIssue[];
  reviewFlags: ReviewFlag[];
  readiness: DraftReadinessState;
  deferredManualBranches: DeferredManualBranchStatus[];
}

export function buildDraftReadinessState(validationIssueCount: number, reviewFlagCount: number): DraftReadinessState {
  if (validationIssueCount > 0) {
    return {
      status: 'blocked',
      label: `Blocked by ${validationIssueCount} required field${validationIssueCount === 1 ? '' : 's'}`
    };
  }

  if (reviewFlagCount > 0) {
    return {
      status: 'review_required',
      label: `${reviewFlagCount} analyst review item${reviewFlagCount === 1 ? '' : 's'}`
    };
  }

  return {
    status: 'ready',
    label: 'Ready for preview and export'
  };
}

export function groupValidationIssuesByFieldPath(validationIssues: ValidationIssue[]) {
  return validationIssues.reduce<Record<string, ValidationIssue[]>>((groups, issue) => {
    if (!issue.fieldPath) {
      return groups;
    }

    if (!groups[issue.fieldPath]) {
      groups[issue.fieldPath] = [];
    }

    groups[issue.fieldPath].push(issue);
    return groups;
  }, {});
}

function buildDeferredManualBranchStatuses(formState: FormState): DeferredManualBranchStatus[] {
  return DEFERRED_MANUAL_BRANCHES.map((branch) => ({
    id: branch.id,
    description: branch.description,
    fieldPath: branch.fieldPath,
    active: Boolean(readValueAtPath(formState, branch.fieldPath))
  }));
}

export function buildDraftWorkflowState(formState: FormState): DraftWorkflowState {
  const normalizedFormState = normalizeDependentFormState(formState);
  const generationResult = generateLetter(normalizedFormState);
  const validationIssues = validateDraftForClientOutput(normalizedFormState, generationResult);
  const reviewFlags = generationResult.reviewFlags;

  return {
    normalizedFormState,
    generationResult,
    validationIssues,
    reviewFlags,
    readiness: buildDraftReadinessState(validationIssues.length, reviewFlags.length),
    deferredManualBranches: buildDeferredManualBranchStatuses(normalizedFormState)
  };
}
