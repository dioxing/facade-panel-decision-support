export type ProcurementType = "design-build" | "eci" | "ipd" | "traditional";

export type RegulatoryContext =
  | "uk-building-safety-act"
  | "sg-bca-dfma"
  | "nz-mbie-eci"
  | "au-nccqld"
  | "none";

export interface ProjectContext {
  projectName: string;
  location: string;
  climateZone: "tropical" | "temperate" | "cold" | "arid" | "coastal";
  buildingTypology:
    | "residential-tower"
    | "office-tower"
    | "mixed-use"
    | "institutional";
  totalHeight: number;
  storeyCount: number;
  procurement: ProcurementType;
  regulatory: RegulatoryContext;
}

export interface Zone {
  id: string;
  label: string;
  heightRange: [number, number];
  resourceQuota: ResourceQuota;
  performanceRequirement: PerformanceRequirement;
}

export interface ResourceQuota {
  craneHoursPerDay: number;
  laydownAreaM2: number;
  deliverySlotsPerDay: number;
  installWindowDays: number;
}

export interface PerformanceRequirement {
  uValueMax: number;
  fireRatingMin: "A1" | "A2" | "B" | "C";
  acousticRwMin: number;
  weatherTightnessClass: "standard" | "enhanced" | "extreme";
}

export interface DocumentSource {
  id: string;
  filename: string;
  sourceType:
    | "epd"
    | "datasheet"
    | "spec"
    | "past-project-boq"
    | "regulation"
    | "site-survey";
  credibilityTier: 1 | 2 | 3;
  uploadedAt: string;
  pageCount: number;
}

export interface DqiVector {
  representativeness: number;
  reliability: number;
  completeness: number;
}

export type SystemTypology =
  | "rainscreen-cladding"
  | "unitised-curtain-wall"
  | "precast-concrete-panel"
  | "grc-panel"
  | "brick-veneer-prefab"
  | "spandrel-window-wall";

export type ParameterKey =
  | "costPerM2"
  | "embodiedCarbonPerM2"
  | "leadTimeWeeks"
  | "uValue"
  | "fireRating"
  | "acousticRw"
  | "maxPanelLength"
  | "maxPanelWeight"
  | "transportClass"
  | "craneLiftCount"
  | "specialisedLabour"
  | "weatherSensitivity"
  | "recyclability";

export interface ExtractedValue {
  id: string;
  parameterKey: ParameterKey;
  candidateSystemId: string;
  value: number | string;
  unit?: string;
  uncertainty?: { lower: number; upper: number };
  sourceDocumentId: string;
  sourcePageRef: number;
  sourceSnippet: string;
  dqi: DqiVector;
  status: "extracted" | "accepted" | "edited" | "rejected";
  editReason?: string;
  editedBy?: ParticipantRole;
  editedAt?: string;
}

export interface CandidateSystem {
  id: string;
  label: string;
  typology: SystemTypology;
  positioning: string;
  parameters: Partial<Record<ParameterKey, ExtractedValue["id"]>>;
  evidenceCoverage: number;
  manualOverrides: Array<{
    parameterKey: ParameterKey;
    value: number | string;
    reason: string;
  }>;
}

export interface HardGate {
  id: string;
  label: string;
  category: "fire" | "thermal" | "structural" | "acoustic";
  requirement: string | number;
  isRegulatory: true;
}

export interface ResourceGate {
  id: string;
  label: string;
  parameterKey: keyof ResourceQuota | "transportLimit" | "liftLimit";
  currentValue: number;
  range: [number, number];
  unit: string;
  uncertaintyStdDev: number;
  zoneId?: string;
}

export interface FeasibilityCell {
  systemId: string;
  zoneId: string;
  pFeasible: number;
  classification: "feasible" | "conditional" | "infeasible";
  bindingGates: string[];
  dqiAggregate: DqiVector;
}

export interface Solution {
  id: string;
  systemAssignment: Record<string, string>;
  cost: number;
  embodiedCarbon: number;
  constructabilityScore: number;
  isPareto: boolean;
  isKnee: boolean;
  feasibilityClassification: "feasible" | "conditional" | "infeasible";
  pMin: number;
  bindingGates: string[];
}

export interface Counterfactual {
  solutionId: string;
  statement: string;
  perturbedGate: string;
  perturbationDelta: number;
  resultingPFeasible: number;
  resultingParetoStatus:
    | "remains-infeasible"
    | "becomes-feasible"
    | "reaches-knee";
}

export type ParticipantRole =
  | "facade-consultant"
  | "main-contractor"
  | "qs"
  | "sustainability"
  | "planner";

export interface AuditEntry {
  id: string;
  timestamp: string;
  actor: ParticipantRole;
  action:
    | "accept"
    | "edit"
    | "reject"
    | "override"
    | "gate-tune"
    | "shortlist";
  targetType: "evidence" | "parameter" | "gate" | "system" | "solution";
  targetId: string;
  before?: unknown;
  after?: unknown;
  reason?: string;
}

export type StageId = 1 | 2 | 3 | 4 | 5;

export interface StageDefinition {
  id: StageId;
  label: string;
  description: string;
}

export const PARAMETER_LABELS: Record<ParameterKey, string> = {
  costPerM2: "Cost per m2",
  embodiedCarbonPerM2: "Embodied carbon",
  leadTimeWeeks: "Lead time",
  uValue: "U-value",
  fireRating: "Fire rating",
  acousticRw: "Acoustic Rw",
  maxPanelLength: "Max panel length",
  maxPanelWeight: "Max panel weight",
  transportClass: "Transport class",
  craneLiftCount: "Crane lift count",
  specialisedLabour: "Specialised labour",
  weatherSensitivity: "Weather sensitivity",
  recyclability: "Recyclability",
};

export const PARAMETER_KEYS: ParameterKey[] = [
  "costPerM2",
  "embodiedCarbonPerM2",
  "leadTimeWeeks",
  "uValue",
  "fireRating",
  "acousticRw",
  "maxPanelLength",
  "maxPanelWeight",
  "transportClass",
  "craneLiftCount",
  "specialisedLabour",
  "weatherSensitivity",
  "recyclability",
];
