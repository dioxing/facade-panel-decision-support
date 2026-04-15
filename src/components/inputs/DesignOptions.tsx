import { Blocks, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import {
  CONNECTION_OPTIONS,
  INSULATION_OPTIONS,
  MATERIAL_OPTIONS,
  PANEL_SIZE_OPTIONS,
  STANDARDISATION_OPTIONS,
} from "@/models/types";
import { useDesignStore } from "@/stores/useDesignStore";

function PillGroup<TValue extends string | number>(props: {
  values: TValue[];
  options: { value: TValue; label: string; shortLabel?: string }[];
  onToggle: (value: TValue) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {props.options.map((option) => {
        const active = props.values.includes(option.value);

        return (
          <Button
            key={String(option.value)}
            type="button"
            variant={active ? "default" : "outline"}
            size="sm"
            className={active ? "shadow-sm" : "bg-white"}
            onClick={() => props.onToggle(option.value)}
          >
            {active ? <CheckCircle2 className="h-3.5 w-3.5" /> : null}
            {option.shortLabel ?? option.label}
          </Button>
        );
      })}
    </div>
  );
}

export function DesignOptions() {
  const designOptions = useDesignStore((state) => state.designOptions);
  const toggleMaterial = useDesignStore((state) => state.toggleMaterial);
  const toggleInsulation = useDesignStore((state) => state.toggleInsulation);
  const togglePanelSize = useDesignStore((state) => state.togglePanelSize);
  const toggleConnection = useDesignStore((state) => state.toggleConnection);
  const toggleStandardisation = useDesignStore((state) => state.toggleStandardisation);
  const setPanelThicknessRange = useDesignStore((state) => state.setPanelThicknessRange);

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center gap-2">
          <Blocks className="h-4 w-4 text-primary" />
          <span className="section-title">Design Options</span>
        </div>
        <CardTitle>Search space definition</CardTitle>
        <CardDescription>
          Select which material, insulation, sizing, and connection options participate in the
          optimisation run.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-slate-800">Panel material type</h4>
            <Badge variant="secondary">{designOptions.materialTypes.length} active</Badge>
          </div>
          <PillGroup
            values={designOptions.materialTypes}
            options={MATERIAL_OPTIONS}
            onToggle={toggleMaterial}
          />
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-slate-800">Insulation type</h4>
            <Badge variant="secondary">{designOptions.insulationTypes.length} active</Badge>
          </div>
          <PillGroup
            values={designOptions.insulationTypes}
            options={INSULATION_OPTIONS}
            onToggle={toggleInsulation}
          />
        </div>

        <div className="space-y-4 rounded-2xl border border-border/70 bg-slate-50/70 p-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-semibold text-slate-800">Panel thickness range</h4>
              <p className="mt-1 text-xs text-muted-foreground">
                Search thickness between the selected lower and upper bounds.
              </p>
            </div>
            <Badge variant="secondary">
              {designOptions.panelThicknessRange[0]} - {designOptions.panelThicknessRange[1]} mm
            </Badge>
          </div>
          <Slider
            min={100}
            max={400}
            step={10}
            value={designOptions.panelThicknessRange}
            onValueChange={(value) =>
              setPanelThicknessRange([
                Math.min(value[0] ?? 100, value[1] ?? 400),
                Math.max(value[0] ?? 100, value[1] ?? 400),
              ])
            }
          />
          <div className="flex justify-between text-[11px] text-muted-foreground">
            <span>100 mm</span>
            <span>400 mm</span>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-slate-800">Panel size category</h4>
            <Badge variant="secondary">{designOptions.panelSizeCategories.length} active</Badge>
          </div>
          <PillGroup
            values={designOptions.panelSizeCategories}
            options={PANEL_SIZE_OPTIONS}
            onToggle={togglePanelSize}
          />
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-slate-800">Connection typology</h4>
            <Badge variant="secondary">{designOptions.connectionTypes.length} active</Badge>
          </div>
          <PillGroup
            values={designOptions.connectionTypes}
            options={CONNECTION_OPTIONS}
            onToggle={toggleConnection}
          />
        </div>

        <div className="space-y-3 rounded-2xl border border-border/70 bg-slate-50/70 p-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-semibold text-slate-800">Standardisation level</h4>
              <p className="mt-1 text-xs text-muted-foreground">
                Higher standardisation reduces panel variety but may constrain facade expression.
              </p>
            </div>
            <Badge variant="secondary">{designOptions.standardisationLevels.length} active</Badge>
          </div>
          <PillGroup
            values={designOptions.standardisationLevels}
            options={STANDARDISATION_OPTIONS}
            onToggle={toggleStandardisation}
          />
        </div>
      </CardContent>
    </Card>
  );
}
