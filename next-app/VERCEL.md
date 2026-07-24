# See DEPLOYMENT.md for full Vercel setup instructions.

## Quick start

1. Set **Root Directory** to `next-app` in Vercel.
2. Add env vars from `.env.example`.
3. Run `npm run db:push` against your Supabase `DATABASE_URL`.
4. Deploy via Git push or `npx vercel --prod` from `next-app/`.

## Verified locally

- `npm run build` passes
- `GET /api/healthz` returns `{ "status": "ok" }`
