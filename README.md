# AiSEO - AI Search Visibility and GEO Analyzer

AiSEO is a Next.js 16 application that checks how a website surfaces across AI assistants and generative search experiences. It scrapes pages, measures performance, runs GEO (Generative Engine Optimization) scoring with LLMs, saves reports in MongoDB, and renders progress and final reports in a localized UI (EN/TR). The app also ships with authentication, pricing, and PayTR-based checkout.

## Features
- AI visibility and GEO pipeline: Playwright scraping feeds Arkhe (business model and market read), Prometheus (pillar-based GEO scoring), Generative Performance, and LIR (roadmap) steps with status polling and resilience.
- Performance insights: integrates Google PageSpeed Insights (PSI) and falls back to stub data when no API key is provided.
- Saved reports: `/results` shows live progress; completed jobs redirect to `/report/[domain]` and reuse results from the last 24h. A download button expects an `/api/export-report` endpoint.
- Auth flows: sign up/in/out, password reset, and email verification backed by the `${NEXT_PUBLIC_API_URL}/auth/*` endpoints with cookie-based sessions.
- Payments: pricing page creates PayTR iframe tokens via `/api/paytr/get-token` with success and failed callbacks.
- Localization: `next-intl` with `src/messages/en.json` and `src/messages/tr.json`.

## Tech Stack
- Frontend: Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4, Framer Motion, react-hook-form, next-intl.
- Backend/API: Next.js route handlers, MongoDB with Mongoose, Playwright/@sparticuz-chromium for scraping, Google PSI, OpenAI/Gemini/Perplexity for LLM work.
- Tooling: ESLint 9, Node 20-22, axios, uuid, lucide-react.

## Project Structure
- `src/app` - App Router pages (`/`, `/results`, `/report`, auth, pricing, payment) and API routes (`/api/analyze-domain`, `/api/internal/start-analysis`, `/api/internal/job-status/[jobId]`, `/api/reports/[domain]`, `/api/paytr/*`).
- `src/components` - UI building blocks and page composites (Hero, Layout, Reports, Pricing, Auth forms, PayTR iframe).
- `src/services` - Analysis pipeline (scrapers, performance analyzer, Arkhe/Prometheus/LIR orchestrator).
- `src/lib` - DB helpers, PayTR helpers, static data (pricing tiers), auth service wrapper.
- `src/models` - Mongoose models for analysis jobs, events, reports, orders.
- `src/messages` - Localization bundles.
- `src/utils` - AI search helpers, logging, validation utilities.

## Getting Started
1. Install Node.js 20-22 and npm.
2. Create `.env.local` at the project root and fill the required variables (see below).
3. Install dependencies: `npm install`
4. Run the app in dev mode: `npm run dev` (defaults to http://localhost:3000)
5. Build for production: `npm run build`
6. Start the production server: `npm run start` (binds `0.0.0.0:${PORT:-8080}`)

## Environment Variables
Set these in `.env.local` (use placeholder values, do not commit secrets):

| Name | Required | Purpose / Notes | Example |
| --- | --- | --- | --- |
| `NEXT_PUBLIC_URL` | Yes | Public site URL used in metadata and payment callbacks | `http://localhost:3000` |
| `NEXT_PUBLIC_API_URL` | Yes | Public API base used by the frontend (point to this app if co-hosted) | `http://localhost:3000/api` |
| `MONGODB_URI` | Yes | MongoDB connection string for jobs/reports/orders | `mongodb+srv://...` |
| `INTERNAL_API_URL` | Yes | Base used by `/api/analyze-domain` to call `/api/internal/start-analysis` | `http://localhost:3000` |
| `INTERNAL_API_TOKEN` | Yes | Shared secret for signing internal analysis requests | `super-secret-token` |
| `OPENAI_API_KEY` | Optional | Enables OpenAI-based GEO/visibility checks | `sk-...` |
| `GOOGLE_GEMINI_API_KEY` / `GOOGLE_API_KEY` / `GEMINI_API_KEY` | Optional | Gemini access for GEO and AI search helpers | `AIza...` |
| `PERPLEXITY_API_KEY` | Optional | Enables Perplexity-based AI search visibility checks | `pplx-...` |
| `GOOGLE_PAGESPEED_API_KEY` or `PSI_API_KEY` | Optional | PageSpeed Insights; if missing, a stub report is returned | `AIza...` |
| `PAYTR_MERCHANT_ID` / `PAYTR_MERCHANT_KEY` / `PAYTR_MERCHANT_SALT` | Optional | Required for PayTR checkout | `xxxxx` |
| `NEXT_PUBLIC_PAYMENT_TEST_MODE` | Optional | `1` for PayTR sandbox, `0` for live | `1` |

## NPM Scripts
- `npm run dev` - start Next.js in development mode.
- `npm run build` - create a production build.
- `npm run start` - run the production server (uses `PORT` or 8080).
- `npm run lint` - run ESLint.

## Key Workflows
- **Kick off an analysis:** Submit a domain on `/` or call `POST /api/analyze-domain` with `{ url, locale }`. It enqueues a job, signs an internal request, and triggers `/api/internal/start-analysis`.
- **Track status:** Poll `GET /api/internal/job-status/:jobId` for `status` updates until `COMPLETED`; the results page handles this automatically.
- **Reuse or fetch a report:** `GET /api/reports/:domain` returns a recent job (24h window) or 404 to allow a fresh run. Completed jobs are shown at `/report/[domain]`.
- **Auth:** UI pages under `/auth/*` post to `${NEXT_PUBLIC_API_URL}/auth/*` (sign up/in/out, reset, verify). `AuthProvider` caches user and session data in cookies.
- **Payments:** `/pricing` posts to `/api/paytr/get-token`, then redirects to `/payment?token=...&merchantOid=...`; callbacks land on `/payment/success` and `/payment/failed`.

## Localization
Messages live in `src/messages/en.json` and `src/messages/tr.json`. `next-intl` selects the locale via `getLocale()` in `src/app/layout.tsx`; add new locales by extending that folder and wiring message files.

## Notes and Troubleshooting
- Playwright/@sparticuz-chromium is used for scraping; make sure the target environment has the necessary Chromium dependencies (run `npx playwright install chromium` locally if needed).
- The download button expects an `/api/export-report` route; add it if you need PDF/CSV exports.
- Jobs older than 24h are re-run; recent completed jobs are reused to avoid duplicate work.
