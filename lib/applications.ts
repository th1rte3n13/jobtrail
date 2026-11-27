import { z } from "zod";

// ---------- Status ----------

export const STATUSES = [
  "saved",
  "applied",
  "interview",
  "offer",
  "rejected",
] as const;

export type Status = (typeof STATUSES)[number];

export const STATUS_LABELS: Record<Status, string> = {
  saved: "Saved",
  applied: "Applied",
  interview: "Interview",
  offer: "Offer",
  rejected: "Rejected",
};

// ---------- Row type (matches supabase/migrations/001_applications.sql) ----------

export type Application = {
  id: string;
  company: string | null;
  role_title: string | null;
  location: string | null;
  salary_text: string | null;
  deadline: string | null; // YYYY-MM-DD
  status: Status;
  job_url: string | null;
  visa_notes: string | null;
  requirements: string[] | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

// ---------- Form input ----------

export const FORM_FIELDS = [
  "company",
  "role_title",
  "location",
  "salary_text",
  "deadline",
  "status",
  "job_url",
  "visa_notes",
  "requirements",
  "notes",
] as const;

export type FormField = (typeof FORM_FIELDS)[number];
export type FormValues = Record<FormField, string>;

// Pull only the fields we expect out of FormData, as plain strings.
// Anything else in the form (for example a user_id) is ignored.
export function readApplicationForm(formData: FormData): FormValues {
  const values = {} as FormValues;
  for (const field of FORM_FIELDS) {
    const value = formData.get(field);
    values[field] = typeof value === "string" ? value : "";
  }
  return values;
}

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `Must be at most ${max} characters.`)
    .transform((value) => (value === "" ? null : value));

export const applicationSchema = z.object({
  company: z
    .string()
    .trim()
    .min(1, "Company is required.")
    .max(200, "Must be at most 200 characters."),
  role_title: z
    .string()
    .trim()
    .min(1, "Role is required.")
    .max(200, "Must be at most 200 characters."),
  location: optionalText(200),
  salary_text: optionalText(200),
  deadline: z
    .union([z.literal(""), z.iso.date("Enter a valid date.")])
    .transform((value) => (value === "" ? null : value)),
  status: z.enum(STATUSES, "Choose a valid status."),
  // Only http(s) links, so a saved URL can never be a javascript: link.
  job_url: z
    .union([
      z.literal(""),
      z
        .url({ protocol: /^https?$/, error: "Enter a full http(s) link." })
        .max(2000, "Must be at most 2000 characters."),
    ])
    .transform((value) => (value === "" ? null : value)),
  visa_notes: optionalText(2000),
  // One requirement per line in the form; stored as text[].
  requirements: z
    .string()
    .max(10000, "Too long.")
    .transform((value) =>
      value
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean),
    )
    .pipe(
      z
        .array(z.string().max(500, "Each requirement must be at most 500 characters."))
        .max(50, "At most 50 requirements."),
    ),
  notes: optionalText(5000),
});

export type ApplicationInput = z.output<typeof applicationSchema>;

export const idSchema = z.uuid();

// Turn a saved row back into form values for the edit form.
export function toFormValues(application: Application): FormValues {
  return {
    company: application.company ?? "",
    role_title: application.role_title ?? "",
    location: application.location ?? "",
    salary_text: application.salary_text ?? "",
    deadline: application.deadline ?? "",
    status: application.status,
    job_url: application.job_url ?? "",
    visa_notes: application.visa_notes ?? "",
    requirements: (application.requirements ?? []).join("\n"),
    notes: application.notes ?? "",
  };
}

// ---------- Deadlines ----------

const MS_PER_DAY = 24 * 60 * 60 * 1000;

const DEADLINE_TIME_ZONE = "Europe/London";

// Today's date as YYYY-MM-DD in UK time, so badges flip at UK midnight even though the server runs in UTC.
// The en-CA locale formats dates as YYYY-MM-DD.
export function todayInLondon(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: DEADLINE_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function daysBetween(from: string, to: string): number {
  return Math.round((Date.parse(to) - Date.parse(from)) / MS_PER_DAY);
}

export type DeadlineBadge = { label: string; tone: "overdue" | "soon" };

// Badge when the deadline has passed or is within the next 3 days.
export function getDeadlineBadge(
  deadline: string | null,
  today: string,
): DeadlineBadge | null {
  if (!deadline) return null;

  const days = daysBetween(today, deadline);
  if (days < 0) return { label: "Overdue", tone: "overdue" };
  if (days === 0) return { label: "Due today", tone: "soon" };
  if (days === 1) return { label: "Due tomorrow", tone: "soon" };
  if (days <= 3) return { label: `Due in ${days} days`, tone: "soon" };
  return null;
}

export function formatDeadline(deadline: string): string {
  return new Date(`${deadline}T00:00:00Z`).toLocaleDateString("en-GB", {
    timeZone: "UTC",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
