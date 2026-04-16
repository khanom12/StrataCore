import type { ReviewFlag, ReviewSeverity } from '@/types/domain';

interface ReviewFlagInput {
  code: string;
  message: string;
  severity?: ReviewSeverity;
  sourceRuleIds?: string[];
  sourceClauseIds?: string[];
}

export function createReviewFlag(input: ReviewFlagInput): ReviewFlag {
  return {
    code: input.code,
    severity: input.severity ?? 'review',
    message: input.message,
    sourceRuleIds: input.sourceRuleIds,
    sourceClauseIds: input.sourceClauseIds
  };
}

