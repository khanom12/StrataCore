export interface AnalystControlGroup {
  id: string;
  title: string;
  description: string;
  fieldPaths: string[];
}

export const ANALYST_CONTROL_GROUPS: AnalystControlGroup[] = [
  {
    id: 'letter-shell-overrides',
    title: 'Letter shell overrides',
    description: 'Use these only when the office needs a non-default subject line, heading detail, or client reference label for this file.',
    fieldPaths: ['topBlock.subjectLineFamily', 'topBlock.headingSuffix', 'topBlock.clientReferenceLabelFamily']
  },
  {
    id: 'recommendation-overrides',
    title: 'Recommendation overrides',
    description: 'Use these only when an analyst needs to override the default footing recommendation family or bearing wording for the draft.',
    fieldPaths: ['reportBody.recommendation.footingBasis', 'reportBody.recommendation.spreadFootingFamily']
  }
];
