import { useMemo } from "react";
import { computeDecisionModel } from "@/mock/computeDecision";
import { useEvidenceStore } from "@/store/evidenceStore";
import { useGateStore } from "@/store/gateStore";
import { useProjectStore } from "@/store/projectStore";

export function useComputedDecision() {
  const values = useEvidenceStore((state) => state.extractedValues);
  const zones = useProjectStore((state) => state.zones);
  const resourceGates = useGateStore((state) => state.resourceGates);

  return useMemo(
    () =>
      computeDecisionModel({
        values,
        zones,
        resourceGates,
      }),
    [resourceGates, values, zones],
  );
}
