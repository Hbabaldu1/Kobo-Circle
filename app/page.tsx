import Link from 'next/link';

export const revalidate = 300;

export default function HomePage() {
  return (
    <main className="min-h-screen bg-paper">
      <nav className="mx-auto flex max-w-5xl items-center justify-between px-5 py-5">
        <span className="font-heading text-sm font-bold uppercase tracking-[0.18em] text-adire">
          Kobo Circle
        </span>
        <div className="flex items-center gap-3">
          <Link href="/login" className="rounded-lg px-4 py-2 text-sm font-semibold text-ink transition-transform duration-100 hover:bg-white active:scale-95 motion-reduce:transform-none motion-reduce:transition-none motion-reduce:active:scale-100">
            Log in
          </Link>
          <Link href="/signup" className="rounded-lg bg-adire px-4 py-2 text-sm font-semibold text-white transition-transform duration-100 active:scale-95 motion-reduce:transform-none motion-reduce:transition-none motion-reduce:active:scale-100">
            Join your ward
          </Link>
        </div>
      </nav>

      <section className="animate-card-enter mx-auto max-w-2xl px-5 pb-20 pt-14 text-center sm:pt-20">
        <h1 className="font-heading text-4xl font-bold leading-tight tracking-tight text-ink sm:text-5xl">
          Trade with people your street already trusts.
        </h1>
        <p className="mx-auto mt-5 max-w-lg text-base leading-7 text-slate-600">
          One ward, one feed. Every neighbour carries a trust ring built by
          real vouches from people nearby — not stars from strangers.
        </p>
        <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link href="/signup" className="w-full rounded-lg bg-adire px-6 py-3.5 text-center font-semibold text-white transition-transform duration-100 active:scale-95 motion-reduce:transform-none motion-reduce:transition-none motion-reduce:active:scale-100 sm:w-auto">
            Join your ward
          </Link>
          <Link href="/login" className="w-full rounded-lg border border-slate-300 px-6 py-3.5 text-center font-semibold text-ink transition-transform duration-100 active:scale-95 motion-reduce:transform-none motion-reduce:transition-none motion-reduce:active:scale-100 sm:w-auto">
            I already have an account
          </Link>
        </div>
      </section>

      <section className="animate-card-enter mx-auto max-w-4xl px-5 pb-24">
        <div className="grid gap-5 sm:grid-cols-3">
          <FeatureCard title="Hyperlocal, not global" body="Your feed is scoped to your own state — not the whole city, not the whole internet." />
          <FeatureCard title="Trust, not stars" body="A trust ring builds from real vouches by people who've actually dealt with a seller." />
          <FeatureCard title="Share where you already talk" body="Post once, share to WhatsApp in one tap — no new app your neighbours have to learn." />
        </div>
      </section>

      <footer className="border-t border-slate-200 px-5 py-8 text-center text-xs text-slate-500">
        Kobo Circle — built for one ward at a time.
      </footer>
    </main>
  );
}

function FeatureCard({ title, body }: { title: string; body: string }) {
  return (
    <div className="animate-card-enter rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm">
      <h3 className="font-heading text-base font-bold text-ink">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-600">{body}</p>
    </div>
  );
}
