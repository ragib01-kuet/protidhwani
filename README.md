# Protidhwani (প্রতিধ্বনি)

>Protidhwani — প্রতিধ্বনি is a citizen-powered civic network built for Bangladesh, designed to turn everyday people into active guardians of their own communities. Unlike conventional social media, which is built for entertainment and algorithmic engagement, Protidhwani is a purpose-driven civic operating system where citizens can report incidents, verify information, request emergency help, organize communities, and protect their rights — all in a Bangla-first, bilingual interface. At its core lies a community safety intelligence map that visualizes risk at division, district, area, and even street level, helping people make informed decisions about the routes they take and the places they visit. When danger strikes, a one-tap SOS broadcasts the caller’s live location to nearby community members and emergency responders, while blood alerts connect those in urgent need with nearby donors. The platform also includes a structured verification pipeline where claims are submitted with sources and reviewed through a transparent status timeline, so information is judged by evidence rather than virality. Community feeds are scoped by real geography — district, upazila, and union — ensuring that what people see reflects what is actually happening around them, not what an opaque algorithm wants them to see. With built-in friend connections, direct messaging, public profiles, legal rights resources, protest coordination with offline resilience, and even agent integrations through secure MCP access, Protidhwani offers a fair, transparent, and functional alternative to traditional social networks: one built not for scrolling, but for safety, accountability, and collective civic action.

Submitted to **July Hackathon 2026**.

---
## Overview

Bangladesh faces a major challenge during emergencies, civic unrest, disasters, and local safety incidents: information is scattered across social media, messaging platforms, and informal networks. Rumors often spread faster than verified facts, emergency assistance is difficult to coordinate, and citizens lack a trusted source to understand what is happening around them.

**Protidhwani (প্রতিধ্বনি)** aims to transform scattered citizen reports into reliable, actionable community intelligence.

Inspired by the spirit of citizen participation and collective responsibility, Protidhwani provides a unified civic safety network where people can report incidents, verify information, request help, and collaborate with their communities.

The platform is designed **Bangla-first**, making civic technology more accessible for everyday citizens across Bangladesh.

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

## Screenshots

| Home | Safety map | Emergency |
| --- | --- | --- |
| _add `docs/screenshots/home.png`_ | _add `docs/screenshots/map.png`_ | _add `docs/screenshots/emergency.png`_ |

| Community | Verify | Founder |
| --- | --- | --- |
| _add `docs/screenshots/community.png`_ | _add `docs/screenshots/verify.png`_ | _add `docs/screenshots/founder.png`_ |

## Live Website
Live: [[https://protidhwani.ragibabid.me](https://protidhwani.ragibabid.me/)]

## Team

| Name | Role | Contact |
| --- | --- | --- |
| Ragib Abid | Founder, product & engineering | ragibkuet@gmail.com |

## AI tools used

- **Lovable & Google AI Studio** — primary AI pair-programming environment used to design the UI of the app


All generated code was reviewed, adapted, and tested by the team.

## License

MIT — see [LICENSE](./LICENSE).
