import { ArrowRight, Gauge, LockKeyhole, SlidersHorizontal } from "lucide-react";
import { createAuditEntry } from "@/lib/auditTrail";
import { ProbabilityPill } from "@/components/shared/ProbabilityPill";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { useEvidenceStore } from "@/store/evidenceStore";
import { useGateStore } from "@/store/gateStore";
import { useProjectStore } from "@/store/projectStore";
import { useComputedDecision } from "@/store/useComputedDecision";
import type { ResourceQuota } from "@/types/domain";

function GateSlider({
  gateId,
}: {
  gateId: string;
}) {
  const actor = useProjectStore((state) => state.actor);
  const updateZoneResource = useProjectStore((state) => state.updateZoneResource);
  const addAuditEntry = useEvidenceStore((state) => state.addAuditEntry);
  const gate = useGateStore((state) =>
    state.resourceGates.find((item) => item.id === gateId),
  );
  const highlightedGateId = useGateStore((state) => state.highlightedGateId);
  const updateResourceGate = useGateStore((state) => state.updateResourceGate);

  if (!gate) {
    return null;
  }

  const handleChange = (next: number) => {
    updateResourceGate(gate.id, next);
    if (
      gate.zoneId &&
      ["craneHoursPerDay", "laydownAreaM2", "deliverySlotsPerDay", "installWindowDays"].includes(
        gate.parameterKey,
      )
    ) {
      updateZoneResource(
        gate.zoneId,
        gate.parameterKey as keyof ResourceQuota,
        next,
      );
    }
    addAuditEntry(
      createAuditEntry({
        actor,
        action: "gate-tune",
        targetType: "gate",
        targetId: gate.id,
        before: gate.currentValue,
        after: next,
        reason: "Workshop resource-gate calibration",
      }),
    );
  };

  const uncertaintyLeft = Math.max(gate.range[0], gate.currentValue - gate.uncertaintyStdDev);
  const uncertaintyRight = Math.min(gate.range[1], gate.currentValue + gate.uncertaintyStdDev);
  const range = gate.range[1] - gate.range[0];

  return (
    <div
      className={`rounded-lg border p-4 transition ${
        highlightedGateId === gate.id
          ? "border-blue-500 bg-blue-50 shadow-sm dark:border-blue-400 dark:bg-blue-500/15"
          : "border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <Label className="text-sm font-semibold">{gate.label}</Label>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Uncertainty sigma: {gate.uncertaintyStdDev} {gate.unit}
          </p>
        </div>
        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-sm font-semibold dark:bg-slate-900">
          {gate.currentValue} {gate.unit}
        </span>
      </div>
      <Slider
        className="mt-5"
        max={gate.range[1]}
        min={gate.range[0]}
        onValueChange={([next]) => handleChange(next)}
        step={gate.unit === "m2" ? 5 : gate.unit === "kg" ? 25 : 0.1}
        value={[gate.currentValue]}
      />
      <div className="relative mt-3 h-2 rounded-full bg-slate-100 dark:bg-slate-800">
        <span
          className="absolute top-0 h-2 rounded-full bg-blue-300/70 dark:bg-blue-400/40"
          style={{
            left: `${((uncertaintyLeft - gate.range[0]) / range) * 100}%`,
            width: `${((uncertaintyRight - uncertaintyLeft) / range) * 100}%`,
          }}
        />
      </div>
      <div className="mt-2 flex justify-between text-xs text-slate-500">
        <span>
          {gate.range[0]} {gate.unit}
        </span>
        <span>
          {gate.range[1]} {gate.unit}
        </span>
      </div>
    </div>
  );
}

export function GateStage() {
  const setStage = useProjectStore((state) => state.setStage);
  const hardGates = useGateStore((state) => state.hardGates);
  const resourceGates = useGateStore((state) => state.resourceGates);
  const { feasibilityCells } = useComputedDecision();
  const feasibleCount = feasibilityCells.filter(
    (cell) => cell.classification === "feasible",
  ).length;
  const conditionalCount = feasibilityCells.filter(
    (cell) => cell.classification === "conditional",
  ).length;
  const infeasibleCount = feasibilityCells.filter(
    (cell) => cell.classification === "infeasible",
  ).length;

  return (
    <div className="space-y-4">
      <div className="grid gap-4 xl:grid-cols-[0.8fr_1.2fr]">
        <Card className="rounded-lg dark:border-slate-800 dark:bg-slate-950">
          <CardHeader>
            <p className="section-title">Hard gates</p>
            <CardTitle className="flex items-center gap-2">
              <LockKeyhole className="h-5 w-5 text-blue-600" />
              Read-only regulatory constraints
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {hardGates.map((gate) => (
              <div
                className="rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900/60"
                key={gate.id}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold">{gate.label}</p>
                    <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                      {gate.requirement}
                    </p>
                  </div>
                  <Badge variant="outline">{gate.category}</Badge>
                </div>
              </div>
            ))}
            <div className="rounded-lg border border-slate-200 p-3 dark:border-slate-800">
              <p className="text-sm font-semibold">Live screen summary</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <ProbabilityPill classification="feasible" probability={feasibleCount / 15} />
                <ProbabilityPill
                  classification="conditional"
                  probability={conditionalCount / 15}
                />
                <ProbabilityPill
                  classification="infeasible"
                  probability={infeasibleCount / 15}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-lg dark:border-slate-800 dark:bg-slate-950">
          <CardHeader>
            <p className="section-title">Resource gates</p>
            <CardTitle className="flex items-center gap-2">
              <SlidersHorizontal className="h-5 w-5 text-blue-600" />
              Probabilistic resource envelopes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border border-blue-100 bg-blue-50 p-3 text-sm leading-relaxed text-blue-900 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-100">
              Sliders change gate capacity and uncertainty-aware feasibility in
              the matrix updates immediately. The blue band below each slider is
              the one-sigma uncertainty range around the current gate value.
            </div>
            <div className="grid gap-3 xl:grid-cols-2">
              {resourceGates.map((gate) => (
                <GateSlider gateId={gate.id} key={gate.id} />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Button className="rounded-lg" onClick={() => setStage(5)}>
        <Gauge className="h-4 w-4" />
        Run decision model
        <ArrowRight className="h-4 w-4" />
      </Button>
    </div>
  );
}
