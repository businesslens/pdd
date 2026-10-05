---
kind: edge
result: not-achieved
routes:
  web-and-api: Web and API
steps:
  - text: The Owner creates an API key and gives its secret to their tool
    kind: actor
    actor: owner
    capability: create-api-key
    entities:
      - { entity: api-key, effect: creates, facts: [Name, Secret, Created at, Last used at] }
    contexts:
      web-and-api:
        place: shortener-web::dashboard::api-keys
  - text: The Owner revokes the API key
    kind: actor
    actor: owner
    capability: revoke-api-key
    entities:
      - { entity: api-key, effect: removes }
    contexts:
      web-and-api:
        place: shortener-web::dashboard::api-keys
  - text: The API client asks for a link, presenting the revoked API key
    kind: actor
    actor: api-client
    capability: create-link
    entities:
      - { entity: api-key, effect: reads, facts: [] }
      - { entity: link, effect: reads, facts: [] }
    contexts:
      web-and-api:
        place: shortener-api
  - text: The Product refuses the request and creates no link
    kind: product
    actor: api-client
    capability: create-link
    entities:
      - { entity: link, effect: reads, facts: [] }
    contexts:
      web-and-api:
        place: shortener-api
---

# Create a link with a revoked API key

## Trigger

The Owner revokes the API key their tool uses, and the tool asks for a link
with it afterwards.

## Outcome

The Journey goal is not achieved: the tool is refused and no link is created
in the Owner's account. Revocation takes effect at once for any tool still
holding the secret.
