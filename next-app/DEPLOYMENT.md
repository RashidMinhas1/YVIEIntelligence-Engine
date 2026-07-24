# Vercel Deployment Guide

Deploy from the **`next-app/`** directory only (not the repo root).

## 1. Supabase setup

1. Create a project at [supabase.com](https://supabase.com).
2. Copy credentials into Vercel env vars (see below).
3. Use the **Transaction pooler** connection string (port **6543**) for `DATABASE_URL`.
4. Push schema locally before first deploy:

```bash
cd next-app
cp .env.example .env.local
# Fill in DATABASE_URL and other values
npm install
npm run db:push
```

## 2. Vercel project

1. Import the GitHub repo at [vercel.com/new](https://vercel.com/new).
2. **Root Directory:** `next-app`
3. **Framework:** Next.js (auto-detected)
4. **Build Command:** `npm run build`
5. **Install Command:** `npm install`

## 3. Environment variables

Set for **Production** and **Preview**:

| Variable | Required | Notes |
|----------|----------|-------|
| `PASSWORD` | Yes | App login password (server-only) |
| `DATABASE_URL` | Yes | Supabase pooler URL with `?pgbouncer=true` |
| `AI_INTEGRATIONS_OPENAI_API_KEY` | Yes | OpenAI API key (server-only) |
| `AI_INTEGRATIONS_OPENAI_BASE_URL` | No | Default: `https://api.openai.com/v1` |
| `YOUTUBE_API_KEY` | No | Enables YouTube Data API fetch |
| `NEXT_PUBLIC_API_BASE_URL` | No | Default: `/api` |

Supabase public keys are optional when using Drizzle + `DATABASE_URL` only.

## 4. Deploy

Push to `main` — Vercel auto-deploys.

Manual deploy:

```bash
cd next-app
npx vercel --prod
```

## 5. Post-deploy checklist

- [ ] `GET /api/healthz` → `{ "status": "ok" }`
- [ ] `/password` login works
- [ ] `/wizard` full 6-step flow
- [ ] `/dashboard` shows live stats
- [ ] `/history` lists saved items
- [ ] `/library` saves title formats and video ideas

## 6. Production notes

- **Connection pooling:** Always use Supabase transaction pooler (port 6543).
- **AI timeouts:** AI routes set `maxDuration = 60` (requires Vercel Pro for >10s on some plans).
- **Custom domain:** Vercel → Project → Settings → Domains.
- **Rollback:** Vercel dashboard → Deployments → Promote previous deployment.
