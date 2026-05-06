import { AlertTriangle } from "lucide-react";
import { DqiBadge } from "@/components/shared/DqiBadge";
import { ProbabilityPill } from "@/components/shared/ProbabilityPill";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useComputedDecision } from "@/store/useComputedDecision";
import { useProjectStore } from "@/store/projectStore";

export function FeasibilityMatrix() {
  const zones = useProjectStore((state) => state.zones);
  const { candidateSystems, feasibilityCells } = useComputedDecision();

  return (
    <Card className="sticky top-4 rounded-lg dark:border-slate-800 dark:bg-slate-950">
      <CardHeader className="p-4">
        <div className="flex items-center justify-between gap-2">
          <div>
            <p className="section-title">Live Gate Output</p>
            <CardTitle className="mt-2 text-base">Feasibility matrix</CardTitle>
          </div>
          <AlertTriangle className="h-5 w-5 text-amber-500" />
        </div>
      </CardHeader>
      <CardContent className="space-y-3 p-4 pt-0">
        <div className="grid grid-cols-[1.1fr_repeat(3,minmax(82px,1fr))] gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
          <span>System</span>
          {zones.map((zone) => (
            <span key={zone.id}>{zone.label}</span>
          ))}
        </div>
        {candidateSystems.map((system) => (
          <div
            key={system.id}
            className="grid grid-cols-[1.1fr_repeat(3,minmax(82px,1fr))] gap-2 rounded-lg border border-slate-200 bg-slate-50/80 p-2 dark:border-slate-800 dark:bg-slate-900/60"
          >
            <div>
              <p className="text-xs font-semibold text-slate-900 dark:text-slate-50">
                {system.label.replace(/^S\d\s/, "")}
              </p>
              <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                {Math.round(system.evidenceCoverage * 100)}% evidence
              </p>
            </div>
            {zones.map((zone) => {
              const cell = feasibilityCells.find(
                (item) => item.systemId === system.id && item.zoneId === zone.id,
              );

              if (!cell) {
                return <span key={zone.id}>No cell</span>;
              }

              return (
                <div key={zone.id} className="space-y-1">
                  <ProbabilityPill
                    classification={cell.classification}
                    probability={cell.pFeasible}
                    className="w-full px-1"
                  />
                  <DqiBadge dqi={cell.dqiAggregate} compact />
                  <p className="truncate text-[10px] text-slate-500 dark:text-slate-400">
                    {cell.bindingGates[0]?.replace("gate-", "") ?? "clear"}
                  </p>
                </div>
              );
            })}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
