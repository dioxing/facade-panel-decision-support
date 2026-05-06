import { Check, FileSearch, Pencil, ShieldCheck, X } from "lucide-react";
import { useMemo, useState } from "react";
import { DqiBadge } from "@/components/shared/DqiBadge";
import { EvidenceSourcePopover } from "@/components/shared/EvidenceSourcePopover";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useEvidenceStore } from "@/store/evidenceStore";
import { useProjectStore } from "@/store/projectStore";
import { useComputedDecision } from "@/store/useComputedDecision";
import { PARAMETER_KEYS, PARAMETER_LABELS, type ExtractedValue } from "@/types/domain";

function statusVariant(status: ExtractedValue["status"]) {
  if (status === "accepted") {
    return "success" as const;
  }

  if (status === "rejected") {
    return "danger" as const;
  }

  if (status === "edited") {
    return "warning" as const;
  }

  return "secondary" as const;
}

function formatValue(value?: ExtractedValue) {
  if (!value) {
    return "Missing";
  }

  return `${value.value}${value.unit ? ` ${value.unit}` : ""}`;
}

export function EvidenceStage() {
  const actor = useProjectStore((state) => state.actor);
  const setStage = useProjectStore((state) => state.setStage);
  const documents = useEvidenceStore((state) => state.documents);
  const values = useEvidenceStore((state) => state.extractedValues);
  const selectedSystemId = useEvidenceStore((state) => state.selectedSystemId);
  const selectSystem = useEvidenceStore((state) => state.selectSystem);
  const acceptValue = useEvidenceStore((state) => state.acceptValue);
  const editValue = useEvidenceStore((state) => state.editValue);
  const rejectValue = useEvidenceStore((state) => state.rejectValue);
  const { candidateSystems } = useComputedDecision();
  const [editingId, setEditingId] = useState<string>();
  const [draftValue, setDraftValue] = useState("");
  const [draftReason, setDraftReason] = useState("");

  const selectedSystem = candidateSystems.find((system) => system.id === selectedSystemId);
  const selectedValues = useMemo(
    () =>
      PARAMETER_KEYS.map((key) =>
        values.find(
          (value) =>
            value.candidateSystemId === selectedSystemId &&
            value.parameterKey === key &&
            value.status !== "rejected",
        ),
      ),
    [selectedSystemId, values],
  );

  const beginEdit = (value: ExtractedValue) => {
    setEditingId(value.id);
    setDraftValue(String(value.value));
    setDraftReason("");
  };

  const commitEdit = (value: ExtractedValue) => {
    if (!draftReason.trim()) {
      setDraftReason("Manual override reason required");
      return;
    }

    const nextValue = Number.isFinite(Number(draftValue)) ? Number(draftValue) : draftValue;
    editValue(value.id, nextValue, draftReason, actor);
    setEditingId(undefined);
    setDraftReason("");
  };

  return (
    <div className="grid gap-4 xl:grid-cols-[0.72fr_1.28fr]">
      <div className="space-y-4">
        <Card className="rounded-lg dark:border-slate-800 dark:bg-slate-950">
          <CardHeader>
            <p className="section-title">Document tray</p>
            <CardTitle className="flex items-center gap-2">
              <FileSearch className="h-5 w-5 text-blue-600" />
              RAG source bundle
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {documents.map((document) => (
              <div
                key={document.id}
                className="rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900/60"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate text-sm font-semibold">{document.filename}</p>
                  <Badge variant={document.credibilityTier === 1 ? "success" : "warning"}>
                    Tier {document.credibilityTier}
                  </Badge>
                </div>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  {document.sourceType} / {document.pageCount} pages / uploaded{" "}
                  {new Date(document.uploadedAt).toLocaleDateString()}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="rounded-lg dark:border-slate-800 dark:bg-slate-950">
          <CardHeader>
            <p className="section-title">System tabs</p>
            <CardTitle>Select candidate system</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2">
            {candidateSystems.map((system) => (
              <button
                className={`rounded-lg border p-3 text-left transition ${
                  system.id === selectedSystemId
                    ? "border-blue-500 bg-blue-50 dark:border-blue-400 dark:bg-blue-500/15"
                    : "border-slate-200 bg-white hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950 dark:hover:bg-slate-900"
                }`}
                key={system.id}
                onClick={() => selectSystem(system.id)}
                type="button"
              >
                <p className="text-sm font-semibold">{system.label}</p>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Evidence coverage {Math.round(system.evidenceCoverage * 100)}%
                </p>
              </button>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <Card className="rounded-lg dark:border-slate-800 dark:bg-slate-950">
          <CardHeader>
            <p className="section-title">Extraction viewer</p>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-blue-600" />
              {selectedSystem?.label ?? "Selected system"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-100">
              Manual edits are allowed only with a reason. The audit trail records
              actor, before/after values, source, and rationale.
            </div>
            {selectedValues.map((value, index) => {
              const parameterKey = PARAMETER_KEYS[index];

              return (
                <div
                  className="rounded-lg border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-950"
                  key={parameterKey}
                >
                  <div className="grid gap-3 lg:grid-cols-[1fr_0.8fr_auto] lg:items-center">
                    <div>
                      <p className="text-sm font-semibold">
                        {PARAMETER_LABELS[parameterKey]}
                      </p>
                      <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                        {formatValue(value)}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      {value ? <DqiBadge dqi={value.dqi} /> : <Badge variant="danger">No DQI</Badge>}
                      {value && (
                        <Badge variant={statusVariant(value.status)}>
                          {value.status}
                        </Badge>
                      )}
                      <EvidenceSourcePopover documents={documents} value={value} />
                    </div>
                    {value && (
                      <div className="flex flex-wrap gap-2 lg:justify-end">
                        <Button
                          onClick={() => acceptValue(value.id, actor)}
                          size="sm"
                          variant="success"
                        >
                          <Check className="h-3.5 w-3.5" />
                          Accept
                        </Button>
                        <Button
                          onClick={() => beginEdit(value)}
                          size="sm"
                          variant="outline"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                          Edit
                        </Button>
                        <Button
                          onClick={() =>
                            rejectValue(value.id, "Rejected during evidence review", actor)
                          }
                          size="sm"
                          variant="outline"
                        >
                          <X className="h-3.5 w-3.5" />
                          Reject
                        </Button>
                      </div>
                    )}
                  </div>
                  {value && editingId === value.id && (
                    <div className="mt-3 grid gap-2 rounded-lg border border-blue-200 bg-blue-50 p-3 dark:border-blue-500/30 dark:bg-blue-500/10">
                      <input
                        className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm dark:border-slate-800 dark:bg-slate-950"
                        onChange={(event) => setDraftValue(event.target.value)}
                        value={draftValue}
                      />
                      <input
                        className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm dark:border-slate-800 dark:bg-slate-950"
                        onChange={(event) => setDraftReason(event.target.value)}
                        placeholder="Reason for manual override"
                        value={draftReason}
                      />
                      <Button
                        className="w-fit rounded-lg"
                        onClick={() => commitEdit(value)}
                        size="sm"
                      >
                        Save verified override
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Card className="rounded-lg dark:border-slate-800 dark:bg-slate-950">
          <CardHeader>
            <p className="section-title">Parameter sheet</p>
            <CardTitle>Evidence completeness by system</CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="text-xs uppercase tracking-[0.16em] text-slate-500">
                <tr>
                  <th className="py-2">Parameter</th>
                  {candidateSystems.map((system) => (
                    <th className="py-2" key={system.id}>
                      {system.id}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {PARAMETER_KEYS.map((key) => (
                  <tr className="border-t border-slate-200 dark:border-slate-800" key={key}>
                    <td className="py-2 font-medium">{PARAMETER_LABELS[key]}</td>
                    {candidateSystems.map((system) => {
                      const value = values.find(
                        (item) =>
                          item.candidateSystemId === system.id &&
                          item.parameterKey === key &&
                          item.status !== "rejected",
                      );

                      return (
                        <td className="py-2" key={system.id}>
                          <div className="flex flex-col gap-1">
                            <span
                              className={
                                value
                                  ? "text-slate-700 dark:text-slate-200"
                                  : "font-semibold text-rose-600 dark:text-rose-300"
                              }
                            >
                              {formatValue(value)}
                            </span>
                            {value && <DqiBadge dqi={value.dqi} compact />}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
            <Button className="mt-4 rounded-lg" onClick={() => setStage(3)}>
              Continue to candidate screening
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
