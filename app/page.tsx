// import { getSeededEstate } from '@/lib/estate';

// export const revalidate = 300;

// export default async function HomePage() {
//   const estate = await getSeededEstate();

//   return (
//     <main className="mx-auto flex min-h-screen max-w-lg items-center px-5 py-12">
//       <section className="w-full rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
//         <p className="text-sm font-semibold uppercase tracking-widest text-[#2F4B7C]">Kobo Circle</p>
//         <h1 className="mt-3 text-3xl font-bold tracking-tight">Your estate marketplace</h1>
//         <p className="mt-4 text-slate-600">Supabase connection status:</p>
//         <p className="mt-1 text-lg font-semibold text-emerald-700">
//           {estate ? `Live — ${estate.name}, ${estate.city}` : 'Awaiting Supabase configuration'}
//         </p>
//       </section>
//     </main>
//   );
// }




import { getSeededEstate } from '@/lib/estate';

export const revalidate = 300;

interface Estate {
  name: string;
  city: string;
}

export default async function HomePage() {
  // Cast the promise return value so TypeScript knows the object shape
  const estate = (await getSeededEstate()) as Estate | null;

  return (
    <main className="mx-auto flex min-h-screen max-w-lg items-center px-5 py-12">
      <section className="w-full rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <p className="text-sm font-semibold uppercase tracking-widest text-[#2F4B7C]">Kobo Circle</p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight">Your estate marketplace</h1>
        <p className="mt-4 text-slate-600">Supabase connection status:</p>
        <p className="mt-1 text-lg font-semibold text-emerald-700">
          {estate ? `Live — ${estate.name}, ${estate.city}` : 'Awaiting Supabase configuration'}
        </p>
      </section>
    </main>
  );
}
