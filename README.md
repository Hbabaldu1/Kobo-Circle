# Kobo Circle

Kobo Circle is a low-bandwidth-first, hyperlocal marketplace for local areas. Neighbours can sign up, complete location onboarding, post listings, vouch for sellers, and contact trusted sellers through WhatsApp.

## Prerequisites

- Node.js 20.9 or newer
- npm 10 or newer
- [Supabase CLI](https://supabase.com/docs/guides/local-development/cli/getting-started) authenticated and linked to your Supabase project

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create your local environment file. It is ignored by Git; do not commit it:

   ```bash
   cp .env.example .env.local
   ```

3. Set these values in `.env.local`:

   ```dotenv
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-public-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-server-only-service-role-key
   NEXT_PUBLIC_VAPID_PUBLIC_KEY=your-client-visible-vapid-public-key
   VAPID_PRIVATE_KEY=your-server-only-vapid-private-key
   # Optional: dormant until a purchased sending domain is verified in Resend.
   RESEND_API_KEY=re_your-resend-api-key
   ```

4. Link the repository to the correct Supabase project, then apply the migration:

   ```bash
   supabase link --project-ref your-project-ref
   supabase db push
   ```

   The migration is in `supabase/migrations/`. Run the seed script once against the linked development database:

   ```bash
   supabase db execute --linked --file supabase/seed.sql
   ```

   This creates **Jigawa, Birnin Kudu** plus sample wards. The script is idempotent. For a local Supabase database, `supabase db reset` reapplies migrations and automatically runs `supabase/seed.sql`.

5. Start the development server:

   ```bash
   npm run dev
   ```

## Push notifications

Generate VAPID keys once, then add the public key to the client environment and the private key only to the server environment:

```bash
npx web-push generate-vapid-keys
```

Apply the migrations before enabling notifications. Web Push uses the browser/OS default notification sound; browsers do not permit custom sounds in a service worker. iOS Safari support remains limited and can vary by OS version and installation state, even with a correct implementation.

## Transactional email and Resend

`lib/email/resend.ts` is a server-only Resend wrapper that is intentionally **not** connected to authentication. Until a custom domain is purchased and verified, real signup and confirmation messages continue to use Supabase's built-in email provider. Do not configure a sender such as `@kobo-circle.vercel.app`: it is a Vercel-owned subdomain and cannot be verified for this purpose.

When a domain is available:

1. Add it in the Resend dashboard.
2. Add the SPF, DKIM, and DMARC records Resend supplies at the domain registrar.
3. Wait for Resend to verify the domain (normally minutes to a few hours).
4. Only after verification, open **Supabase Dashboard → Authentication → Email Templates → SMTP Settings** and configure Resend's SMTP relay with a from-address on the verified domain.

Before then, the wrapper may only be used for a clearly labelled internal sandbox test sent to the account's own Resend-verified recipient address. It must not be used for real user signups.


## Security and performance baseline

- Every database table has RLS enabled. The migration provides authenticated-only policies, estate-scoped listing reads and writes, self-vouch prevention, and duplicate-vouch prevention.
- Shared Zod schemas validate user and listing input at the appropriate client and server boundaries. User text is rendered through React's escaped JSX text nodes.
- Profile and listing images use `next/image`; image optimization is disabled intentionally so the app can be bundled for a WebView/Capacitor target without requiring a Next.js image server.
- `public/manifest.json` and iOS metadata make the app installable as a standalone PWA.
