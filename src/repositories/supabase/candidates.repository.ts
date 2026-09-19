import type { SupabaseClient } from "@supabase/supabase-js";
import type { CandidateProfile, CandidateRepository } from "../ports";
import { throwIfError } from "../errors";

export function createCandidateRepository(db: SupabaseClient): CandidateRepository {
  return {
    async getProfile(userId: string): Promise<CandidateProfile | null> {
      const { data, error } = await db
        .from("candidate_profiles")
        .select(
          "user_id, headline, summary, remote_pref, avatar_path, cities(slug), candidate_experiences(*), candidate_educations(*), candidate_skills(proficiency, skills(slug))",
        )
        .eq("user_id", userId)
        .maybeSingle();
      throwIfError(error);
      if (!data) return null;
      const city = Array.isArray(data.cities) ? data.cities[0] : data.cities;
      return {
        userId: data.user_id as string,
        headline: (data.headline as string | null) ?? null,
        summary: (data.summary as string | null) ?? null,
        citySlug: (city as { slug?: string } | null)?.slug ?? null,
        remotePref: data.remote_pref as string,
        avatarPath: (data.avatar_path as string | null) ?? null,
        experiences: ((data.candidate_experiences as Record<string, unknown>[]) ?? []).map((e) => ({
          id: e.id as string,
          title: e.title as string,
          company: e.company as string,
          startDate: (e.start_date as string | null) ?? null,
          endDate: (e.end_date as string | null) ?? null,
          isCurrent: Boolean(e.is_current),
          description: (e.description as string | null) ?? null,
          source: e.source as string,
        })),
        educations: ((data.candidate_educations as Record<string, unknown>[]) ?? []).map((e) => ({
          id: e.id as string,
          school: e.school as string,
          degree: (e.degree as string | null) ?? null,
          field: (e.field as string | null) ?? null,
          startDate: (e.start_date as string | null) ?? null,
          endDate: (e.end_date as string | null) ?? null,
          source: e.source as string,
        })),
        skills: ((data.candidate_skills as { proficiency: string | null; skills: { slug: string } | { slug: string }[] }[]) ?? []).map(
          (s) => ({
            slug: Array.isArray(s.skills) ? s.skills[0].slug : s.skills.slug,
            proficiency: s.proficiency,
          }),
        ),
      };
    },

    async replaceFromConfirmedCv(userId, payload) {
      const { error } = await db.rpc("replace_profile_from_confirmed_cv", {
        p_payload: {
          ...payload,
          candidateId: userId,
        },
      });
      throwIfError(error);
    },
  };
}
