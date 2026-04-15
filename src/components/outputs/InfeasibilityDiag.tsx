import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { OptimisationResult } from "@/models/types";

export function InfeasibilityDiag({ results }: { results: OptimisationResult }) {
  return (
    <Card>
      <CardHeader>
        <p className="section-title">Infeasibility Diagnostics</p>
        <CardTitle>
          {results.excludedCount} of {results.totalCandidates} candidate solutions were excluded
        </CardTitle>
        <CardDescription>
          This shows which constraints most strongly restrict the feasible region and where
          relaxation decisions might create the most design freedom.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="h-[360px] rounded-[1.4rem] border border-border/70 bg-slate-50/70 p-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={results.infeasibilityStats.map((item) => ({
                ...item,
                percent: item.ratio * 100,
              }))}
              layout="vertical"
              margin={{ top: 8, right: 20, bottom: 8, left: 30 }}
            >
              <CartesianGrid strokeDasharray="4 4" stroke="#d7e0eb" horizontal={false} />
              <XAxis
                type="number"
                tickFormatter={(value) => `${value.toFixed(0)}%`}
                stroke="#64748b"
                fontSize={12}
              />
              <YAxis
                type="category"
                dataKey="name"
                width={130}
                stroke="#64748b"
                fontSize={12}
              />
              <Tooltip
                formatter={(value) => [`${Number(value ?? 0).toFixed(1)}%`, "Violation rate"]}
                cursor={{ fill: "rgba(148, 163, 184, 0.1)" }}
              />
              <Bar dataKey="percent" fill="#c2410c" radius={[0, 10, 10, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          {results.infeasibilityStats.slice(0, 3).map((item) => (
            <div
              key={item.name}
              className="rounded-2xl border border-border/70 bg-slate-50/70 p-4"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                {item.name}
              </p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">
                {(item.ratio * 100).toFixed(0)}%
              </p>
              <p className="mt-1 text-sm text-muted-foreground">{item.count} failing candidates</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
