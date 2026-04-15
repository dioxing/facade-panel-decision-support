import { useState } from "react";
import {
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatCarbon, formatCurrency } from "@/lib/format";
import {
  MATERIAL_OPTIONS,
  PANEL_SIZE_OPTIONS,
  type CandidateSolution,
  type MaterialType,
  type OptimisationResult,
  type PanelSizeCategory,
} from "@/models/types";
import { useDesignStore } from "@/stores/useDesignStore";

const specialMeta = {
  knee_point: { label: "Knee solution", color: "#2563eb" },
  low_carbon: { label: "Low carbon", color: "#16a34a" },
  low_cost: { label: "Low cost", color: "#d97706" },
  high_buildability: { label: "High buildability", color: "#0891b2" },
} as const;

const materialLabels = Object.fromEntries(
  MATERIAL_OPTIONS.map((item) => [item.value, item.label]),
) as Record<MaterialType, string>;

const sizeLabels = Object.fromEntries(
  PANEL_SIZE_OPTIONS.map((item) => [item.value, item.shortLabel ?? item.label]),
) as Record<PanelSizeCategory, string>;

interface BubblePoint extends CandidateSolution {
  bubbleSize: number;
  color: string;
  opacity: number;
}

function chartPoints(
  solutions: CandidateSolution[],
  materialFilter: string,
  sizeFilter: string,
  selectedSolutionId: string | null,
) {
  return solutions.map((solution) => {
    const matchesMaterial =
      materialFilter === "all" || solution.decision.materialType === materialFilter;
    const matchesSize =
      sizeFilter === "all" || solution.decision.panelSizeCategory === sizeFilter;
    const emphasis = matchesMaterial && matchesSize;

    return {
      ...solution,
      bubbleSize: 80 + (1 - solution.objectives.constructability) * 200,
      color: solution.label ? specialMeta[solution.label].color : "#475569",
      opacity: selectedSolutionId === solution.id ? 1 : emphasis ? 0.95 : 0.24,
    } satisfies BubblePoint;
  });
}

function TradeoffTooltip({ active, payload }: { active?: boolean; payload?: any[] }) {
  if (!active || !payload?.length) {
    return null;
  }

  const item = payload[0]?.payload as BubblePoint | undefined;
  if (!item) {
    return null;
  }

  return (
    <div className="rounded-2xl border border-border bg-white/95 p-4 shadow-xl">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-900">{item.id}</p>
          <p className="text-xs text-muted-foreground">
            {materialLabels[item.decision.materialType]} ·{" "}
            {sizeLabels[item.decision.panelSizeCategory]}
          </p>
        </div>
        {item.label ? <Badge>{specialMeta[item.label].label}</Badge> : null}
      </div>
      <div className="mt-3 space-y-1.5 text-xs text-slate-700">
        <p>Cost: {formatCurrency(item.objectives.cost)}</p>
        <p>Carbon: {formatCarbon(item.objectives.embodiedCarbon)}</p>
        <p>Constructability: {item.objectives.constructability.toFixed(3)}</p>
      </div>
    </div>
  );
}

function TradeoffChart(props: {
  title: string;
  description: string;
  background: CandidateSolution[];
  foreground: BubblePoint[];
  onSelect: (id: string) => void;
  selectedSolutionId: string | null;
}) {
  return (
    <div className="rounded-[1.4rem] border border-border/70 bg-slate-50/70 p-4">
      <div className="mb-4">
        <h4 className="text-sm font-semibold text-slate-900">{props.title}</h4>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">{props.description}</p>
      </div>
      <div className="h-[340px]">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 12, right: 16, bottom: 20, left: 8 }}>
            <CartesianGrid strokeDasharray="4 4" stroke="#d7e0eb" />
            <XAxis
              type="number"
              dataKey="objectives.cost"
              tickFormatter={(value) => `$${Math.round(value / 1000)}k`}
              name="Cost"
              fontSize={12}
              stroke="#64748b"
            />
            <YAxis
              type="number"
              dataKey="objectives.embodiedCarbon"
              tickFormatter={(value) => `${value}`}
              name="Carbon"
              fontSize={12}
              stroke="#64748b"
            />
            <ZAxis type="number" dataKey="bubbleSize" range={[60, 240]} />
            <Tooltip cursor={{ strokeDasharray: "4 4" }} content={<TradeoffTooltip />} />

            <Scatter data={props.background} fill="#cbd5e1" fillOpacity={0.2} />
            <Scatter data={props.foreground}>
              {props.foreground.map((point) => (
                <Cell
                  key={point.id}
                  fill={point.color}
                  fillOpacity={point.opacity}
                  stroke={props.selectedSolutionId === point.id ? "#0f172a" : point.color}
                  strokeWidth={props.selectedSolutionId === point.id ? 2 : 0}
                  style={{ cursor: "pointer" }}
                  onClick={() => props.onSelect(point.id)}
                />
              ))}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export function ParetoSurface({ results }: { results: OptimisationResult }) {
  const selectedSolutionId = useDesignStore((state) => state.selectedSolutionId);
  const setSelectedSolutionId = useDesignStore((state) => state.setSelectedSolutionId);
  const setActiveTab = useDesignStore((state) => state.setActiveTab);
  const compareMode = useDesignStore((state) => state.compareMode);
  const setCompareMode = useDesignStore((state) => state.setCompareMode);
  const [materialFilter, setMaterialFilter] = useState<string>("all");
  const [sizeFilter, setSizeFilter] = useState<string>("all");

  const feasibilityFirst = chartPoints(
    results.paretoFront,
    materialFilter,
    sizeFilter,
    selectedSolutionId,
  );
  const baseline = chartPoints(
    results.baselineParetoFront,
    materialFilter,
    sizeFilter,
    selectedSolutionId,
  );
  const baselineInfeasibleRatio = results.baselineParetoFront.length
    ? (results.baselineParetoFront.filter((solution) => !solution.feasible).length /
        results.baselineParetoFront.length) *
      100
    : 0;

  const handleSelect = (id: string) => {
    setSelectedSolutionId(id);
    setActiveTab("solutions");
  };

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="section-title">Pareto Trade-off Surface</p>
            <CardTitle className="mt-2">Cost-carbon-buildability frontier</CardTitle>
            <CardDescription className="mt-2 max-w-2xl">
              X-axis = cost, Y-axis = embodied carbon, and highlighted points show special
              buildability-aware solutions.
            </CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Select value={materialFilter} onValueChange={setMaterialFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Material highlight" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All materials</SelectItem>
                {MATERIAL_OPTIONS.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={sizeFilter} onValueChange={setSizeFilter}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Size highlight" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All sizes</SelectItem>
                {PANEL_SIZE_OPTIONS.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant={compareMode ? "default" : "outline"}
              onClick={() => setCompareMode(!compareMode)}
            >
              {compareMode ? "Hide baseline comparison" : "Show baseline comparison"}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {Object.values(specialMeta).map((item) => (
            <Badge key={item.label} variant="outline" className="gap-2">
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: item.color }}
              />
              {item.label}
            </Badge>
          ))}
        </div>

        {compareMode ? (
          <>
            <div className="grid gap-4 xl:grid-cols-2">
              <TradeoffChart
                title="Performance-only"
                description="Cost and embodied carbon only. Some frontier points are later shown to be infeasible."
                background={results.candidates}
                foreground={baseline}
                onSelect={handleSelect}
                selectedSolutionId={selectedSolutionId}
              />
              <TradeoffChart
                title="Feasibility-first"
                description="Constructability is explicit, and infeasible options are excluded before front selection."
                background={results.feasibleSolutions}
                foreground={feasibilityFirst}
                onSelect={handleSelect}
                selectedSolutionId={selectedSolutionId}
              />
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              <div className="rounded-2xl border border-border/70 bg-slate-50/70 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                  Baseline infeasible frontier
                </p>
                <p className="mt-2 text-2xl font-semibold text-slate-900">
                  {baselineInfeasibleRatio.toFixed(0)}%
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  of baseline Pareto points violate feasibility-first gates.
                </p>
              </div>
              <div className="rounded-2xl border border-border/70 bg-slate-50/70 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                  Baseline front size
                </p>
                <p className="mt-2 text-2xl font-semibold text-slate-900">
                  {results.baselineParetoFront.length}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  candidate points on the performance-only frontier.
                </p>
              </div>
              <div className="rounded-2xl border border-border/70 bg-slate-50/70 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                  Feasibility-first front size
                </p>
                <p className="mt-2 text-2xl font-semibold text-slate-900">
                  {results.paretoFront.length}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  shortlisted solutions after hard constraints and constructability weighting.
                </p>
              </div>
            </div>
          </>
        ) : (
          <TradeoffChart
            title="Feasibility-first Pareto frontier"
            description="Click a Pareto point to inspect the corresponding solution card and diagnostics."
            background={results.feasibleSolutions}
            foreground={feasibilityFirst}
            onSelect={handleSelect}
            selectedSolutionId={selectedSolutionId}
          />
        )}
      </CardContent>
    </Card>
  );
}
