# Delivery roadmap

1. Foundation — database, auth, roles, base layout, environment, UI system, errors, logging, CI.
2. CMS — pages, typed content blocks, media, articles, FAQ, reviews.
3. Catalog — games, nested categories, products, services.
4. Storefront — catalog, game/product/service pages, search, filters.
5. Cart — guest persistence, server validation, coupons.
6. Checkout — dynamic requirements, order snapshots, mock payment and verified webhook.
7. Delivery — provider abstraction, mock provider, retries and idempotency.
8. Account — profile, orders, order details, settings.
9. Admin — dashboards and management workflows.
10. Analytics — typed event layer, attribution and reporting.
11. Production hardening — security, rate limiting, monitoring, backups, performance and tests.

## Definition of done per phase

- TypeScript check passes.
- Production build passes.
- Migrations are reproducible and reviewed.
- Critical scenarios have tests.
- README and architecture docs are current.
- No secrets are committed.
