---
kind: primary
result: achieved
routes:
  web-and-api: Web and API
steps:
  - text: The Owner creates an API key named for their tool
    kind: actor
    actor: owner
    capability: create-api-key
    entities:
      - { entity: api-key, effect: creates, facts: [Name, Secret, Created at, Last used at] }
    contexts:
      web-and-api:
        place: shortener-web::dashboard::api-keys
  - text: The Product shows the API key's secret once
    kind: product
    actor: owner
    capability: create-api-key
    entities:
      - { entity: api-key, effect: reads, facts: [Name, Secret] }
    contexts:
      web-and-api:
        place: shortener-web::dashboard::api-keys
  - text: The Owner gives the secret to their tool
    kind: actor
    actor: owner
    entities: []
  - text: The API client asks for a link to a destination, presenting the API key
    kind: actor
    actor: api-client
    capability: create-link
    entities:
      - { entity: api-key, effect: reads, facts: [] }
      - { entity: link, effect: reads, facts: [] }
    contexts:
      web-and-api:
        place: shortener-api
  - text: The Product creates an active link in the account the API key belongs to and answers with its short address
    kind: product
    actor: api-client
    capability: create-link
    entities:
      - { entity: api-key, effect: changes, facts: [Last used at] }
      - { entity: link, effect: creates, to: Active, facts: [Slug, Destination, Expires at, Created at] }
    contexts:
      web-and-api:
        place: shortener-api
  - text: The Owner finds the new link among their links
    kind: actor
    actor: owner
    capability: search-links
    entities:
      - { entity: link, effect: reads, facts: [Slug, Destination, Created at, Expires at] }
    contexts:
      web-and-api:
        place: shortener-web::dashboard::links
---

# Connect a tool and create a link

## Trigger

The Owner wants a tool of their own to shorten addresses without them.

## Outcome

The Journey goal is achieved: the tool created a link through the API, the
link belongs to the Owner, and the Owner finds it among their links with the
API key's last use recorded.
