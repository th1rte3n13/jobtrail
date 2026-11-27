"use client";

import { useActionState, useState } from "react";
import { MAX_ADVERT_CHARS } from "@/lib/applications";
import { extractFromAdvert, type ParseAdvertState } from "./advert-actions";
import { createApplication } from "./actions";
import { ApplicationForm } from "./application-form";

export function AdvertImporter() {
  const [state, formAction, pending] = useActionState<ParseAdvertState, FormData>(
    extractFromAdvert,
    {},
  );
  const [length, setLength] = useState(0);
  // Which extraction you've dismissed (saved or cancelled), so the paste box shows again.
  const [dismissed, setDismissed] = useState<ParseAdvertState | null>(null);
  const [savedMessage, setSavedMessage] = useState(false);

  const showReview = state.extracted && state !== dismissed;

  if (showReview && state.extracted) {
    return (
      <div className="flex flex-col gap-4">
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Check these details against the advert and correct anything that&apos;s wrong. Nothing is
          saved until you press Save.
        </p>
        <ApplicationForm
          action={createApplication}
          initialValues={state.extracted}
          submitLabel="Save application"
          onSaved={() => {
            setDismissed(state);
            setSavedMessage(true);
            setLength(0);
          }}
        />
        <button
          type="button"
          onClick={() => {
            setDismissed(state);
            setLength(0);
          }}
          className="self-start text-sm underline"
        >
          Cancel and paste a different advert
        </button>
      </div>
    );
  }

  return (
    <form
      action={(formData) => {
        setSavedMessage(false);
        formAction(formData);
      }}
      className="flex flex-col gap-3"
    >
      <label className="flex flex-col gap-1 text-sm font-medium">
        Job advert
        <textarea
          name="advert_text"
          rows={10}
          required
          maxLength={MAX_ADVERT_CHARS}
          defaultValue={state === dismissed ? "" : (state.advertText ?? "")}
          onChange={(event) => setLength(event.currentTarget.value.length)}
          placeholder="Paste the full job advert here"
          className="rounded-md border border-zinc-300 px-3 py-2 text-base font-normal dark:border-zinc-700 dark:bg-zinc-900"
        />
      </label>
      <p className="text-xs text-zinc-500">
        {length.toLocaleString("en-GB")} / {MAX_ADVERT_CHARS.toLocaleString("en-GB")} characters
      </p>

      <div className="flex items-center gap-4">
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-zinc-900 px-4 py-2 font-medium text-white disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
        >
          {pending ? "Reading advert…" : "Extract details"}
        </button>
        {state.error && state !== dismissed && (
          <p role="alert" className="text-sm text-red-600">
            {state.error}
          </p>
        )}
        {savedMessage && (
          <p role="status" className="text-sm text-green-700">
            Saved to your board.
          </p>
        )}
      </div>
    </form>
  );
}
