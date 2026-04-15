import { useEffect, useTransition } from "react";
import { ArrowRight, RefreshCcw } from "lucide-react";
import { DataImportPanel } from "@/components/inputs/DataImportPanel";
import { DesignOptions } from "@/components/inputs/DesignOptions";
import { ProjectContext } from "@/components/inputs/ProjectContext";
import { WeightProfile } from "@/components/inputs/WeightProfile";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useDesignStore } from "@/stores/useDesignStore";

export function InputPanel() {
  const results = useDesignStore((state) => state.results);
  const runOptimisation = useDesignStore((state) => state.runOptimisation);
  const isRunning = useDesignStore((state) => state.isRunning);
  const dataSource = useDesignStore((state) => state.dataSource);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!results) {
      runOptimisation();
    }
  }, [results, runOptimisation]);

  return (
    <aside className="panel-surface min-h-[calc(100vh-3rem)] overflow-hidden">
      <ScrollArea className="h-[calc(100vh-3rem)]">
        <div className="space-y-6 p-6">
          <div className="space-y-4 rounded-[1.6rem] bg-linear-to-br from-slate-900 via-slate-800 to-blue-900 p-6 text-white shadow-[0_20px_55px_rgba(15,23,42,0.18)]">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="border-white/20 bg-white/10 text-white" variant="outline">
                feasibility-first
              </Badge>
              <Badge className="border-cyan-300/20 bg-cyan-300/10 text-cyan-100" variant="outline">
                early-stage facade decisions
              </Badge>
              <Badge className="border-white/20 bg-white/10 text-white" variant="outline">
                {dataSource === "imported" ? "using imported data" : "using mock data"}
              </Badge>
            </div>
            <div>
              <p className="section-title text-blue-100/80">Facade Panel Decision Support</p>
              <h1 className="mt-3 text-2xl font-semibold leading-tight">
                Make cost, carbon, and constructability visible in one optimisation loop.
              </h1>
            </div>
            <p className="text-sm leading-6 text-slate-200">
              This interface keeps constructability explicit inside the objective space so Pareto
              solutions stay buildable under real project constraints.
            </p>
            <Button
              size="lg"
              className="w-full justify-between"
              onClick={() => startTransition(() => runOptimisation())}
              disabled={isRunning || isPending}
            >
              <span className="flex items-center gap-2">
                <RefreshCcw className="h-4 w-4" />
                {isRunning || isPending ? "Running optimisation..." : "Run optimisation"}
              </span>
              <ArrowRight className="h-4 w-4" />
            </Button>
            {results ? (
              <div className="grid grid-cols-3 gap-3 text-center text-xs">
                <div className="rounded-2xl bg-white/10 px-3 py-3">
                  <div className="text-lg font-semibold text-white">{results.totalCandidates}</div>
                  <div className="mt-1 text-slate-200">Candidates</div>
                </div>
                <div className="rounded-2xl bg-white/10 px-3 py-3">
                  <div className="text-lg font-semibold text-white">
                    {results.paretoFront.length}
                  </div>
                  <div className="mt-1 text-slate-200">Pareto</div>
                </div>
                <div className="rounded-2xl bg-white/10 px-3 py-3">
                  <div className="text-lg font-semibold text-white">{results.excludedCount}</div>
                  <div className="mt-1 text-slate-200">Excluded</div>
                </div>
              </div>
            ) : null}
          </div>

          <DataImportPanel />
          <ProjectContext />
          <DesignOptions />
          <WeightProfile />
        </div>
      </ScrollArea>
    </aside>
  );
}
