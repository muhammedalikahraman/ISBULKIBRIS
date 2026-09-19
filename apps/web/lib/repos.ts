import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import { createRepositories } from "@isbulkibris/data";
import { createServiceClient, envFromProcess } from "@isbulkibris/data/server";

export async function createUserClient() {
  const env = envFromProcess();
  const store = await cookies();
  return createServerClient(env.url, env.anonKey, {
    cookies: {
      getAll() {
        return store.getAll();
      },
      setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => store.set(name, value, options));
        } catch {
          /* Server Component */
        }
      },
    },
  });
}

export async function repos(privileged = false) {
  const user = await createUserClient();
  const env = envFromProcess();
  const service = privileged ? createServiceClient(env) : undefined;
  return createRepositories(user, service);
}
