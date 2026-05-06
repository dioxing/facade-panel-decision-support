import { create } from "zustand";
import { candidateSystems } from "@/mock/candidateSystems";
import type { CandidateSystem } from "@/types/domain";

interface CandidateStore {
  candidateSystems: CandidateSystem[];
  shortlistedIds: string[];
  toggleShortlist: (systemId: string) => void;
}

export const useCandidateStore = create<CandidateStore>((set) => ({
  candidateSystems,
  shortlistedIds: ["S1", "S3", "S4"],
  toggleShortlist: (systemId) =>
    set((state) => ({
      shortlistedIds: state.shortlistedIds.includes(systemId)
        ? state.shortlistedIds.filter((id) => id !== systemId)
        : [...state.shortlistedIds, systemId],
    })),
}));
