import { BarChart3, Factory, Sparkles } from "lucide-react";
import { InfeasibilityDiag } from "@/components/outputs/InfeasibilityDiag";
import { ParetoSurface } from "@/components/outputs/ParetoSurface";
import { PatternClusters } from "@/components/outputs/PatternClusters";
import { SensitivityPanel } from "@/components/outputs/SensitivityPanel";
import { SolutionCard } from "@/components/outputs/SolutionCard";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { OUTPUT_TABS } from "@/models/types";
import { useDesignStore } from "@/stores/useDesignStore";

export function OutputPanel() {
  const results = useDesignStore((state) => state.results);
  const selectedSolutionId = useDesignStore((state) => state.selectedSolutionId);
  const activeTab = useDesignStore((state) => state.activeTab);
  const setActiveTab = useDesignStore((state) => state.setActiveTab);

  if (!results) {
    return (
      <section className="panel-surface flex min-h-[calc(100vh-3rem)] items-center justify-center p-10">
        <div className="max-w-md text-center">
          <Sparkles className="mx-auto h-10 w-10 text-primary" />
          <h2 className="mt-4 text-xl font-semibold text-slate-900">Preparing optimisation model</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Generating mock candidates, checking feasibility, and assembling the Pareto surface.
          </p>
        </div>
      </section>
    );
  }

  const selectedSolution = results.candidates.find(
    (candidate) => candidate.id === selectedSolutionId,
  );

  return (
    <section className="space-y-4">
      <div className="panel-surface p-6">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-primary" />
              <span className="section-title">Decision Artefacts</span>
            </div>
            <h2 className="mt-3 text-2xl font-semibold text-slate-900">
              Feasibility-aware optimisation results
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
              Explore trade-offs, inspect shortlisted solutions, diagnose infeasible regions, and
              identify recurring facade system families.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline">Selected: {selectedSolution?.id ?? "none"}</Badge>
            <Badge variant="secondary">{results.paretoFront.length} Pareto solutions</Badge>
            <Badge variant="outline">{results.excludedCount} excluded</Badge>
          </div>
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-4">
          <Card className="metric-glow">
            <CardContent className="p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Candidates</p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">{results.totalCandidates}</p>
            </CardContent>
          </Card>
          <Card className="metric-glow">
            <CardContent className="p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Feasible</p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">
                {results.feasibleSolutions.length}
              </p>
            </CardContent>
          </Card>
          <Card className="metric-glow">
            <CardContent className="p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Pareto</p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">{results.paretoFront.length}</p>
            </CardContent>
          </Card>
          <Card className="metric-glow">
            <CardContent className="p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Clusters</p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">{results.clusters.length}</p>
            </CardContent>
          </Card>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as typeof activeTab)}>
        <TabsList className="panel-surface p-2">
          {OUTPUT_TABS.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value}>
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="pareto">
          <ParetoSurface results={results} />
        </TabsContent>
        <TabsContent value="solutions">
          <SolutionCard solution={selectedSolution} />
        </TabsContent>
        <TabsContent value="diagnostics">
          <InfeasibilityDiag results={results} />
        </TabsContent>
        <TabsContent value="clusters">
          <PatternClusters clusters={results.clusters} />
        </TabsContent>
        <TabsContent value="sensitivity">
          <SensitivityPanel />
        </TabsContent>
      </Tabs>

      <div className="panel-surface flex items-start gap-3 p-5">
        <Factory className="mt-0.5 h-5 w-5 text-primary" />
        <div>
          <p className="text-sm font-semibold text-slate-900">Research framing</p>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            The interface prioritises feasibility-first optimisation by screening candidate systems
            against site logistics and constructability before design teams interpret cost-carbon
            trade-offs.
          </p>
        </div>
      </div>
    </section>
  );
}
