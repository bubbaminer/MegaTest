# Security policy

Report vulnerabilities privately to the repository owner. Never publish exploit details, credentials, customer data, or provider secrets in an issue.

- Never commit environment files, service-role keys, payment secrets, or webhook secrets.
- The server recalculates prices, totals, discounts, payment state, and delivery state.
- Admin operations require server-side authorization and RLS defense in depth.
- Webhooks require signature verification, replay protection, idempotency, and audit logging.
- Logs must not contain access tokens, secrets, full payment payloads, or unredacted customer requirements.
