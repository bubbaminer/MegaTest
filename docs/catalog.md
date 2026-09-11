# Catalog architecture

## Entity boundaries

- A game groups products, services, media and editorial content. It is not a purchasable product.
- A category is a reusable nested taxonomy node and may contain products from multiple games.
- A product is an independently purchasable digital good.
- A service is an independently purchasable offering with variants and customer requirements.
- Orders will reference products/services but preserve immutable name, price, currency, requirements and fulfillment snapshots.

## Money

Prices are stored as integer minor units (`price_minor`) plus an ISO 4217 currency code. Browser-submitted prices are never accepted. Formatting happens at presentation boundaries.

## Checkout requirements

Products and services define typed JSON requirement arrays. Every payload is validated on admin writes and again when an order is created. Select fields require explicit options; keys are unique machine identifiers.

## Deletion

Catalog entities use `deleted_at` and archived states. Authenticated staff are intentionally not granted physical delete privileges. Service-role maintenance may only delete after explicit reference checks.

## Delivery

`delivery_type` chooses an adapter category. Provider-specific configuration stays in `delivery_config`; it is never interpreted directly by Astro pages.
