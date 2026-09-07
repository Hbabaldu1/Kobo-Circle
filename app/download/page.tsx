const apkUrl = '/downloads/kobo-circle.apk';

export const metadata = {
  title: 'Download Kobo Circle for Android',
  description: 'Download and install the Kobo Circle Android app.',
};

export default function DownloadPage() {
  return (
    <main className="min-h-screen bg-paper px-5 py-10 sm:py-16">
      <section className="animate-card-enter mx-auto max-w-xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-9">
        <p className="font-heading text-sm font-bold uppercase tracking-[0.18em] text-adire">Kobo Circle</p>
        <h1 className="mt-3 font-heading text-3xl font-bold tracking-tight text-ink sm:text-4xl">Get Kobo Circle for Android</h1>
        <p className="mt-4 leading-7 text-slate-600">Download the Kobo Circle app directly to your Android phone. It is free.</p>
        <a href={apkUrl} className="mt-7 inline-flex w-full items-center justify-center rounded-lg bg-adire px-6 py-3.5 text-center font-semibold text-white transition-transform duration-100 active:scale-95 motion-reduce:transform-none motion-reduce:transition-none motion-reduce:active:scale-100 sm:w-auto">Download for Android</a>
        <div className="mt-9 border-t border-slate-200 pt-7">
          <h2 className="font-heading text-xl font-bold text-ink">How to install it</h2>
          <ol className="mt-5 space-y-5 text-slate-600">
            <li className="flex gap-3"><Step number="1" /> <span>Tap <strong className="text-ink">Download for Android</strong>. When it finishes, open the file from your browser&apos;s download notification.</span></li>
            <li className="flex gap-3"><Step number="2" /> <span>If Android asks for permission, tap <strong className="text-ink">Settings</strong>, then turn on <strong className="text-ink">Allow from this source</strong> or <strong className="text-ink">Install unknown apps</strong> for the browser you used. Go back to the installer.</span></li>
            <li className="flex gap-3"><Step number="3" /> <span>Tap <strong className="text-ink">Install</strong>. If Google Play Protect shows a warning because this app did not come from the Play Store, tap <strong className="text-ink">Install anyway</strong>.</span></li>
            <li className="flex gap-3"><Step number="4" /> <span>When installation is complete, tap <strong className="text-ink">Open</strong> and sign in to Kobo Circle.</span></li>
          </ol>
        </div>
      </section>
    </main>
  );
}

function Step({ number }: { number: string }) {
  return <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-ochre font-semibold text-ink">{number}</span>;
}
