export type MaterialType =
  | "precast_concrete"
  | "grc"
  | "gfrc"
  | "acp"
  | "timber_clt"
  | "steel_sandwich";

export type InsulationType =
  | "eps"
  | "xps"
  | "mineral_wool"
  | "pir"
  | "phenolic";

export type PanelSizeCategory = "small" | "medium" | "large" | "extra_large";

export type ConnectionType =
  | "cast_in_channel"
  | "bracket_bolt"
  | "hook_on_clip"
  | "adhesive";

export type FireClass = "A1" | "A2" | "B" | "C";

export type StandardisationLevel = 1 | 2 | 3 | 4 | 5;

export type CandidateCluster =
  | "high_standardisation"
  | "low_carbon"
  | "low_cost"
  | "balanced";

export type SpecialLabel =
  | "knee_point"
  | "low_cost"
  | "low_carbon"
  | "high_buildability";

export type OutputTab =
  | "pareto"
  | "solutions"
  | "diagnostics"
  | "clusters"
  | "sensitivity";

export type ConstraintMode = "max" | "min" | "rank" | "boolean";

export interface DecisionVector {
  materialType: MaterialType;
  insulationType: InsulationType;
  panelThickness: number;
  panelSizeCategory: PanelSizeCategory;
  connectionType: ConnectionType;
  standardisationLevel: StandardisationLevel;
}

export interface ObjectiveValues {
  cost: number;
  embodiedCarbon: number;
  constructability: number;
}

export interface ConstructabilityProxies {
  panelTypeVariety: number;
  dimensionalDispersion: number;
  connectionVariety: number;
  liftingInstallTime: number;
  logisticsPressure: number;
  laydownFootprint: number;
  workfaceInteraction: number;
}

export interface DiagnosticIndicators {
  nonStandardRatio: number;
  liftCountIntensity: number;
}

export interface ConstraintCheck {
  name: string;
  status: "pass" | "warning" | "fail";
  actual: number;
  limit: number;
  unit: string;
  utilisation: number;
  mode: ConstraintMode;
  message: string;
  actualLabel?: string;
  limitLabel?: string;
}

export interface PanelSystemMetrics {
  width: number;
  height: number;
  area: number;
  weight: number;
  maxDimension: number;
  thermalR: number;
  fireClass: FireClass;
  insulationThickness: number;
  panelCount: number;
  panelsInstalledPerDay: number;
  dailyCraneHours: number;
  dailyTrips: number;
  laydownDemand: number;
  standardisationPercent: number;
}

export interface CandidateSolution {
  id: string;
  decision: DecisionVector;
  objectives: ObjectiveValues;
  proxies: ConstructabilityProxies;
  diagnostics: DiagnosticIndicators;
  constraints: ConstraintCheck[];
  feasible: boolean;
  paretoRank: number;
  cluster?: CandidateCluster;
  label?: SpecialLabel;
  panelMetrics: PanelSystemMetrics;
}

export interface CandidateRecord {
  id: string;
  decision: DecisionVector;
  objectives: ObjectiveValues;
  proxies: ConstructabilityProxies;
  diagnostics: DiagnosticIndicators;
  panelMetrics: PanelSystemMetrics;
  cluster?: CandidateCluster;
  label?: SpecialLabel;
}

export interface ProjectConstraints {
  facadeZone: string;
  deliveryBookingCapacity: number;
  laydownArea: number;
  craneTimeBudget: number;
  maxPanelWeight: number;
  maxPanelDimension: number;
  minThermalR: number;
  fireClass: FireClass;
}

export interface ConstructabilityWeights {
  panelTypeVariety: number;
  dimensionalDispersion: number;
  connectionVariety: number;
  liftingInstallTime: number;
  logisticsPressure: number;
  laydownFootprint: number;
  workfaceInteraction: number;
}

export interface DesignOptionsState {
  materialTypes: MaterialType[];
  insulationTypes: InsulationType[];
  panelThicknessRange: [number, number];
  panelSizeCategories: PanelSizeCategory[];
  connectionTypes: ConnectionType[];
  standardisationLevels: StandardisationLevel[];
}

export interface InfeasibilityStat {
  name: string;
  count: number;
  ratio: number;
}

export interface ClusterSummary {
  id: CandidateCluster;
  title: string;
  description: string;
  averageCost: number;
  averageCarbon: number;
  averageConstructability: number;
  count: number;
  materials: MaterialType[];
  accent: string;
}

export interface SensitivityParameters {
  craneBudgetDelta: number;
  laydownAreaDelta: number;
  deliveryCapacityDelta: number;
  installationUnitTimeMultiplier: number;
}

export interface SensitivityResult {
  feasibleAfterPerturbation: boolean;
  kneeShiftCost: number;
  kneeShiftCarbon: number;
  frontSizeChange: number;
  structureConsistent: boolean;
  selectedSolutionAfter?: CandidateSolution;
  perturbedConstraints: ProjectConstraints;
  notes: string[];
}

export interface OptimisationResult {
  candidates: CandidateSolution[];
  feasibleSolutions: CandidateSolution[];
  infeasibleSolutions: CandidateSolution[];
  paretoFront: CandidateSolution[];
  baselineParetoFront: CandidateSolution[];
  clusters: ClusterSummary[];
  infeasibilityStats: InfeasibilityStat[];
  totalCandidates: number;
  excludedCount: number;
}

export type DataSource = "mock" | "imported";

export interface ImportedDatasetPayload {
  candidates: CandidateRecord[];
  projectConstraints?: Partial<ProjectConstraints>;
  sourceLabel?: string;
}

export interface OptionItem<TValue extends string | number> {
  value: TValue;
  label: string;
  shortLabel?: string;
}

export const FACADE_ZONES: OptionItem<string>[] = [
  { value: "Zone A - North", label: "Zone A - North" },
  { value: "Zone B - East", label: "Zone B - East" },
  { value: "Zone C - South", label: "Zone C - South" },
  { value: "Zone D - West", label: "Zone D - West" },
  { value: "Podium Interface", label: "Podium Interface" },
  { value: "Atrium Envelope", label: "Atrium Envelope" },
];

export const MATERIAL_OPTIONS: OptionItem<MaterialType>[] = [
  { value: "precast_concrete", label: "Precast concrete", shortLabel: "Precast" },
  { value: "grc", label: "GRC", shortLabel: "GRC" },
  { value: "gfrc", label: "GFRC", shortLabel: "GFRC" },
  { value: "acp", label: "Aluminium composite panel", shortLabel: "ACP" },
  { value: "timber_clt", label: "Timber CLT", shortLabel: "CLT" },
  { value: "steel_sandwich", label: "Steel sandwich panel", shortLabel: "Steel sandwich" },
];

export const INSULATION_OPTIONS: OptionItem<InsulationType>[] = [
  { value: "eps", label: "EPS" },
  { value: "xps", label: "XPS" },
  { value: "mineral_wool", label: "Mineral wool", shortLabel: "Mineral wool" },
  { value: "pir", label: "PIR" },
  { value: "phenolic", label: "Phenolic foam", shortLabel: "Phenolic" },
];

export const PANEL_SIZE_OPTIONS: OptionItem<PanelSizeCategory>[] = [
  { value: "small", label: "Small (< 3m2)", shortLabel: "Small" },
  { value: "medium", label: "Medium (3 - 6m2)", shortLabel: "Medium" },
  { value: "large", label: "Large (6 - 12m2)", shortLabel: "Large" },
  { value: "extra_large", label: "Extra large (> 12m2)", shortLabel: "XL" },
];

export const CONNECTION_OPTIONS: OptionItem<ConnectionType>[] = [
  { value: "cast_in_channel", label: "Cast-in channel", shortLabel: "Cast-in" },
  { value: "bracket_bolt", label: "Bracket + bolt", shortLabel: "Bracket" },
  { value: "hook_on_clip", label: "Hook-on clip", shortLabel: "Hook-on" },
  { value: "adhesive", label: "Adhesive bonded", shortLabel: "Adhesive" },
];

export const STANDARDISATION_OPTIONS: OptionItem<StandardisationLevel>[] = [
  { value: 1, label: "Low" },
  { value: 2, label: "Medium-low" },
  { value: 3, label: "Medium" },
  { value: 4, label: "Medium-high" },
  { value: 5, label: "High" },
];

export const OUTPUT_TABS: OptionItem<OutputTab>[] = [
  { value: "pareto", label: "Pareto Surface" },
  { value: "solutions", label: "Solution Card" },
  { value: "diagnostics", label: "Infeasibility" },
  { value: "clusters", label: "Pattern Clusters" },
  { value: "sensitivity", label: "Sensitivity" },
];

export type ConstructabilityMetricKey = keyof ConstructabilityWeights;

export const CONSTRUCTABILITY_METRICS: {
  key: ConstructabilityMetricKey;
  label: string;
  variable: string;
  description: string;
}[] = [
  {
    key: "panelTypeVariety",
    label: "Panel type variety",
    variable: "P_types",
    description: "Different panel families across the package",
  },
  {
    key: "dimensionalDispersion",
    label: "Dimensional dispersion",
    variable: "D_disp",
    description: "Spread of panel dimensions and bespoke edges",
  },
  {
    key: "connectionVariety",
    label: "Connection variety",
    variable: "C_var",
    description: "Number and complexity of connection details",
  },
  {
    key: "liftingInstallTime",
    label: "Lifting & installation time",
    variable: "T_lift",
    description: "Crane and installation intensity",
  },
  {
    key: "logisticsPressure",
    label: "Logistics pressure",
    variable: "L_log",
    description: "Booking cadence and transport pressure",
  },
  {
    key: "laydownFootprint",
    label: "Laydown footprint demand",
    variable: "A_lay",
    description: "Temporary storage footprint on site",
  },
  {
    key: "workfaceInteraction",
    label: "Workface interaction",
    variable: "I_wf",
    description: "Concurrent trades and workface conflicts",
  },
];

export const DEFAULT_PROJECT_CONSTRAINTS: ProjectConstraints = {
  facadeZone: "Zone A - North",
  deliveryBookingCapacity: 12,
  laydownArea: 280,
  craneTimeBudget: 10,
  maxPanelWeight: 5000,
  maxPanelDimension: 8,
  minThermalR: 3.5,
  fireClass: "A2",
};

export const DEFAULT_DESIGN_OPTIONS: DesignOptionsState = {
  materialTypes: MATERIAL_OPTIONS.map((item) => item.value),
  insulationTypes: INSULATION_OPTIONS.map((item) => item.value),
  panelThicknessRange: [100, 400],
  panelSizeCategories: PANEL_SIZE_OPTIONS.map((item) => item.value),
  connectionTypes: CONNECTION_OPTIONS.map((item) => item.value),
  standardisationLevels: STANDARDISATION_OPTIONS.map((item) => item.value),
};

export const DEFAULT_CONSTRUCTABILITY_WEIGHTS: ConstructabilityWeights = {
  panelTypeVariety: 7,
  dimensionalDispersion: 5,
  connectionVariety: 4,
  liftingInstallTime: 6,
  logisticsPressure: 5,
  laydownFootprint: 4,
  workfaceInteraction: 3,
};

export const DEFAULT_SENSITIVITY_PARAMETERS: SensitivityParameters = {
  craneBudgetDelta: -10,
  laydownAreaDelta: -10,
  deliveryCapacityDelta: -10,
  installationUnitTimeMultiplier: 1.1,
};

export const FIRE_CLASS_ORDER: Record<FireClass, number> = {
  A1: 1,
  A2: 2,
  B: 3,
  C: 4,
};

export const STATUS_COLORS = {
  pass: "text-success",
  warning: "text-warning",
  fail: "text-danger",
} as const;
