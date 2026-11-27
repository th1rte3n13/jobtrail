"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import {
  STATUSES,
  applicationSchema,
  idSchema,
  readApplicationForm,
  type FormField,
  type FormValues,
} from "@/lib/applications";

export type ApplicationFormState = {
  error?: string;
  fieldErrors?: Partial<Record<FormField, string[]>>;
  values?: FormValues;
  success?: boolean;
};

const NOT_SIGNED_IN = "You must be logged in to do that.";

// Every action starts here: the user comes from the verified session, never from the form.
async function getSignedInUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}

export async function createApplication(
  _prevState: ApplicationFormState,
  formData: FormData,
): Promise<ApplicationFormState> {
  const { supabase, user } = await getSignedInUser();
  if (!user) return { error: NOT_SIGNED_IN };

  const values = readApplicationForm(formData);
  const parsed = applicationSchema.safeParse(values);
  if (!parsed.success) {
    return {
      error: "Please fix the highlighted fields.",
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
      values,
    };
  }

  const { error } = await supabase
    .from("applications")
    .insert({ ...parsed.data, user_id: user.id });

  if (error) {
    console.error("createApplication failed", error);
    return { error: "Could not save the application. Please try again.", values };
  }

  revalidatePath("/dashboard");
  return { success: true };
}

export async function updateApplication(
  id: string,
  _prevState: ApplicationFormState,
  formData: FormData,
): Promise<ApplicationFormState> {
  const { supabase, user } = await getSignedInUser();
  if (!user) return { error: NOT_SIGNED_IN };

  // The id arrives from the browser, so it is untrusted too.
  const parsedId = idSchema.safeParse(id);
  if (!parsedId.success) return { error: "Application not found." };

  const values = readApplicationForm(formData);
  const parsed = applicationSchema.safeParse(values);
  if (!parsed.success) {
    return {
      error: "Please fix the highlighted fields.",
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
      values,
    };
  }

  // Filtering on user_id as well as RLS means another user's id simply matches nothing.
  const { data, error } = await supabase
    .from("applications")
    .update(parsed.data)
    .eq("id", parsedId.data)
    .eq("user_id", user.id)
    .select("id");

  if (error) {
    console.error("updateApplication failed", error);
    return { error: "Could not save your changes. Please try again.", values };
  }
  if (!data || data.length === 0) {
    return { error: "Application not found." };
  }

  revalidatePath("/dashboard");
  redirect("/dashboard");
}

const statusChangeSchema = z.object({
  id: idSchema,
  status: z.enum(STATUSES),
});

export async function updateApplicationStatus(formData: FormData) {
  const { supabase, user } = await getSignedInUser();
  if (!user) redirect("/login");

  const parsed = statusChangeSchema.safeParse({
    id: formData.get("id"),
    status: formData.get("status"),
  });
  if (!parsed.success) return;

  const { error } = await supabase
    .from("applications")
    .update({ status: parsed.data.status })
    .eq("id", parsed.data.id)
    .eq("user_id", user.id);

  if (error) console.error("updateApplicationStatus failed", error);
  revalidatePath("/dashboard");
}

export async function deleteApplication(formData: FormData) {
  const { supabase, user } = await getSignedInUser();
  if (!user) redirect("/login");

  const parsedId = idSchema.safeParse(formData.get("id"));
  if (!parsedId.success) return;

  const { error } = await supabase
    .from("applications")
    .delete()
    .eq("id", parsedId.data)
    .eq("user_id", user.id);

  if (error) console.error("deleteApplication failed", error);
  revalidatePath("/dashboard");
}
