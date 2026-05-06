import { Moon, SunMedium } from "lucide-react";
import { useEffect } from "react";
import { FeasibilityMatrix } from "@/components/shell/FeasibilityMatrix";
import { StageStepper } from "@/components/shell/StageStepper";
import { ProjectSetupStage } from "@/components/stage1-setup/ProjectSetupStage";
import { EvidenceStage } from "@/components/stage2-evidence/EvidenceStage";
import { CandidateStage } from "@/components/stage3-candidates/CandidateStage";
import { GateStage } from "@/components/stage4-gates/GateStage";
import { DecisionStage } from "@/components/stage5-decide/DecisionStage";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useEvidenceStore } from "@/store/evidenceStore";
import { useProjectStore } from "@/store/projectStore";
import type { ParticipantRole } from "@/types/domain";

const roleLabels: Record<ParticipantRole, string> = {
  "facade-consultant": "Facade consultant",
  "main-contractor": "Main contractor",
  planner: "Planner",
  qs: "QS",
  sustainability: "Sustainability",
};

function StageBody() {
  const currentStage = useProjectStore((state) => state.currentStage);

  if (currentStage === 1) {
    return <ProjectSetupStage />;
  }

  if (currentStage === 2) {
    return <EvidenceStage />;
  }

  if (currentStage === 3) {
    return <CandidateStage />;
  }

  if (currentStage === 4) {
    return <GateStage />;
  }

  return <DecisionStage />;
}

export function WorkshopShell() {
  const actor = useProjectStore((state) => state.actor);
  const currentStage = useProjectStore((state) => state.currentStage);
  const projectContext = useProjectStore((state) => state.projectContext);
  const setActor = useProjectStore((state) => state.setActor);
  const theme = useProjectStore((state) => state.theme);
  const toggleTheme = useProjectStore((state) => state.toggleTheme);
  const auditEntries = useEvidenceStore((state) => state.auditEntries);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  return (
    <main className="min-h-screen px-4 py-5 lg:px-6">
      <div className="mx-auto max-w-[1880px] space-y-4">
        <header className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="section-title">EG-Facade decision support</p>
              <h1 className="mt-2 max-w-5xl text-2xl font-semibold tracking-tight text-slate-950 dark:text-slate-50 lg:text-3xl">
                Early-stage facade strategy selection with evidence, DQI, and
                counterfactual diagnostics.
              </h1>
              <p className="mt-2 max-w-4xl text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                {projectContext.projectName} / {projectContext.location}. The
                workflow keeps constructability and evidence quality visible before
                the team settles on cost-carbon trade-offs.
              </p>
            </div>
            <div className="flex min-w-[300px] flex-wrap items-center justify-end gap-2">
              <div className="w-[210px]">
                <Select
                  onValueChange={(value) => setActor(value as ParticipantRole)}
                  value={actor}
                >
                  <SelectTrigger className="rounded-lg dark:border-slate-800 dark:bg-slate-900">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(roleLabels).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={toggleTheme} variant="outline">
                {theme === "light" ? (
                  <Moon className="h-4 w-4" />
                ) : (
                  <SunMedium className="h-4 w-4" />
                )}
                {theme === "light" ? "Dark" : "Light"}
              </Button>
              <span className="rounded-full border border-slate-200 px-3 py-2 text-sm font-semibold dark:border-slate-800">
                {auditEntries.length} audit entries
              </span>
            </div>
          </div>
        </header>

        <StageStepper />

        <section
          className={
            currentStage === 5
              ? "grid gap-4"
              : "grid gap-4 2xl:grid-cols-[minmax(0,1fr)_390px]"
          }
        >
          <StageBody />
          {currentStage !== 5 && <FeasibilityMatrix />}
        </section>
      </div>
    </main>
  );
}
