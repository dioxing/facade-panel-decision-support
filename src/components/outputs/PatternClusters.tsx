import { Boxes, Compass, Layers2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCarbon, formatCurrency } from "@/lib/format";
import { MATERIAL_OPTIONS, type ClusterSummary } from "@/models/types";

const materialLabels = Object.fromEntries(
  MATERIAL_OPTIONS.map((item) => [item.value, item.shortLabel ?? item.label]),
);

function ClusterCard({ cluster }: { cluster: ClusterSummary }) {
  return (
    <div className={`rounded-[1.45rem] border p-5 ${cluster.accent}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-slate-900">{cluster.title}</h3>
          <p className="mt-2 text-sm leading-6 text-slate-700">{cluster.description}</p>
        </div>
        <Badge variant="outline">{cluster.count} sols</Badge>
      </div>
      <div className="mt-5 grid gap-3 md:grid-cols-3">
        <div className="rounded-2xl bg-white/80 p-3">
          <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Avg cost</p>
          <p className="mt-2 text-sm font-semibold text-slate-900">
            {formatCurrency(cluster.averageCost)}
          </p>
        </div>
        <div className="rounded-2xl bg-white/80 p-3">
          <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Avg carbon</p>
          <p className="mt-2 text-sm font-semibold text-slate-900">
            {formatCarbon(cluster.averageCarbon)}
          </p>
        </div>
        <div className="rounded-2xl bg-white/80 p-3">
          <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">
            Avg constructability
          </p>
          <p className="mt-2 text-sm font-semibold text-slate-900">
            {cluster.averageConstructability.toFixed(3)}
          </p>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {cluster.materials.map((material) => (
          <Badge key={material} variant="secondary">
            {materialLabels[material]}
          </Badge>
        ))}
      </div>
    </div>
  );
}

export function PatternClusters({ clusters }: { clusters: ClusterSummary[] }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Compass className="h-4 w-4 text-primary" />
          <p className="section-title">Pattern Clusters</p>
        </div>
        <CardTitle>Scheme families across the Pareto set</CardTitle>
        <CardDescription>
          Pareto-optimal solutions are grouped into recurring family patterns to make the frontier
          easier to interpret and communicate.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 xl:grid-cols-2">
          {clusters.map((cluster) => (
            <ClusterCard key={cluster.id} cluster={cluster} />
          ))}
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <div className="rounded-2xl border border-border/70 bg-slate-50/70 p-4">
            <div className="flex items-center gap-2">
              <Layers2 className="h-4 w-4 text-primary" />
              <p className="text-sm font-semibold text-slate-900">Interpretation</p>
            </div>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Cluster cards compress large solution sets into recurring strategic patterns so the
              designer can move from individual points to family-level direction setting.
            </p>
          </div>
          <div className="rounded-2xl border border-border/70 bg-slate-50/70 p-4">
            <div className="flex items-center gap-2">
              <Boxes className="h-4 w-4 text-primary" />
              <p className="text-sm font-semibold text-slate-900">Use in practice</p>
            </div>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              These families are useful for briefing clients, testing constraint relaxations, and
              deciding whether the project is primarily budget-, carbon-, or logistics-driven.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
