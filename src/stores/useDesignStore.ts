import { create } from "zustand";
import {
  buildOptimisationResultFromRecords,
} from "@/models/importData";
import { generateOptimisationResult } from "@/models/mockData";
import type {
  CandidateRecord,
  CandidateSolution,
  ConnectionType,
  ConstructabilityMetricKey,
  ConstructabilityWeights,
  DataSource,
  DesignOptionsState,
  ImportedDatasetPayload,
  InsulationType,
  MaterialType,
  OptimisationResult,
  OutputTab,
  PanelSizeCategory,
  ProjectConstraints,
  SensitivityParameters,
  SensitivityResult,
  StandardisationLevel,
} from "@/models/types";
import {
  DEFAULT_CONSTRUCTABILITY_WEIGHTS,
  DEFAULT_DESIGN_OPTIONS,
  DEFAULT_PROJECT_CONSTRAINTS,
  DEFAULT_SENSITIVITY_PARAMETERS,
} from "@/models/types";

interface DesignStore {
  projectConstraints: ProjectConstraints;
  designOptions: DesignOptionsState;
  weights: ConstructabilityWeights;
  results: OptimisationResult | null;
  importedRecords: CandidateRecord[] | null;
  dataSource: DataSource;
  dataSourceLabel: string | null;
  selectedSolutionId: string | null;
  activeTab: OutputTab;
  compareMode: boolean;
  sensitivityParameters: SensitivityParameters;
  sensitivityResult: SensitivityResult | null;
  isRunning: boolean;
  setProjectConstraint: <TKey extends keyof ProjectConstraints>(
    key: TKey,
    value: ProjectConstraints[TKey],
  ) => void;
  toggleMaterial: (material: MaterialType) => void;
  toggleInsulation: (insulation: InsulationType) => void;
  togglePanelSize: (size: PanelSizeCategory) => void;
  toggleConnection: (connection: ConnectionType) => void;
  toggleStandardisation: (level: StandardisationLevel) => void;
  setPanelThicknessRange: (range: [number, number]) => void;
  setWeight: (key: ConstructabilityMetricKey, value: number) => void;
  setSelectedSolutionId: (id: string) => void;
  setActiveTab: (tab: OutputTab) => void;
  setCompareMode: (value: boolean) => void;
  setSensitivityParameter: <TKey extends keyof SensitivityParameters>(
    key: TKey,
    value: SensitivityParameters[TKey],
  ) => void;
  importDataset: (payload: ImportedDatasetPayload) => void;
  resetToMockData: () => void;
  runOptimisation: () => void;
  runSensitivityAnalysis: () => void;
}

function toggleArrayValue<TValue>(values: TValue[], nextValue: TValue) {
  if (values.includes(nextValue)) {
    return values.length > 1 ? values.filter((value) => value !== nextValue) : values;
  }

  return [...values, nextValue];
}

function findSolution(
  results: OptimisationResult | null,
  selectedSolutionId: string | null,
): CandidateSolution | undefined {
  if (!results || !selectedSolutionId) {
    return undefined;
  }

  return results.candidates.find((candidate) => candidate.id === selectedSolutionId);
}

export const useDesignStore = create<DesignStore>((set, get) => ({
  projectConstraints: DEFAULT_PROJECT_CONSTRAINTS,
  designOptions: DEFAULT_DESIGN_OPTIONS,
  weights: DEFAULT_CONSTRUCTABILITY_WEIGHTS,
  results: null,
  importedRecords: null,
  dataSource: "mock",
  dataSourceLabel: null,
  selectedSolutionId: null,
  activeTab: "pareto",
  compareMode: false,
  sensitivityParameters: DEFAULT_SENSITIVITY_PARAMETERS,
  sensitivityResult: null,
  isRunning: false,

  setProjectConstraint: (key, value) =>
    set((state) => ({
      projectConstraints: {
        ...state.projectConstraints,
        [key]: value,
      },
    })),

  toggleMaterial: (material) =>
    set((state) => ({
      designOptions: {
        ...state.designOptions,
        materialTypes: toggleArrayValue(state.designOptions.materialTypes, material),
      },
    })),

  toggleInsulation: (insulation) =>
    set((state) => ({
      designOptions: {
        ...state.designOptions,
        insulationTypes: toggleArrayValue(state.designOptions.insulationTypes, insulation),
      },
    })),

  togglePanelSize: (size) =>
    set((state) => ({
      designOptions: {
        ...state.designOptions,
        panelSizeCategories: toggleArrayValue(state.designOptions.panelSizeCategories, size),
      },
    })),

  toggleConnection: (connection) =>
    set((state) => ({
      designOptions: {
        ...state.designOptions,
        connectionTypes: toggleArrayValue(state.designOptions.connectionTypes, connection),
      },
    })),

  toggleStandardisation: (level) =>
    set((state) => ({
      designOptions: {
        ...state.designOptions,
        standardisationLevels: toggleArrayValue(
          state.designOptions.standardisationLevels,
          level,
        ) as StandardisationLevel[],
      },
    })),

  setPanelThicknessRange: (range) =>
    set((state) => ({
      designOptions: {
        ...state.designOptions,
        panelThicknessRange: range,
      },
    })),

  setWeight: (key, value) =>
    set((state) => ({
      weights: {
        ...state.weights,
        [key]: value,
      },
    })),

  setSelectedSolutionId: (id) => set({ selectedSolutionId: id }),
  setActiveTab: (tab) => set({ activeTab: tab }),
  setCompareMode: (value) => set({ compareMode: value }),

  setSensitivityParameter: (key, value) =>
    set((state) => ({
      sensitivityParameters: {
        ...state.sensitivityParameters,
        [key]: value,
      },
    })),

  importDataset: (payload) => {
    set({ isRunning: true });

    const current = get();
    const projectConstraints = {
      ...current.projectConstraints,
      ...payload.projectConstraints,
    };
    const results = buildOptimisationResultFromRecords(
      payload.candidates,
      projectConstraints,
    );
    const nextSelectedId =
      results.paretoFront.find((solution) => solution.label === "knee_point")?.id ??
      results.paretoFront[0]?.id ??
      results.feasibleSolutions[0]?.id ??
      null;

    set({
      projectConstraints,
      importedRecords: payload.candidates,
      dataSource: "imported",
      dataSourceLabel: payload.sourceLabel ?? null,
      results,
      selectedSolutionId: nextSelectedId,
      sensitivityResult: null,
      isRunning: false,
      activeTab: "pareto",
    });
  },

  resetToMockData: () => {
    set({ isRunning: true });

    const { projectConstraints, designOptions, weights } = get();
    const results = generateOptimisationResult(projectConstraints, designOptions, weights);
    const nextSelectedId =
      results.paretoFront.find((solution) => solution.label === "knee_point")?.id ??
      results.paretoFront[0]?.id ??
      results.feasibleSolutions[0]?.id ??
      null;

    set({
      importedRecords: null,
      dataSource: "mock",
      dataSourceLabel: null,
      results,
      selectedSolutionId: nextSelectedId,
      sensitivityResult: null,
      isRunning: false,
      activeTab: "pareto",
    });
  },

  runOptimisation: () => {
    set({ isRunning: true });

    const {
      projectConstraints,
      designOptions,
      weights,
      selectedSolutionId,
      importedRecords,
    } = get();
    const results = importedRecords
      ? buildOptimisationResultFromRecords(importedRecords, projectConstraints)
      : generateOptimisationResult(projectConstraints, designOptions, weights);
    const nextSelectedId =
      findSolution(results, selectedSolutionId)?.id ??
      results.paretoFront.find((solution) => solution.label === "knee_point")?.id ??
      results.paretoFront[0]?.id ??
      results.feasibleSolutions[0]?.id ??
      null;

    set({
      results,
      selectedSolutionId: nextSelectedId,
      sensitivityResult: null,
      isRunning: false,
    });
  },

  runSensitivityAnalysis: () => {
    const {
      projectConstraints,
      designOptions,
      weights,
      sensitivityParameters,
      results,
      selectedSolutionId,
      importedRecords,
    } = get();

    if (!results || !selectedSolutionId) {
      return;
    }

    const baseSelected = findSolution(results, selectedSolutionId);
    if (!baseSelected) {
      return;
    }

    const perturbedConstraints: ProjectConstraints = {
      ...projectConstraints,
      craneTimeBudget: Math.max(
        2,
        Number(
          (
            projectConstraints.craneTimeBudget *
            (1 + sensitivityParameters.craneBudgetDelta / 100)
          ).toFixed(1),
        ),
      ),
      laydownArea: Math.max(
        50,
        Math.round(
          projectConstraints.laydownArea *
            (1 + sensitivityParameters.laydownAreaDelta / 100),
        ),
      ),
      deliveryBookingCapacity: Math.max(
        1,
        Math.round(
          projectConstraints.deliveryBookingCapacity *
            (1 + sensitivityParameters.deliveryCapacityDelta / 100),
        ),
      ),
    };

    const perturbedResults = importedRecords
      ? buildOptimisationResultFromRecords(importedRecords, perturbedConstraints)
      : generateOptimisationResult(
          perturbedConstraints,
          designOptions,
          weights,
          {
            installationUnitTimeMultiplier:
              sensitivityParameters.installationUnitTimeMultiplier,
          },
        );
    const selectedSolutionAfter = perturbedResults.candidates.find(
      (candidate) => candidate.id === selectedSolutionId,
    );
    const baseKnee =
      results.paretoFront.find((solution) => solution.label === "knee_point") ??
      results.paretoFront[0];
    const perturbedKnee =
      perturbedResults.paretoFront.find((solution) => solution.label === "knee_point") ??
      perturbedResults.paretoFront[0];
    const baseMaterials = new Set(
      results.paretoFront.map((solution) => solution.decision.materialType),
    );
    const overlapFamilies = perturbedResults.paretoFront.filter((solution) =>
      baseMaterials.has(solution.decision.materialType),
    ).length;
    const structureConsistent =
      overlapFamilies >= Math.max(2, Math.floor(perturbedResults.paretoFront.length * 0.45)) &&
      Math.abs(perturbedResults.paretoFront.length - results.paretoFront.length) <=
        Math.max(3, Math.floor(results.paretoFront.length * 0.45));

    const notes = [
      selectedSolutionAfter?.feasible
        ? "Selected solution remains feasible under the perturbed project settings."
        : "Selected solution drops out of the feasible region under the perturbation.",
      baseKnee && perturbedKnee
        ? "Knee point drift is measured against the original feasibility-first knee."
        : "Knee point comparison is unavailable because one of the fronts is empty.",
      structureConsistent
        ? "Pareto front family mix remains qualitatively consistent."
        : "Pareto front family mix changes materially after perturbation.",
    ];

    set({
      sensitivityResult: {
        feasibleAfterPerturbation: Boolean(selectedSolutionAfter?.feasible),
        kneeShiftCost:
          baseKnee && perturbedKnee
            ? ((perturbedKnee.objectives.cost - baseKnee.objectives.cost) /
                baseKnee.objectives.cost) *
              100
            : 0,
        kneeShiftCarbon:
          baseKnee && perturbedKnee
            ? ((perturbedKnee.objectives.embodiedCarbon -
                baseKnee.objectives.embodiedCarbon) /
                baseKnee.objectives.embodiedCarbon) *
              100
            : 0,
        frontSizeChange:
          results.paretoFront.length === 0
            ? 0
            : ((perturbedResults.paretoFront.length - results.paretoFront.length) /
                results.paretoFront.length) *
              100,
        structureConsistent,
        selectedSolutionAfter,
        perturbedConstraints,
        notes,
      },
    });
  },
}));
