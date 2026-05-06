import { ArrowRight, Building2, MapPinned } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { useGateStore } from "@/store/gateStore";
import { useProjectStore } from "@/store/projectStore";
import type { ProcurementType, ResourceQuota } from "@/types/domain";

const procurementOptions: Array<{ value: ProcurementType; label: string }> = [
  { value: "eci", label: "Early Contractor Involvement" },
  { value: "design-build", label: "Design-build" },
  { value: "ipd", label: "Integrated Project Delivery" },
  { value: "traditional", label: "Traditional tender" },
];

function ResourceSlider({
  label,
  max,
  min,
  step = 1,
  unit,
  value,
  onChange,
}: {
  label: string;
  max: number;
  min: number;
  step?: number;
  unit: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900/60">
      <div className="flex items-center justify-between gap-3">
        <Label className="text-sm font-semibold">{label}</Label>
        <span className="rounded-full bg-white px-2 py-1 text-xs font-semibold text-slate-700 shadow-xs dark:bg-slate-950 dark:text-slate-200">
          {value} {unit}
        </span>
      </div>
      <Slider
        className="mt-4"
        max={max}
        min={min}
        onValueChange={([next]) => onChange(next)}
        step={step}
        value={[value]}
      />
      <div className="mt-2 flex justify-between text-xs text-slate-500">
        <span>
          {min} {unit}
        </span>
        <span>
          {max} {unit}
        </span>
      </div>
    </div>
  );
}

export function ProjectSetupStage() {
  const context = useProjectStore((state) => state.projectContext);
  const zones = useProjectStore((state) => state.zones);
  const updateContext = useProjectStore((state) => state.updateProjectContext);
  const updateZoneResource = useProjectStore((state) => state.updateZoneResource);
  const setStage = useProjectStore((state) => state.setStage);
  const updateZoneResourceGate = useGateStore((state) => state.updateZoneResourceGate);

  const handleZoneResource = <K extends keyof ResourceQuota>(
    zoneId: string,
    key: K,
    value: ResourceQuota[K],
  ) => {
    updateZoneResource(zoneId, key, value);
    updateZoneResourceGate(zoneId, key, Number(value));
  };

  return (
    <div className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
      <Card className="rounded-lg dark:border-slate-800 dark:bg-slate-950">
        <CardHeader>
          <p className="section-title">Workshop setup</p>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-blue-600" />
            Project context
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg border border-blue-100 bg-blue-50 p-3 text-sm leading-relaxed text-blue-900 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-100">
            Parameters downstream are populated through document evidence and
            human verification. Direct numeric edits belong in Evidence as
            reasoned manual overrides, not hidden assumptions.
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="space-y-2">
              <span className="text-sm font-semibold">Project name</span>
              <input
                className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-800 dark:bg-slate-900"
                onChange={(event) =>
                  updateContext({ projectName: event.target.value })
                }
                value={context.projectName}
              />
            </label>
            <label className="space-y-2">
              <span className="text-sm font-semibold">Location</span>
              <input
                className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-800 dark:bg-slate-900"
                onChange={(event) => updateContext({ location: event.target.value })}
                value={context.location}
              />
            </label>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Procurement route</Label>
              <Select
                onValueChange={(value) =>
                  updateContext({ procurement: value as ProcurementType })
                }
                value={context.procurement}
              >
                <SelectTrigger className="rounded-lg dark:border-slate-800 dark:bg-slate-900">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {procurementOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Regulatory frame</Label>
              <Select
                onValueChange={(value) =>
                  updateContext({ regulatory: value as typeof context.regulatory })
                }
                value={context.regulatory}
              >
                <SelectTrigger className="rounded-lg dark:border-slate-800 dark:bg-slate-900">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="nz-mbie-eci">NZ MBIE + ECI</SelectItem>
                  <SelectItem value="uk-building-safety-act">
                    UK Building Safety Act
                  </SelectItem>
                  <SelectItem value="sg-bca-dfma">Singapore BCA DfMA</SelectItem>
                  <SelectItem value="au-nccqld">Australia NCC / QLD</SelectItem>
                  <SelectItem value="none">Research neutral</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="rounded-lg border border-slate-200 p-4 dark:border-slate-800">
            <p className="flex items-center gap-2 text-sm font-semibold">
              <MapPinned className="h-4 w-4 text-blue-600" />
              Default facade zones
            </p>
            <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
              The prompt-defined zones are preloaded: podium 0-18m, tower-low
              18-80m, and tower-high 80-160m. Gate tuning later can test resource
              relaxations without rewriting extracted product data.
            </p>
          </div>
          <Button className="w-full rounded-lg" onClick={() => setStage(2)}>
            Continue to evidence review
            <ArrowRight className="h-4 w-4" />
          </Button>
        </CardContent>
      </Card>

      <Card className="rounded-lg dark:border-slate-800 dark:bg-slate-950">
        <CardHeader>
          <p className="section-title">Zone editor</p>
          <CardTitle>Resource envelopes by height band</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {zones.map((zone) => (
            <div
              key={zone.id}
              className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-base font-semibold">{zone.label}</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    {zone.heightRange[0]}-{zone.heightRange[1]}m, U-value {"<="}{" "}
                    {zone.performanceRequirement.uValueMax} W/m2K, Rw {">="}{" "}
                    {zone.performanceRequirement.acousticRwMin}
                  </p>
                </div>
                <span className="rounded-full border border-slate-200 px-2.5 py-1 text-xs font-semibold dark:border-slate-700">
                  {zone.performanceRequirement.weatherTightnessClass}
                </span>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <ResourceSlider
                  label="Crane allocation"
                  max={12}
                  min={2}
                  onChange={(value) =>
                    handleZoneResource(zone.id, "craneHoursPerDay", value)
                  }
                  unit="hr/day"
                  value={zone.resourceQuota.craneHoursPerDay}
                />
                <ResourceSlider
                  label="Laydown buffer"
                  max={220}
                  min={40}
                  onChange={(value) =>
                    handleZoneResource(zone.id, "laydownAreaM2", value)
                  }
                  unit="m2"
                  value={zone.resourceQuota.laydownAreaM2}
                />
                <ResourceSlider
                  label="Delivery bookings"
                  max={10}
                  min={2}
                  onChange={(value) =>
                    handleZoneResource(zone.id, "deliverySlotsPerDay", value)
                  }
                  unit="slots/day"
                  value={zone.resourceQuota.deliverySlotsPerDay}
                />
                <ResourceSlider
                  label="Install window"
                  max={150}
                  min={35}
                  onChange={(value) =>
                    handleZoneResource(zone.id, "installWindowDays", value)
                  }
                  unit="days"
                  value={zone.resourceQuota.installWindowDays}
                />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
