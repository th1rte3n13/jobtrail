"use client";

import { useActionState } from "react";
import {
  STATUSES,
  STATUS_LABELS,
  type FormField,
  type FormValues,
} from "@/lib/applications";
import type { ApplicationFormState } from "./actions";

const EMPTY_VALUES: FormValues = {
  company: "",
  role_title: "",
  location: "",
  salary_text: "",
  deadline: "",
  status: "saved",
  job_url: "",
  visa_notes: "",
  requirements: "",
  notes: "",
};

type ApplicationFormProps = {
  action: (
    state: ApplicationFormState,
    formData: FormData,
  ) => Promise<ApplicationFormState>;
  initialValues?: FormValues;
  submitLabel: string;
};

const inputClass =
  "rounded-md border border-zinc-300 px-3 py-2 text-base font-normal dark:border-zinc-700 dark:bg-zinc-900";

export function ApplicationForm({
  action,
  initialValues = EMPTY_VALUES,
  submitLabel,
}: ApplicationFormProps) {
  const [state, formAction, pending] = useActionState(action, {});

  // After a failed submit, show what the user typed rather than the original values.
  const values = state.values ?? initialValues;
  const errorFor = (field: FormField) => state.fieldErrors?.[field]?.[0];

  return (
    <form action={formAction} className="grid gap-4 sm:grid-cols-2">
      <Field label="Company" error={errorFor("company")}>
        <input name="company" required maxLength={200} defaultValue={values.company} className={inputClass} />
      </Field>

      <Field label="Role" error={errorFor("role_title")}>
        <input name="role_title" required maxLength={200} defaultValue={values.role_title} className={inputClass} />
      </Field>

      <Field label="Location" error={errorFor("location")}>
        <input name="location" maxLength={200} defaultValue={values.location} className={inputClass} />
      </Field>

      <Field label="Salary" error={errorFor("salary_text")}>
        <input name="salary_text" maxLength={200} defaultValue={values.salary_text} className={inputClass} />
      </Field>

      <Field label="Deadline" error={errorFor("deadline")}>
        <input name="deadline" type="date" defaultValue={values.deadline} className={inputClass} />
      </Field>

      <Field label="Status" error={errorFor("status")}>
        <select name="status" defaultValue={values.status} className={inputClass}>
          {STATUSES.map((status) => (
            <option key={status} value={status}>
              {STATUS_LABELS[status]}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Job advert link" error={errorFor("job_url")} wide>
        <input name="job_url" type="url" maxLength={2000} placeholder="https://" defaultValue={values.job_url} className={inputClass} />
      </Field>

      <Field label="Requirements (one per line)" error={errorFor("requirements")} wide>
        <textarea name="requirements" rows={4} maxLength={10000} defaultValue={values.requirements} className={inputClass} />
      </Field>

      <Field label="Visa notes" error={errorFor("visa_notes")} wide>
        <textarea name="visa_notes" rows={2} maxLength={2000} defaultValue={values.visa_notes} className={inputClass} />
      </Field>

      <Field label="Notes" error={errorFor("notes")} wide>
        <textarea name="notes" rows={3} maxLength={5000} defaultValue={values.notes} className={inputClass} />
      </Field>

      <div className="flex items-center gap-4 sm:col-span-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-zinc-900 px-4 py-2 font-medium text-white disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
        >
          {pending ? "Saving…" : submitLabel}
        </button>
        {state.error && (
          <p role="alert" className="text-sm text-red-600">
            {state.error}
          </p>
        )}
        {state.success && (
          <p role="status" className="text-sm text-green-700">
            Saved.
          </p>
        )}
      </div>
    </form>
  );
}

function Field({
  label,
  error,
  wide = false,
  children,
}: {
  label: string;
  error?: string;
  wide?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className={`flex flex-col gap-1 text-sm font-medium ${wide ? "sm:col-span-2" : ""}`}>
      {label}
      {children}
      {error && <span className="font-normal text-red-600">{error}</span>}
    </label>
  );
}
