import { create } from "zustand";
import { buildDefaultResourceGates, hardGates } from "@/mock/gates";
import type { HardGate, ResourceGate, ResourceQuota } from "@/types/domain";

interface GateStore {
  hardGates: HardGate[];
  highlightedGateId?: string;
  resourceGates: ResourceGate[];
  applyCounterfactualScenario: (gateId: string) => void;
  clearHighlight: () => void;
  setHighlightedGate: (gateId?: string) => void;
  updateResourceGate: (gateId: string, currentValue: number) => void;
  updateZoneResourceGate: (
    zoneId: string,
    key: keyof ResourceQuota,
    currentValue: number,
  ) => void;
}

export const useGateStore = create<GateStore>((set) => ({
  hardGates,
  highlightedGateId: undefined,
  resourceGates: buildDefaultResourceGates(),
  applyCounterfactualScenario: (gateId) =>
    set((state) => ({
      highlightedGateId: gateId,
      resourceGates: state.resourceGates.map((gate) =>
        gate.id === gateId
          ? {
              ...gate,
              currentValue: Math.min(gate.range[1], Number((gate.currentValue * 1.2).toFixed(2))),
            }
          : gate,
      ),
    })),
  clearHighlight: () => set({ highlightedGateId: undefined }),
  setHighlightedGate: (gateId) => set({ highlightedGateId: gateId }),
  updateResourceGate: (gateId, currentValue) =>
    set((state) => ({
      resourceGates: state.resourceGates.map((gate) =>
        gate.id === gateId ? { ...gate, currentValue } : gate,
      ),
    })),
  updateZoneResourceGate: (zoneId, key, currentValue) =>
    set((state) => ({
      resourceGates: state.resourceGates.map((gate) =>
        gate.zoneId === zoneId && gate.parameterKey === key
          ? { ...gate, currentValue }
          : gate,
      ),
    })),
}));
