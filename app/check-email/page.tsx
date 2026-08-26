import Link from 'next/link';

export default function CheckEmailPage() {
  return <main className="mx-auto flex min-h-screen max-w-md items-center px-4 py-8"><section className="w-full rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200"><p className="font-heading text-sm font-bold uppercase tracking-[0.18em] text-adire">Kobo Circle</p><h1 className="mt-3 font-heading text-3xl font-bold text-ink">Check your email</h1><p className="mt-3 leading-6 text-slate-600">We sent a confirmation link to your email address. Confirm your account before signing in and joining your estate.</p><Link href="/login" className="mt-6 inline-block rounded-lg bg-adire px-4 py-3 font-semibold text-white transition-transform duration-100 active:scale-95 motion-reduce:transition-none motion-reduce:active:scale-100">Back to sign in</Link></section></main>;
}
