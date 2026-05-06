import { dqiSummary, dqiTone } from "@/lib/dqi";
import { cn } from "@/lib/utils";
import type { DqiVector } from "@/types/domain";

const segmentLabels: Array<[keyof DqiVector, string]> = [
  ["representativeness", "Rep"],
  ["reliability", "Rel"],
  ["completeness", "Com"],
];

function toneClass(value: number) {
  const tone = dqiTone(value);

  if (tone === "high") {
    return "bg-emerald-500";
  }

  if (tone === "medium") {
    return "bg-amber-500";
  }

  return "bg-rose-500";
}

export function DqiBadge({
  dqi,
  compact = false,
}: {
  dqi: DqiVector;
  compact?: boolean;
}) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] font-semibold text-slate-700 shadow-xs dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200",
        compact && "px-1.5 py-0.5",
      )}
      title={dqiSummary(dqi)}
    >
      {!compact && <span>DQI</span>}
      <div className="flex items-center gap-0.5">
        {segmentLabels.map(([key, label]) => (
          <span
            key={key}
            className="flex items-center gap-0.5"
            aria-label={`${label} ${dqi[key].toFixed(2)}`}
          >
            <span
              className={cn(
                "h-2.5 w-4 rounded-[3px]",
                toneClass(dqi[key]),
              )}
              style={{ opacity: Math.max(0.35, dqi[key]) }}
            />
          </span>
        ))}
      </div>
    </div>
  );
}
