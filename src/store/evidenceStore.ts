import { create } from "zustand";
import { createAuditEntry } from "@/lib/auditTrail";
import { documents } from "@/mock/documents";
import { extractedValues } from "@/mock/extractedValues";
import type {
  AuditEntry,
  DocumentSource,
  ExtractedValue,
  ParticipantRole,
} from "@/types/domain";

interface EvidenceStore {
  auditEntries: AuditEntry[];
  documents: DocumentSource[];
  extractedValues: ExtractedValue[];
  selectedSystemId: string;
  acceptValue: (id: string, actor: ParticipantRole) => void;
  addAuditEntry: (entry: AuditEntry) => void;
  editValue: (
    id: string,
    value: ExtractedValue["value"],
    reason: string,
    actor: ParticipantRole,
  ) => void;
  rejectValue: (id: string, reason: string, actor: ParticipantRole) => void;
  selectSystem: (systemId: string) => void;
}

export const useEvidenceStore = create<EvidenceStore>((set) => ({
  auditEntries: [
    createAuditEntry({
      actor: "facade-consultant",
      action: "accept",
      targetType: "evidence",
      targetId: "workshop-created",
      after: "Mock RAG evidence bundle loaded",
      reason: "Initial workshop seed data",
    }),
  ],
  documents,
  extractedValues,
  selectedSystemId: "S1",
  acceptValue: (id, actor) =>
    set((state) => {
      const before = state.extractedValues.find((value) => value.id === id);

      return {
        extractedValues: state.extractedValues.map((value) =>
          value.id === id ? { ...value, status: "accepted" } : value,
        ),
        auditEntries: [
          createAuditEntry({
            actor,
            action: "accept",
            targetType: "parameter",
            targetId: id,
            before,
            after: { ...before, status: "accepted" },
            reason: "Human verification accepted the extracted value",
          }),
          ...state.auditEntries,
        ],
      };
    }),
  addAuditEntry: (entry) =>
    set((state) => ({ auditEntries: [entry, ...state.auditEntries] })),
  editValue: (id, nextValue, reason, actor) =>
    set((state) => {
      const before = state.extractedValues.find((value) => value.id === id);

      return {
        extractedValues: state.extractedValues.map((value) =>
          value.id === id
            ? {
                ...value,
                value: nextValue,
                status: "edited",
                editReason: reason,
                editedBy: actor,
                editedAt: new Date().toISOString(),
              }
            : value,
        ),
        auditEntries: [
          createAuditEntry({
            actor,
            action: "edit",
            targetType: "parameter",
            targetId: id,
            before,
            after: nextValue,
            reason,
          }),
          ...state.auditEntries,
        ],
      };
    }),
  rejectValue: (id, reason, actor) =>
    set((state) => {
      const before = state.extractedValues.find((value) => value.id === id);

      return {
        extractedValues: state.extractedValues.map((value) =>
          value.id === id
            ? {
                ...value,
                status: "rejected",
                editReason: reason,
                editedBy: actor,
                editedAt: new Date().toISOString(),
              }
            : value,
        ),
        auditEntries: [
          createAuditEntry({
            actor,
            action: "reject",
            targetType: "parameter",
            targetId: id,
            before,
            after: "rejected",
            reason,
          }),
          ...state.auditEntries,
        ],
      };
    }),
  selectSystem: (systemId) => set({ selectedSystemId: systemId }),
}));
