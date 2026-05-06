import { CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useProjectStore } from "@/store/projectStore";
import type { StageId } from "@/types/domain";

export function StageStepper() {
  const currentStage = useProjectStore((state) => state.currentStage);
  const stages = useProjectStore((state) => state.stages);
  const setStage = useProjectStore((state) => state.setStage);

  return (
    <nav className="grid gap-2 lg:grid-cols-5" aria-label="Workshop stages">
      {stages.map((stage) => {
        const isActive = stage.id === currentStage;
        const isComplete = stage.id < currentStage;

        return (
          <button
            key={stage.id}
            className={cn(
              "rounded-lg border p-3 text-left transition hover:border-blue-300 hover:bg-blue-50/70 dark:hover:border-blue-500/60 dark:hover:bg-blue-500/10",
              isActive
                ? "border-blue-500 bg-blue-50 text-blue-950 shadow-sm dark:border-blue-400 dark:bg-blue-500/15 dark:text-blue-50"
                : "border-slate-200 bg-white text-slate-700 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300",
            )}
            onClick={() => setStage(stage.id as StageId)}
            type="button"
          >
            <span className="flex items-center justify-between gap-2">
              <span className="text-xs font-semibold uppercase tracking-[0.18em]">
                Stage {stage.id}
              </span>
              {isComplete && <CheckCircle2 className="h-4 w-4 text-emerald-500" />}
            </span>
            <span className="mt-2 block text-sm font-semibold">{stage.label}</span>
            <span className="mt-1 block text-xs leading-relaxed text-slate-500 dark:text-slate-400">
              {stage.description}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
