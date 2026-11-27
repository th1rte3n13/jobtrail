"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { parseAdvert } from "@/lib/ai/advert-parser";
import {
  MAX_ADVERT_CHARS,
  extractedToFormValues,
  type FormValues,
} from "@/lib/applications";

export type ParseAdvertState = {
  error?: string;
  advertText?: string;
  extracted?: FormValues;
};

const advertSchema = z
  .string()
  .max(
    MAX_ADVERT_CHARS,
    `That advert is too long. Please paste at most ${MAX_ADVERT_CHARS.toLocaleString("en-GB")} characters.`,
  )
  .refine((text) => text.trim().length > 0, "Paste a job advert first.");

// Reads the advert with Claude and returns the fields for you to check. It never saves anything.
export async function extractFromAdvert(
  _prevState: ParseAdvertState,
  formData: FormData,
): Promise<ParseAdvertState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be logged in to do that." };

  const raw = formData.get("advert_text");
  const parsed = advertSchema.safeParse(typeof raw === "string" ? raw : "");
  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Invalid advert.",
      // Hand back what fits so the textarea isn't wiped; anything longer is cut by the browser anyway.
      advertText: typeof raw === "string" ? raw.slice(0, MAX_ADVERT_CHARS) : "",
    };
  }

  const result = await parseAdvert(parsed.data);
  if (!result.ok) {
    return { error: result.error, advertText: parsed.data };
  }

  return {
    advertText: parsed.data,
    extracted: extractedToFormValues(result.data, parsed.data),
  };
}
