import { cn } from "@/lib/utils";
import type { FeasibilityCell, Solution } from "@/types/domain";

type Classification =
  | FeasibilityCell["classification"]
  | Solution["feasibilityClassification"];

const labels: Record<Classification, string> = {
  feasible: "Feasible",
  conditional: "Conditional",
  infeasible: "Infeasible",
};

const classes: Record<Classification, string> = {
  feasible:
    "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300",
  conditional:
    "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300",
  infeasible:
    "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300",
};

export function ProbabilityPill({
  classification,
  probability,
  className,
}: {
  classification: Classification;
  probability?: number;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-full border px-2.5 py-1 text-[11px] font-semibold",
        classes[classification],
        className,
      )}
    >
      {labels[classification]}
      {typeof probability === "number" ? ` ${Math.round(probability * 100)}%` : ""}
    </span>
  );
}
