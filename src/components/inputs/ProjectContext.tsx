import { AlertTriangle, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { FACADE_ZONES } from "@/models/types";
import type { FireClass, ProjectConstraints } from "@/models/types";
import { useDesignStore } from "@/stores/useDesignStore";

const fireClasses: FireClass[] = ["A1", "A2", "B", "C"];

function FieldSlider(props: {
  label: string;
  description: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit: string;
  onChange: (value: number) => void;
}) {
  return (
    <div className="space-y-3 rounded-2xl border border-border/70 bg-slate-50/70 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <Label className="text-sm font-semibold text-slate-800">{props.label}</Label>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">{props.description}</p>
        </div>
        <Badge variant="secondary">
          {props.value}
          {props.unit ? ` ${props.unit}` : ""}
        </Badge>
      </div>
      <Slider
        min={props.min}
        max={props.max}
        step={props.step}
        value={[props.value]}
        onValueChange={(value) => props.onChange(value[0] ?? props.value)}
      />
      <div className="flex justify-between text-[11px] text-muted-foreground">
        <span>
          {props.min}
          {props.unit ? ` ${props.unit}` : ""}
        </span>
        <span>
          {props.max}
          {props.unit ? ` ${props.unit}` : ""}
        </span>
      </div>
    </div>
  );
}

export function ProjectContext() {
  const constraints = useDesignStore((state) => state.projectConstraints);
  const setProjectConstraint = useDesignStore((state) => state.setProjectConstraint);

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-primary" />
          <span className="section-title">Project Context</span>
        </div>
        <CardTitle>Gatekeeper constraints</CardTitle>
        <CardDescription>
          Solutions violating these constraints are excluded from the Pareto set.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2 rounded-2xl border border-border/70 bg-slate-50/70 p-4">
          <Label className="text-sm font-semibold text-slate-800">Facade zone</Label>
          <Select
            value={constraints.facadeZone}
            onValueChange={(value) => setProjectConstraint("facadeZone", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select facade zone" />
            </SelectTrigger>
            <SelectContent>
              {FACADE_ZONES.map((zone) => (
                <SelectItem key={zone.value} value={zone.value}>
                  {zone.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <FieldSlider
          label="Delivery booking capacity"
          description="Maximum daily delivery bookings available for the facade package."
          value={constraints.deliveryBookingCapacity}
          min={1}
          max={20}
          step={1}
          unit="trips/day"
          onChange={(value) =>
            setProjectConstraint("deliveryBookingCapacity", Math.round(value))
          }
        />
        <FieldSlider
          label="Laydown area"
          description="Temporary laydown and sequencing buffer available on site."
          value={constraints.laydownArea}
          min={50}
          max={500}
          step={10}
          unit="m2"
          onChange={(value) => setProjectConstraint("laydownArea", Math.round(value))}
        />
        <FieldSlider
          label="Crane time budget"
          description="Daily crane hours that can be allocated to panel lifting and installation."
          value={constraints.craneTimeBudget}
          min={2}
          max={12}
          step={0.5}
          unit="hr/day"
          onChange={(value) => setProjectConstraint("craneTimeBudget", value)}
        />
        <FieldSlider
          label="Max panel weight"
          description="Single-panel lifting limit based on crane and rigging envelope."
          value={constraints.maxPanelWeight}
          min={500}
          max={8000}
          step={100}
          unit="kg"
          onChange={(value) => setProjectConstraint("maxPanelWeight", Math.round(value))}
        />
        <FieldSlider
          label="Max panel dimension"
          description="Largest transportable panel dimension for delivery and handling."
          value={constraints.maxPanelDimension}
          min={2}
          max={12}
          step={0.1}
          unit="m"
          onChange={(value) => setProjectConstraint("maxPanelDimension", Number(value.toFixed(1)))}
        />
        <FieldSlider
          label="Min thermal performance (R-value)"
          description="Minimum thermal resistance requirement for candidate solutions."
          value={constraints.minThermalR}
          min={1}
          max={8}
          step={0.1}
          unit="m2K/W"
          onChange={(value) => setProjectConstraint("minThermalR", Number(value.toFixed(1)))}
        />

        <div className="space-y-2 rounded-2xl border border-border/70 bg-slate-50/70 p-4">
          <Label className="text-sm font-semibold text-slate-800">Fire classification</Label>
          <Select
            value={constraints.fireClass}
            onValueChange={(value) =>
              setProjectConstraint("fireClass", value as ProjectConstraints["fireClass"])
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select fire class" />
            </SelectTrigger>
            <SelectContent>
              {fireClasses.map((fireClass) => (
                <SelectItem key={fireClass} value={fireClass}>
                  {fireClass}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="rounded-2xl border border-amber-200 bg-amber-50/80 p-4 text-sm text-amber-900">
          <div className="flex items-center gap-2 font-semibold">
            <AlertTriangle className="h-4 w-4" />
            Gatekeeper logic
          </div>
          <p className="mt-2 leading-6 text-amber-800">
            These checks act as hard feasibility gates before multi-objective optimisation is
            considered.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
