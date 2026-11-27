import Link from "next/link";
import { LogoutButton } from "@/app/auth/logout-button";

// Logging out is a POST (form + server action), so a stray link or image can't log someone out.
export default function LogoutPage() {
  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-6 px-4 py-16">
      <h1 className="text-2xl font-semibold">Log out of JobTrail?</h1>
      <LogoutButton />
      <Link href="/dashboard" className="text-sm underline">
        Back to dashboard
      </Link>
    </main>
  );
}
