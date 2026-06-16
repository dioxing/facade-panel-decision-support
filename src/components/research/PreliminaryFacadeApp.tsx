import { useMemo, useState } from "react";
import {
  ArrowRightLeft,
  BarChart3,
  Boxes,
  ClipboardList,
  Database,
  FileCheck2,
  FileStack,
  Gauge,
  MapPinned,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Target,
  type LucideIcon,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from "recharts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  dataCompleteness,
  facadeOptions,
  projectDataset,
  referenceDataCards,
  validationComparisonRows,
  validationModels,
  workflowSteps,
} from "@/mock/preliminaryFrameworkData";
import {
  calculateOptionScores,
  createValidationSummary,
} from "@/lib/preliminaryFrameworkCalculations";
import type {
  FacadeOption,
  L1GateKey,
  L1Status,
  OptionScores,
  ResearchStepId,
} from "@/types/researchFramework";

type BadgeTone = "default" | "secondary" | "success" | "warning" | "danger" | "outline";

type StressControls = {
  laydown: "low" | "medium" | "high";
  deliveryAccess: "restricted" | "typical" | "flexible";
  craneAccess: "constrained" | "typical" | "favourable";
  supplierLeadTime: "low" | "medium" | "high";
  supplierSubstitution: "low" | "medium" | "high";
  carbonBoundary: "A1-A3" | "A1-A5" | "A1-A5+B4" | "biogenic sensitivity";
};

type StressResult = {
  status: "robust" | "moderately sensitive" | "fragile";
  flags: string[];
  points: number;
};

const l1GateLabels: Record<L1GateKey, string> = {
  productAssurance: "Product assurance",
  e2ExternalMoisture: "E2 external moisture",
  fireExternalWall: "Fire / external wall cladding",
  h1ThermalEnvelope: "H1 thermal envelope",
  b1SeismicMovement: "B1 / seismic / movement",
  b2Durability: "B2 durability",
  transportHardFeasibility: "Transport hard feasibility",
  dataConfidence: "Data confidence",
};

const stepIcons: Record<ResearchStepId, LucideIcon> = {
  "project-data": Database,
  "facade-options": Boxes,
  "l1-feasibility": ShieldCheck,
  "l2-comparison": BarChart3,
  "l3-robustness": Gauge,
  "decision-models": ArrowRightLeft,
  "shortlist-report": FileStack,
};

const l1Variant: Record<L1Status, BadgeTone> = {
  pass: "success",
  "conditional pass": "warning",
  hold: "secondary",
  reject: "danger",
};

const confidenceVariant: Record<FacadeOption["confidence"], BadgeTone> = {
  high: "success",
  medium: "warning",
  low: "danger",
};

const recommendationVariant: Record<FacadeOption["recommendation"], BadgeTone> = {
  proceed: "success",
  "proceed with evidence request": "warning",
  hold: "secondary",
  reject: "danger",
};

const robustnessVariant: Record<StressResult["status"], BadgeTone> = {
  robust: "success",
  "moderately sensitive": "warning",
  fragile: "danger",
};

const decisionVariant: Record<OptionScores["m3Decision"], BadgeTone> = {
  selected: "success",
  conditional: "warning",
  held: "secondary",
  excluded: "danger",
};

const burdenColour = {
  low: "bg-emerald-500",
  medium: "bg-amber-500",
  high: "bg-rose-500",
};

const sensitivityRank = {
  low: 0,
  medium: 1,
  high: 2,
} as const;

const laydownDemand = {
  high: 0,
  medium: 1,
  low: 2,
} as const;

const deliveryDemand = {
  flexible: 0,
  typical: 1,
  restricted: 2,
} as const;

const craneDemand = {
  favourable: 0,
  typical: 1,
  constrained: 2,
} as const;

const scenarioDemand = {
  low: 0,
  medium: 1,
  high: 2,
} as const;

const carbonDemand = {
  "A1-A3": 0,
  "A1-A5": 1,
  "A1-A5+B4": 2,
  "biogenic sensitivity": 2,
} as const;

function burdenTone(value: number) {
  if (value <= 0.35) {
    return "low" as const;
  }

  if (value <= 0.6) {
    return "medium" as const;
  }

  return "high" as const;
}

function titleCase(value: string) {
  return value
    .replace(/[_-]/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatPercent(value: number) {
  return `${Math.round(value * 100)}%`;
}

function formatF1(score: OptionScores) {
  if (score.f1Unit === "NZD/m2 facade") {
    return `$${Math.round(score.f1)}/m2`;
  }

  return `${score.f1.toFixed(2)} index`;
}

function formatF2(score: OptionScores) {
  return `${Math.round(score.f2)} kgCO2e/m2`;
}

function formatF3(score: OptionScores) {
  return score.f3.toFixed(2);
}

function statusTone(status: L1Status) {
  return l1Variant[status];
}

function riskVariant(label: string): BadgeTone {
  if (label.includes("low cost") || label.includes("low carbon") || label.includes("high confidence")) {
    return "success";
  }

  if (label.includes("evidence gap") || label.includes("low confidence")) {
    return "danger";
  }

  if (label.includes("sensitive") || label.includes("risk")) {
    return "warning";
  }

  return "secondary";
}

function stressPoints(level: "low" | "medium" | "high", demand: number) {
  const rank = sensitivityRank[level];

  if (rank === 0 || demand === 0) {
    return 0;
  }

  if (demand === 1) {
    return rank === 2 ? 2 : 1;
  }

  return rank === 2 ? 3 : 2;
}

function evaluateStressTest(option: FacadeOption, controls: StressControls): StressResult {
  const categories = [
    {
      label: "laydown-sensitive",
      points: stressPoints(option.scenarioSensitivity.laydown, laydownDemand[controls.laydown]),
    },
    {
      label: "delivery-sensitive",
      points: stressPoints(
        option.scenarioSensitivity.deliveryAccess,
        deliveryDemand[controls.deliveryAccess],
      ),
    },
    {
      label: "crane-sensitive",
      points: stressPoints(option.scenarioSensitivity.craneAccess, craneDemand[controls.craneAccess]),
    },
    {
      label: "supplier-sensitive",
      points: stressPoints(option.scenarioSensitivity.supplierLeadTime, scenarioDemand[controls.supplierLeadTime]) +
        stressPoints(option.scenarioSensitivity.supplierSubstitution, scenarioDemand[controls.supplierSubstitution]),
    },
    {
      label: "carbon-boundary-sensitive",
      points: stressPoints(option.scenarioSensitivity.carbonBoundary, carbonDemand[controls.carbonBoundary]),
    },
    {
      label: "evidence-sensitive",
      points: stressPoints(option.scenarioSensitivity.evidence, 2),
    },
  ];

  const points = categories.reduce((sum, category) => sum + category.points, 0);
  const flags = categories.filter((category) => category.points > 0).map((category) => category.label);

  if (points >= 11 || flags.length >= 4) {
    return {
      status: "fragile",
      flags,
      points,
    };
  }

  if (points >= 4 || flags.length >= 1) {
    return {
      status: "moderately sensitive",
      flags,
      points,
    };
  }

  return {
    status: "robust",
    flags,
    points,
  };
}

function MetricCard({
  label,
  value,
  helper,
}: {
  label: string;
  value: string;
  helper: string;
}) {
  return (
    <div className="metric-glow rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-slate-950 dark:text-slate-50">{value}</p>
      <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{helper}</p>
    </div>
  );
}

function KeyValue({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-950">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{label}</p>
      <p className="mt-2 text-sm font-semibold text-slate-950 dark:text-slate-50">{value}</p>
    </div>
  );
}

function ProgressBar({ value }: { value: number }) {
  return (
    <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-800">
      <div
        className={`h-2 rounded-full ${value >= 0.75 ? "bg-emerald-500" : value >= 0.55 ? "bg-amber-500" : "bg-rose-500"}`}
        style={{ width: formatPercent(value) }}
      />
    </div>
  );
}

function BurdenBar({ label, value }: { label: string; value: number }) {
  const tone = burdenTone(value);

  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs">
        <span className="font-semibold text-slate-700 dark:text-slate-200">{label}</span>
        <span className="text-slate-500">{value.toFixed(2)}</span>
      </div>
      <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-800">
        <div
          className={`h-2 rounded-full ${burdenColour[tone]}`}
          style={{ width: formatPercent(value) }}
        />
      </div>
    </div>
  );
}

function WorkflowNavigation({
  activeStep,
  onSelectStep,
}: {
  activeStep: ResearchStepId;
  onSelectStep: (step: ResearchStepId) => void;
}) {
  return (
    <Card className="panel-surface">
      <CardHeader className="pb-3">
        <p className="section-title">Workflow</p>
        <CardTitle className="text-xl text-slate-950 dark:text-slate-50">
          Seven-step preliminary shortlist workflow
        </CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-7">
        {workflowSteps.map((step) => {
          const Icon = stepIcons[step.id];
          const isActive = step.id === activeStep;

          return (
            <button
              className={`rounded-2xl border p-4 text-left transition ${
                isActive
                  ? "border-blue-500 bg-blue-50 shadow-sm dark:border-blue-400 dark:bg-blue-500/15"
                  : "border-slate-200 bg-white hover:border-blue-200 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950 dark:hover:border-blue-500/50 dark:hover:bg-slate-900"
              }`}
              key={step.id}
              onClick={() => onSelectStep(step.id)}
              type="button"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                    Step {step.number}
                  </p>
                  <p className="mt-2 text-sm font-semibold text-slate-950 dark:text-slate-50">
                    {step.label}
                  </p>
                </div>
                <div
                  className={`rounded-xl p-2 ${
                    isActive
                      ? "bg-blue-600 text-white"
                      : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-200"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                </div>
              </div>
              <p className="mt-3 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                {step.description}
              </p>
            </button>
          );
        })}
      </CardContent>
    </Card>
  );
}

function ProjectDataScreen({ scores }: { scores: OptionScores[] }) {
  const nzdScores = scores.filter((score) => score.f1Unit === "NZD/m2 facade");
  const averageCost =
    nzdScores.reduce((sum, score) => sum + score.f1, 0) / Math.max(1, nzdScores.length);
  const averageCarbon = scores.reduce((sum, score) => sum + score.f2, 0) / scores.length;
  const conditionalCount = scores.filter((score) => score.l1Overall === "conditional pass").length;

  return (
    <div className="grid gap-4 xl:grid-cols-[1.14fr_0.86fr]">
      <Card className="panel-surface">
        <CardHeader>
          <p className="section-title">Project data</p>
          <CardTitle className="text-2xl text-slate-950 dark:text-slate-50">
            Project brief, context, and decision scope
          </CardTitle>
          <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
            This screen defines the preliminary project basis before options are screened. It supports
            preliminary facade shortlisting, screens evidence status, and prepares the inputs used in L1,
            L2, and L3.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-2">
            <KeyValue label="Project name" value={projectDataset.projectName} />
            <KeyValue label="Location" value={projectDataset.location} />
            <KeyValue label="Building use" value={projectDataset.buildingUse} />
            <KeyValue label="Height band" value={projectDataset.heightBand} />
            <KeyValue label="Facade area" value={`${projectDataset.facadeArea.toLocaleString()} m2`} />
            <KeyValue label="Facade zones" value={projectDataset.facadeZones.join(", ")} />
            <KeyValue label="Grid / bay" value={projectDataset.grid} />
            <KeyValue label="Floor-to-floor height" value={`${projectDataset.floorHeight.toFixed(2)} m`} />
            <KeyValue label="WWR" value={formatPercent(projectDataset.wwr)} />
            <KeyValue label="Thermal target" value={projectDataset.thermalTarget} />
            <KeyValue label="Procurement route" value={projectDataset.procurementRoute} />
            <KeyValue label="Site access category" value={titleCase(projectDataset.siteAccess)} />
            <KeyValue label="Laydown category" value={titleCase(projectDataset.laydown)} />
            <KeyValue label="Crane access category" value={titleCase(projectDataset.craneAccess)} />
            <KeyValue label="Delivery access category" value={titleCase(projectDataset.deliveryAccess)} />
          </div>
          <div className="rounded-2xl border border-blue-200 bg-blue-50/90 p-4 text-sm leading-relaxed text-blue-900 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-100">
            The prototype does not verify NZ Building Code compliance or produce a final facade design. It
            screens compliance-evidence status, estimates supply-side cost or cost index, estimates
            preliminary constructability burden, stress-tests delivery uncertainty, and generates
            decision-support solution cards.
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4">
        <Card className="panel-surface">
          <CardHeader>
            <p className="section-title">Completeness</p>
            <CardTitle>Minimum viable dataset coverage</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {dataCompleteness.map((item) => (
              <div className="space-y-2" key={item.label}>
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-slate-700 dark:text-slate-200">{titleCase(item.label)}</span>
                  <span className="text-slate-500">{formatPercent(item.value)}</span>
                </div>
                <ProgressBar value={item.value} />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="panel-surface">
          <CardHeader>
            <p className="section-title">Reference data</p>
            <CardTitle>Connected evidence layers</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {referenceDataCards.map((item) => (
              <Badge className="text-[11px]" key={item} variant="outline">
                {item}
              </Badge>
            ))}
          </CardContent>
        </Card>

        <Card className="panel-surface">
          <CardHeader>
            <p className="section-title">Current baseline</p>
            <CardTitle>What the loaded dataset currently shows</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-3">
            <MetricCard
              helper="NZD-priced options only"
              label="Average F1"
              value={`$${Math.round(averageCost)}/m2`}
            />
            <MetricCard
              helper="All seven loaded options"
              label="Average F2"
              value={`${Math.round(averageCarbon)} kgCO2e/m2`}
            />
            <MetricCard
              helper="Options still viable for interpretation"
              label="L1 Conditional"
              value={`${conditionalCount}`}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function FacadeOptionsScreen({
  scores,
  selectedOptionId,
  onSelectOption,
}: {
  scores: OptionScores[];
  selectedOptionId: string;
  onSelectOption: (optionId: string) => void;
}) {
  const selectedScore = scores.find((score) => score.option.id === selectedOptionId) ?? scores[0];

  return (
    <div className="grid gap-4 xl:grid-cols-[1.12fr_0.88fr]">
      <Card className="panel-surface">
        <CardHeader>
          <p className="section-title">Facade options</p>
          <CardTitle className="text-2xl text-slate-950 dark:text-slate-50">
            Candidate systems loaded for comparison
          </CardTitle>
          <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
            Select a system to inspect the option-level inputs that feed L1 feasibility, L2 cost-carbon-
            constructability comparison, and L3 scenario stress testing.
          </p>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          {scores.map((score) => {
            const isSelected = score.option.id === selectedOptionId;

            return (
              <button
                className={`rounded-2xl border p-4 text-left transition ${
                  isSelected
                    ? "border-blue-500 bg-blue-50 shadow-sm dark:border-blue-400 dark:bg-blue-500/15"
                    : "border-slate-200 bg-white hover:border-blue-200 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950 dark:hover:border-blue-500/40 dark:hover:bg-slate-900"
                }`}
                key={score.option.id}
                onClick={() => onSelectOption(score.option.id)}
                type="button"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                      {score.option.id}
                    </p>
                    <p className="mt-2 text-base font-semibold text-slate-950 dark:text-slate-50">
                      {score.option.name}
                    </p>
                    <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                      {titleCase(score.option.systemFamily)}
                    </p>
                  </div>
                  <Badge variant={confidenceVariant[score.option.confidence]}>
                    {titleCase(score.option.confidence)} confidence
                  </Badge>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Badge variant={statusTone(score.l1Overall)}>{score.l1Overall}</Badge>
                  <Badge variant={decisionVariant[score.m3Decision]}>{titleCase(score.m3Decision)}</Badge>
                </div>
                <div className="mt-4 grid grid-cols-3 gap-3 text-sm">
                  <div>
                    <p className="text-xs uppercase tracking-[0.14em] text-slate-500">F1</p>
                    <p className="mt-1 font-semibold text-slate-900 dark:text-slate-100">{formatF1(score)}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.14em] text-slate-500">F2</p>
                    <p className="mt-1 font-semibold text-slate-900 dark:text-slate-100">{Math.round(score.f2)}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.14em] text-slate-500">F3</p>
                    <p className="mt-1 font-semibold text-slate-900 dark:text-slate-100">{formatF3(score)}</p>
                  </div>
                </div>
                <div className="mt-4 grid gap-2 text-sm text-slate-600 dark:text-slate-300">
                  <p>Material: {score.option.material}</p>
                  <p>Insulation: {score.option.insulation}</p>
                  <p>Supplier source: {titleCase(score.option.supplierSource)}</p>
                </div>
              </button>
            );
          })}
        </CardContent>
      </Card>

      <Card className="panel-surface">
        <CardHeader>
          <p className="section-title">Selected option</p>
          <CardTitle>{selectedScore.option.name}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Badge variant={recommendationVariant[selectedScore.option.recommendation]}>
              {selectedScore.option.recommendation}
            </Badge>
            <Badge variant={statusTone(selectedScore.l1Overall)}>{selectedScore.l1Overall}</Badge>
            <Badge variant={confidenceVariant[selectedScore.option.confidence]}>
              {titleCase(selectedScore.option.confidence)} confidence
            </Badge>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <KeyValue label="System family" value={titleCase(selectedScore.option.systemFamily)} />
            <KeyValue label="External material" value={selectedScore.option.material} />
            <KeyValue label="Insulation type" value={selectedScore.option.insulation} />
            <KeyValue label="Build-up thickness" value={selectedScore.option.buildUpThickness} />
            <KeyValue label="Panel size" value={selectedScore.option.panelSize} />
            <KeyValue label="Panel weight" value={selectedScore.option.panelWeight} />
            <KeyValue label="Connection concept" value={selectedScore.option.connectionType} />
            <KeyValue
              label="Standardisation level"
              value={`${selectedScore.option.standardisationLevel} / 5`}
            />
            <KeyValue
              label="Wet or dry joint condition"
              value={titleCase(selectedScore.option.wetTradeDependency)}
            />
            <KeyValue label="Supplier source" value={titleCase(selectedScore.option.supplierSource)} />
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <MetricCard helper="Supply-side facade cost" label="F1" value={formatF1(selectedScore)} />
            <MetricCard helper="A1-A5 upfront carbon" label="F2" value={formatF2(selectedScore)} />
            <MetricCard helper="Preliminary constructability burden" label="F3" value={formatF3(selectedScore)} />
          </div>

          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Risk chips</p>
            <div className="flex flex-wrap gap-2">
              {selectedScore.option.riskChips.map((chip) => (
                <Badge key={chip} variant={riskVariant(chip)}>
                  {chip}
                </Badge>
              ))}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                Diagnostics
              </p>
              <div className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
                {selectedScore.option.diagnostics.map((item) => (
                  <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 dark:border-slate-800 dark:bg-slate-950" key={item}>
                    {item}
                  </div>
                ))}
              </div>
            </div>
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                Evidence requests
              </p>
              <div className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
                {selectedScore.option.evidenceRequests.map((item) => (
                  <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 dark:border-slate-800 dark:bg-slate-950" key={item}>
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function L1FeasibilityScreen({
  scores,
  selectedOptionId,
  onSelectOption,
}: {
  scores: OptionScores[];
  selectedOptionId: string;
  onSelectOption: (optionId: string) => void;
}) {
  const selectedScore = scores.find((score) => score.option.id === selectedOptionId) ?? scores[0];
  const summary = {
    pass: scores.filter((score) => score.l1Overall === "pass").length,
    conditional: scores.filter((score) => score.l1Overall === "conditional pass").length,
    hold: scores.filter((score) => score.l1Overall === "hold").length,
    reject: scores.filter((score) => score.l1Overall === "reject").length,
  };

  return (
    <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
      <Card className="panel-surface">
        <CardHeader>
          <p className="section-title">L1 feasibility</p>
          <CardTitle className="text-2xl text-slate-950 dark:text-slate-50">
            Evidence status and preliminary feasibility matrix
          </CardTitle>
          <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
            L1 is an evidence-status screen. It does not verify compliance. It shows whether the current
            preliminary dataset is pass, conditional pass, hold, or reject by gate.
          </p>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="min-w-[1120px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 dark:border-slate-800">
                <th className="px-3 py-3 font-semibold">Option</th>
                <th className="px-3 py-3 font-semibold">Overall</th>
                {Object.entries(l1GateLabels).map(([key, label]) => (
                  <th className="px-3 py-3 font-semibold" key={key}>
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {scores.map((score) => {
                const isSelected = score.option.id === selectedOptionId;

                return (
                  <tr
                    className={`border-b border-slate-100 dark:border-slate-900 ${isSelected ? "bg-blue-50/80 dark:bg-blue-500/10" : ""}`}
                    key={score.option.id}
                  >
                    <td className="px-3 py-3">
                      <button
                        className="text-left"
                        onClick={() => onSelectOption(score.option.id)}
                        type="button"
                      >
                        <p className="font-semibold text-slate-950 dark:text-slate-50">{score.option.name}</p>
                        <p className="text-xs text-slate-500">{score.option.id}</p>
                      </button>
                    </td>
                    <td className="px-3 py-3">
                      <Badge variant={statusTone(score.l1Overall)}>{score.l1Overall}</Badge>
                    </td>
                    {Object.keys(l1GateLabels).map((gate) => (
                      <td className="px-3 py-3" key={gate}>
                        <Badge variant={statusTone(score.option.l1Evidence[gate as L1GateKey])}>
                          {score.option.l1Evidence[gate as L1GateKey]}
                        </Badge>
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <div className="grid gap-4">
        <Card className="panel-surface">
          <CardHeader>
            <p className="section-title">L1 summary</p>
            <CardTitle>Status distribution</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            <MetricCard helper="No unresolved L1 issues" label="Pass" value={`${summary.pass}`} />
            <MetricCard helper="Interpret with evidence requests" label="Conditional" value={`${summary.conditional}`} />
            <MetricCard helper="Missing evidence blocks interpretation" label="Hold" value={`${summary.hold}`} />
            <MetricCard helper="Not suitable for shortlist" label="Reject" value={`${summary.reject}`} />
          </CardContent>
        </Card>

        <Card className="panel-surface">
          <CardHeader>
            <p className="section-title">Evidence requests</p>
            <CardTitle>{selectedScore.option.name}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap gap-2">
              <Badge variant={statusTone(selectedScore.l1Overall)}>{selectedScore.l1Overall}</Badge>
              <Badge variant={confidenceVariant[selectedScore.option.confidence]}>
                {titleCase(selectedScore.option.confidence)} confidence
              </Badge>
            </div>
            {selectedScore.option.evidenceRequests.map((item) => (
              <div
                className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200"
                key={item}
              >
                {item}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function L2ComparisonScreen({
  scores,
  selectedOptionId,
  onSelectOption,
}: {
  scores: OptionScores[];
  selectedOptionId: string;
  onSelectOption: (optionId: string) => void;
}) {
  const selectedScore = scores.find((score) => score.option.id === selectedOptionId) ?? scores[0];
  const scatterScores = scores.filter((score) => score.f1Unit === "NZD/m2 facade");
  const barData = scores.map((score) => ({
    id: score.option.id,
    name: score.option.id,
    f3: Number(score.f3.toFixed(3)),
  }));

  return (
    <div className="grid gap-4 xl:grid-cols-[1.18fr_0.82fr]">
      <div className="grid gap-4">
        <Card className="panel-surface">
          <CardHeader>
            <p className="section-title">L2 comparison</p>
            <CardTitle className="text-2xl text-slate-950 dark:text-slate-50">
              Cost, carbon, and constructability side by side
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-3">
            <MetricCard
              helper="F1 = (Cmaterial + Cfabrication + Cconnection + Ctransport + Callowance) / Afacade"
              label="F1 supply-side facade cost"
              value={formatF1(selectedScore)}
            />
            <MetricCard
              helper="F2 = (sum qi x EFi + A4 transport + A5 construction/waste) / Afacade"
              label="F2 A1-A5 carbon"
              value={formatF2(selectedScore)}
            />
            <MetricCard
              helper="F3 = (D1 + D2 + D3) / 3 on a 0-1 burden scale"
              label="F3 constructability burden"
              value={formatF3(selectedScore)}
            />
          </CardContent>
        </Card>

        <Card className="panel-surface">
          <CardHeader>
            <p className="section-title">Pareto-style view</p>
            <CardTitle>Cost vs carbon, with F3 burden as bubble size</CardTitle>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              The scatter plot includes options with NZD/m2 cost values. Options represented only by cost
              index remain in the table and constructability charts.
            </p>
          </CardHeader>
          <CardContent className="h-[380px]">
            <ResponsiveContainer height="100%" width="100%">
              <ScatterChart margin={{ top: 16, right: 24, bottom: 12, left: 12 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#d6deea" />
                <XAxis
                  dataKey="f1"
                  domain={["dataMin - 40", "dataMax + 40"]}
                  name="F1"
                  tick={{ fill: "#64748b", fontSize: 12 }}
                  type="number"
                />
                <YAxis
                  dataKey="f2"
                  domain={["dataMin - 10", "dataMax + 10"]}
                  name="F2"
                  tick={{ fill: "#64748b", fontSize: 12 }}
                  type="number"
                />
                <ZAxis dataKey="f3" range={[120, 420]} />
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) {
                      return null;
                    }

                    const point = payload[0]?.payload as OptionScores | undefined;

                    if (!point) {
                      return null;
                    }

                    return (
                      <div className="rounded-2xl border border-slate-200 bg-white p-3 text-sm shadow-lg dark:border-slate-800 dark:bg-slate-950">
                        <p className="font-semibold text-slate-950 dark:text-slate-50">{point.option.name}</p>
                        <p className="mt-1 text-slate-600 dark:text-slate-300">{formatF1(point)}</p>
                        <p className="text-slate-600 dark:text-slate-300">{formatF2(point)}</p>
                        <p className="text-slate-600 dark:text-slate-300">F3 {formatF3(point)}</p>
                      </div>
                    );
                  }}
                />
                <Scatter
                  data={scatterScores}
                  shape={(props: {
                    cx?: number;
                    cy?: number;
                    payload?: OptionScores;
                  }) => {
                    const point = props.payload;

                    if (!point || typeof props.cx !== "number" || typeof props.cy !== "number") {
                      return null;
                    }

                    const radius = 10 + point.f3 * 14;
                    const fill =
                      point.option.id === selectedOptionId
                        ? "#2563eb"
                        : point.m3Decision === "selected"
                          ? "#0f766e"
                          : point.l1Overall === "hold"
                            ? "#64748b"
                            : "#f59e0b";

                    return (
                      <circle
                        cx={props.cx}
                        cy={props.cy}
                        fill={fill}
                        fillOpacity={0.82}
                        r={radius}
                        stroke={point.option.id === selectedOptionId ? "#0f172a" : "#ffffff"}
                        strokeWidth={point.option.id === selectedOptionId ? 3 : 1.5}
                      />
                    );
                  }}
                >
                  {scatterScores.map((score) => (
                    <Cell key={score.option.id} onClick={() => onSelectOption(score.option.id)} />
                  ))}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="panel-surface">
          <CardHeader>
            <p className="section-title">Comparison table</p>
            <CardTitle>Loaded option values used in L2</CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <table className="min-w-[860px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 dark:border-slate-800">
                  <th className="px-3 py-3 font-semibold">Option</th>
                  <th className="px-3 py-3 font-semibold">F1</th>
                  <th className="px-3 py-3 font-semibold">F2</th>
                  <th className="px-3 py-3 font-semibold">F3</th>
                  <th className="px-3 py-3 font-semibold">L1</th>
                  <th className="px-3 py-3 font-semibold">M3 view</th>
                </tr>
              </thead>
              <tbody>
                {scores.map((score) => {
                  const isSelected = score.option.id === selectedOptionId;

                  return (
                    <tr
                      className={`border-b border-slate-100 dark:border-slate-900 ${isSelected ? "bg-blue-50/80 dark:bg-blue-500/10" : ""}`}
                      key={score.option.id}
                    >
                      <td className="px-3 py-3">
                        <button
                          className="text-left"
                          onClick={() => onSelectOption(score.option.id)}
                          type="button"
                        >
                          <p className="font-semibold text-slate-950 dark:text-slate-50">{score.option.name}</p>
                          <p className="text-xs text-slate-500">{score.option.id}</p>
                        </button>
                      </td>
                      <td className="px-3 py-3">{formatF1(score)}</td>
                      <td className="px-3 py-3">{formatF2(score)}</td>
                      <td className="px-3 py-3">{formatF3(score)}</td>
                      <td className="px-3 py-3">
                        <Badge variant={statusTone(score.l1Overall)}>{score.l1Overall}</Badge>
                      </td>
                      <td className="px-3 py-3">
                        <Badge variant={decisionVariant[score.m3Decision]}>{titleCase(score.m3Decision)}</Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4">
        <Card className="panel-surface">
          <CardHeader>
            <p className="section-title">Selected option profile</p>
            <CardTitle>{selectedScore.option.name}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-3">
              <MetricCard helper="Current cost expression" label="F1" value={formatF1(selectedScore)} />
              <MetricCard helper="A1-A5 total" label="F2" value={formatF2(selectedScore)} />
              <MetricCard helper="Lower is better" label="F3" value={formatF3(selectedScore)} />
            </div>
            <div className="space-y-3">
              <BurdenBar label="D1 standardisation / offsite readiness" value={selectedScore.d1} />
              <BurdenBar label="D2 interface / assembly / tolerance" value={selectedScore.d2} />
              <BurdenBar label="D3 handling / access / detailing" value={selectedScore.d3} />
            </div>
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                Diagnostics
              </p>
              <div className="space-y-2">
                {selectedScore.option.diagnostics.map((item) => (
                  <div
                    className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200"
                    key={item}
                  >
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="panel-surface">
          <CardHeader>
            <p className="section-title">Constructability burden chart</p>
            <CardTitle>F3 by option</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer height="100%" width="100%">
              <BarChart data={barData} margin={{ top: 12, right: 12, bottom: 12, left: 0 }}>
                <CartesianGrid stroke="#d6deea" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tick={{ fill: "#64748b", fontSize: 12 }} />
                <YAxis domain={[0, 0.8]} tick={{ fill: "#64748b", fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="f3" radius={[10, 10, 0, 0]}>
                  {barData.map((entry) => (
                    <Cell
                      fill={entry.id === selectedOptionId ? "#2563eb" : "#7c93e6"}
                      key={entry.id}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function ScenarioField({
  label,
  helper,
  value,
  options,
  onChange,
}: {
  label: string;
  helper: string;
  value: string;
  options: Array<{ value: string; label: string }>;
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-2">
      <div>
        <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{label}</p>
        <p className="text-xs text-slate-500">{helper}</p>
      </div>
      <Select onValueChange={onChange} value={value}>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function L3RobustnessScreen({
  scores,
  stressControls,
  stressResults,
  selectedOptionId,
  onSelectOption,
  onStressChange,
}: {
  scores: OptionScores[];
  stressControls: StressControls;
  stressResults: Record<string, StressResult>;
  selectedOptionId: string;
  onSelectOption: (optionId: string) => void;
  onStressChange: <K extends keyof StressControls>(key: K, value: StressControls[K]) => void;
}) {
  const selectedScore = scores.find((score) => score.option.id === selectedOptionId) ?? scores[0];
  const selectedStress = stressResults[selectedScore.option.id];
  const robustCount = scores.filter((score) => stressResults[score.option.id].status === "robust").length;
  const moderateCount = scores.filter(
    (score) => stressResults[score.option.id].status === "moderately sensitive",
  ).length;
  const fragileCount = scores.filter((score) => stressResults[score.option.id].status === "fragile").length;

  return (
    <div className="grid gap-4 xl:grid-cols-[0.92fr_1.08fr]">
      <div className="grid gap-4">
        <Card className="panel-surface">
          <CardHeader>
            <p className="section-title">L3 robustness</p>
            <CardTitle className="text-2xl text-slate-950 dark:text-slate-50">
              Scenario stress testing and decision explanation
            </CardTitle>
            <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
              L3 is not a fourth objective. It stress-tests delivery uncertainty, supplier exposure, carbon
              boundary assumptions, and evidence fragility.
            </p>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <ScenarioField
              helper="Constrained local storage and sequencing buffer"
              label="Laydown"
              onChange={(value) => onStressChange("laydown", value as StressControls["laydown"])}
              options={[
                { label: "Low availability", value: "low" },
                { label: "Medium availability", value: "medium" },
                { label: "High availability", value: "high" },
              ]}
              value={stressControls.laydown}
            />
            <ScenarioField
              helper="Booking and site-entry friction"
              label="Delivery access"
              onChange={(value) =>
                onStressChange("deliveryAccess", value as StressControls["deliveryAccess"])
              }
              options={[
                { label: "Restricted", value: "restricted" },
                { label: "Typical", value: "typical" },
                { label: "Flexible", value: "flexible" },
              ]}
              value={stressControls.deliveryAccess}
            />
            <ScenarioField
              helper="Hook time, reach, and competing lifts"
              label="Crane access"
              onChange={(value) => onStressChange("craneAccess", value as StressControls["craneAccess"])}
              options={[
                { label: "Constrained", value: "constrained" },
                { label: "Typical", value: "typical" },
                { label: "Favourable", value: "favourable" },
              ]}
              value={stressControls.craneAccess}
            />
            <ScenarioField
              helper="Procurement delay exposure"
              label="Supplier lead time"
              onChange={(value) =>
                onStressChange("supplierLeadTime", value as StressControls["supplierLeadTime"])
              }
              options={[
                { label: "Low risk", value: "low" },
                { label: "Medium risk", value: "medium" },
                { label: "High risk", value: "high" },
              ]}
              value={stressControls.supplierLeadTime}
            />
            <ScenarioField
              helper="Replacement or fallback availability"
              label="Supplier substitution risk"
              onChange={(value) =>
                onStressChange("supplierSubstitution", value as StressControls["supplierSubstitution"])
              }
              options={[
                { label: "Low risk", value: "low" },
                { label: "Medium risk", value: "medium" },
                { label: "High risk", value: "high" },
              ]}
              value={stressControls.supplierSubstitution}
            />
            <ScenarioField
              helper="How wide the carbon accounting boundary is taken"
              label="Carbon boundary"
              onChange={(value) =>
                onStressChange("carbonBoundary", value as StressControls["carbonBoundary"])
              }
              options={[
                { label: "A1-A3", value: "A1-A3" },
                { label: "A1-A5", value: "A1-A5" },
                { label: "A1-A5 + B4", value: "A1-A5+B4" },
                { label: "Biogenic sensitivity", value: "biogenic sensitivity" },
              ]}
              value={stressControls.carbonBoundary}
            />
          </CardContent>
        </Card>

        <Card className="panel-surface">
          <CardHeader>
            <p className="section-title">Current scenario output</p>
            <CardTitle>Selected option: {selectedScore.option.name}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-3">
              <MetricCard helper="Current scenario result" label="L3 status" value={titleCase(selectedStress.status)} />
              <MetricCard helper="Baseline from the mock dataset" label="Stored robustness" value={titleCase(selectedScore.robustness)} />
              <MetricCard helper="Higher points mean more exposure" label="Stress points" value={`${selectedStress.points}`} />
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant={robustnessVariant[selectedStress.status]}>{selectedStress.status}</Badge>
              {selectedStress.flags.length ? (
                selectedStress.flags.map((flag) => (
                  <Badge key={flag} variant="warning">
                    {flag}
                  </Badge>
                ))
              ) : (
                <Badge variant="success">No current L3 flags</Badge>
              )}
            </div>
            <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
              This view explains why an option remains robust, becomes moderately sensitive, or becomes
              fragile under the selected delivery and supply scenario.
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="panel-surface">
        <CardHeader>
          <p className="section-title">Option-level stress output</p>
          <CardTitle>Robustness under the active scenario</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <MetricCard helper="Still stable under current stress" label="Robust" value={`${robustCount}`} />
            <MetricCard helper="Needs explanation or caution" label="Moderate" value={`${moderateCount}`} />
            <MetricCard helper="Shortlist confidence is weak" label="Fragile" value={`${fragileCount}`} />
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {scores.map((score) => {
              const result = stressResults[score.option.id];
              const isSelected = score.option.id === selectedOptionId;

              return (
                <button
                  className={`rounded-2xl border p-4 text-left transition ${
                    isSelected
                      ? "border-blue-500 bg-blue-50 shadow-sm dark:border-blue-400 dark:bg-blue-500/15"
                      : "border-slate-200 bg-white hover:border-blue-200 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950 dark:hover:border-blue-500/40 dark:hover:bg-slate-900"
                  }`}
                  key={score.option.id}
                  onClick={() => onSelectOption(score.option.id)}
                  type="button"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-950 dark:text-slate-50">{score.option.name}</p>
                      <p className="text-xs text-slate-500">{score.option.id}</p>
                    </div>
                    <Badge variant={robustnessVariant[result.status]}>{result.status}</Badge>
                  </div>
                  <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
                    Stored robustness: {score.robustness}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {result.flags.length ? (
                      result.flags.map((flag) => (
                        <Badge key={flag} variant="warning">
                          {flag}
                        </Badge>
                      ))
                    ) : (
                      <Badge variant="success">No current flags</Badge>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function DecisionModelsScreen({
  scores,
  onSelectOption,
}: {
  scores: OptionScores[];
  onSelectOption: (optionId: string) => void;
}) {
  const summary = createValidationSummary(scores);
  const optionById = new Map(scores.map((score) => [score.option.id, score]));
  const selectedByModel = {
    M0: summary.m0,
    M1: summary.m1,
    M3: summary.m3,
  };
  const newInM3 = summary.m3.filter((id) => !summary.m1.includes(id));
  const removedFromM3 = summary.m1.filter((id) => !summary.m3.includes(id));

  return (
    <div className="space-y-4">
      <Card className="panel-surface">
        <CardHeader>
          <p className="section-title">Decision models</p>
          <CardTitle className="text-2xl text-slate-950 dark:text-slate-50">
            M0, M1, and M3 side by side
          </CardTitle>
          <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
            The prototype compares baseline decision logics rather than claiming that one facade system is
            universally optimal.
          </p>
        </CardHeader>
        <CardContent className="grid gap-4 xl:grid-cols-3">
          {validationModels.map((model) => (
            <div
              className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-950"
              key={model.id}
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="section-title">{model.id}</p>
                  <p className="mt-2 text-lg font-semibold text-slate-950 dark:text-slate-50">{model.label}</p>
                </div>
                <Badge variant={model.id === "M3" ? "default" : "outline"}>{model.id}</Badge>
              </div>
              <div className="mt-4 space-y-2 text-sm text-slate-600 dark:text-slate-300">
                {model.decisionLogic.map((item) => (
                  <p key={item}>{item}</p>
                ))}
              </div>
              <div className="mt-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Selected options</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {selectedByModel[model.id].map((optionId) => (
                    <button key={optionId} onClick={() => onSelectOption(optionId)} type="button">
                      <Badge variant={model.id === "M3" ? "success" : "outline"}>
                        {optionId} {optionById.get(optionId)?.option.name}
                      </Badge>
                    </button>
                  ))}
                </div>
              </div>
              <p className="mt-4 text-sm leading-relaxed text-slate-600 dark:text-slate-300">{model.explanation}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
        <Card className="panel-surface">
          <CardHeader>
            <p className="section-title">Comparison outputs</p>
            <CardTitle>What each model includes</CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <table className="min-w-[640px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 dark:border-slate-800">
                  <th className="px-3 py-3 font-semibold">Output</th>
                  <th className="px-3 py-3 font-semibold">M0</th>
                  <th className="px-3 py-3 font-semibold">M1</th>
                  <th className="px-3 py-3 font-semibold">M3</th>
                </tr>
              </thead>
              <tbody>
                {validationComparisonRows.map((row) => (
                  <tr className="border-b border-slate-100 dark:border-slate-900" key={row.output}>
                    <td className="px-3 py-3 font-medium text-slate-950 dark:text-slate-50">{row.output}</td>
                    <td className="px-3 py-3">{row.M0}</td>
                    <td className="px-3 py-3">{row.M1}</td>
                    <td className="px-3 py-3">{row.M3}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>

        <div className="grid gap-4">
          <Card className="panel-surface">
            <CardHeader>
              <p className="section-title">Model delta</p>
              <CardTitle>Why M3 changes the shortlist</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-slate-600 dark:text-slate-300">
              <div>
                <p className="font-semibold text-slate-950 dark:text-slate-50">Shortlist overlap</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {summary.overlap.map((id) => (
                    <Badge key={id} variant="success">
                      {id} {optionById.get(id)?.option.name}
                    </Badge>
                  ))}
                </div>
              </div>
              <div>
                <p className="font-semibold text-slate-950 dark:text-slate-50">Removed after L1/L3 become explicit</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {removedFromM3.map((id) => (
                    <Badge key={id} variant="warning">
                      {id} {optionById.get(id)?.option.name}
                    </Badge>
                  ))}
                </div>
              </div>
              <div>
                <p className="font-semibold text-slate-950 dark:text-slate-50">Added in M3</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {newInM3.map((id) => (
                    <Badge key={id} variant="success">
                      {id} {optionById.get(id)?.option.name}
                    </Badge>
                  ))}
                </div>
              </div>
              <div>
                <p className="font-semibold text-slate-950 dark:text-slate-50">Options held by L1</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {summary.held.map((id) => (
                    <Badge key={id} variant="secondary">
                      {id} {optionById.get(id)?.option.name}
                    </Badge>
                  ))}
                </div>
              </div>
              <div>
                <p className="font-semibold text-slate-950 dark:text-slate-50">Options flagged by L3</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {summary.flagged.map((id) => (
                    <Badge key={id} variant="warning">
                      {id} {optionById.get(id)?.option.name}
                    </Badge>
                  ))}
                </div>
              </div>
              <p>{summary.reason}</p>
            </CardContent>
          </Card>

          <Card className="panel-surface">
            <CardHeader>
              <p className="section-title">Validation claim</p>
              <CardTitle>What this demonstrator claims</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                The proposed framework is not validated by proving one facade system is universally optimal.
                It is validated by showing that preliminary facade data can be transformed into traceable,
                explainable, scenario-tested, and reviewable decision outputs.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function ShortlistReportScreen({
  scores,
  stressResults,
  selectedOptionId,
  onSelectOption,
}: {
  scores: OptionScores[];
  stressResults: Record<string, StressResult>;
  selectedOptionId: string;
  onSelectOption: (optionId: string) => void;
}) {
  const summary = createValidationSummary(scores);
  const shortlist = summary.m3
    .map((optionId) => scores.find((score) => score.option.id === optionId))
    .filter((score): score is OptionScores => Boolean(score));

  return (
    <div className="space-y-4">
      <Card className="panel-surface">
        <CardHeader>
          <p className="section-title">Shortlist and report</p>
          <CardTitle className="text-2xl text-slate-950 dark:text-slate-50">
            Final preliminary shortlist and solution cards
          </CardTitle>
          <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
            These cards combine L1 evidence status, F1/F2/F3 values, L3 scenario sensitivity, diagnostics,
            and evidence requests into a discussion-ready shortlist.
          </p>
        </CardHeader>
        <CardContent className="grid gap-4 xl:grid-cols-3">
          {shortlist.map((score) => {
            const result = stressResults[score.option.id];
            const isSelected = score.option.id === selectedOptionId;

            return (
              <button
                className={`rounded-[1.4rem] border p-5 text-left transition ${
                  isSelected
                    ? "border-blue-500 bg-blue-50 shadow-sm dark:border-blue-400 dark:bg-blue-500/15"
                    : "border-slate-200 bg-white hover:border-blue-200 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950 dark:hover:border-blue-500/40 dark:hover:bg-slate-900"
                }`}
                key={score.option.id}
                onClick={() => onSelectOption(score.option.id)}
                type="button"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="section-title">{score.option.id}</p>
                    <p className="mt-2 text-lg font-semibold text-slate-950 dark:text-slate-50">
                      {score.option.name}
                    </p>
                    <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                      {titleCase(score.option.systemFamily)}
                    </p>
                  </div>
                  <Badge variant={recommendationVariant[score.option.recommendation]}>
                    {score.option.recommendation}
                  </Badge>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  <MetricCard helper="Cost or index" label="F1" value={formatF1(score)} />
                  <MetricCard helper="A1-A5" label="F2" value={formatF2(score)} />
                  <MetricCard helper="Lower is better" label="F3" value={formatF3(score)} />
                </div>

                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  <KeyValue label="Material" value={score.option.material} />
                  <KeyValue label="Insulation" value={score.option.insulation} />
                  <KeyValue label="Panel size" value={score.option.panelSize} />
                  <KeyValue label="Connection" value={score.option.connectionType} />
                </div>

                <div className="mt-4 space-y-3">
                  <BurdenBar label="D1" value={score.d1} />
                  <BurdenBar label="D2" value={score.d2} />
                  <BurdenBar label="D3" value={score.d3} />
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <Badge variant={statusTone(score.l1Overall)}>{score.l1Overall}</Badge>
                  <Badge variant={robustnessVariant[result.status]}>{result.status}</Badge>
                  <Badge variant={confidenceVariant[score.option.confidence]}>
                    {titleCase(score.option.confidence)} confidence
                  </Badge>
                </div>

                <div className="mt-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Risk chips</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {score.option.riskChips.map((chip) => (
                      <Badge key={chip} variant={riskVariant(chip)}>
                        {chip}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="mt-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">L3 flags</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {result.flags.length ? (
                      result.flags.map((flag) => (
                        <Badge key={flag} variant="warning">
                          {flag}
                        </Badge>
                      ))
                    ) : (
                      <Badge variant="success">No current flags</Badge>
                    )}
                  </div>
                </div>

                <div className="mt-4 space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Diagnostics</p>
                  {score.option.diagnostics.map((item) => (
                    <div
                      className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200"
                      key={item}
                    >
                      {item}
                    </div>
                  ))}
                </div>

                <div className="mt-4 space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Evidence requests</p>
                  {score.option.evidenceRequests.map((item) => (
                    <div
                      className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200"
                      key={item}
                    >
                      {item}
                    </div>
                  ))}
                </div>

                <div className="mt-4 rounded-2xl border border-blue-200 bg-blue-50/80 p-4 text-sm leading-relaxed text-blue-900 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-100">
                  {score.m3Explanation}
                </div>
              </button>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}

function SummaryRail({
  scores,
  selectedOptionId,
  stressResults,
  onSelectOption,
  onOpenStep,
}: {
  scores: OptionScores[];
  selectedOptionId: string;
  stressResults: Record<string, StressResult>;
  onSelectOption: (optionId: string) => void;
  onOpenStep: (step: ResearchStepId) => void;
}) {
  const selectedScore = scores.find((score) => score.option.id === selectedOptionId) ?? scores[0];
  const selectedStress = stressResults[selectedScore.option.id];
  const summary = createValidationSummary(scores);
  const shortlist = summary.m3
    .map((optionId) => scores.find((score) => score.option.id === optionId))
    .filter((score): score is OptionScores => Boolean(score));

  return (
    <div className="space-y-4 xl:sticky xl:top-6">
      <Card className="panel-surface">
        <CardHeader>
          <p className="section-title">Selected option</p>
          <CardTitle>{selectedScore.option.name}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Badge variant={recommendationVariant[selectedScore.option.recommendation]}>
              {selectedScore.option.recommendation}
            </Badge>
            <Badge variant={statusTone(selectedScore.l1Overall)}>{selectedScore.l1Overall}</Badge>
            <Badge variant={robustnessVariant[selectedStress.status]}>{selectedStress.status}</Badge>
          </div>
          <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
            <MetricCard helper="Supply-side cost" label="F1" value={formatF1(selectedScore)} />
            <MetricCard helper="A1-A5 carbon" label="F2" value={formatF2(selectedScore)} />
            <MetricCard helper="Constructability burden" label="F3" value={formatF3(selectedScore)} />
          </div>
          <div className="flex flex-wrap gap-2">
            {selectedScore.option.riskChips.slice(0, 4).map((chip) => (
              <Badge key={chip} variant={riskVariant(chip)}>
                {chip}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="panel-surface">
        <CardHeader>
          <p className="section-title">M3 shortlist</p>
          <CardTitle>Current shortlist snapshot</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {shortlist.map((score) => (
            <button
              className={`w-full rounded-2xl border p-3 text-left transition ${
                score.option.id === selectedOptionId
                  ? "border-blue-500 bg-blue-50 dark:border-blue-400 dark:bg-blue-500/15"
                  : "border-slate-200 bg-white hover:border-blue-200 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950 dark:hover:border-blue-500/40 dark:hover:bg-slate-900"
              }`}
              key={score.option.id}
              onClick={() => onSelectOption(score.option.id)}
              type="button"
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-semibold text-slate-950 dark:text-slate-50">{score.option.name}</p>
                  <p className="text-xs text-slate-500">{score.option.id}</p>
                </div>
                <Badge variant={decisionVariant[score.m3Decision]}>{titleCase(score.m3Decision)}</Badge>
              </div>
            </button>
          ))}
          <div className="flex gap-2">
            <Button className="flex-1" onClick={() => onOpenStep("l2-comparison")} variant="secondary">
              Open L2
            </Button>
            <Button className="flex-1" onClick={() => onOpenStep("shortlist-report")}>
              Open report
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="panel-surface">
        <CardHeader>
          <p className="section-title">Prototype boundary</p>
          <CardTitle>What the demonstrator does and does not claim</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
          <p>It screens compliance-evidence status and supports preliminary facade shortlisting.</p>
          <p>It estimates supply-side cost or cost index, A1-A5 carbon, and preliminary constructability burden.</p>
          <p>It stress-tests delivery uncertainty and generates solution cards for discussion.</p>
          <p>It does not verify NZ Building Code compliance or produce a final facade design.</p>
        </CardContent>
      </Card>
    </div>
  );
}

function renderActiveScreen({
  activeStep,
  scores,
  selectedOptionId,
  onSelectOption,
  stressControls,
  stressResults,
  onStressChange,
}: {
  activeStep: ResearchStepId;
  scores: OptionScores[];
  selectedOptionId: string;
  onSelectOption: (optionId: string) => void;
  stressControls: StressControls;
  stressResults: Record<string, StressResult>;
  onStressChange: <K extends keyof StressControls>(key: K, value: StressControls[K]) => void;
}) {
  switch (activeStep) {
    case "project-data":
      return <ProjectDataScreen scores={scores} />;
    case "facade-options":
      return (
        <FacadeOptionsScreen
          onSelectOption={onSelectOption}
          scores={scores}
          selectedOptionId={selectedOptionId}
        />
      );
    case "l1-feasibility":
      return (
        <L1FeasibilityScreen
          onSelectOption={onSelectOption}
          scores={scores}
          selectedOptionId={selectedOptionId}
        />
      );
    case "l2-comparison":
      return (
        <L2ComparisonScreen
          onSelectOption={onSelectOption}
          scores={scores}
          selectedOptionId={selectedOptionId}
        />
      );
    case "l3-robustness":
      return (
        <L3RobustnessScreen
          onSelectOption={onSelectOption}
          onStressChange={onStressChange}
          scores={scores}
          selectedOptionId={selectedOptionId}
          stressControls={stressControls}
          stressResults={stressResults}
        />
      );
    case "decision-models":
      return <DecisionModelsScreen onSelectOption={onSelectOption} scores={scores} />;
    case "shortlist-report":
      return (
        <ShortlistReportScreen
          onSelectOption={onSelectOption}
          scores={scores}
          selectedOptionId={selectedOptionId}
          stressResults={stressResults}
        />
      );
    default:
      return <ProjectDataScreen scores={scores} />;
  }
}

export function PreliminaryFacadeApp() {
  const [activeStep, setActiveStep] = useState<ResearchStepId>("project-data");
  const [selectedOptionId, setSelectedOptionId] = useState<string>(facadeOptions[0]?.id ?? "");
  const [stressControls, setStressControls] = useState<StressControls>({
    laydown: projectDataset.laydown,
    deliveryAccess: projectDataset.deliveryAccess,
    craneAccess: projectDataset.craneAccess,
    supplierLeadTime: "medium",
    supplierSubstitution: "medium",
    carbonBoundary: "A1-A5",
  });

  const scores = useMemo(() => calculateOptionScores(facadeOptions), []);
  const validationSummary = useMemo(() => createValidationSummary(scores), [scores]);
  const l1ReadyCount = scores.filter((score) => score.l1Overall === "pass" || score.l1Overall === "conditional pass").length;
  const shortlistedCount = validationSummary.m3.length;
  const highConfidenceCount = scores.filter((score) => score.option.confidence === "high").length;
  const stressResults = useMemo(
    () =>
      Object.fromEntries(
        scores.map((score) => [score.option.id, evaluateStressTest(score.option, stressControls)]),
      ) as Record<string, StressResult>,
    [scores, stressControls],
  );

  const handleStressChange = <K extends keyof StressControls>(key: K, value: StressControls[K]) => {
    setStressControls((current) => ({
      ...current,
      [key]: value,
    }));
  };

  return (
    <div className="mx-auto max-w-[1680px] px-5 py-6 sm:px-6 lg:px-8">
      <div className="space-y-6">
        <Card className="panel-surface overflow-hidden border-white/70 bg-linear-to-br from-slate-950 via-slate-900 to-blue-900 text-white">
          <div className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
            <div className="p-6 sm:p-8">
              <div className="flex flex-wrap gap-2">
                <Badge className="border-white/15 bg-white/10 text-white" variant="outline">
                  research demonstrator
                </Badge>
                <Badge className="border-white/15 bg-white/10 text-white" variant="outline">
                  NZ preliminary design
                </Badge>
                <Badge className="border-white/15 bg-white/10 text-white" variant="outline">
                  L1 / L2 / L3 workflow
                </Badge>
              </div>

              <p className="mt-6 text-xs font-semibold uppercase tracking-[0.24em] text-blue-200">
                Preliminary facade shortlisting decision support
              </p>
              <h1 className="mt-3 max-w-4xl text-4xl font-semibold tracking-tight text-white sm:text-5xl">
                Preliminary Facade Shortlisting Decision Support
              </h1>
              <p className="mt-4 max-w-3xl text-base leading-8 text-slate-200">
                Compare facade strategies using project data, evidence status, cost, A1-A5 carbon,
                constructability burden, scenario robustness, and M0/M1/M3 decision logic.
              </p>
              <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-300">
                A research demonstrator for linking constructability factors, NZ preliminary design
                evidence, cost-carbon-constructability comparison, and M0/M1/M3 validation.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Button className="bg-white text-slate-950 hover:bg-slate-100" onClick={() => setActiveStep("l2-comparison")}>
                  Open L2 comparison
                </Button>
                <Button
                  className="border-white/20 bg-white/10 text-white hover:bg-white/15"
                  onClick={() => setActiveStep("shortlist-report")}
                  variant="outline"
                >
                  Open shortlist report
                </Button>
              </div>
              <div className="mt-6 rounded-2xl border border-white/12 bg-white/8 p-4 text-sm leading-relaxed text-slate-200">
                This prototype screens compliance-evidence status, supports preliminary facade shortlisting,
                estimates supply-side cost or cost index, estimates preliminary constructability burden,
                stress-tests delivery uncertainty, and generates decision-support solution cards. It does
                not verify NZ Building Code compliance or produce a final facade design.
              </div>
            </div>

            <div className="grid gap-3 p-6 sm:p-8 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/12 bg-white/8 p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-200">Candidate options</p>
                <p className="mt-3 text-4xl font-semibold text-white">{scores.length}</p>
                <p className="mt-2 text-sm text-slate-300">Facade systems loaded into the demonstrator.</p>
              </div>
              <div className="rounded-2xl border border-white/12 bg-white/8 p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-200">L1 ready</p>
                <p className="mt-3 text-4xl font-semibold text-white">{l1ReadyCount}</p>
                <p className="mt-2 text-sm text-slate-300">Pass or conditional pass under the current evidence screen.</p>
              </div>
              <div className="rounded-2xl border border-white/12 bg-white/8 p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-200">M3 shortlist</p>
                <p className="mt-3 text-4xl font-semibold text-white">{shortlistedCount}</p>
                <p className="mt-2 text-sm text-slate-300">Options retained after L1, L2, and L3 are made explicit.</p>
              </div>
              <div className="rounded-2xl border border-white/12 bg-white/8 p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-200">High confidence</p>
                <p className="mt-3 text-4xl font-semibold text-white">{highConfidenceCount}</p>
                <p className="mt-2 text-sm text-slate-300">Options with stronger current data confidence.</p>
              </div>
            </div>
          </div>
        </Card>

        <WorkflowNavigation activeStep={activeStep} onSelectStep={setActiveStep} />

        <div className="grid gap-6 xl:grid-cols-[1.22fr_0.78fr]">
          <div className="space-y-4">
            {renderActiveScreen({
              activeStep,
              onSelectOption: setSelectedOptionId,
              onStressChange: handleStressChange,
              scores,
              selectedOptionId,
              stressControls,
              stressResults,
            })}
          </div>

          <SummaryRail
            onOpenStep={setActiveStep}
            onSelectOption={setSelectedOptionId}
            scores={scores}
            selectedOptionId={selectedOptionId}
            stressResults={stressResults}
          />
        </div>
      </div>
    </div>
  );
}
