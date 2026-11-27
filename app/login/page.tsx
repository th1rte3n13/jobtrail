import Link from "next/link";
import { logIn } from "@/app/auth/actions";
import { AuthForm } from "@/app/auth/auth-form";

export default function LoginPage() {
  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-6 px-4 py-16">
      <h1 className="text-2xl font-semibold">Log in to JobTrail</h1>
      <AuthForm
        action={logIn}
        submitLabel="Log in"
        passwordAutoComplete="current-password"
      />
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        No account yet?{" "}
        <Link href="/signup" className="font-medium underline">
          Sign up
        </Link>
      </p>
    </main>
  );
}
