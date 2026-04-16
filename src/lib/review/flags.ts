import type { ClauseRef, ReviewFlag, ReviewSeverity, RuleRef, SectionId } from '@/types/domain';

interface ReviewFlagInput {
  id: string;
  title: string;
  message: string;
  severity?: ReviewSeverity;
  relatedSectionId?: SectionId;
  clauseRefs?: ClauseRef[];
  ruleRefs?: RuleRef[];
}

export function createReviewFlag(input: ReviewFlagInput): ReviewFlag {
  return {
    id: input.id,
    title: input.title,
    message: input.message,
    severity: input.severity ?? 'warning',
    relatedSectionId: input.relatedSectionId,
    clauseRefs: input.clauseRefs ?? [],
    ruleRefs: input.ruleRefs ?? []
  };
}
