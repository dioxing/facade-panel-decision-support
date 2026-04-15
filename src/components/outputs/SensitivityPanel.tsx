import { Activity, ArrowUpRight, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { formatCarbon, formatCurrency } from "@/lib/format";
import { useDesignStore } from "@/stores/useDesignStore";

function ControlRow(props: {
  title: string;
  description: string;
  valueLabel: string;
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="space-y-3 rounded-2xl border border-border/70 bg-slate-50/70 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h4 className="text-sm font-semibold text-slate-900">{props.title}</h4>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">{props.description}</p>
        </div>
        <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-800 shadow-xs">
          {props.valueLabel}
        </span>
      </div>
      <Slider
        min={props.min}
        max={props.max}
        step={props.step}
        value={[props.value]}
        onValueChange={(value) => props.onChange(value[0] ?? props.value)}
      />
    </div>
  );
}

export function SensitivityPanel() {
  const selectedSolutionId = useDesignStore((state) => state.selectedSolutionId);
  const results = useDesignStore((state) => state.results);
  const params = useDesignStore((state) => state.sensitivityParameters);
  const result = useDesignStore((state) => state.sensitivityResult);
  const setSensitivityParameter = useDesignStore((state) => state.setSensitivityParameter);
  const runSensitivityAnalysis = useDesignStore((state) => state.runSensitivityAnalysis);

  const selectedSolution = results?.candidates.find(
    (candidate) => candidate.id === selectedSolutionId,
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="h-4 w-4 text-primary" />
          <p className="section-title">Sensitivity Analysis</p>
        </div>
        <CardTitle>Perturb the selected scheme</CardTitle>
        <CardDescription>
          Stress-test the current solution against crane capacity, laydown capacity, delivery
          bookings, and installation unit-time assumptions.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-[1.4rem] border border-border/70 bg-slate-50/70 p-4">
          <p className="text-sm font-semibold text-slate-900">Selected solution</p>
          <p className="mt-2 text-sm text-muted-foreground">
            {selectedSolution
              ? `${selectedSolution.id} · ${selectedSolution.decision.materialType.replaceAll("_", " ")}`
              : "Select a solution from the Pareto surface to run sensitivity analysis."}
          </p>
        </div>

        <div className="grid gap-4 xl:grid-cols-2">
          <ControlRow
            title="Crane budget perturbation"
            description="Apply a percentage change to the available daily crane hours."
            value={params.craneBudgetDelta}
            valueLabel={`${params.craneBudgetDelta}%`}
            min={-30}
            max={30}
            step={5}
            onChange={(value) => setSensitivityParameter("craneBudgetDelta", value)}
          />
          <ControlRow
            title="Laydown capacity perturbation"
            description="Apply a percentage change to laydown capacity."
            value={params.laydownAreaDelta}
            valueLabel={`${params.laydownAreaDelta}%`}
            min={-30}
            max={30}
            step={5}
            onChange={(value) => setSensitivityParameter("laydownAreaDelta", value)}
          />
          <ControlRow
            title="Delivery booking perturbation"
            description="Apply a percentage change to booking capacity."
            value={params.deliveryCapacityDelta}
            valueLabel={`${params.deliveryCapacityDelta}%`}
            min={-30}
            max={30}
            step={5}
            onChange={(value) => setSensitivityParameter("deliveryCapacityDelta", value)}
          />
          <ControlRow
            title="Installation unit-time multiplier"
            description="Scale installation effort assumptions for the candidate set."
            value={params.installationUnitTimeMultiplier}
            valueLabel={`${params.installationUnitTimeMultiplier.toFixed(2)}x`}
            min={0.7}
            max={1.4}
            step={0.05}
            onChange={(value) =>
              setSensitivityParameter(
                "installationUnitTimeMultiplier",
                Number(value.toFixed(2)),
              )
            }
          />
        </div>

        <Button
          onClick={() => runSensitivityAnalysis()}
          disabled={!selectedSolution}
          className="w-full"
        >
          <Activity className="h-4 w-4" />
          Run sensitivity test
        </Button>

        {result ? (
          <div className="space-y-4 rounded-[1.4rem] border border-border/70 bg-slate-50/70 p-5">
            <div className="grid gap-3 md:grid-cols-3">
              <div className="rounded-2xl bg-white p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                  Still feasible
                </p>
                <p className="mt-2 text-xl font-semibold text-slate-900">
                  {result.feasibleAfterPerturbation ? "Yes" : "No"}
                </p>
              </div>
              <div className="rounded-2xl bg-white p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Knee cost drift</p>
                <p className="mt-2 text-xl font-semibold text-slate-900">
                  {result.kneeShiftCost.toFixed(1)}%
                </p>
              </div>
              <div className="rounded-2xl bg-white p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                  Knee carbon drift
                </p>
                <p className="mt-2 text-xl font-semibold text-slate-900">
                  {result.kneeShiftCarbon.toFixed(1)}%
                </p>
              </div>
            </div>

            <div className="grid gap-4 xl:grid-cols-2">
              <div className="rounded-2xl bg-white p-4">
                <div className="flex items-center gap-2">
                  <ArrowUpRight className="h-4 w-4 text-primary" />
                  <p className="text-sm font-semibold text-slate-900">Pareto response</p>
                </div>
                <div className="mt-3 space-y-2 text-sm text-muted-foreground">
                  <p>Front size change: {result.frontSizeChange.toFixed(1)}%</p>
                  <p>
                    Qualitative consistency: {result.structureConsistent ? "consistent" : "shifted"}
                  </p>
                </div>
              </div>
              <div className="rounded-2xl bg-white p-4">
                <p className="text-sm font-semibold text-slate-900">Perturbed candidate snapshot</p>
                {result.selectedSolutionAfter ? (
                  <div className="mt-3 space-y-2 text-sm text-muted-foreground">
                    <p>Cost: {formatCurrency(result.selectedSolutionAfter.objectives.cost)}</p>
                    <p>
                      Carbon: {formatCarbon(result.selectedSolutionAfter.objectives.embodiedCarbon)}
                    </p>
                    <p>
                      Constructability:{" "}
                      {result.selectedSolutionAfter.objectives.constructability.toFixed(3)}
                    </p>
                  </div>
                ) : (
                  <p className="mt-3 text-sm text-muted-foreground">
                    Selected solution is not available in the perturbed run.
                  </p>
                )}
              </div>
            </div>

            <div className="rounded-2xl bg-white p-4">
              <p className="text-sm font-semibold text-slate-900">Interpretation</p>
              <ul className="mt-3 space-y-2 text-sm leading-6 text-muted-foreground">
                {result.notes.map((note) => (
                  <li key={note}>{note}</li>
                ))}
              </ul>
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
