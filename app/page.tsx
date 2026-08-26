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
          <Link href="/login" className="rounded-lg px-4 py-2 text-sm font-semibold text-ink hover:bg-white">
            Log in
          </Link>
          <Link href="/signup" className="rounded-lg bg-adire px-4 py-2 text-sm font-semibold text-white">
            Join your estate
          </Link>
        </div>
      </nav>

      <section className="mx-auto max-w-2xl px-5 pb-20 pt-14 text-center sm:pt-20">
        <h1 className="font-heading text-4xl font-bold leading-tight tracking-tight text-ink sm:text-5xl">
          Trade with people your street already trusts.
        </h1>
        <p className="mx-auto mt-5 max-w-lg text-base leading-7 text-slate-600">
          One estate, one feed. Every neighbour carries a trust ring built by
          real vouches from people nearby — not stars from strangers.
        </p>
        <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link href="/signup" className="w-full rounded-lg bg-adire px-6 py-3.5 text-center font-semibold text-white sm:w-auto">
            Join your estate
          </Link>
          <Link href="/login" className="w-full rounded-lg border border-slate-300 px-6 py-3.5 text-center font-semibold text-ink sm:w-auto">
            I already have an account
          </Link>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-5 pb-24">
        <div className="grid gap-5 sm:grid-cols-3">
          <FeatureCard title="Hyperlocal, not global" body="Your feed is scoped to your own estate — not the whole city, not the whole internet." />
          <FeatureCard title="Trust, not stars" body="A trust ring builds from real vouches by people who've actually dealt with a seller." />
          <FeatureCard title="Share where you already talk" body="Post once, share to WhatsApp in one tap — no new app your neighbours have to learn." />
        </div>
      </section>

      <footer className="border-t border-slate-200 px-5 py-8 text-center text-xs text-slate-500">
        Kobo Circle — built for one estate at a time.
      </footer>
    </main>
  );
}

function FeatureCard({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm">
      <h3 className="font-heading text-base font-bold text-ink">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-600">{body}</p>
    </div>
  );
}
