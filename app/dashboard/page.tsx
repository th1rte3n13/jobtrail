import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { LogoutButton } from "@/app/auth/logout-button";
import {
  STATUSES,
  STATUS_LABELS,
  formatDeadline,
  getDeadlineBadge,
  todayInLondon,
  type Application,
} from "@/lib/applications";
import { createApplication } from "./actions";
import { ApplicationForm } from "./application-form";
import { DeleteButton, StatusSelect } from "./card-controls";

export default function DashboardPage() {
  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-8 px-4 py-10">
      {/* Anything that reads the session cookie must sit inside Suspense when Cache Components is on. */}
      <Suspense fallback={<p className="text-zinc-500">Loading your applications…</p>}>
        <Dashboard />
      </Suspense>
    </main>
  );
}

async function Dashboard() {
  // Render on every request so "today" is always the real current date, never a prerendered one.
  await connection();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Second line of defence; proxy.ts normally redirects before we get here.
  if (!user) redirect("/login");

  // RLS already limits rows to this user; the explicit filter also lets Postgres use the (user_id, deadline) index.
  const { data, error } = await supabase
    .from("applications")
    .select(
      "id, company, role_title, location, salary_text, deadline, status, job_url, visa_notes, requirements, notes, created_at, updated_at",
    )
    .eq("user_id", user.id)
    .order("deadline", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: false });

  const applications = (data ?? []) as Application[];
  const today = todayInLondon();

  return (
    <>
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Your applications</h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Signed in as {user.email}
          </p>
        </div>
        <LogoutButton />
      </header>

      <details className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
        <summary className="cursor-pointer font-medium">Add an application</summary>
        <div className="mt-4">
          <ApplicationForm action={createApplication} submitLabel="Add application" />
        </div>
      </details>

      {error ? (
        <p role="alert" className="text-red-600">
          Could not load your applications. Please refresh the page.
        </p>
      ) : (
        <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-5">
          {STATUSES.map((status) => {
            const inColumn = applications.filter((a) => a.status === status);
            return (
              <section
                key={status}
                aria-labelledby={`column-${status}`}
                className="flex flex-col gap-3 rounded-lg bg-zinc-100 p-3 dark:bg-zinc-900"
              >
                <h2 id={`column-${status}`} className="flex justify-between text-sm font-semibold">
                  {STATUS_LABELS[status]}
                  <span className="text-zinc-500">{inColumn.length}</span>
                </h2>
                {inColumn.length === 0 ? (
                  <p className="text-xs text-zinc-500">Nothing here yet.</p>
                ) : (
                  inColumn.map((application) => (
                    <ApplicationCard
                      key={application.id}
                      application={application}
                      today={today}
                    />
                  ))
                )}
              </section>
            );
          })}
        </div>
      )}
    </>
  );
}

function ApplicationCard({
  application,
  today,
}: {
  application: Application;
  today: string;
}) {
  const company = application.company ?? "Unknown company";
  const badge = getDeadlineBadge(application.deadline, today);

  return (
    <article className="flex flex-col gap-2 rounded-md border border-zinc-200 bg-white p-3 text-sm shadow-sm dark:border-zinc-800 dark:bg-black">
      <div>
        <h3 className="font-semibold">{company}</h3>
        <p className="text-zinc-600 dark:text-zinc-400">
          {application.role_title ?? "Untitled role"}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="text-zinc-600 dark:text-zinc-400">
          {application.deadline
            ? `Deadline ${formatDeadline(application.deadline)}`
            : "No deadline"}
        </span>
        {badge && (
          <span
            className={
              badge.tone === "overdue"
                ? "rounded-full bg-red-100 px-2 py-0.5 font-medium text-red-800 dark:bg-red-950 dark:text-red-200"
                : "rounded-full bg-amber-100 px-2 py-0.5 font-medium text-amber-800 dark:bg-amber-950 dark:text-amber-200"
            }
          >
            {badge.label}
          </span>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <StatusSelect id={application.id} status={application.status} />
        <Link href={`/dashboard/${application.id}/edit`} className="text-xs underline">
          Edit
        </Link>
        <DeleteButton id={application.id} name={company} />
      </div>
    </article>
  );
}
