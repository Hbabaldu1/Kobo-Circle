import { logout } from '@/app/logout/actions';

export function LogoutButton() {
  return (
    <form action={logout}>
      <button
        type="submit"
        className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-ink transition-transform duration-100 hover:bg-white active:scale-95 motion-reduce:transition-none motion-reduce:active:scale-100"
      >
        Log out
      </button>
    </form>
  );
}
