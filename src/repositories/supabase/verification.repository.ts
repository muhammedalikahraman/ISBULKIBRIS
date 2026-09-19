import type { SupabaseClient } from "@supabase/supabase-js";
import type { VerificationRepository } from "../ports";
import { throwIfError, requireRow } from "../errors";

export function createVerificationRepository(db: SupabaseClient): VerificationRepository {
  return {
    async enqueueDocument(input) {
      const { data, error } = await db
        .from("sensitive_documents")
        .insert({
          user_id: input.userId,
          organization_id: input.organizationId ?? null,
          type: input.type,
          storage_path: input.storagePath,
          status: "pending",
        })
        .select("id")
        .single();
      const row = requireRow(data, error);
      const badgeType = input.type === "tax_certificate" ? "company" : input.type === "identity" ? "identity" : null;
      if (badgeType) {
        let existing = db
          .from("verification_badges")
          .select("id")
          .eq("user_id", input.userId)
          .eq("type", badgeType);
        existing = input.organizationId
          ? existing.eq("organization_id", input.organizationId)
          : existing.is("organization_id", null);
        const { data: badge, error: fErr } = await existing.maybeSingle();
        throwIfError(fErr);
        if (!badge) {
          const { error: bErr } = await db.from("verification_badges").insert({
            user_id: input.userId,
            organization_id: input.organizationId ?? null,
            type: badgeType,
            status: "pending",
            method: "manual_review",
          });
          throwIfError(bErr);
        }
      }
      return { id: row.id as string };
    },

    async decide(input) {
      const { data: doc, error } = await db
        .from("sensitive_documents")
        .update({
          status: input.decision,
          reviewed_by: input.actorId,
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", input.documentId)
        .select("user_id, organization_id, type")
        .single();
      throwIfError(error);

      const badgeType = doc?.type === "tax_certificate" ? "company" : doc?.type === "identity" ? "identity" : null;
      if (badgeType && doc) {
        let q = db
          .from("verification_badges")
          .update({
            status: input.decision,
            verified_at: input.decision === "verified" ? new Date().toISOString() : null,
          })
          .eq("user_id", doc.user_id)
          .eq("type", badgeType);
        if (doc.organization_id) q = q.eq("organization_id", doc.organization_id);
        const { error: bErr } = await q;
        throwIfError(bErr);

        if (input.decision === "verified" && badgeType === "company" && doc.organization_id) {
          const { error: oErr } = await db
            .from("organizations")
            .update({ verified: true, verification_source: "manual_admin" })
            .eq("id", doc.organization_id);
          throwIfError(oErr);
        }
      }

      const { error: aErr } = await db.from("audit_log").insert({
        actor_id: input.actorId,
        action: "verification.decide",
        entity_type: "sensitive_document",
        entity_id: input.documentId,
        meta: { decision: input.decision, note: input.note ?? null },
      });
      throwIfError(aErr);
    },
  };
}
