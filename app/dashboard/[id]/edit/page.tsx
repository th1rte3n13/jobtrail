import { Suspense } from "react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { idSchema, toFormValues, type Application } from "@/lib/applications";
import { updateApplication } from "../../actions";
import { ApplicationForm } from "../../application-form";

export default function EditApplicationPage({
  params,
}: PageProps<"/dashboard/[id]/edit">) {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-4 py-10">
      <Link href="/dashboard" className="text-sm underline">
        ← Back to dashboard
      </Link>
      <Suspense fallback={<p className="text-zinc-500">Loading…</p>}>
        <EditApplication params={params} />
      </Suspense>
    </main>
  );
}

async function EditApplication({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const parsedId = idSchema.safeParse(id);
  if (!parsedId.success) notFound();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data } = await supabase
    .from("applications")
    .select(
      "id, company, role_title, location, salary_text, deadline, status, job_url, visa_notes, requirements, notes, created_at, updated_at",
    )
    .eq("id", parsedId.data)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!data) notFound();
  const application = data as Application;

  return (
    <>
      <h1 className="text-2xl font-semibold">
        Edit {application.company ?? "application"}
      </h1>
      <ApplicationForm
        action={updateApplication.bind(null, application.id)}
        initialValues={toFormValues(application)}
        submitLabel="Save changes"
      />
    </>
  );
}
