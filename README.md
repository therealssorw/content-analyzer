# ContentLens

AI-powered content analysis for personal brands. Paste your X post or Substack article, get instant feedback on hook strength, structure, engagement drivers, and actionable improvements.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FYOUR_REPO_HERE&env=ANTHROPIC_API_KEY,NEXT_PUBLIC_SUPABASE_URL,NEXT_PUBLIC_SUPABASE_ANON_KEY&envDescription=API%20keys%20for%20AI%20analysis%20and%20auth&project-name=contentlens)

## Getting Started

```bash
npm install
cp .env.example .env.local  # then add your API keys
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## AI Providers

ContentLens supports **3 AI providers** — just set one API key and it works:

| Priority | Provider | Env Var | Model |
|----------|----------|---------|-------|
| 1st | Anthropic | `ANTHROPIC_API_KEY` | Claude Sonnet 4 |
| 2nd | OpenAI | `OPENAI_API_KEY` | GPT-4o-mini |
| 3rd | Google | `GOOGLE_AI_API_KEY` | Gemini 2.0 Flash |

No key set? App runs in demo mode with smart mock analysis.

## Environment Variables

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

### Required for production:
- **AI**: One of `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, or `GOOGLE_AI_API_KEY`
- **Auth**: `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### Optional:
- **Payments**: `STRIPE_SECRET_KEY`, `STRIPE_PRO_PRICE_ID`, `STRIPE_WEBHOOK_SECRET`
- **Rate limit**: `RATE_LIMIT_PER_DAY` (default: 20)

## Database Setup

1. Create a free [Supabase](https://supabase.com) project
2. Run `supabase/migrations/001_initial_schema.sql` in the SQL Editor
3. Copy the URL + anon key to `.env.local`

## Deploy

### Vercel (recommended)
**One-click** — Click the deploy button at the top of this README, or import repo at [vercel.com](https://vercel.com).

### Railway (free tier)
[![Deploy on Railway](https://railway.com/button.svg)](https://railway.com/template)

```bash
# Or via CLI:
npm i -g @railway/cli
railway login
railway init
railway up
```

### Render (free tier)
1. Push to GitHub
2. Go to [render.com](https://render.com) → New Web Service → Connect repo
3. Render auto-detects `render.yaml` — just add env vars

### Fly.io (free tier)
```bash
fly launch    # auto-detects fly.toml
fly secrets set ANTHROPIC_API_KEY=sk-...
fly deploy
```

### Docker (any host)
```bash
docker build -t contentlens .
docker run -p 3000:3000 -e ANTHROPIC_API_KEY=sk-... contentlens
```

## CI/CD

GitHub Actions runs tests + build on every push to `main`. See `.github/workflows/ci.yml`.

## Tech Stack

- Next.js 16 + React 19
- Tailwind CSS 4
- Multi-provider AI (Anthropic / OpenAI / Google)
- Supabase (auth + database)
- Stripe (Pro tier, $9/mo)
