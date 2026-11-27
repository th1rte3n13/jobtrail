import { logOut } from "./actions";

export function LogoutButton() {
  return (
    <form action={logOut}>
      <button
        type="submit"
        className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium dark:border-zinc-700"
      >
        Log out
      </button>
    </form>
  );
}
