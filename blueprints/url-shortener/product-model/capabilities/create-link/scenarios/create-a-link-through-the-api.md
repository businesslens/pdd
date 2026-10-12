---
kind: primary
routes:
  api: API
steps:
  - text: The API client sends a destination, optionally a slug and an expiry, with an API key
    kind: actor
    actor: api-client
    entities:
      - { entity: api-key, effect: reads, facts: [] }
    contexts:
      api:
        place: shortener-api
  - text: The Product recognizes the API key and records that it was just used
    kind: product
    actor: api-client
    entities:
      - { entity: api-key, effect: changes, facts: [Last used at] }
    contexts:
      api:
        place: shortener-api
  - text: The Product checks the destination and, when a slug was sent, that no link has it
    kind: product
    actor: api-client
    entities:
      - { entity: link, effect: reads, facts: [Slug] }
    contexts:
      api:
        place: shortener-api
  - text: The Product creates an active link in the account the API key belongs to
    kind: product
    actor: api-client
    entities:
      - { entity: link, effect: creates, to: Active, facts: [Slug, Destination, Expires at, Created at] }
      - { entity: api-key, effect: reads, facts: [] }
    contexts:
      api:
        place: shortener-api
  - text: The Product answers with the new link's short address
    kind: product
    actor: api-client
    entities:
      - { entity: link, effect: reads, facts: [Slug] }
    contexts:
      api:
        place: shortener-api
---

# Create a link through the API

## Trigger

A tool the Owner runs needs a short address for a destination.

## Decision points

### Slug

Did the request carry a slug?

- A slug was sent and no link has it → the link uses that slug.
- No slug was sent → the Product generates one no other link has ever had.

## Outcome

The tool has the short address of an active link that belongs to the Owner of
the API key, listed among the Owner's links like any link created on the web.

## Edge cases

- The slug sent is taken, or the destination cannot be shortened → no link is created and the answer says why.
