import { logout } from '@/app/logout/actions';

export function LogoutButton() {
  return (
    <form action={logout}>
      <button
        type="submit"
        className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-ink hover:bg-white"
      >
        Log out
      </button>
    </form>
  );
}
