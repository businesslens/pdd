---
kind: validation
routes:
  api: API
steps:
  - text: The API client sends a destination with an API key that was revoked or never issued
    kind: actor
    actor: api-client
    entities:
      - { entity: api-key, effect: reads, facts: [] }
    contexts:
      api:
        place: shortener-api
  - text: No existing API key matches what was presented
    kind: condition
    entities:
      - { entity: api-key, effect: reads, facts: [] }
    contexts:
      api:
        place: shortener-api
  - text: The Product refuses the request without creating anything
    kind: product
    actor: api-client
    entities: []
    contexts:
      api:
        place: shortener-api
---

# Refuse a request without a valid API key

## Trigger

A tool asks for a link presenting a key the Product does not recognize,
including one its Owner has revoked.

## Outcome

No link is created, the answer says the key is not accepted, and nothing
about any account is revealed.

## Edge cases

- The request carries no key at all → it is refused the same way.
