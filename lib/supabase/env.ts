// Public Supabase settings, read from .env.local.
// These must be referenced as literal process.env.NEXT_PUBLIC_* names so Next.js can inline them in the browser bundle.

export function getSupabaseEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY. Copy .env.example to .env.local and fill them in.",
    );
  }

  return { url, anonKey };
}
