import Link from "next/link";
import { signUp } from "@/app/auth/actions";
import { AuthForm } from "@/app/auth/auth-form";

export default function SignUpPage() {
  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-6 px-4 py-16">
      <h1 className="text-2xl font-semibold">Create your JobTrail account</h1>
      <AuthForm
        action={signUp}
        submitLabel="Sign up"
        passwordAutoComplete="new-password"
      />
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        Already have an account?{" "}
        <Link href="/login" className="font-medium underline">
          Log in
        </Link>
      </p>
    </main>
  );
}
