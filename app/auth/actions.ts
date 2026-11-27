"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

export type AuthFormState = {
  error?: string;
  message?: string;
};

const credentialsSchema = z.object({
  email: z.email("Enter a valid email address.").max(254),
  // Supabase hashes with bcrypt, which only uses the first 72 bytes.
  password: z
    .string()
    .min(8, "Password must be at least 8 characters.")
    .max(72, "Password must be at most 72 characters."),
});

function parseCredentials(formData: FormData) {
  return credentialsSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
}

export async function signUp(
  _prevState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = parseCredentials(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const origin = (await headers()).get("origin");
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    ...parsed.data,
    options: origin
      ? { emailRedirectTo: `${origin}/auth/callback` }
      : undefined,
  });

  if (error) {
    return { error: error.message };
  }

  // If email confirmation is on (the Supabase default), there is no session yet.
  if (!data.session) {
    return { message: "Check your email for a link to confirm your account." };
  }

  redirect("/dashboard");
}

export async function logIn(
  _prevState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = parseCredentials(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    // Same message for wrong email or wrong password, so accounts can't be probed.
    return { error: "Incorrect email or password." };
  }

  redirect("/dashboard");
}

export async function logOut() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    await supabase.auth.signOut();
  }

  redirect("/login");
}
