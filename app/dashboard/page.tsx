import { Suspense } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LogoutButton } from "@/app/auth/logout-button";

export default function DashboardPage() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-16">
      <h1 className="text-2xl font-semibold">Dashboard</h1>
      {/* Reading the session cookie must happen inside Suspense when Cache Components is on. */}
      <Suspense fallback={<p className="text-zinc-500">Loading…</p>}>
        <SignedInUser />
      </Suspense>
    </main>
  );
}

async function SignedInUser() {
  const supabase = await createClient();
  // getUser() asks Supabase to confirm the session, so a forged cookie can't get through.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Second line of defence; proxy.ts normally redirects before we get here.
  if (!user) {
    redirect("/login");
  }

  return (
    <div className="flex items-center justify-between gap-4">
      <p>
        Signed in as <span className="font-medium">{user.email}</span>
      </p>
      <LogoutButton />
    </div>
  );
}
