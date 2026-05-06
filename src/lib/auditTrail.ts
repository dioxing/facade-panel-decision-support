import type { AuditEntry, ParticipantRole } from "@/types/domain";

export function createAuditEntry(input: {
  actor: ParticipantRole;
  action: AuditEntry["action"];
  targetType: AuditEntry["targetType"];
  targetId: string;
  before?: unknown;
  after?: unknown;
  reason?: string;
}): AuditEntry {
  return {
    id: `audit-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    timestamp: new Date().toISOString(),
    ...input,
  };
}
