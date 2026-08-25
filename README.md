# Kobo Circle

Kobo Circle is a low-bandwidth-first, hyperlocal marketplace for a residential estate. This initial scaffold intentionally contains only the secure data foundation and a Supabase connection-status homepage—no authentication, marketplace screens, or feed logic yet.

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
   UPSTASH_REDIS_REST_URL=https://your-redis-instance.upstash.io
   UPSTASH_REDIS_REST_TOKEN=your-upstash-rest-token
   ```

   `SUPABASE_SERVICE_ROLE_KEY` is used only by `lib/supabase/server.ts`, which imports `server-only`; never expose it in browser code. The Upstash REST values enforce the distributed limit of three OTP requests per number per 15 minutes and are server-only.

4. Link the repository to the correct Supabase project, then apply the migration:

   ```bash
   supabase link --project-ref your-project-ref
   supabase db push
   ```

   The migration is in `supabase/migrations/`. Run the seed script once against the linked development database:

   ```bash
   supabase db execute --linked --file supabase/seed.sql
   ```

   This creates **Golden Estate, Lekki** plus four streets. The script is idempotent. For a local Supabase database, `supabase db reset` reapplies migrations and automatically runs `supabase/seed.sql`.

5. Start the development server:

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000). Signed-out visitors are redirected to `/login`; after SMS verification, new users are routed to onboarding and returning users to `/feed`.

## Configure SMS auth

In Supabase Dashboard, enable Phone Auth and configure an SMS provider (such as Twilio). For local testing, configure a test phone number and OTP in Supabase Auth settings. Kobo Circle supports Nigerian numbers written as `08012345678` or `+2348012345678`; the server normalizes them to E.164 before requesting an OTP.

## Security and performance baseline

- Every database table has RLS enabled. The migration provides authenticated-only policies, estate-scoped listing reads and writes, self-vouch prevention, and duplicate-vouch prevention.
- Shared Zod schemas validate listing and vouch inputs on both client and server integration points. DOMPurify sanitizes all user text before it is rendered.
- The homepage caches the public seed lookup for five minutes. Future image uploads must use `next/image` with explicit dimensions; Next is configured to prefer AVIF/WebP and cache optimized images.
- `public/manifest.json` and iOS metadata make the app installable as a standalone PWA.
