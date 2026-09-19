import type { SupabaseClient } from "@supabase/supabase-js";
import type { OutboxRepository } from "../ports";
import { throwIfError } from "../errors";

export function createOutboxRepository(db: SupabaseClient): OutboxRepository {
  return {
    async enqueue(event) {
      const { error } = await db.rpc("enqueue_outbox", {
        p_event_type: event.type,
        p_aggregate_type: event.aggregateType,
        p_aggregate_id: event.aggregateId,
        p_payload: event.payload ?? {},
      });
      throwIfError(error);
    },

    async claimBatch(limit: number) {
      const { data, error } = await db.rpc("claim_outbox", { p_limit: limit });
      throwIfError(error);
      return ((data ?? []) as { id: string; event_type: string; payload: unknown }[]).map((row) => ({
        id: row.id,
        type: row.event_type,
        payload: row.payload,
      }));
    },

    async markPublished(id: string) {
      const { error } = await db
        .from("domain_outbox")
        .update({ status: "published", published_at: new Date().toISOString(), last_error: null })
        .eq("id", id);
      throwIfError(error);
    },

    async markFailed(id: string, errorMessage: string) {
      const { error } = await db
        .from("domain_outbox")
        .update({
          status: "failed",
          last_error: errorMessage,
          available_at: new Date(Date.now() + 60_000).toISOString(),
        })
        .eq("id", id);
      throwIfError(error);
    },
  };
}
