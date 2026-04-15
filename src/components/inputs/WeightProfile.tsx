import { Gauge, Sigma } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { CONSTRUCTABILITY_METRICS } from "@/models/types";
import { normaliseWeights } from "@/models/optimization";
import { useDesignStore } from "@/stores/useDesignStore";

export function WeightProfile() {
  const weights = useDesignStore((state) => state.weights);
  const setWeight = useDesignStore((state) => state.setWeight);
  const normalized = normaliseWeights(weights);

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center gap-2">
          <Gauge className="h-4 w-4 text-primary" />
          <span className="section-title">Constructability Weight Profile</span>
        </div>
        <CardTitle>Explicit buildability weighting</CardTitle>
        <CardDescription>
          Adjust relative importance of each constructability sub-indicator. Weights are normalised
          internally.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {CONSTRUCTABILITY_METRICS.map((metric) => (
          <div
            key={metric.key}
            className="space-y-3 rounded-2xl border border-border/70 bg-slate-50/70 p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-semibold text-slate-800">{metric.label}</h4>
                  <Badge variant="outline">
                    <Sigma className="mr-1 h-3 w-3" />
                    {metric.variable}
                  </Badge>
                </div>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                  {metric.description}
                </p>
              </div>
              <div className="text-right">
                <div className="text-sm font-semibold text-slate-800">{weights[metric.key]}</div>
                <div className="text-[11px] text-muted-foreground">
                  {(normalized[metric.key] * 100).toFixed(0)}%
                </div>
              </div>
            </div>
            <Slider
              min={0}
              max={10}
              step={1}
              value={[weights[metric.key]]}
              onValueChange={(value) => setWeight(metric.key, value[0] ?? weights[metric.key])}
            />
            <div className="h-2 overflow-hidden rounded-full bg-slate-200">
              <div
                className="h-full rounded-full bg-primary/80 transition-all"
                style={{ width: `${normalized[metric.key] * 100}%` }}
              />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
