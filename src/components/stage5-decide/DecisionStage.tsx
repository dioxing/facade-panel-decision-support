import {
  ArrowUpRight,
  Download,
  GitBranch,
  LineChart,
  ScrollText,
  Target,
} from "lucide-react";
import {
  CartesianGrid,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from "recharts";
import { createAuditEntry } from "@/lib/auditTrail";
import { ProbabilityPill } from "@/components/shared/ProbabilityPill";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useDecisionStore, type DecisionTab } from "@/store/decisionStore";
import { useEvidenceStore } from "@/store/evidenceStore";
import { useGateStore } from "@/store/gateStore";
import { useProjectStore } from "@/store/projectStore";
import { useComputedDecision } from "@/store/useComputedDecision";
import { solutionAssignments } from "@/mock/solutions";

function solutionLabel(solutionId: string) {
  return solutionAssignments.find((solution) => solution.id === solutionId)?.label ?? solutionId;
}

function formatMoney(value: number) {
  return `$${(value / 1_000_000).toFixed(2)}M`;
}

function CounterfactualCards() {
  const actor = useProjectStore((state) => state.actor);
  const setStage = useProjectStore((state) => state.setStage);
  const addAuditEntry = useEvidenceStore((state) => state.addAuditEntry);
  const applyScenario = useGateStore((state) => state.applyCounterfactualScenario);
  const gates = useGateStore((state) => state.resourceGates);
  const { counterfactuals, solutions } = useComputedDecision();

  return (
    <div className="grid gap-4 xl:grid-cols-2">
      {counterfactuals.map((counterfactual) => {
        const solution = solutions.find((item) => item.id === counterfactual.solutionId);
        const gate = gates.find((item) => item.id === counterfactual.perturbedGate);

        return (
          <Card
            className="rounded-lg border-blue-100 dark:border-slate-800 dark:bg-slate-950"
            key={`${counterfactual.solutionId}-${counterfactual.perturbedGate}`}
          >
            <CardHeader>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="section-title">Counterfactual diagnostic</p>
                  <CardTitle className="mt-2">{solutionLabel(counterfactual.solutionId)}</CardTitle>
                </div>
                {solution && (
                  <ProbabilityPill
                    classification={solution.feasibilityClassification}
                    probability={solution.pMin}
                  />
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-base leading-relaxed text-slate-700 dark:text-slate-200">
                {counterfactual.statement}
              </p>
              <div className="grid gap-2 sm:grid-cols-3">
                <div className="rounded-lg bg-slate-50 p-3 dark:bg-slate-900/60">
                  <p className="text-xs uppercase tracking-[0.16em] text-slate-500">
                    Gate
                  </p>
                  <p className="mt-1 text-sm font-semibold">
                    {gate?.label ?? counterfactual.perturbedGate}
                  </p>
                </div>
                <div className="rounded-lg bg-slate-50 p-3 dark:bg-slate-900/60">
                  <p className="text-xs uppercase tracking-[0.16em] text-slate-500">
                    Delta
                  </p>
                  <p className="mt-1 text-sm font-semibold">
                    +{counterfactual.perturbationDelta} {gate?.unit ?? ""}
                  </p>
                </div>
                <div className="rounded-lg bg-slate-50 p-3 dark:bg-slate-900/60">
                  <p className="text-xs uppercase tracking-[0.16em] text-slate-500">
                    Result
                  </p>
                  <p className="mt-1 text-sm font-semibold">
                    {counterfactual.resultingParetoStatus.replaceAll("-", " ")}
                  </p>
                </div>
              </div>
              <Button
                className="w-full rounded-lg"
                onClick={() => {
                  applyScenario(counterfactual.perturbedGate);
                  addAuditEntry(
                    createAuditEntry({
                      actor,
                      action: "gate-tune",
                      targetType: "gate",
                      targetId: counterfactual.perturbedGate,
                      reason: `Applied counterfactual scenario from ${counterfactual.solutionId}`,
                    }),
                  );
                  setStage(4);
                }}
                variant="outline"
              >
                Apply scenario in Gate stage
                <ArrowUpRight className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

function ParetoExplorer() {
  const setSelectedSolution = useDecisionStore((state) => state.setSelectedSolution);
  const selectedSolutionId = useDecisionStore((state) => state.selectedSolutionId);
  const { solutions, kneeSolution } = useComputedDecision();
  const selected = solutions.find((solution) => solution.id === selectedSolutionId) ?? kneeSolution;
  const data = solutions.map((solution) => ({
    id: solution.id,
    name: solutionLabel(solution.id),
    costM: Number((solution.cost / 1_000_000).toFixed(2)),
    carbon: Number(solution.embodiedCarbon.toFixed(0)),
    constructability: Number(solution.constructabilityScore.toFixed(2)),
    pMin: solution.pMin,
    isPareto: solution.isPareto,
    isKnee: solution.isKnee,
  }));

  return (
    <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
      <Card className="rounded-lg dark:border-slate-800 dark:bg-slate-950">
        <CardHeader>
          <p className="section-title">Pareto explorer</p>
          <CardTitle className="flex items-center gap-2">
            <LineChart className="h-5 w-5 text-blue-600" />
            Cost-carbon frontier with constructability colour
          </CardTitle>
        </CardHeader>
        <CardContent className="h-[420px]">
          <ResponsiveContainer height="100%" width="100%">
            <ScatterChart margin={{ bottom: 20, left: 10, right: 20, top: 15 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="costM"
                label={{ value: "Cost ($M)", position: "bottom" }}
                name="Cost"
                type="number"
              />
              <YAxis
                dataKey="carbon"
                label={{ value: "Embodied carbon (tCO2e)", angle: -90, position: "insideLeft" }}
                name="Carbon"
                type="number"
              />
              <ZAxis dataKey="constructability" range={[90, 360]} />
              <Tooltip
                cursor={{ strokeDasharray: "3 3" }}
                formatter={(value, name) => [value, name]}
                labelFormatter={(_, payload) => payload[0]?.payload?.name ?? ""}
              />
              <Scatter
                data={data}
                fill="#2563eb"
                name="Solutions"
                onClick={(point: unknown) => {
                  const payload = point as { id?: string; payload?: { id?: string } };
                  setSelectedSolution(payload.id ?? payload.payload?.id);
                }}
              />
            </ScatterChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="rounded-lg dark:border-slate-800 dark:bg-slate-950">
        <CardHeader>
          <p className="section-title">Selected solution</p>
          <CardTitle>{selected ? solutionLabel(selected.id) : "Select a point"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {selected && (
            <>
              <div className="grid gap-2 sm:grid-cols-3">
                <div className="rounded-lg bg-slate-50 p-3 dark:bg-slate-900/60">
                  <p className="text-xs uppercase tracking-[0.16em] text-slate-500">
                    Cost
                  </p>
                  <p className="mt-1 text-lg font-semibold">{formatMoney(selected.cost)}</p>
                </div>
                <div className="rounded-lg bg-slate-50 p-3 dark:bg-slate-900/60">
                  <p className="text-xs uppercase tracking-[0.16em] text-slate-500">
                    Carbon
                  </p>
                  <p className="mt-1 text-lg font-semibold">
                    {selected.embodiedCarbon.toFixed(0)}
                  </p>
                </div>
                <div className="rounded-lg bg-slate-50 p-3 dark:bg-slate-900/60">
                  <p className="text-xs uppercase tracking-[0.16em] text-slate-500">
                    Buildability
                  </p>
                  <p className="mt-1 text-lg font-semibold">
                    {selected.constructabilityScore.toFixed(2)}
                  </p>
                </div>
              </div>
              <ProbabilityPill
                classification={selected.feasibilityClassification}
                probability={selected.pMin}
              />
              <div className="space-y-2">
                {Object.entries(selected.systemAssignment).map(([zoneId, systemId]) => (
                  <div
                    className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-800"
                    key={zoneId}
                  >
                    <span className="font-semibold">{zoneId}</span>
                    <span>{systemId}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Card className="rounded-lg xl:col-span-2 dark:border-slate-800 dark:bg-slate-950">
        <CardContent className="grid gap-4 p-4 lg:grid-cols-3">
          <div>
            <p className="section-title">Baseline comparison</p>
            <h3 className="mt-2 text-base font-semibold">Performance-only vs feasibility-first</h3>
          </div>
          <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
            Performance-only ranking highlights lower cost and lower carbon packages
            before site gates are applied. In this prototype those options remain
            visible but their infeasible cells are not allowed to masquerade as
            buildable recommendations.
          </p>
          <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
            Feasibility-first shifts preference toward systems with better delivery,
            lifting, and laydown resilience. Counterfactual cards show which gate
            relaxation would change that decision.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function SolutionList() {
  const { solutions } = useComputedDecision();

  return (
    <div className="grid gap-4 xl:grid-cols-2">
      {solutions.map((solution) => (
        <Card className="rounded-lg dark:border-slate-800 dark:bg-slate-950" key={solution.id}>
          <CardHeader>
            <div className="flex items-start justify-between gap-3">
              <CardTitle>{solutionLabel(solution.id)}</CardTitle>
              <div className="flex flex-wrap justify-end gap-2">
                {solution.isKnee && <Badge>Knee</Badge>}
                {solution.isPareto && <Badge variant="success">Pareto</Badge>}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2 sm:grid-cols-4">
              <div className="rounded-lg bg-slate-50 p-3 dark:bg-slate-900/60">
                <p className="text-xs text-slate-500">Cost</p>
                <p className="font-semibold">{formatMoney(solution.cost)}</p>
              </div>
              <div className="rounded-lg bg-slate-50 p-3 dark:bg-slate-900/60">
                <p className="text-xs text-slate-500">Carbon</p>
                <p className="font-semibold">{solution.embodiedCarbon.toFixed(0)}</p>
              </div>
              <div className="rounded-lg bg-slate-50 p-3 dark:bg-slate-900/60">
                <p className="text-xs text-slate-500">Con.</p>
                <p className="font-semibold">{solution.constructabilityScore.toFixed(2)}</p>
              </div>
              <div className="rounded-lg bg-slate-50 p-3 dark:bg-slate-900/60">
                <p className="text-xs text-slate-500">p-min</p>
                <p className="font-semibold">{solution.pMin.toFixed(2)}</p>
              </div>
            </div>
            <ProbabilityPill
              classification={solution.feasibilityClassification}
              probability={solution.pMin}
            />
            <div className="grid gap-2">
              {solution.bindingGates.map((gate) => (
                <span
                  className="rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-800"
                  key={gate}
                >
                  Binding: {gate}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function AuditTrailView() {
  const entries = useEvidenceStore((state) => state.auditEntries);
  const exportNotice = useDecisionStore((state) => state.exportNotice);
  const setExportNotice = useDecisionStore((state) => state.setExportNotice);

  return (
    <Card className="rounded-lg dark:border-slate-800 dark:bg-slate-950">
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="section-title">Audit trail</p>
            <CardTitle className="flex items-center gap-2">
              <ScrollText className="h-5 w-5 text-blue-600" />
              Evidence and decision lineage
            </CardTitle>
          </div>
          <Button
            onClick={() =>
              setExportNotice(
                `Mock export created with ${entries.length} audit entries, evidence references, and gate settings.`,
              )
            }
            variant="outline"
          >
            <Download className="h-4 w-4" />
            Mock export
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {exportNotice && (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200">
            {exportNotice}
          </div>
        )}
        {entries.map((entry) => (
          <div
            className="rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900/60"
            key={entry.id}
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-semibold">
                {entry.action} / {entry.targetType} / {entry.targetId}
              </p>
              <Badge variant="outline">{entry.actor}</Badge>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              {new Date(entry.timestamp).toLocaleString()}
            </p>
            {entry.reason && (
              <p className="mt-2 text-sm text-slate-700 dark:text-slate-200">
                {entry.reason}
              </p>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export function DecisionStage() {
  const activeTab = useDecisionStore((state) => state.activeTab);
  const setActiveTab = useDecisionStore((state) => state.setActiveTab);
  const { solutions, paretoSolutions, kneeSolution } = useComputedDecision();

  return (
    <div className="space-y-4">
      <Card className="rounded-lg dark:border-slate-800 dark:bg-slate-950">
        <CardHeader>
          <p className="section-title">Decide and audit</p>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-blue-600" />
            Feasibility-first decision artefacts
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-4">
          <div className="rounded-lg border border-slate-200 p-3 dark:border-slate-800">
            <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Solutions</p>
            <p className="mt-1 text-2xl font-semibold">{solutions.length}</p>
          </div>
          <div className="rounded-lg border border-slate-200 p-3 dark:border-slate-800">
            <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Pareto</p>
            <p className="mt-1 text-2xl font-semibold">{paretoSolutions.length}</p>
          </div>
          <div className="rounded-lg border border-slate-200 p-3 dark:border-slate-800">
            <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Knee</p>
            <p className="mt-1 text-base font-semibold">
              {kneeSolution ? solutionLabel(kneeSolution.id) : "None"}
            </p>
          </div>
          <div className="rounded-lg border border-slate-200 p-3 dark:border-slate-800">
            <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Mode</p>
            <p className="mt-1 text-base font-semibold">Feasibility-first</p>
          </div>
        </CardContent>
      </Card>

      <Tabs
        onValueChange={(value) => setActiveTab(value as DecisionTab)}
        value={activeTab}
      >
        <TabsList className="rounded-lg dark:bg-slate-900">
          <TabsTrigger value="counterfactuals">
            <GitBranch className="h-4 w-4" />
            Counterfactual Cards
          </TabsTrigger>
          <TabsTrigger value="pareto">Pareto Explorer</TabsTrigger>
          <TabsTrigger value="solutions">Solution Cards</TabsTrigger>
          <TabsTrigger value="audit">Audit Trail</TabsTrigger>
        </TabsList>
        <TabsContent value="counterfactuals">
          <CounterfactualCards />
        </TabsContent>
        <TabsContent value="pareto">
          <ParetoExplorer />
        </TabsContent>
        <TabsContent value="solutions">
          <SolutionList />
        </TabsContent>
        <TabsContent value="audit">
          <AuditTrailView />
        </TabsContent>
      </Tabs>
    </div>
  );
}
