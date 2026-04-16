import autoCoreClauses from '../../../seed/auto_core_clauses.json';
import autoCoreRules from '../../../seed/auto_core_rules.json';
import reportSkeleton from '../../../seed/report_skeleton.json';
import reviewLog from '../../../seed/review_log.json';
import v1ScopeLock from '../../../seed/v1_scope_lock.json';

import type { ClauseRef, RuleRef, SectionId } from '@/types/domain';

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

export interface SeedClauseDefinition {
  id: string;
  title: string;
  text: string;
  decisionRuleIds: string[];
  v1Handling?: string;
}

export interface SeedRuleDefinition {
  id: string;
  sectionId?: SectionId;
  seedSection: string;
  output: string;
  primaryClauseIds: string[];
  support: string;
}

export interface SeedReviewDecision {
  id: string;
  topic: string;
  whyItMatters: string;
  interimHandling: string;
  exactReviewQuestion?: string;
}

export interface SeedScopeItem {
  id: string;
  family: string;
  support: string;
}

export interface SeedSkeletonDefinition {
  id: string;
  sectionId?: SectionId;
  name: string;
  description: string;
}

const clauseRows = autoCoreClauses as ClauseRow[];
const ruleRows = autoCoreRules as RuleRow[];
const reviewDecisionRows = reviewLog as ReviewDecisionRow[];
const scopeRows = v1ScopeLock as ScopeRow[];
const skeletonRows = reportSkeleton as SkeletonRow[];

function extractIds(value: string | undefined, pattern: RegExp): string[] {
  return value?.match(pattern) ?? [];
}

export function normalizeSectionId(seedSection: string): SectionId | undefined {
  const normalized = seedSection.trim().toUpperCase();

  if (normalized === 'META' || normalized.startsWith('META_')) {
    return 'TOP_BLOCK';
  }

  if (normalized === 'P8' || normalized.startsWith('P8')) {
    return 'CLOSING';
  }

  if (normalized === 'SIG' || normalized.startsWith('SIG') || normalized.includes('SIG / ARCHIVE')) {
    return 'SIGNOFF';
  }

  if (['P1', 'P2', 'P3', 'P4', 'P5', 'P6', 'P7'].includes(normalized)) {
    return normalized as SectionId;
  }

  return undefined;
}

const clauseDefinitions = clauseRows.map<SeedClauseDefinition>((row) => ({
  id: row['Clause ID'],
  title: row['Raw Title / Name'],
  text: row['Clause Text (source excerpt)'],
  decisionRuleIds: extractIds(row['Decision table ref(s)'], /DT_\d+/g),
  v1Handling: row['V1 Handling']
}));

const ruleDefinitions = ruleRows.map<SeedRuleDefinition>((row) => ({
  id: row['Rule ID'],
  sectionId: normalizeSectionId(row.Section),
  seedSection: row.Section,
  output: row['Output / result'],
  primaryClauseIds: extractIds(row['Primary clause ID(s)'], /(CL_\d+|META_\d+|SIG_\d+|P[1-8])/g),
  support: row['V1 Support'] ?? 'AUTO'
}));

const reviewDecisions = reviewDecisionRows.map<SeedReviewDecision>((row) => ({
  id: row['Decision ID'],
  topic: row.Topic,
  whyItMatters: row['Why it matters'],
  interimHandling: row['Interim handling'],
  exactReviewQuestion: row['Exact review question']
}));

const scopeItems = scopeRows.map<SeedScopeItem>((row) => ({
  id: row['Scope ID'],
  family: row['Family / Capability'],
  support: row['V1 Support']
}));

const skeletonDefinitions = skeletonRows.map<SeedSkeletonDefinition>((row) => ({
  id: row['Section ID'],
  sectionId: normalizeSectionId(row['Section ID']),
  name: row['Section Name'],
  description: row.Description
}));

const clauseDefinitionMap = new Map(clauseDefinitions.map((definition) => [definition.id, definition]));
const ruleDefinitionMap = new Map(ruleDefinitions.map((definition) => [definition.id, definition]));
const skeletonDefinitionMap = new Map(skeletonDefinitions.map((definition) => [definition.id, definition]));
const reviewDecisionMap = new Map(reviewDecisions.map((decision) => [decision.id, decision]));

export function getClauseDefinition(id: string): SeedClauseDefinition | undefined {
  return clauseDefinitionMap.get(id);
}

export function getRuleDefinition(id: string): SeedRuleDefinition | undefined {
  return ruleDefinitionMap.get(id);
}

export function getReportSectionDefinition(id: string): SeedSkeletonDefinition | undefined {
  return skeletonDefinitionMap.get(id);
}

export function getReviewDecision(id: string): SeedReviewDecision | undefined {
  return reviewDecisionMap.get(id);
}

export function toClauseRef(id: string): ClauseRef {
  const clauseDefinition = getClauseDefinition(id);

  if (clauseDefinition) {
    return { id: clauseDefinition.id, title: clauseDefinition.title };
  }

  const skeletonDefinition = getReportSectionDefinition(id);

  if (skeletonDefinition) {
    return { id: skeletonDefinition.id, title: skeletonDefinition.name };
  }

  return { id };
}

export function toRuleRef(id: string): RuleRef {
  const ruleDefinition = getRuleDefinition(id);

  return ruleDefinition ? { id: ruleDefinition.id, title: ruleDefinition.output } : { id };
}

export function toClauseRefs(ids: string[]): ClauseRef[] {
  return ids.map(toClauseRef);
}

export function toRuleRefs(ids: string[]): RuleRef[] {
  return ids.map(toRuleRef);
}

export function getClauseText(idOrRef: string | ClauseRef): string {
  const id = typeof idOrRef === 'string' ? idOrRef : idOrRef.id;
  return getClauseDefinition(id)?.text ?? `[Missing clause text for ${id}]`;
}

export function uniqueClauseRefs(refs: ClauseRef[]): ClauseRef[] {
  return [...new Map(refs.map((ref) => [ref.id, ref])).values()];
}

export function uniqueRuleRefs(refs: RuleRef[]): RuleRef[] {
  return [...new Map(refs.map((ref) => [ref.id, ref])).values()];
}

export function getSeedSummary() {
  return {
    clauseCount: clauseDefinitions.length,
    ruleCount: ruleDefinitions.length,
    reviewDecisionCount: reviewDecisions.length,
    scopeItems
  };
}
