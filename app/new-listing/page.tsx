import { NewListingForm } from '@/components/new-listing-form';

export default function NewListingPage() {
  return <main className="mx-auto min-h-screen max-w-lg px-5 py-10"><a href="/feed" className="text-sm font-semibold text-adire">← Back to feed</a><h1 className="mt-4 font-heading text-3xl font-bold text-ink">Post to your Local Government</h1><p className="mt-2 text-sm text-slate-600">Share something useful with your neighbours.</p><NewListingForm /></main>;
}
