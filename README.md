# Digital Goods Commerce

A data-driven CMS and e-commerce platform for digital gaming goods and services.

## Stack

Astro, TypeScript, Tailwind CSS, Cloudflare Pages/Workers, Supabase PostgreSQL/Auth, Vitest, and Playwright.

## Current status

Phase 1 foundation includes strict project configuration, Cloudflare SSR, Tailwind design tokens, Supabase client boundaries, role/permission checks, protected account/admin routes, structured errors/logging, a profiles and audit-log RLS migration, and unit/E2E test scaffolding.

The current homepage is intentionally temporary. Phase 2 will replace it with content rendered exclusively from managed CMS sections.

## Local setup

1. Install Node.js 20 or newer.
2. Run `npm install`.
3. Copy `.env.example` to `.env` and set the Supabase URL and anon key.
4. Start local Supabase or link a development project and apply migrations.
5. Run `npm run dev`.

## Verification

- `npm run check` — Astro and TypeScript validation.
- `npm run test` — unit tests.
- `npm run build` — Cloudflare production build.
- `npm run test:e2e` — desktop and mobile browser smoke tests.
- `npm run verify` — check, unit tests, and build.

## Delivery strategy

Development is iterative. Every phase must leave TypeScript, build, migrations, critical scenarios, architecture documentation, and this README coherent before the next major module starts. See `docs/roadmap.md` and `docs/architecture.md`.

## Security

Never commit `.env` files, service-role keys, payment secrets, or webhook secrets. The browser is never authoritative for prices, totals, discounts, payment state, or delivery state. See `SECURITY.md`.
