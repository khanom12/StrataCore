export type SectionId =
  | 'META'
  | 'P1'
  | 'P2'
  | 'P3'
  | 'P4'
  | 'P5'
  | 'P6'
  | 'P7'
  | 'P8'
  | 'SIG';

export type ReviewSeverity = 'info' | 'review' | 'block';

export interface ClauseRef {
  id: string;
  title?: string;
}

export interface RuleRef {
  id: string;
}

export interface ReviewFlag {
  code: string;
  severity: ReviewSeverity;
  message: string;
  sourceRuleIds?: string[];
  sourceClauseIds?: string[];
}

export interface GeneratedParagraph {
  id: string;
  section: SectionId;
  title: string;
  text: string;
  clauseIds: string[];
  ruleIds: string[];
  needsReview?: boolean;
}

export interface MetaState {
  letterDate: string;
  fileNumber: string;
  clientName: string;
  clientMailingAddress: string[];
  headingSuffix?: string;
  includeLegalDescription: boolean;
  lot?: string;
  block?: string;
  plan?: string;
  streetAddress: string;
  includeClientJobNumber?: boolean;
  clientJobNumber?: string;
  includeSubdivision?: boolean;
  subdivision?: string;
  municipality: string;
  hNumber: string;
}

export interface P2State {
  minCutM?: number;
  maxCutM?: number;
  garageMode: 'none' | 'same_elevation' | 'higher_than_house';
  garageOffsetAboveHouseM?: number;
  walkoutBasement?: boolean;
  gardenSuiteMode?: boolean;
  asConstructedMode?: 'none' | 'poured_18in' | 'poured_20in' | 'poured_24in' | 'walls_and_footing';
  constructionStage?: 'normal' | 'nearly_complete' | 'framing';
  siteHistory?: 'none' | 'infill' | 'knockdown_rebuild';
  oversizedTrench?: boolean;
  trenchLocation?: 'front' | 'front_left' | 'front_right';
  sloughMaterial?: boolean;
  loosePeelingMaterial?: boolean;
  frostDepthMm?: number;
  freeWaterInAugerHoles?: boolean;
  waterContext?: string;
  rainSoftenedMode?: 'none' | 'saturated_soft_surficial' | 'standing_water_rain_softened';
  snowDepthMm?: number;
  exposedElectricalTrench?: boolean;
  groundHeatingSystem?: boolean;
}

export interface P3State {
  soilLayeringMode: 'single_layer' | 'engineered_fill_over_native';
  primarySoilOrigin:
    | 'native'
    | 'engineered_fill_jrp'
    | 'engineered_fill_jrp_and_others'
    | 'engineered_fill_others'
    | 'engineered_fill_unknown';
  primaryMaterialFamily: 'clay' | 'clay_till' | 'sand' | 'silt' | 'clayey_sand' | 'clayey_silt';
  clayDescriptors?: Array<'silty' | 'very_silty' | 'sandy' | 'very_sandy'>;
  sandSiltDescriptors?: Array<'coarse' | 'medium' | 'fine' | 'well_graded' | 'poorly_graded'>;
  moisture1: 'damp' | 'moist' | 'very_moist' | 'wet';
  moisture2?: 'moist' | 'very_moist' | 'wet';
  colour: 'brown' | 'grey' | 'brown_and_grey' | 'brown_and_dark_grey' | 'dark_grey' | 'black' | 'reddish_brown';
  plasticity1: 'low' | 'medium' | 'high';
  plasticity2?: 'medium' | 'high';
  consistencyOrDensity:
    | 'soft'
    | 'firm'
    | 'stiff'
    | 'very_stiff'
    | 'hard'
    | 'very_loose'
    | 'loose'
    | 'compact'
    | 'dense'
    | 'very_dense';
  traceFeatures?: Array<'oxides' | 'white_precipitates' | 'coal' | 'gravel' | 'organics' | 'rootlets'>;
  highPlasticWarning?: boolean;
}

export interface P4State {
  footingBasis: 'standard' | 'modified';
  spreadFootingMode: 'omit' | 'default_140_kpa' | 'review_100_kpa';
}

export interface P5State {
  garageSlabOrganics?: boolean;
}

export interface P6State {
  includeSulphateParagraph?: boolean;
  sulphateClass?: 'negligible' | 'moderate' | 'severe' | 'very_severe';
}

export interface P7State {
  includeWinterParagraph: boolean;
}

export interface SignoffState {
  preparedBy?: string;
  signingEngineer: string;
}

export interface FormState {
  meta: MetaState;
  inspectionDate: string;
  p2: P2State;
  p3: P3State;
  p4: P4State;
  p5?: P5State;
  p6?: P6State;
  p7: P7State;
  signoff: SignoffState;
}

export interface GenerationResult {
  visibleSections: SectionId[];
  paragraphs: GeneratedParagraph[];
  clauseIds: string[];
  ruleIds: string[];
  reviewFlags: ReviewFlag[];
  filename: string;
  archivePath: string;
}

