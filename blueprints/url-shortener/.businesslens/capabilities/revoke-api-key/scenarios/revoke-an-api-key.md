---
kind: primary
routes:
  web: Web
steps:
  - text: The Owner chooses to revoke an API key
    kind: actor
    actor: owner
    entities:
      - { entity: api-key, effect: reads, facts: [Name, Last used at] }
    contexts:
      web:
        place: shortener-web::dashboard::api-keys
  - text: The Product warns that any tool using the API key will be refused from now on, and that links it created stay
    kind: product
    actor: owner
    entities:
      - { entity: api-key, effect: reads, facts: [] }
      - { entity: link, effect: reads, facts: [] }
    contexts:
      web:
        place: shortener-web::dashboard::api-keys
  - text: The Owner confirms
    kind: actor
    actor: owner
    entities:
      - { entity: api-key, effect: removes }
    contexts:
      web:
        place: shortener-web::dashboard::api-keys
  - text: Links created with the API key stay active and remain the Owner's
    kind: condition
    actor: owner
    entities:
      - { entity: link, effect: reads, facts: [] }
      - { entity: api-key, effect: reads, facts: [] }
    contexts:
      web:
        place: shortener-web::dashboard::api-keys
---

# Revoke an API key

## Trigger

The Owner no longer wants a tool to create links in their account, or fears
its secret has leaked.

## Outcome

The API key is gone: a tool presenting its secret is refused, and every link
created with it is unchanged.

## Edge cases

- The Owner declines to confirm → the API key stays and keeps working.
