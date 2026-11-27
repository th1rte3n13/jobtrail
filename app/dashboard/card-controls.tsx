"use client";

import { STATUSES, STATUS_LABELS, type Status } from "@/lib/applications";
import { deleteApplication, updateApplicationStatus } from "./actions";

export function StatusSelect({ id, status }: { id: string; status: Status }) {
  return (
    <form action={updateApplicationStatus}>
      <input type="hidden" name="id" value={id} />
      <select
        name="status"
        defaultValue={status}
        aria-label="Change status"
        onChange={(event) => event.currentTarget.form?.requestSubmit()}
        className="rounded border border-zinc-300 bg-transparent px-1 py-0.5 text-xs dark:border-zinc-700"
      >
        {STATUSES.map((value) => (
          <option key={value} value={value}>
            {STATUS_LABELS[value]}
          </option>
        ))}
      </select>
    </form>
  );
}

export function DeleteButton({ id, name }: { id: string; name: string }) {
  return (
    <form
      action={deleteApplication}
      onSubmit={(event) => {
        if (!window.confirm(`Delete ${name}? This can't be undone.`)) {
          event.preventDefault();
        }
      }}
    >
      <input type="hidden" name="id" value={id} />
      <button type="submit" className="text-xs text-red-600 underline">
        Delete
      </button>
    </form>
  );
}
