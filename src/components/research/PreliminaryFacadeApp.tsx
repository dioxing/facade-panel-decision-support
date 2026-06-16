import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from "recharts";
import {
  BookOpenCheck,
  Boxes,
  ClipboardCheck,
  Download,
  FileQuestion,
  FlaskConical,
  Layers3,
  MapPinned,
  Network,
  ShieldAlert,
  SlidersHorizontal,
  Target,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  contextMappingCards,
  dataCompleteness,
  facadeOptions,
  factorIndicatorRows,
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
  DataAvailability,
  FactorIndicatorRow,
  L1GateKey,
  L1Status,
  OptionScores,
  ResearchStepId,
} from "@/types/researchFramework";

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

const statusClass: Record<L1Status, string> = {
  pass: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200",
  "conditional pass":
    "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200",
  hold: "border-slate-300 bg-slate-100 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200",
  reject:
    "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200",
};

const burdenColour = {
  low: "bg-emerald-500",
  medium: "bg-amber-500",
  high: "bg-rose-500",
};

function burdenTone(value: number) {
  if (value <= 0.35) {
    return "low" as const;
  }

  if (value <= 0.6) {
    return "medium" as const;
  }

  return "high" as const;
}

function roleVariant(role: string) {
  if (role.includes("L1")) {
    return "warning" as const;
  }

  if (role.includes("L3")) {
    return "secondary" as const;
  }

  if (role.includes("diagnostic")) {
    return "outline" as const;
  }

  return "default" as const;
}

function confidenceVariant(confidence: string) {
  if (confidence === "high") {
    return "success" as const;
  }

  if (confidence === "medium") {
    return "warning" as const;
  }

  return "danger" as const;
}

function StatusChip({ status }: { status: L1Status }) {
  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold capitalize ${statusClass[status]}`}
    >
      {status}
    </span>
  );
}

function RiskChip({ label }: { label: string }) {
  const variant =
    label.includes("low cost") || label.includes("low carbon") || label.includes("high confidence")
      ? "success"
      : label.includes("low confidence") || label.includes("evidence gap")
        ? "danger"
        : label.includes("sensitive") || label.includes("risk")
          ? "warning"
          : "secondary";

  return <Badge variant={variant}>{label}</Badge>;
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
    <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
        {label}
      </p>
      <p className="mt-2 text-2xl font-semibold text-slate-950 dark:text-slate-50">
        {value}
      </p>
      <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{helper}</p>
    </div>
  );
}

function ProgressBar({ value }: { value: number }) {
  return (
    <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-800">
      <div
        className={`h-2 rounded-full ${value >= 0.75 ? "bg-emerald-500" : value >= 0.55 ? "bg-amber-500" : "bg-rose-500"}`}
        style={{ width: `${Math.round(value * 100)}%` }}
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
          style={{ width: `${Math.round(value * 100)}%` }}
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
  const phase1 = workflowSteps.filter((step) => step.phase === "phase-1");
  const phase2 = workflowSteps.filter((step) => step.phase === "phase-2");

  return (
    <div className="grid gap-4 xl:grid-cols-[0.85fr_1.45fr]">
      {[
        ["Phase 1: Framework Development", phase1],
        ["Phase 2: Operationalisation and Validation", phase2],
      ].map(([title, steps]) => (
        <Card className="rounded-lg dark:border-slate-800 dark:bg-slate-950" key={title as string}>
          <CardHeader className="p-4 pb-2">
            <p className="section-title">{title as string}</p>
          </CardHeader>
          <CardContent className="grid gap-2 p-4 pt-1 sm:grid-cols-2 xl:grid-cols-none 2xl:grid-cols-2">
            {(steps as typeof workflowSteps).map((step) => {
              const isActive = step.id === activeStep;

              return (
                <button
                  className={`rounded-lg border p-3 text-left transition ${
                    isActive
                      ? "border-blue-500 bg-blue-50 shadow-sm dark:border-blue-400 dark:bg-blue-500/15"
                      : "border-slate-200 bg-white hover:border-blue-200 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950 dark:hover:border-blue-500/50 dark:hover:bg-slate-900"
                  }`}
                  key={step.id}
                  onClick={() => onSelectStep(step.id)}
                  type="button"
                >
                  <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                    Step {step.number}
                  </span>
                  <span className="mt-1 block text-sm font-semibold text-slate-950 dark:text-slate-50">
                    {step.shortLabel}
                  </span>
                  <span className="mt-1 block text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                    {step.description}
                  </span>
                </button>
              );
            })}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function ResearchSetupScreen() {
  return (
    <div className="grid gap-4 xl:grid-cols-[1fr_0.95fr]">
      <Card className="rounded-lg dark:border-slate-800 dark:bg-slate-950">
        <CardHeader>
          <p className="section-title">Research logic</p>
          <CardTitle className="flex items-center gap-2">
            <BookOpenCheck className="h-5 w-5 text-blue-600" />
            Preliminary facade shortlisting framework
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm leading-relaxed text-slate-700 dark:text-slate-200">
          <p>
            This study develops a decision-support framework for preliminary facade
            system shortlisting in New Zealand. It is a research demonstrator, not
            a tool that verifies Building Code compliance or produces a final
            facade design.
          </p>
          <div className="grid gap-3 lg:grid-cols-3">
            <MetricCard
              helper="Estimated supply-side facade cost or confidential cost index."
              label="F1"
              value="Cost"
            />
            <MetricCard
              helper="A1-A5 upfront embodied carbon per facade area."
              label="F2"
              value="Carbon"
            />
            <MetricCard
              helper="Preliminary constructability burden from D1/D2/D3."
              label="F3"
              value="Constructability"
            />
          </div>
          <ul className="grid gap-2">
            {[
              "Compliance evidence is treated as L1 feasibility and context screening.",
              "Logistics and supplier uncertainty are treated as L3 scenario stress testing.",
              "Labour, crane, lift count, and programme impact are diagnostics, not main objectives.",
              "The output supports preliminary facade shortlisting and expert review.",
            ].map((item) => (
              <li className="rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900/60" key={item}>
                {item}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card className="rounded-lg dark:border-slate-800 dark:bg-slate-950">
        <CardHeader>
          <p className="section-title">Research workflow diagram</p>
          <CardTitle className="flex items-center gap-2">
            <Network className="h-5 w-5 text-blue-600" />
            Phase structure
          </CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="overflow-x-auto rounded-lg border border-slate-200 bg-slate-950 p-4 text-xs leading-relaxed text-slate-100 dark:border-slate-800">
{`Phase 1: Framework Development
Literature indicators + NZ context + expert input
        ↓
Factor-Indicator-Metric structure
        ↓
L1 / L2 / L3 decision-support framework

Phase 2: Operationalisation and Validation
MVP data + case options
        ↓
Run L1, L2, L3
        ↓
Compare M0, M1, M3
        ↓
Solution cards`}
          </pre>
          <div className="mt-4 rounded-lg border border-blue-100 bg-blue-50 p-3 text-sm leading-relaxed text-blue-900 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-100">
            Scope statement: this demonstrator screens compliance-evidence
            status, estimates supply-side cost or cost index, estimates
            preliminary constructability burden, and stress-tests delivery
            uncertainty.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function FactorIndicatorMatrixScreen() {
  const [activeFilter, setActiveFilter] = useState<FactorIndicatorRow["tags"][number] | "all">("all");
  const filterChips: Array<FactorIndicatorRow["tags"][number] | "all"> = [
    "all",
    "F3 core",
    "L1 gate",
    "L3 scenario",
    "diagnostics",
    "expert validation required",
  ];
  const rows =
    activeFilter === "all"
      ? factorIndicatorRows
      : factorIndicatorRows.filter((row) => row.tags.includes(activeFilter));

  return (
    <Card className="rounded-lg dark:border-slate-800 dark:bg-slate-950">
      <CardHeader>
        <p className="section-title">Phase 1 / core research artefact</p>
        <CardTitle className="flex items-center gap-2">
          <Layers3 className="h-5 w-5 text-blue-600" />
          Constructability Factors, Indicators, and Metrics
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 lg:grid-cols-3">
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-900 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-100">
            CF1-CF6 mainly structure F3 preliminary constructability burden.
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200">
            CF7 belongs mainly to L3 scenario stress testing and explanation.
          </div>
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-100">
            CF8 belongs mainly to L1 compliance-evidence status screening.
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {filterChips.map((chip) => (
            <button
              className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                activeFilter === chip
                  ? "border-blue-500 bg-blue-50 text-blue-700 dark:border-blue-400 dark:bg-blue-500/15 dark:text-blue-200"
                  : "border-slate-200 bg-white text-slate-600 hover:border-blue-200 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300"
              }`}
              key={chip}
              onClick={() => setActiveFilter(chip)}
              type="button"
            >
              {chip}
            </button>
          ))}
        </div>
        <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800">
          <table className="w-full min-w-[1400px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-[0.14em] text-slate-500 dark:bg-slate-900 dark:text-slate-400">
              <tr>
                <th className="p-3">Factor group</th>
                <th className="p-3">Constructability indicator</th>
                <th className="p-3">Operational definition</th>
                <th className="p-3">Metric / quantification</th>
                <th className="p-3">Framework role</th>
                <th className="p-3">Data availability</th>
                <th className="p-3">Source type</th>
                <th className="p-3">Expert validation status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr
                  className="border-t border-slate-200 align-top dark:border-slate-800"
                  key={row.id}
                >
                  <td className="p-3 font-semibold text-slate-950 dark:text-slate-50">
                    {row.factorGroup}
                  </td>
                  <td className="p-3">{row.constructabilityIndicator}</td>
                  <td className="p-3 text-slate-600 dark:text-slate-300">
                    {row.operationalDefinition}
                  </td>
                  <td className="p-3">{row.metric}</td>
                  <td className="p-3">
                    <Badge variant={roleVariant(row.frameworkRole)}>
                      {row.frameworkRole}
                    </Badge>
                  </td>
                  <td className="p-3">{row.dataAvailability}</td>
                  <td className="p-3">{row.sourceType}</td>
                  <td className="p-3">
                    <Badge
                      variant={
                        row.expertValidationStatus === "validated"
                          ? "success"
                          : row.expertValidationStatus === "review required"
                            ? "warning"
                            : "secondary"
                      }
                    >
                      {row.expertValidationStatus}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

function NZContextMappingScreen() {
  return (
    <div className="space-y-4">
      <Card className="rounded-lg dark:border-slate-800 dark:bg-slate-950">
        <CardHeader>
          <p className="section-title">Phase 1 / NZ context</p>
          <CardTitle className="flex items-center gap-2">
            <MapPinned className="h-5 w-5 text-blue-600" />
            NZ Preliminary Design and Compliance Context Mapping
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="max-w-5xl text-sm leading-relaxed text-slate-600 dark:text-slate-300">
            The framework screens compliance-evidence readiness and contextual
            feasibility. It does not verify NZ Building Code compliance. Evidence
            pathways are made explicit so preliminary design teams can identify
            what still needs expert or project-specific review.
          </p>
        </CardContent>
      </Card>
      <div className="grid gap-4 xl:grid-cols-2">
        {contextMappingCards.map((card) => (
          <Card className="rounded-lg dark:border-slate-800 dark:bg-slate-950" key={card.id}>
            <CardHeader>
              <CardTitle>{card.title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="grid gap-2">
                {card.bullets.map((bullet) => (
                  <li className="rounded-lg bg-slate-50 px-3 py-2 text-sm dark:bg-slate-900/60" key={bullet}>
                    {bullet}
                  </li>
                ))}
              </ul>
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                  Framework treatment
                </p>
                <div className="flex flex-wrap gap-2">
                  {card.frameworkTreatment.map((item) => (
                    <Badge key={item} variant={roleVariant(item)}>
                      {item}
                    </Badge>
                  ))}
                </div>
              </div>
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                  Data availability
                </p>
                <div className="flex flex-wrap gap-2">
                  {card.dataAvailability.map((item) => (
                    <Badge key={item} variant="outline">
                      {item}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function ExpertReviewPackScreen() {
  const validates = [
    "relevance of constructability factors",
    "suitability of indicators",
    "availability of data at preliminary design",
    "classification into F3 / L1 / L3 / diagnostics",
    "clarity of solution cards",
    "missing or redundant factors",
  ];
  const questions = [
    "Are these constructability factor groups relevant for preliminary facade shortlisting in New Zealand?",
    "Are the proposed indicators suitable proxies for each factor?",
    "Which indicators are available or estimable during Preliminary Design?",
    "Which factors should be treated as F3, L1 gate, L3 scenario, or diagnostic?",
    "Are any important NZ-specific factors missing?",
    "Is the solution-card format clear enough for design-team or client discussion?",
  ];

  return (
    <Card className="rounded-lg dark:border-slate-800 dark:bg-slate-950">
      <CardHeader>
        <p className="section-title">Phase 1 / interview validation</p>
        <CardTitle className="flex items-center gap-2">
          <ClipboardCheck className="h-5 w-5 text-blue-600" />
          Expert Interview Validation Pack
        </CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="space-y-4">
          <div className="rounded-lg border border-slate-200 p-4 dark:border-slate-800">
            <h3 className="text-base font-semibold">What experts validate</h3>
            <ul className="mt-3 grid gap-2">
              {validates.map((item) => (
                <li className="rounded-lg bg-slate-50 px-3 py-2 text-sm dark:bg-slate-900/60" key={item}>
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <Button className="rounded-lg" variant="outline">
            <Download className="h-4 w-4" />
            Export interview pack
            <span className="text-xs text-slate-500">Prototype only</span>
          </Button>
        </div>
        <div className="rounded-lg border border-slate-200 p-4 dark:border-slate-800">
          <h3 className="text-base font-semibold">Suggested interview questions</h3>
          <ol className="mt-3 grid gap-3">
            {questions.map((question, index) => (
              <li className="rounded-lg border border-slate-200 bg-white p-3 text-sm dark:border-slate-800 dark:bg-slate-950" key={question}>
                <span className="mr-2 font-semibold text-blue-600">{index + 1}.</span>
                {question}
              </li>
            ))}
          </ol>
        </div>
      </CardContent>
    </Card>
  );
}

function MvpDataSetupScreen() {
  const projectFields = [
    ["Project location", projectDataset.location],
    ["Building use", projectDataset.buildingUse],
    ["Building height", projectDataset.heightBand],
    ["Facade area", `${projectDataset.facadeArea.toLocaleString()} m2`],
    ["Facade zones", projectDataset.facadeZones.join(", ")],
    ["Grid / bay width", projectDataset.grid],
    ["Floor-to-floor height", `${projectDataset.floorHeight} m`],
    ["WWR / solid-to-void ratio", `${Math.round(projectDataset.wwr * 100)}% WWR`],
    ["Thermal target", projectDataset.thermalTarget],
    ["Site access category", projectDataset.siteAccess],
    ["Laydown category", projectDataset.laydown],
    ["Crane access category", projectDataset.craneAccess],
    ["Delivery access category", projectDataset.deliveryAccess],
  ];
  const optionFields = [
    "option ID",
    "facade system family",
    "external material",
    "insulation type",
    "build-up thickness",
    "panel size",
    "panel weight",
    "connection concept",
    "standardisation level",
    "wet/dry joint condition",
    "supplier source",
    "cost value or cost index",
    "A1-A5 carbon value or carbon factor",
    "compliance evidence status",
    "data confidence",
  ];

  return (
    <div className="grid gap-4 xl:grid-cols-[1fr_0.9fr]">
      <Card className="rounded-lg dark:border-slate-800 dark:bg-slate-950">
        <CardHeader>
          <p className="section-title">Phase 2 / MVP data</p>
          <CardTitle className="flex items-center gap-2">
            <Boxes className="h-5 w-5 text-blue-600" />
            Minimum Viable Dataset Setup
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <section>
            <h3 className="text-base font-semibold">A. Project-level input</h3>
            <div className="mt-3 grid gap-2 md:grid-cols-2">
              {projectFields.map(([label, value]) => (
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900/60" key={label}>
                  <p className="text-xs uppercase tracking-[0.14em] text-slate-500">{label}</p>
                  <p className="mt-1 text-sm font-semibold">{value}</p>
                </div>
              ))}
            </div>
          </section>
          <section>
            <h3 className="text-base font-semibold">B. Option-level input</h3>
            <div className="mt-3 flex flex-wrap gap-2">
              {optionFields.map((field) => (
                <Badge key={field} variant="outline">
                  {field}
                </Badge>
              ))}
            </div>
          </section>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <Card className="rounded-lg dark:border-slate-800 dark:bg-slate-950">
          <CardHeader>
            <p className="section-title">C. Reference data</p>
            <CardTitle>Reference databases</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2">
            {referenceDataCards.map((card) => (
              <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-800 dark:bg-slate-950" key={card}>
                {card}
              </div>
            ))}
          </CardContent>
        </Card>
        <Card className="rounded-lg dark:border-slate-800 dark:bg-slate-950">
          <CardHeader>
            <p className="section-title">Completeness</p>
            <CardTitle>Data readiness indicators</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {dataCompleteness.map((item) => (
              <div key={item.label}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="font-semibold">{item.label}</span>
                  <span className="text-slate-500">{Math.round(item.value * 100)}%</span>
                </div>
                <ProgressBar value={item.value} />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function L1FeasibilityScreen({ scores }: { scores: OptionScores[] }) {
  const requests = scores.flatMap((score) =>
    score.option.evidenceRequests.map((request) => ({
      optionId: score.option.id,
      request,
    })),
  );

  return (
    <div className="grid gap-4 2xl:grid-cols-[1fr_360px]">
      <Card className="rounded-lg dark:border-slate-800 dark:bg-slate-950">
        <CardHeader>
          <p className="section-title">L1 feasibility and context setup</p>
          <CardTitle className="flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-blue-600" />
            Compliance-evidence and context matrix
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
            L1 screens evidence status and context readiness. It does not verify
            compliance. Options with hold or reject statuses require evidence
            resolution before L2 outputs should be treated as shortlist evidence.
          </p>
          <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800">
            <table className="w-full min-w-[1200px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-[0.14em] text-slate-500 dark:bg-slate-900 dark:text-slate-400">
                <tr>
                  <th className="p-3">Facade option</th>
                  {Object.values(l1GateLabels).map((label) => (
                    <th className="p-3" key={label}>{label}</th>
                  ))}
                  <th className="p-3">Overall L1 status</th>
                </tr>
              </thead>
              <tbody>
                {scores.map((score) => (
                  <tr className="border-t border-slate-200 dark:border-slate-800" key={score.option.id}>
                    <td className="p-3 font-semibold">{score.option.id} {score.option.name}</td>
                    {(Object.keys(l1GateLabels) as L1GateKey[]).map((key) => (
                      <td className="p-3" key={key}>
                        <StatusChip status={score.option.l1Evidence[key]} />
                      </td>
                    ))}
                    <td className="p-3">
                      <StatusChip status={score.l1Overall} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
      <Card className="rounded-lg dark:border-slate-800 dark:bg-slate-950">
        <CardHeader>
          <p className="section-title">Evidence requests</p>
          <CardTitle>Missing or unresolved evidence</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {requests.map((item) => (
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm dark:border-slate-800 dark:bg-slate-900/60" key={`${item.optionId}-${item.request}`}>
              <p className="font-semibold">{item.optionId}</p>
              <p className="mt-1 text-slate-600 dark:text-slate-300">{item.request}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function L2ComparisonScreen({ scores }: { scores: OptionScores[] }) {
  const barData = scores.map((score) => ({
    option: score.option.id,
    F1: score.f1Unit === "NZD/m2 facade" ? score.f1 / 1200 : score.f1,
    F2: score.f2 / 240,
    F3: score.f3,
  }));
  const scatterData = scores.map((score) => ({
    option: score.option.id,
    name: score.option.name,
    cost: score.f1Unit === "NZD/m2 facade" ? score.f1 : score.f1 * 900,
    carbon: score.f2,
    constructability: score.f3,
    status: score.l1Overall,
  }));

  return (
    <div className="space-y-4">
      <Card className="rounded-lg dark:border-slate-800 dark:bg-slate-950">
        <CardHeader>
          <p className="section-title">L2 cost-carbon-constructability comparison</p>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-blue-600" />
            F1 / F2 / F3 definitions
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 xl:grid-cols-3">
          <div className="rounded-lg border border-slate-200 p-4 dark:border-slate-800">
            <h3 className="font-semibold">F1 Supply-side facade cost</h3>
            <pre className="mt-3 overflow-x-auto rounded-lg bg-slate-950 p-3 text-xs text-slate-100">{`F1 = (Cmaterial + Cfabrication + Cconnection
     + Ctransport + Callowance) / Afacade`}</pre>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">Unit: NZD/m2 facade or cost index if confidential data are unavailable.</p>
          </div>
          <div className="rounded-lg border border-slate-200 p-4 dark:border-slate-800">
            <h3 className="font-semibold">F2 A1-A5 upfront embodied carbon</h3>
            <pre className="mt-3 overflow-x-auto rounded-lg bg-slate-950 p-3 text-xs text-slate-100">{`F2 = (Σ qi × EFi + A4transport
     + A5construction/waste) / Afacade`}</pre>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">Unit: kgCO2e/m2 facade.</p>
          </div>
          <div className="rounded-lg border border-slate-200 p-4 dark:border-slate-800">
            <h3 className="font-semibold">F3 Preliminary constructability burden</h3>
            <pre className="mt-3 overflow-x-auto rounded-lg bg-slate-950 p-3 text-xs text-slate-100">{`F3 = w1D1 + w2D2 + w3D3
w1 = w2 = w3 = 1/3`}</pre>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">D1 standardisation/offsite, D2 interface/assembly/tolerance, D3 handling/access/detailing. Lower is better.</p>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 2xl:grid-cols-[1fr_1fr]">
        <Card className="rounded-lg dark:border-slate-800 dark:bg-slate-950">
          <CardHeader>
            <CardTitle>L2 values table</CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="text-xs uppercase tracking-[0.14em] text-slate-500">
                <tr>
                  <th className="py-2">Option</th>
                  <th>F1</th>
                  <th>F2</th>
                  <th>D1</th>
                  <th>D2</th>
                  <th>D3</th>
                  <th>F3</th>
                  <th>L1</th>
                </tr>
              </thead>
              <tbody>
                {scores.map((score) => (
                  <tr className="border-t border-slate-200 dark:border-slate-800" key={score.option.id}>
                    <td className="py-3 font-semibold">{score.option.id} {score.option.name}</td>
                    <td>{score.f1.toFixed(score.f1Unit === "cost index" ? 2 : 0)} {score.f1Unit}</td>
                    <td>{score.f2.toFixed(0)} kgCO2e/m2</td>
                    <td>{score.d1.toFixed(2)}</td>
                    <td>{score.d2.toFixed(2)}</td>
                    <td>{score.d3.toFixed(2)}</td>
                    <td>{score.f3.toFixed(2)}</td>
                    <td><StatusChip status={score.l1Overall} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>

        <Card className="rounded-lg dark:border-slate-800 dark:bg-slate-950">
          <CardHeader>
            <CardTitle>Normalised F1/F2/F3 bars</CardTitle>
          </CardHeader>
          <CardContent className="h-[330px]">
            <ResponsiveContainer height="100%" width="100%">
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="option" />
                <YAxis domain={[0, 1]} />
                <Tooltip />
                <Legend />
                <Bar dataKey="F1" fill="#2563eb" />
                <Bar dataKey="F2" fill="#059669" />
                <Bar dataKey="F3" fill="#d97706" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 2xl:grid-cols-[0.95fr_1.05fr]">
        <Card className="rounded-lg dark:border-slate-800 dark:bg-slate-950">
          <CardHeader>
            <CardTitle>D1/D2/D3 constructability profiles</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            {scores.map((score) => (
              <div className="rounded-lg border border-slate-200 p-3 dark:border-slate-800" key={score.option.id}>
                <p className="mb-3 font-semibold">{score.option.id} {score.option.name}</p>
                <div className="grid gap-2">
                  <BurdenBar label="D1 standardisation/offsite" value={score.d1} />
                  <BurdenBar label="D2 interface/assembly/tolerance" value={score.d2} />
                  <BurdenBar label="D3 handling/access/detailing" value={score.d3} />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="rounded-lg dark:border-slate-800 dark:bg-slate-950">
          <CardHeader>
            <CardTitle>Pareto-style scatter: cost vs carbon</CardTitle>
          </CardHeader>
          <CardContent className="h-[460px]">
            <ResponsiveContainer height="100%" width="100%">
              <ScatterChart margin={{ bottom: 24, left: 10, right: 20, top: 15 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="cost" label={{ value: "F1 cost equivalent", position: "bottom" }} name="F1" type="number" />
                <YAxis dataKey="carbon" label={{ value: "F2 kgCO2e/m2", angle: -90, position: "insideLeft" }} name="F2" type="number" />
                <ZAxis dataKey="constructability" range={[110, 420]} />
                <Tooltip cursor={{ strokeDasharray: "3 3" }} />
                <Scatter data={scatterData} name="Facade options">
                  {scatterData.map((entry) => (
                    <Cell
                      fill={
                        entry.status === "pass"
                          ? "#059669"
                          : entry.status === "conditional pass"
                            ? "#d97706"
                            : entry.status === "hold"
                              ? "#64748b"
                              : "#e11d48"
                      }
                      key={entry.option}
                    />
                  ))}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function L3RobustnessScreen({ scores }: { scores: OptionScores[] }) {
  const [scenario, setScenario] = useState({
    laydown: "medium",
    delivery: "restricted",
    crane: "typical",
    leadTime: "medium",
    substitution: "medium",
    boundary: "A1-A5",
  });
  const scenarioControls = [
    { key: "laydown", label: "Laydown", values: ["low", "medium", "high"] },
    { key: "delivery", label: "Delivery access", values: ["restricted", "typical", "flexible"] },
    { key: "crane", label: "Crane access", values: ["constrained", "typical", "favourable"] },
    { key: "leadTime", label: "Supplier lead time", values: ["low", "medium", "high"] },
    { key: "substitution", label: "Supplier substitution risk", values: ["low", "medium", "high"] },
    { key: "boundary", label: "Carbon boundary", values: ["A1-A3", "A1-A5", "A1-A5+B4", "biogenic sensitivity"] },
  ] as const;

  return (
    <div className="space-y-4">
      <Card className="rounded-lg dark:border-slate-800 dark:bg-slate-950">
        <CardHeader>
          <p className="section-title">L3 robustness and decision explanation</p>
          <CardTitle className="flex items-center gap-2">
            <SlidersHorizontal className="h-5 w-5 text-blue-600" />
            Scenario stress testing
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
            L3 is scenario stress testing and decision explanation. It is not a
            fourth optimisation objective. It identifies where delivery
            uncertainty, supplier risk, or carbon-boundary assumptions may change
            how preliminary shortlist evidence is interpreted.
          </p>
          <div className="grid gap-3 xl:grid-cols-3">
            {scenarioControls.map((control) => (
              <div className="rounded-lg border border-slate-200 p-3 dark:border-slate-800" key={control.key}>
                <p className="mb-2 text-sm font-semibold">{control.label}</p>
                <div className="flex flex-wrap gap-2">
                  {control.values.map((value) => (
                    <button
                      className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                        scenario[control.key] === value
                          ? "border-blue-500 bg-blue-50 text-blue-700 dark:border-blue-400 dark:bg-blue-500/15 dark:text-blue-200"
                          : "border-slate-200 bg-white text-slate-600 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300"
                      }`}
                      key={value}
                      onClick={() => setScenario((current) => ({ ...current, [control.key]: value }))}
                      type="button"
                    >
                      {value}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 xl:grid-cols-2">
        {scores.map((score) => (
          <Card className="rounded-lg dark:border-slate-800 dark:bg-slate-950" key={score.option.id}>
            <CardHeader>
              <div className="flex items-start justify-between gap-3">
                <CardTitle>{score.option.id} {score.option.name}</CardTitle>
                <Badge
                  variant={
                    score.robustness === "robust"
                      ? "success"
                      : score.robustness === "moderately sensitive"
                        ? "warning"
                        : "danger"
                  }
                >
                  {score.robustness}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2 sm:grid-cols-2">
                {Object.entries(score.option.scenarioSensitivity).map(([key, value]) => (
                  <div className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-800" key={key}>
                    <span className="capitalize">{key.replace(/([A-Z])/g, " $1")}</span>
                    <Badge variant={value === "low" ? "success" : value === "medium" ? "warning" : "danger"}>
                      {value}
                    </Badge>
                  </div>
                ))}
              </div>
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                  Risk flags
                </p>
                <div className="flex flex-wrap gap-2">
                  {(score.l3Flags.length ? score.l3Flags : ["no high-sensitivity flag"]).map((flag) => (
                    <RiskChip key={flag} label={flag} />
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function ValidationScreen({ scores }: { scores: OptionScores[] }) {
  const summary = createValidationSummary(scores);
  const labelFor = (id: string) => scores.find((score) => score.option.id === id)?.option.name ?? id;

  return (
    <div className="space-y-4">
      <Card className="rounded-lg dark:border-slate-800 dark:bg-slate-950">
        <CardHeader>
          <p className="section-title">Validation</p>
          <CardTitle className="flex items-center gap-2">
            <FlaskConical className="h-5 w-5 text-blue-600" />
            Validation: M0 / M1 / M3 Comparison
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 xl:grid-cols-3">
          {validationModels.map((model) => (
            <div className="rounded-lg border border-slate-200 p-4 dark:border-slate-800" key={model.id}>
              <p className="section-title">{model.id}</p>
              <h3 className="mt-2 text-lg font-semibold">{model.label}</h3>
              <ul className="mt-3 grid gap-2 text-sm text-slate-600 dark:text-slate-300">
                {model.decisionLogic.map((logic) => (
                  <li className="rounded-lg bg-slate-50 px-3 py-2 dark:bg-slate-900/60" key={logic}>{logic}</li>
                ))}
              </ul>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="grid gap-4 2xl:grid-cols-[1fr_0.8fr]">
        <Card className="rounded-lg dark:border-slate-800 dark:bg-slate-950">
          <CardHeader>
            <CardTitle>Comparison table</CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="text-xs uppercase tracking-[0.14em] text-slate-500">
                <tr>
                  <th className="py-2">Output</th>
                  <th>M0</th>
                  <th>M1</th>
                  <th>M3</th>
                </tr>
              </thead>
              <tbody>
                {validationComparisonRows.map((row) => (
                  <tr className="border-t border-slate-200 dark:border-slate-800" key={row.output}>
                    <td className="py-3 font-semibold">{row.output}</td>
                    <td>{row.M0}</td>
                    <td>{row.M1}</td>
                    <td>{row.M3}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>

        <Card className="rounded-lg dark:border-slate-800 dark:bg-slate-950">
          <CardHeader>
            <CardTitle>Validation outputs</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              ["M0 shortlist", summary.m0],
              ["M1 shortlist", summary.m1],
              ["M3 shortlist", summary.m3],
              ["Shortlist overlap", summary.overlap],
              ["Options held by L1", summary.held],
              ["Options flagged by L3", summary.flagged],
            ].map(([label, ids]) => (
              <div className="rounded-lg border border-slate-200 p-3 dark:border-slate-800" key={label as string}>
                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                  {label as string}
                </p>
                <div className="flex flex-wrap gap-2">
                  {(ids as string[]).map((id) => (
                    <Badge key={id}>{id} {labelFor(id)}</Badge>
                  ))}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-lg border-blue-200 bg-blue-50 dark:border-blue-500/30 dark:bg-blue-500/10">
        <CardContent className="p-5">
          <p className="section-title">Validation claim</p>
          <p className="mt-2 text-base leading-relaxed text-blue-950 dark:text-blue-100">
            The proposed framework is not validated by proving one facade system
            is universally optimal. It is validated by showing that preliminary
            facade data can be transformed into traceable, explainable,
            scenario-tested, and expert-reviewable decision outputs.
          </p>
          <p className="mt-3 text-sm text-blue-900 dark:text-blue-100">{summary.reason}</p>
        </CardContent>
      </Card>
    </div>
  );
}

function SolutionCardsScreen({ scores }: { scores: OptionScores[] }) {
  const visibleScores = scores.filter((score) => score.m3Decision !== "excluded");

  return (
    <div className="space-y-4">
      <Card className="rounded-lg dark:border-slate-800 dark:bg-slate-950">
        <CardHeader>
          <p className="section-title">Final preliminary shortlist</p>
          <CardTitle className="flex items-center gap-2">
            <FileQuestion className="h-5 w-5 text-blue-600" />
            Final Preliminary Shortlist and Solution Cards
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="max-w-5xl text-sm leading-relaxed text-slate-600 dark:text-slate-300">
            These solution cards generate decision-support outputs for discussion.
            Recommendations are preliminary and depend on evidence requests,
            project inputs, and expert review.
          </p>
        </CardContent>
      </Card>
      <div className="grid gap-4 xl:grid-cols-2">
        {visibleScores.map((score) => (
          <Card className="rounded-lg dark:border-slate-800 dark:bg-slate-950" key={score.option.id}>
            <CardHeader>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="section-title">{score.option.id}</p>
                  <CardTitle className="mt-2">{score.option.name}</CardTitle>
                </div>
                <Badge variant={score.option.recommendation === "proceed" ? "success" : score.option.recommendation === "hold" ? "warning" : "default"}>
                  {score.option.recommendation}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2 sm:grid-cols-2">
                {[
                  ["System type", score.option.systemFamily],
                  ["Material", score.option.material],
                  ["Insulation", score.option.insulation],
                  ["Build-up thickness", score.option.buildUpThickness],
                  ["Panel size", score.option.panelSize],
                  ["Panel weight", score.option.panelWeight],
                  ["Connection concept", score.option.connectionType],
                ].map(([label, value]) => (
                  <div className="rounded-lg bg-slate-50 p-3 dark:bg-slate-900/60" key={label}>
                    <p className="text-xs uppercase tracking-[0.14em] text-slate-500">{label}</p>
                    <p className="mt-1 text-sm font-semibold">{value}</p>
                  </div>
                ))}
              </div>
              <div className="grid gap-2 sm:grid-cols-4">
                <div className="rounded-lg border border-slate-200 p-3 dark:border-slate-800">
                  <p className="text-xs text-slate-500">L1 status</p>
                  <div className="mt-2"><StatusChip status={score.l1Overall} /></div>
                </div>
                <div className="rounded-lg border border-slate-200 p-3 dark:border-slate-800">
                  <p className="text-xs text-slate-500">F1 cost</p>
                  <p className="mt-2 font-semibold">{score.f1.toFixed(score.f1Unit === "cost index" ? 2 : 0)} {score.f1Unit}</p>
                </div>
                <div className="rounded-lg border border-slate-200 p-3 dark:border-slate-800">
                  <p className="text-xs text-slate-500">F2 carbon</p>
                  <p className="mt-2 font-semibold">{score.f2.toFixed(0)} kgCO2e/m2</p>
                </div>
                <div className="rounded-lg border border-slate-200 p-3 dark:border-slate-800">
                  <p className="text-xs text-slate-500">F3 burden</p>
                  <p className="mt-2 font-semibold">{score.f3.toFixed(2)}</p>
                </div>
              </div>
              <div className="grid gap-2">
                <BurdenBar label="D1 standardisation/offsite readiness" value={score.d1} />
                <BurdenBar label="D2 interface/assembly/tolerance" value={score.d2} />
                <BurdenBar label="D3 handling/access/detailing" value={score.d3} />
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge variant={confidenceVariant(score.option.confidence)}>
                  {score.option.confidence} data confidence
                </Badge>
                <Badge variant={score.robustness === "robust" ? "success" : score.robustness === "moderately sensitive" ? "warning" : "danger"}>
                  {score.robustness}
                </Badge>
                {score.option.riskChips.map((chip) => (
                  <RiskChip key={chip} label={chip} />
                ))}
              </div>
              <div className="grid gap-3 lg:grid-cols-2">
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                    Diagnostics
                  </p>
                  <ul className="grid gap-2 text-sm">
                    {score.option.diagnostics.map((item) => (
                      <li className="rounded-lg bg-slate-50 px-3 py-2 dark:bg-slate-900/60" key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                    Evidence requests
                  </p>
                  <ul className="grid gap-2 text-sm">
                    {score.option.evidenceRequests.map((item) => (
                      <li className="rounded-lg bg-amber-50 px-3 py-2 text-amber-900 dark:bg-amber-500/10 dark:text-amber-100" key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              </div>
              <div className="rounded-lg border border-blue-100 bg-blue-50 p-3 text-sm leading-relaxed text-blue-900 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-100">
                {score.m3Explanation}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function ActiveScreen({
  activeStep,
  scores,
}: {
  activeStep: ResearchStepId;
  scores: OptionScores[];
}) {
  if (activeStep === "research-setup") {
    return <ResearchSetupScreen />;
  }

  if (activeStep === "factor-indicator-matrix") {
    return <FactorIndicatorMatrixScreen />;
  }

  if (activeStep === "nz-context-mapping") {
    return <NZContextMappingScreen />;
  }

  if (activeStep === "expert-review-pack") {
    return <ExpertReviewPackScreen />;
  }

  if (activeStep === "mvp-data-setup") {
    return <MvpDataSetupScreen />;
  }

  if (activeStep === "l1-feasibility") {
    return <L1FeasibilityScreen scores={scores} />;
  }

  if (activeStep === "l2-comparison") {
    return <L2ComparisonScreen scores={scores} />;
  }

  if (activeStep === "l3-robustness") {
    return <L3RobustnessScreen scores={scores} />;
  }

  if (activeStep === "validation") {
    return <ValidationScreen scores={scores} />;
  }

  return <SolutionCardsScreen scores={scores} />;
}

export function PreliminaryFacadeApp() {
  const [activeStep, setActiveStep] = useState<ResearchStepId>("research-setup");
  const scores = useMemo(() => calculateOptionScores(facadeOptions), []);
  const active = workflowSteps.find((step) => step.id === activeStep) ?? workflowSteps[0];

  return (
    <main className="min-h-screen px-4 py-5 lg:px-6">
      <div className="mx-auto max-w-[1880px] space-y-4">
        <header className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950">
          <div className="grid gap-4 xl:grid-cols-[1fr_420px] xl:items-end">
            <div>
              <p className="section-title">Independent PhD research demonstrator</p>
              <h1 className="mt-2 max-w-5xl text-3xl font-semibold tracking-tight text-slate-950 dark:text-slate-50 lg:text-4xl">
                Preliminary Facade Shortlisting Decision Support
              </h1>
              <p className="mt-3 max-w-5xl text-base leading-relaxed text-slate-600 dark:text-slate-300">
                A research demonstrator for linking constructability factors, NZ
                preliminary design evidence, cost-carbon-constructability
                comparison, and M0/M1/M3 validation.
              </p>
            </div>
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm leading-relaxed text-amber-950 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-100">
              This demonstrator supports preliminary facade shortlisting. It does
              not verify NZ Building Code compliance, select a universally optimal
              facade, predict final construction cost, or predict final
              installation productivity.
            </div>
          </div>
        </header>

        <WorkflowNavigation activeStep={activeStep} onSelectStep={setActiveStep} />

        <Card className="rounded-lg border-blue-100 bg-blue-50/80 dark:border-blue-500/30 dark:bg-blue-500/10">
          <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
            <div>
              <p className="section-title">Current research step</p>
              <h2 className="mt-1 text-xl font-semibold text-slate-950 dark:text-slate-50">
                Step {active.number}: {active.label}
              </h2>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant={active.phase === "phase-1" ? "default" : "success"}>
                {active.phase === "phase-1" ? "Phase 1" : "Phase 2"}
              </Badge>
              <Badge variant="outline">{active.description}</Badge>
            </div>
          </CardContent>
        </Card>

        <ActiveScreen activeStep={activeStep} scores={scores} />
      </div>
    </main>
  );
}
