import { create } from "zustand";
import { defaultProjectContext, defaultZones, stageDefinitions } from "@/mock/gates";
import type {
  ParticipantRole,
  ProjectContext,
  ResourceQuota,
  StageId,
  Zone,
} from "@/types/domain";

type ThemeMode = "light" | "dark";

interface ProjectStore {
  actor: ParticipantRole;
  currentStage: StageId;
  projectContext: ProjectContext;
  stages: typeof stageDefinitions;
  theme: ThemeMode;
  zones: Zone[];
  setActor: (actor: ParticipantRole) => void;
  setStage: (stage: StageId) => void;
  toggleTheme: () => void;
  updateProjectContext: (patch: Partial<ProjectContext>) => void;
  updateZoneHeight: (zoneId: string, heightRange: [number, number]) => void;
  updateZoneResource: <K extends keyof ResourceQuota>(
    zoneId: string,
    key: K,
    value: ResourceQuota[K],
  ) => void;
}

export const useProjectStore = create<ProjectStore>((set) => ({
  actor: "facade-consultant",
  currentStage: 1,
  projectContext: defaultProjectContext,
  stages: stageDefinitions,
  theme: "light",
  zones: defaultZones,
  setActor: (actor) => set({ actor }),
  setStage: (stage) => set({ currentStage: stage }),
  toggleTheme: () =>
    set((state) => ({ theme: state.theme === "light" ? "dark" : "light" })),
  updateProjectContext: (patch) =>
    set((state) => ({
      projectContext: {
        ...state.projectContext,
        ...patch,
      },
    })),
  updateZoneHeight: (zoneId, heightRange) =>
    set((state) => ({
      zones: state.zones.map((zone) =>
        zone.id === zoneId ? { ...zone, heightRange } : zone,
      ),
    })),
  updateZoneResource: (zoneId, key, value) =>
    set((state) => ({
      zones: state.zones.map((zone) =>
        zone.id === zoneId
          ? {
              ...zone,
              resourceQuota: {
                ...zone.resourceQuota,
                [key]: value,
              },
            }
          : zone,
      ),
    })),
}));
