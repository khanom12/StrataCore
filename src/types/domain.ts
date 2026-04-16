export type SectionId =
  | 'TOP_BLOCK'
  | 'P1'
  | 'P2'
  | 'P3'
  | 'P3A'
  | 'P4'
  | 'P5'
  | 'P6'
  | 'P7'
  | 'CLOSING'
  | 'SIGNOFF';

export type ReviewSeverity = 'info' | 'warning' | 'blocker';

export interface ClauseRef {
  id: string;
  title?: string;
}

export interface RuleRef {
  id: string;
  title?: string;
}

export interface GeneratedParagraph {
  id: string;
  sectionId: SectionId;
  title: string;
  text: string;
  order: number;
  clauseRefs: ClauseRef[];
  ruleRefs: RuleRef[];
  reviewSensitive: boolean;
}

export interface ReviewFlag {
  id: string;
  title: string;
  message: string;
  severity: ReviewSeverity;
  relatedSectionId?: SectionId;
  clauseRefs: ClauseRef[];
  ruleRefs: RuleRef[];
}

export interface ValidationIssue {
  id: string;
  title: string;
  message: string;
  fieldPath?: string;
}

export type LegalDescriptionMode = 'single' | 'custom';
export type SubjectLineFamily = 'singular' | 'plural';
export type ClientReferenceLabelFamily = 'client_job_no' | 'job_hash';

export interface TopBlockInputs {
  letterDate: string;
  fileNumber: string;
  clientName: string;
  clientMailingAddress: string[];
  subjectLineFamily: SubjectLineFamily;
  headingSuffix?: string;
  includeLegalDescription: boolean;
  legalDescriptionMode: LegalDescriptionMode;
  lot?: string;
  block?: string;
  plan?: string;
  customLegalDescriptionLines?: string[];
  streetAddress: string;
  includeClientJobNumber: boolean;
  clientReferenceLabelFamily: ClientReferenceLabelFamily;
  clientJobNumber?: string;
  includeSubdivision: boolean;
  subdivision?: string;
  municipality: string;
}

export interface ArchiveMetadata {
  hNumber: string;
}

export interface HouseFootingCutDepthsM {
  frontLeftM?: number;
  frontRightM?: number;
  rearLeftM?: number;
  rearRightM?: number;
}

export type GarageMode = 'none' | 'same_elevation' | 'higher_than_house';
export type AsConstructedMode = 'none' | 'poured_18in' | 'poured_20in' | 'poured_24in' | 'walls_and_footing';
export type ConstructionStage = 'normal' | 'nearly_complete' | 'framing';
export type SiteHistory = 'none' | 'infill' | 'knockdown_rebuild';
export type TrenchLocation = 'front' | 'front_left' | 'front_right';
export type StructureVariant = 'standard_house' | 'rear_garage_garden_suite';
export type WaterIssueMode =
  | 'none'
  | 'free_water_in_auger_holes_basic'
  | 'free_water_in_auger_holes_upgraded_drainage'
  | 'rain_softened'
  | 'exposed_electrical_trench_water_entry';
export type OversizedTrenchMode = 'none' | 'reinforcement' | 'fillcrete_gravel' | 'precast_review';
export type LooseMaterialMode = 'none' | 'noted_only' | 'standard_cleanup' | 'thickened_footing_drainage';

export interface ExcavationInputs {
  houseFootingCutDepthsM: HouseFootingCutDepthsM;
  walkoutBasement?: boolean;
  walkoutExtraRearRemovalM?: number;
  asConstructedMode?: AsConstructedMode;
  constructionStage?: ConstructionStage;
  siteHistory?: SiteHistory;
  oversizedTrenchMode?: OversizedTrenchMode;
  trenchLocation?: TrenchLocation;
  sloughMaterial?: boolean;
  looseMaterialMode?: LooseMaterialMode;
  frostDepthMm?: number;
  waterIssueMode?: WaterIssueMode;
  waterObservedDepthBelowFootingM?: number;
  snowDepthMm?: number;
  groundHeatingSystem?: boolean;
}

export interface GarageInputs {
  mode: GarageMode;
  offsetAboveHouseM?: number;
  slabOrganics?: boolean;
}

export type SoilLayeringMode = 'single_layer' | 'engineered_fill_over_native';
export type PrimarySoilOrigin =
  | 'native'
  | 'engineered_fill_jrp'
  | 'engineered_fill_jrp_and_others'
  | 'engineered_fill_others'
  | 'engineered_fill_unknown';
export type PrimaryMaterialFamily = 'clay' | 'clay_till' | 'sand' | 'silt' | 'clayey_sand' | 'clayey_silt';
export type ClayDescriptor = 'silty' | 'very_silty' | 'sandy' | 'very_sandy';
export type SandSiltDescriptor = 'coarse' | 'medium' | 'fine' | 'well_graded' | 'poorly_graded';
export type MoistureDescriptor = 'damp' | 'moist' | 'very_moist' | 'wet';
export type SoilColour =
  | 'brown'
  | 'grey'
  | 'brown_and_grey'
  | 'brown_and_dark_grey'
  | 'dark_grey'
  | 'black'
  | 'reddish_brown';
export type PlasticityDescriptor = 'low' | 'medium' | 'high';
export type DensityOrConsistencyDescriptor =
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
export type TraceFeature = 'oxides' | 'white_precipitates' | 'coal' | 'gravel' | 'organics' | 'rootlets';

export interface SoilLayerDescriptor {
  materialFamily: PrimaryMaterialFamily;
  clayDescriptors?: ClayDescriptor[];
  sandSiltDescriptors?: SandSiltDescriptor[];
  moisture1: MoistureDescriptor;
  moisture2?: Exclude<MoistureDescriptor, 'damp'>;
  colour: SoilColour;
  plasticity1?: PlasticityDescriptor;
  plasticity2?: Exclude<PlasticityDescriptor, 'low'>;
  consistencyOrDensity: DensityOrConsistencyDescriptor;
  traceFeatures?: TraceFeature[];
}

export interface SoilInputs {
  soilLayeringMode: SoilLayeringMode;
  primarySoilOrigin: PrimarySoilOrigin;
  primaryMaterialFamily: PrimaryMaterialFamily;
  clayDescriptors?: ClayDescriptor[];
  sandSiltDescriptors?: SandSiltDescriptor[];
  moisture1: MoistureDescriptor;
  moisture2?: Exclude<MoistureDescriptor, 'damp'>;
  colour: SoilColour;
  plasticity1: PlasticityDescriptor;
  plasticity2?: Exclude<PlasticityDescriptor, 'low'>;
  consistencyOrDensity: DensityOrConsistencyDescriptor;
  traceFeatures?: TraceFeature[];
  engineeredFillLayer?: SoilLayerDescriptor;
  underlyingNativeLayer?: SoilLayerDescriptor;
  layeredCoverageMode?: 'variable_portions' | 'throughout_excavation';
  fillDepthBelowFootingMm?: number;
  highPlasticWarning?: boolean;
}

export type FootingBasis = 'standard' | 'modified';
export type SpreadFootingFamily = 'omit' | 'default_140_kpa' | 'default_120_kpa' | 'review_100_kpa';
export type DrainageUpgradeVariant = 'none' | 'washed_rock_interior_exterior_two_laterals';

export interface RecommendationInputs {
  footingBasis: FootingBasis;
  spreadFootingFamily: SpreadFootingFamily;
  drainageUpgradeVariant: DrainageUpgradeVariant;
  drainageDrawingAttached?: boolean;
}

export type SulphateClass = 'negligible' | 'moderate' | 'severe' | 'very_severe';

export interface SulphateInputs {
  includeParagraph: boolean;
  sulphateClass?: SulphateClass;
}

export interface WinterInputs {
  includeParagraph: boolean;
}

export interface ReportBodyInputs {
  inspectionDate: string;
  structureVariant: StructureVariant;
  excavation: ExcavationInputs;
  soil: SoilInputs;
  recommendation: RecommendationInputs;
  garage: GarageInputs;
  sulphate: SulphateInputs;
  winter: WinterInputs;
}

export interface SignoffInputs {
  preparedBy?: string;
  signingEngineer: string;
}

export interface FormState {
  topBlock: TopBlockInputs;
  archive: ArchiveMetadata;
  reportBody: ReportBodyInputs;
  signoff: SignoffInputs;
}

export interface GenerationResult {
  paragraphs: GeneratedParagraph[];
  visibleSections: SectionId[];
  reviewFlags: ReviewFlag[];
  filename: string;
  archivePath: string;
  clauseRefsUsed: ClauseRef[];
  ruleRefsUsed: RuleRef[];
}
