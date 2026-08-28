---
entities:
  - product-model
  - product
  - actor
  - interface
  - experience
  - screen
  - domain
  - entity
  - capability
  - capability-scenario
  - journey
  - journey-scenario
  - business-rule
domain: blueprint-portability
availability: [{ place: businesslens-cli }]
references:
  - kind: code
    role: implementation
    target: src/commands/pull.ts#runPull
    title: Catalog pull
  - kind: code
    role: implementation
    target: src/core/catalog-url.ts#trustedCatalogUrl
    title: Catalog origin rules
---

# Pull a Blueprint

Fetches a Blueprint from a catalog by its name and expands it into a Product
Model in the chosen directory, together with the Product's logo when the catalog
has one. Reading a catalog is anonymous: no account, sign-in, or credential is
involved. The catalog may be the public one, one named by the Developer, or one
they run themselves.

## Intent

Starting from someone else's reviewed model should be one command and should not
require trusting whatever came back. The response is checked before a single
file is written: the right Blueprint, an unredirected reply, a plausible size, a
declared digest, and a body that matches it.

## Fetching a Blueprint

The catalog is a system this Product calls out to; it is not part of the
Product. A catalog that is missing, slow, or answering about the wrong Blueprint
produces a message the Developer can act on and no Product Model at all.
