# Architecture

## Layer boundaries

- `src/pages`: HTTP routing and composition only.
- `src/components` and `src/layouts`: presentation.
- `src/lib/services`: business use cases.
- `src/lib/repositories`: persistence ports and Supabase adapters.
- `src/lib/auth`: authentication and authorization.
- `src/lib/payments`: provider ports and adapters.
- `src/lib/delivery`: provider ports and adapters.
- `src/lib/analytics`: typed events and sinks.
- `src/lib/validation`: boundary validation.

Astro pages must not contain pricing, discount, payment, delivery, or authorization decisions.

## Core decisions

- Games group products and services but are not purchasable products.
- Products and services share cart/order concepts through immutable purchasable snapshots, not table inheritance.
- Categories use an adjacency-list tree.
- CMS pages comprise ordered, visible, typed sections; JSON payloads are validated at write and render boundaries.
- Media metadata lives in PostgreSQL; binaries live in Supabase Storage.
- Payment and delivery use unique idempotency keys and append-only attempt logs.
- Financial reports query order/payment records, never analytics events.

## Security

- Browsers receive only the Supabase URL and anon key.
- Admin/account routes enforce server-side authorization.
- RLS is defense in depth, not a replacement for service checks.
- Service-role access stays in server-only modules and Cloudflare secrets.
- Webhooks verify signatures before conditional, transactional state transitions.
- Critical actions write structured audit records without secrets or raw sensitive payloads.
