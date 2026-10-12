---
kind: primary
routes:
  web: Web
steps:
  - text: The Owner names a new API key after the tool it is for
    kind: actor
    actor: owner
    entities:
      - { entity: api-key, effect: reads, facts: [] }
    contexts:
      web:
        place: shortener-web::dashboard::api-keys
  - text: The Product creates the API key with a secret of its own making
    kind: product
    actor: owner
    entities:
      - { entity: api-key, effect: creates, facts: [Name, Secret, Created at, Last used at] }
    contexts:
      web:
        place: shortener-web::dashboard::api-keys
  - text: The Product shows the secret once, ready to copy, and says it will not be shown again
    kind: product
    actor: owner
    entities:
      - { entity: api-key, effect: reads, facts: [Name, Secret] }
    contexts:
      web:
        place: shortener-web::dashboard::api-keys
  - text: The API key is listed by name, never again with its secret
    kind: condition
    entities:
      - { entity: api-key, effect: reads, facts: [Name, Created at, Last used at] }
    contexts:
      web:
        place: shortener-web::dashboard::api-keys
---

# Create an API key

## Trigger

The Owner wants a tool of their own to create links in their account.

## Outcome

The Owner holds the secret of a new API key, named for its tool, that the
tool can present to create links; the Product will not show that secret again.

## Edge cases

- The Owner leaves without copying the secret → it cannot be shown again; the Owner revokes the key and creates another.
- The Owner gives no name → no key is created, and the Product asks for one.
