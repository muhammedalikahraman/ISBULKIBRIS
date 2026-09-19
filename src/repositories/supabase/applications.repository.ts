import type { SupabaseClient } from "@supabase/supabase-js";
import type { ApplicationRepository } from "../ports";
import { throwIfError, requireRow } from "../errors";

export function createApplicationRepository(db: SupabaseClient): ApplicationRepository {
  return {
    async submit(input) {
      const { data, error } = await db
        .from("applications")
        .insert({
          job_id: input.jobId,
          candidate_id: input.candidateId,
          cover_note: input.coverNote ?? null,
          cv_snapshot_id: input.cvUploadId ?? null,
        })
        .select("id")
        .single();
      const row = requireRow(data, error);
      return { id: row.id as string };
    },

    async updateStatus(input) {
      const { error } = await db.from("applications").update({ status: input.status }).eq("id", input.id);
      throwIfError(error);
    },
  };
}
