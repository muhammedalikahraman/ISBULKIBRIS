import type { SupabaseClient } from "@supabase/supabase-js";
import type { AuditRepository } from "../ports";
import { throwIfError } from "../errors";

export function createAuditRepository(db: SupabaseClient): AuditRepository {
  return {
    async append(entry) {
      const { error } = await db.from("audit_log").insert({
        actor_id: entry.actorId,
        action: entry.action,
        entity_type: entry.entityType,
        entity_id: entry.entityId ?? null,
        meta: entry.meta ?? null,
      });
      throwIfError(error);
    },
  };
}
