import Link from "next/link";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 px-4">
      <h1 className="text-4xl font-semibold tracking-tight">JobTrail</h1>
      <div className="flex gap-4 text-sm font-medium">
        <Link href="/login" className="underline">
          Log in
        </Link>
        <Link href="/signup" className="underline">
          Sign up
        </Link>
      </div>
    </main>
  );
}
