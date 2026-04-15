import {
  AlertTriangle,
  CheckCircle2,
  CircleOff,
  Layers3,
  ShieldAlert,
  XCircle,
} from "lucide-react";
import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
} from "recharts";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  CONNECTION_OPTIONS,
  CONSTRUCTABILITY_METRICS,
  INSULATION_OPTIONS,
  MATERIAL_OPTIONS,
  STATUS_COLORS,
  type CandidateSolution,
} from "@/models/types";
import { formatCarbon, formatCurrency, formatDecimal, formatPercent } from "@/lib/format";

const materialLabels = Object.fromEntries(
  MATERIAL_OPTIONS.map((item) => [item.value, item.label]),
);
const insulationLabels = Object.fromEntries(
  INSULATION_OPTIONS.map((item) => [item.value, item.label]),
);
const connectionLabels = Object.fromEntries(
  CONNECTION_OPTIONS.map((item) => [item.value, item.label]),
);

function proxyColor(value: number) {
  if (value <= 0.3) {
    return "bg-emerald-500";
  }

  if (value <= 0.6) {
    return "bg-amber-500";
  }

  return "bg-rose-500";
}

function statusIcon(status: "pass" | "warning" | "fail") {
  if (status === "pass") {
    return <CheckCircle2 className="h-4 w-4 text-success" />;
  }

  if (status === "warning") {
    return <AlertTriangle className="h-4 w-4 text-warning" />;
  }

  return <XCircle className="h-4 w-4 text-danger" />;
}

export function SolutionCard({ solution }: { solution?: CandidateSolution }) {
  if (!solution) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Solution detail</CardTitle>
          <CardDescription>
            Select a Pareto point to inspect objectives, constructability proxies, and feasibility
            checks.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const radarData = CONSTRUCTABILITY_METRICS.map((metric) => ({
    label: metric.variable,
    value: solution.proxies[metric.key],
  }));
  const panelTypeCount = Math.round(solution.proxies.panelTypeVariety * 7 + 2);

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge>{solution.id}</Badge>
          {solution.label ? <Badge variant="secondary">{solution.label.replaceAll("_", " ")}</Badge> : null}
          {solution.cluster ? (
            <Badge variant="outline">{solution.cluster.replaceAll("_", " ")}</Badge>
          ) : null}
        </div>
        <CardTitle className="mt-2">Selected facade package definition</CardTitle>
        <CardDescription>
          Detailed breakdown of cost, embodied carbon, constructability proxies, and gatekeeper
          checks.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-3 md:grid-cols-3">
          <div className="metric-glow rounded-2xl border border-border/70 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              Estimated cost
            </p>
            <p className="mt-3 text-2xl font-semibold text-slate-900">
              {formatCurrency(solution.objectives.cost)}
            </p>
          </div>
          <div className="metric-glow rounded-2xl border border-border/70 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              Embodied carbon
            </p>
            <p className="mt-3 text-2xl font-semibold text-slate-900">
              {formatCarbon(solution.objectives.embodiedCarbon)}
            </p>
          </div>
          <div className="metric-glow rounded-2xl border border-border/70 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              Constructability score
            </p>
            <p className="mt-3 text-2xl font-semibold text-slate-900">
              {solution.objectives.constructability.toFixed(3)}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">Lower is better.</p>
          </div>
        </div>

        <div className="rounded-[1.4rem] border border-border/70 bg-slate-50/70 p-5">
          <div className="mb-4 flex items-center gap-2">
            <Layers3 className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold text-slate-900">Solution definition</h3>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Material</p>
              <p className="mt-1 text-sm font-medium text-slate-900">
                {materialLabels[solution.decision.materialType]}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Insulation</p>
              <p className="mt-1 text-sm font-medium text-slate-900">
                {insulationLabels[solution.decision.insulationType]}{" "}
                {solution.panelMetrics.insulationThickness}mm
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Connection</p>
              <p className="mt-1 text-sm font-medium text-slate-900">
                {connectionLabels[solution.decision.connectionType]}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Panel types count</p>
              <p className="mt-1 text-sm font-medium text-slate-900">
                {panelTypeCount} types ({solution.panelMetrics.standardisationPercent}% standard)
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Panel size</p>
              <p className="mt-1 text-sm font-medium text-slate-900">
                {formatDecimal(solution.panelMetrics.width, 2)} x{" "}
                {formatDecimal(solution.panelMetrics.height, 2)}m
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Lift weight</p>
              <p className="mt-1 text-sm font-medium text-slate-900">
                {Math.round(solution.panelMetrics.weight).toLocaleString()} kg
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
          <div className="rounded-[1.4rem] border border-border/70 bg-slate-50/70 p-5">
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-slate-900">
                Constructability proxy radar
              </h3>
              <p className="mt-1 text-xs text-muted-foreground">
                Seven normalized sub-indicators contributing to the aggregate constructability
                objective.
              </p>
            </div>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData}>
                  <PolarGrid stroke="#d6deea" />
                  <PolarAngleAxis dataKey="label" tick={{ fontSize: 11, fill: "#475569" }} />
                  <PolarRadiusAxis domain={[0, 1]} tick={false} axisLine={false} />
                  <Radar
                    dataKey="value"
                    fill="#2563eb"
                    fillOpacity={0.24}
                    stroke="#1d4ed8"
                    strokeWidth={2}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-[1.4rem] border border-border/70 bg-slate-50/70 p-5">
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-slate-900">
                Constructability proxy breakdown
              </h3>
              <p className="mt-1 text-xs text-muted-foreground">
                Thresholds: ≤ 0.3 good, 0.3 - 0.6 moderate, &gt; 0.6 poor.
              </p>
            </div>
            <div className="space-y-4">
              {CONSTRUCTABILITY_METRICS.map((metric) => {
                const value = solution.proxies[metric.key];

                return (
                  <div key={metric.key} className="space-y-2">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium text-slate-900">{metric.label}</p>
                        <p className="text-[11px] text-muted-foreground">{metric.variable}</p>
                      </div>
                      <Badge variant="outline">{value.toFixed(2)}</Badge>
                    </div>
                    <div className="h-2.5 overflow-hidden rounded-full bg-slate-200">
                      <div
                        className={`h-full rounded-full ${proxyColor(value)}`}
                        style={{ width: `${Math.min(value * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-[1.4rem] border border-border/70 bg-slate-50/70 p-5">
            <div className="mb-4 flex items-center gap-2">
              <CircleOff className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-semibold text-slate-900">Diagnostic indicators</h3>
            </div>
            <div className="grid gap-3">
              <div className="rounded-2xl bg-white p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                  Non-standard ratio (R_ns)
                </p>
                <p className="mt-2 text-xl font-semibold text-slate-900">
                  {formatPercent(solution.diagnostics.nonStandardRatio, 1)}
                </p>
              </div>
              <div className="rounded-2xl bg-white p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                  Lift count intensity (N_lift)
                </p>
                <p className="mt-2 text-xl font-semibold text-slate-900">
                  {solution.diagnostics.liftCountIntensity}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-[1.4rem] border border-border/70 bg-slate-50/70 p-5">
            <div className="mb-4 flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-semibold text-slate-900">Feasibility checks</h3>
            </div>
            <div className="space-y-3">
              {solution.constraints.map((check, index) => (
                <div key={`${check.name}-${index}`}>
                  <div className="flex items-start gap-3">
                    {statusIcon(check.status)}
                    <div className="min-w-0 flex-1">
                      <p className={`text-sm font-medium ${STATUS_COLORS[check.status]}`}>
                        {check.name}
                      </p>
                      <p className="mt-1 text-xs leading-5 text-muted-foreground">
                        {check.message}
                      </p>
                    </div>
                  </div>
                  {index < solution.constraints.length - 1 ? (
                    <Separator className="mt-3" />
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
