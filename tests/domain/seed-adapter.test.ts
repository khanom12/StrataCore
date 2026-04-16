import { describe, expect, it } from 'vitest';

import {
  getClauseDefinition,
  getRuleOutput,
  getReportSectionDefinition,
  getRuleDefinition,
  getSeedSummary,
  normalizeSectionId,
  toClauseRef,
  toRuleRef
} from '@/lib/seed/source-data';

describe('seed adapter layer', () => {
  it('loads typed clause and rule definitions from the repo seed files', () => {
    expect(getClauseDefinition('CL_000')?.title).toBe('Standard P1');
    expect(getRuleDefinition('DT_010')?.sectionId).toBe('P1');
    expect(getReportSectionDefinition('SIG_04')?.sectionId).toBe('SIGNOFF');
  });

  it('creates lightweight typed refs for clauses and rules', () => {
    expect(toClauseRef('CL_000')).toEqual({
      id: 'CL_000',
      title: 'Standard P1'
    });
    expect(toRuleRef('DT_010').id).toBe('DT_010');
    expect(toRuleRef('DT_010').title).toContain('Insert the standard intro');
    expect(getRuleOutput('DT_010')).toContain('Insert the standard intro');
  });

  it('maps seed section labels to the normalized V1 section ids', () => {
    expect(normalizeSectionId('META')).toBe('TOP_BLOCK');
    expect(normalizeSectionId('P8')).toBe('CLOSING');
    expect(normalizeSectionId('SIG / Archive')).toBe('SIGNOFF');
  });

  it('exposes a summary that the landing page can consume without touching raw seed rows', () => {
    const summary = getSeedSummary();

    expect(summary.clauseCount).toBeGreaterThan(0);
    expect(summary.ruleCount).toBeGreaterThan(0);
    expect(summary.reviewDecisionCount).toBeGreaterThan(0);
  });
});
