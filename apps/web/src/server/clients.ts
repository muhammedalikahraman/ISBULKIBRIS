import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export type DataEnv = {
  url: string;
  anonKey: string;
  serviceRoleKey?: string;
};

export function envFromProcess(): DataEnv {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    throw new Error("Supabase URL / anon key missing. Copy .env.example to .env.local.");
  }
  return {
    url,
    anonKey,
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  };
}

export function createAnonClient(env: DataEnv, accessToken?: string): SupabaseClient {
  return createClient(env.url, env.anonKey, {
    global: accessToken ? { headers: { Authorization: `Bearer ${accessToken}` } } : undefined,
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export function createServiceClient(env: DataEnv): SupabaseClient {
  if (!env.serviceRoleKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY missing.");
  }
  return createClient(env.url, env.serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
