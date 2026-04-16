import autoCoreClauses from '../../../seed/auto_core_clauses.json';
import autoCoreRules from '../../../seed/auto_core_rules.json';
import reportSkeleton from '../../../seed/report_skeleton.json';
import reviewLog from '../../../seed/review_log.json';
import v1ScopeLock from '../../../seed/v1_scope_lock.json';

interface ClauseRow {
  'Clause ID': string;
  'Raw Title / Name': string;
  'Clause Text (source excerpt)': string;
  'Decision table ref(s)'?: string;
  'V1 Handling'?: string;
}

interface RuleRow {
  'Rule ID': string;
  Section: string;
  'Output / result': string;
  'Primary clause ID(s)'?: string;
  'V1 Support'?: string;
}

interface ReviewDecisionRow {
  'Decision ID': string;
  Topic: string;
  'Why it matters': string;
  'Interim handling': string;
  'Exact review question'?: string;
}

interface ScopeRow {
  'Scope ID': string;
  'Family / Capability': string;
  'V1 Support': string;
}

interface SkeletonRow {
  'Section ID': string;
  'Section Name': string;
  Description: string;
}

const clauses = autoCoreClauses as ClauseRow[];
const rules = autoCoreRules as RuleRow[];
const reviewDecisions = reviewLog as ReviewDecisionRow[];
const scopeLock = v1ScopeLock as ScopeRow[];
const skeleton = reportSkeleton as SkeletonRow[];

export const clauseMap = new Map(
  clauses.map((clause) => [
    clause['Clause ID'],
    {
      id: clause['Clause ID'],
      title: clause['Raw Title / Name'],
      text: clause['Clause Text (source excerpt)'],
      ruleRefs: clause['Decision table ref(s)']
    }
  ])
);

export const ruleMap = new Map(
  rules.map((rule) => [
    rule['Rule ID'],
    {
      id: rule['Rule ID'],
      section: rule.Section,
      output: rule['Output / result'],
      clauseRefs: rule['Primary clause ID(s)'] ?? '',
      support: rule['V1 Support'] ?? 'AUTO'
    }
  ])
);

export const skeletonMap = new Map(
  skeleton.map((row) => [
    row['Section ID'],
    {
      id: row['Section ID'],
      name: row['Section Name'],
      description: row.Description
    }
  ])
);

export function getClauseText(clauseId: string): string {
  return clauseMap.get(clauseId)?.text ?? `[Missing clause text for ${clauseId}]`;
}

export function getRuleOutput(ruleId: string): string {
  return ruleMap.get(ruleId)?.output ?? `[Missing rule output for ${ruleId}]`;
}

export function getReviewDecision(decisionId: string): ReviewDecisionRow | undefined {
  return reviewDecisions.find((decision) => decision['Decision ID'] === decisionId);
}

export function getSeedSummary() {
  return {
    clauseCount: clauses.length,
    ruleCount: rules.length,
    reviewDecisionCount: reviewDecisions.length,
    scopeItems: scopeLock.map((item) => ({
      id: item['Scope ID'],
      family: item['Family / Capability'],
      support: item['V1 Support']
    }))
  };
}
