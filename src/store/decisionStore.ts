import { create } from "zustand";

export type DecisionTab = "counterfactuals" | "pareto" | "solutions" | "audit";

interface DecisionStore {
  activeTab: DecisionTab;
  exportNotice?: string;
  selectedSolutionId?: string;
  setActiveTab: (tab: DecisionTab) => void;
  setExportNotice: (notice?: string) => void;
  setSelectedSolution: (solutionId?: string) => void;
}

export const useDecisionStore = create<DecisionStore>((set) => ({
  activeTab: "counterfactuals",
  exportNotice: undefined,
  selectedSolutionId: undefined,
  setActiveTab: (tab) => set({ activeTab: tab }),
  setExportNotice: (notice) => set({ exportNotice: notice }),
  setSelectedSolution: (solutionId) => set({ selectedSolutionId: solutionId }),
}));
