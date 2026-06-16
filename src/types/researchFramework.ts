export type ResearchStepId =
  | "project-data"
  | "facade-options"
  | "l1-feasibility"
  | "l2-comparison"
  | "l3-robustness"
  | "decision-models"
  | "shortlist-report";

export interface WorkflowStep {
  id: ResearchStepId;
  number: number;
  label: string;
  shortLabel: string;
  description: string;
}

export type FrameworkRole =
  | "F3-D1"
  | "F3-D2"
  | "F3-D3"
  | "L1 gate"
  | "L2 objective"
  | "L3 scenario"
  | "diagnostic";

export type DataAvailability =
  | "public"
  | "project input"
  | "expert validation"
  | "assumption";

export type ExpertValidationStatus =
  | "validated"
  | "review required"
  | "provisional"
  | "out of scope";

export interface FactorIndicatorRow {
  id: string;
  factorGroup: string;
  constructabilityIndicator: string;
  operationalDefinition: string;
  metric: string;
  frameworkRole: FrameworkRole;
  dataAvailability: DataAvailability;
  sourceType: string;
  expertValidationStatus: ExpertValidationStatus;
  tags: Array<"F3 core" | "L1 gate" | "L3 scenario" | "diagnostics" | "expert validation required">;
}

export interface ContextMappingCard {
  id: string;
  title: string;
  bullets: string[];
  frameworkTreatment: Array<"L1" | "L2" | "L3" | "F1" | "F2" | "F3" | "diagnostic">;
  dataAvailability: DataAvailability[];
}

export interface ProjectDataset {
  projectName: string;
  location: string;
  buildingUse: string;
  heightBand: string;
  facadeArea: number;
  grid: string;
  floorHeight: number;
  wwr: number;
  thermalTarget: string;
  procurementRoute: string;
  siteAccess: "restricted" | "typical" | "flexible";
  laydown: "low" | "medium" | "high";
  craneAccess: "constrained" | "typical" | "favourable";
  deliveryAccess: "restricted" | "typical" | "flexible";
  facadeZones: string[];
}

export type L1Status = "pass" | "conditional pass" | "hold" | "reject";

export type L1GateKey =
  | "productAssurance"
  | "e2ExternalMoisture"
  | "fireExternalWall"
  | "h1ThermalEnvelope"
  | "b1SeismicMovement"
  | "b2Durability"
  | "transportHardFeasibility"
  | "dataConfidence";

export type BurdenDimension = "D1" | "D2" | "D3";

export interface ConstructabilityIndicators {
  D1: Record<string, number>;
  D2: Record<string, number>;
  D3: Record<string, number>;
}

export interface ScenarioSensitivity {
  laydown: "low" | "medium" | "high";
  deliveryAccess: "low" | "medium" | "high";
  craneAccess: "low" | "medium" | "high";
  supplierLeadTime: "low" | "medium" | "high";
  supplierSubstitution: "low" | "medium" | "high";
  carbonBoundary: "low" | "medium" | "high";
  evidence: "low" | "medium" | "high";
}

export interface FacadeOption {
  id: string;
  name: string;
  systemFamily: string;
  material: string;
  insulation: string;
  buildUpThickness: string;
  panelSize: string;
  panelWeight: string;
  connectionType: string;
  standardisationLevel: number;
  wetTradeDependency: "low" | "medium" | "high";
  supplierSource: "local" | "regional" | "imported";
  costIndex?: number;
  costNZD?: number;
  carbonA1A3: number;
  carbonA4: number;
  carbonA5: number;
  l1Evidence: Record<L1GateKey, L1Status>;
  constructabilityIndicators: ConstructabilityIndicators;
  scenarioSensitivity: ScenarioSensitivity;
  diagnostics: string[];
  evidenceRequests: string[];
  confidence: "high" | "medium" | "low";
  recommendation: "proceed" | "proceed with evidence request" | "hold" | "reject";
  riskChips: string[];
}

export interface DataCompletenessItem {
  label: string;
  value: number;
}

export interface ValidationModel {
  id: "M0" | "M1" | "M3";
  label: string;
  decisionLogic: string[];
  selectedOptions: string[];
  explanation: string;
}

export interface OptionScores {
  option: FacadeOption;
  f1: number;
  f1Unit: "NZD/m2 facade" | "cost index";
  f2: number;
  d1: number;
  d2: number;
  d3: number;
  f3: number;
  l1Overall: L1Status;
  robustness: "robust" | "moderately sensitive" | "fragile";
  l3Flags: string[];
  m1Score: number;
  m3Decision: "selected" | "conditional" | "held" | "excluded";
  m3Explanation: string;
}

export interface ValidationComparisonRow {
  output: string;
  M0: string;
  M1: string;
  M3: string;
}
