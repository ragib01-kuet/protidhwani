# Protidhwani (প্রতিধ্বনি)

> A citizen-powered civic safety network for Bangladesh — report incidents, verify information, call for help, and organise your community, in Bangla first.

Submitted to **July Hackathon 2026**.

---

## Problem

Civic information in Bangladesh is fragmented and unverifiable. Incidents are reported on Facebook groups where rumours outrun facts, emergency help depends on knowing the right phone number, and there is no shared map of where an area is actually unsafe. Most tooling is English-first, which excludes the majority of users.

## Solution

Protidhwani is one Bangla-first civic operating system:

- Citizens **report incidents** with photo, category, and location.
- Reports feed a **community safety intelligence map** with micro-area (union / upazila / street) heat.
- Claims go through a **verification workflow** with sources and a public status timeline.
- **SOS + blood alerts** broadcast to the user's own area with live location tracking.
- A **community feed** scoped to your area, plus a nationwide **explore** feed.

Every string is bilingual: Bangla dominant, English beneath.

## Key features

| Area | What it does |
| --- | --- |
| Safety map | MapLibre heatmap, micro-area precision, district selector, layer toggles, route comparison |
| Emergency | 5-second countdown SOS, live pings, area-wide broadcast, blood alerts, hotline dialling |
| Incident reporting | Multi-step composer with media upload, category, geolocation, confirmation |
| Verify information | Claim submission, source attachments, status timeline |
| Community | Area-scoped feed, composer, comments, supports, realtime updates |
| Explore | Nationwide feed, filters, post detail pages, infinite scroll |
| Social | Friend requests, direct messages, public profiles |
| Vehicle verification | Registration lookup with public safety reports |
| Protest mode | Verified updates, safe routes, offline message queue |
| Rights & legal | Community legal help, timeline-based case tracking |
| Agent access | MCP server with OAuth consent for AI agents |

## Architecture

```
Browser (React 19 + TanStack Router, Bangla-first UI)
        │  supabase-js (RLS enforced as the signed-in user)
        ▼
Supabase — Postgres + Auth + Realtime + Storage
        ▲
        │  server functions / server routes (TanStack Start, edge runtime)
Netlify (SSR + static assets)
```

- File-based routing in `src/routes`, shared shell in `src/routes/__root.tsx` and `src/components/AppShell.tsx`.
- Data access is isolated in `src/services/*`; every table is protected by row-level security.
- Demo fallbacks in `src/data/*` keep every screen presentable without a database.
- MCP tools live in `src/lib/mcp/tools`.

## Tech stack

React 19 · TypeScript · TanStack Start / Router v1 · Vite 7 · Tailwind CSS v4 · shadcn/ui · MapLibre GL · Supabase (Postgres, Auth, Realtime, Storage) · Netlify

## Getting started

```sh
git clone <this-repository-url>
cd protidhwani
npm install
cp .env.example .env    # fill in your Supabase values
npm run dev             # http://localhost:8080
```

### Environment variables

| Variable | Description |
| --- | --- |
| `VITE_SUPABASE_URL` | Supabase project URL (Project Settings → API) |
| `VITE_SUPABASE_ANON_KEY` | Publishable / anon key — safe for the browser |

No service-role key is used anywhere in this project.

### Database setup

Run the SQL files in the Supabase SQL editor, in this order:

1. `supabase/schema.sql` — profiles, categories, complaints, votes, comments, notifications
2. `supabase/community.sql` — posts, supports, comments, flags
3. `supabase/social.sql` — friend requests, messages
4. `supabase/emergency.sql` — SOS alerts, pings, responses
5. `supabase/verify.sql` — verification claims, sources, status events
6. `supabase/protest.sql` — protest updates, confirmations
7. `supabase/vehicles.sql` — vehicles, vehicle reports

Each file creates tables, grants, RLS policies, and triggers.

### Storage buckets

Created by the SQL above; verify they exist and are public:

- `avatars`
- `complaint-images`
- `community-images`

### Deploying to Netlify

1. Connect the repository to Netlify (build config lives in `netlify.toml`).
2. Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in Site settings → Environment variables.
3. Deploy — the build uses the Netlify Nitro preset and ships SSR plus static assets.

## Screenshots

| Home | Safety map | Emergency |
| --- | --- | --- |
| _add `docs/screenshots/home.png`_ | _add `docs/screenshots/map.png`_ | _add `docs/screenshots/emergency.png`_ |

| Community | Verify | Founder |
| --- | --- | --- |
| _add `docs/screenshots/community.png`_ | _add `docs/screenshots/verify.png`_ | _add `docs/screenshots/founder.png`_ |

## Demo video

_Add the demo video link here before submission._

Live demo: https://protidhwani.lovable.app

## Team

| Name | Role | Contact |
| --- | --- | --- |
| Ragib Abid | Founder, product & engineering | ragibkuet@gmail.com |

## AI tools used

- **Lovable** — primary AI pair-programming environment used to design and build the app
- **Claude (Anthropic)** — architecture reasoning, code review, and content drafting

All generated code was reviewed, adapted, and tested by the team.

## License

MIT — see [LICENSE](./LICENSE).
