import { AlertCircle, ArrowRight, Layers3 } from "lucide-react";
import { createAuditEntry } from "@/lib/auditTrail";
import { averageDqi } from "@/lib/dqi";
import { DqiBadge } from "@/components/shared/DqiBadge";
import { EvidenceSourcePopover } from "@/components/shared/EvidenceSourcePopover";
import { ProbabilityPill } from "@/components/shared/ProbabilityPill";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCandidateStore } from "@/store/candidateStore";
import { useEvidenceStore } from "@/store/evidenceStore";
import { useProjectStore } from "@/store/projectStore";
import { useComputedDecision } from "@/store/useComputedDecision";
import { PARAMETER_LABELS, type ParameterKey } from "@/types/domain";

const visibleParameters: ParameterKey[] = [
  "costPerM2",
  "embodiedCarbonPerM2",
  "leadTimeWeeks",
  "uValue",
  "fireRating",
  "acousticRw",
  "maxPanelWeight",
  "craneLiftCount",
];

export function CandidateStage() {
  const actor = useProjectStore((state) => state.actor);
  const setStage = useProjectStore((state) => state.setStage);
  const documents = useEvidenceStore((state) => state.documents);
  const values = useEvidenceStore((state) => state.extractedValues);
  const addAuditEntry = useEvidenceStore((state) => state.addAuditEntry);
  const shortlistedIds = useCandidateStore((state) => state.shortlistedIds);
  const toggleShortlist = useCandidateStore((state) => state.toggleShortlist);
  const { candidateSystems, feasibilityCells } = useComputedDecision();

  const handleShortlist = (systemId: string) => {
    toggleShortlist(systemId);
    addAuditEntry(
      createAuditEntry({
        actor,
        action: "shortlist",
        targetType: "system",
        targetId: systemId,
        reason: "Workshop participant toggled candidate shortlist",
      }),
    );
  };

  return (
    <div className="space-y-4">
      <Card className="rounded-lg dark:border-slate-800 dark:bg-slate-950">
        <CardHeader>
          <p className="section-title">Candidate systems</p>
          <CardTitle className="flex items-center gap-2">
            <Layers3 className="h-5 w-5 text-blue-600" />
            Five facade typologies from evidence, not preference sliders
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="max-w-4xl text-sm leading-relaxed text-slate-600 dark:text-slate-300">
            Each candidate card exposes evidence coverage, parameter DQI, and
            first-pass zone feasibility. Missing values are treated as uncertainty
            and become visible decision risk rather than silent defaults.
          </p>
        </CardContent>
      </Card>

      <div className="grid gap-4 xl:grid-cols-2">
        {candidateSystems.map((system) => {
          const systemValues = values.filter(
            (value) =>
              value.candidateSystemId === system.id && value.status !== "rejected",
          );
          const dqi = averageDqi(systemValues.map((value) => value.dqi));
          const cells = feasibilityCells.filter((cell) => cell.systemId === system.id);
          const worstCell = [...cells].sort((a, b) => a.pFeasible - b.pFeasible)[0];
          const lowDqiCount = systemValues.filter(
            (value) =>
              value.dqi.representativeness < 0.45 ||
              value.dqi.reliability < 0.45 ||
              value.dqi.completeness < 0.45,
          ).length;

          return (
            <Card
              className="rounded-lg dark:border-slate-800 dark:bg-slate-950"
              key={system.id}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="section-title">{system.typology}</p>
                    <CardTitle className="mt-2">{system.label}</CardTitle>
                  </div>
                  <Button
                    onClick={() => handleShortlist(system.id)}
                    size="sm"
                    variant={shortlistedIds.includes(system.id) ? "success" : "outline"}
                  >
                    {shortlistedIds.includes(system.id) ? "Shortlisted" : "Shortlist"}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                  {system.positioning}
                </p>
                <div className="grid gap-2 sm:grid-cols-3">
                  <div className="rounded-lg border border-slate-200 p-3 dark:border-slate-800">
                    <p className="text-xs uppercase tracking-[0.16em] text-slate-500">
                      Coverage
                    </p>
                    <p className="mt-1 text-xl font-semibold">
                      {Math.round(system.evidenceCoverage * 100)}%
                    </p>
                  </div>
                  <div className="rounded-lg border border-slate-200 p-3 dark:border-slate-800">
                    <p className="text-xs uppercase tracking-[0.16em] text-slate-500">
                      DQI
                    </p>
                    <div className="mt-2">
                      <DqiBadge dqi={dqi} />
                    </div>
                  </div>
                  <div className="rounded-lg border border-slate-200 p-3 dark:border-slate-800">
                    <p className="text-xs uppercase tracking-[0.16em] text-slate-500">
                      Worst zone
                    </p>
                    {worstCell && (
                      <div className="mt-2">
                        <ProbabilityPill
                          classification={worstCell.classification}
                          probability={worstCell.pFeasible}
                        />
                      </div>
                    )}
                  </div>
                </div>
                {(system.evidenceCoverage < 0.6 || lowDqiCount > 0) && (
                  <div className="flex gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-100">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>
                      {system.evidenceCoverage < 0.6
                        ? "Evidence coverage is below 60%; keep this system conditional until verified."
                        : `${lowDqiCount} low-DQI value(s) should be verified before a preferred strategy is locked.`}
                    </span>
                  </div>
                )}
                <div className="grid gap-2">
                  {visibleParameters.map((key) => {
                    const value = systemValues.find((item) => item.parameterKey === key);

                    return (
                      <div
                        className="grid grid-cols-[1fr_auto_auto] items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 dark:bg-slate-900/60"
                        key={key}
                      >
                        <span className="text-sm font-medium">{PARAMETER_LABELS[key]}</span>
                        <span className="text-sm text-slate-600 dark:text-slate-300">
                          {value
                            ? `${value.value}${value.unit ? ` ${value.unit}` : ""}`
                            : "Missing"}
                        </span>
                        {value ? (
                          <EvidenceSourcePopover documents={documents} value={value} />
                        ) : (
                          <Badge variant="danger">Missing</Badge>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Button className="rounded-lg" onClick={() => setStage(4)}>
        Continue to gate calibration
        <ArrowRight className="h-4 w-4" />
      </Button>
    </div>
  );
}
