---
kind: primary
routes:
  web: Web
steps:
  - text: The Visitor opens the history of a public or unlisted snippet
    kind: actor
    actor: visitor
    entities:
      - { entity: snippet, effect: reads, facts: [Title] }
      - { entity: revision, effect: reads, facts: [Number, Saved at] }
    contexts:
      web:
        place: snippets-web::public-snippets::snippet
  - text: The Visitor opens an earlier revision
    kind: actor
    actor: visitor
    entities:
      - { entity: revision, effect: reads, facts: [Number] }
    contexts:
      web:
        place: snippets-web::public-snippets::snippet
  - text: The Product presents that revision's code highlighted for the language it had then, and what changed from the revision before it
    kind: product
    actor: visitor
    entities:
      - { entity: revision, effect: reads, facts: [Number, Code, Language, Saved at] }
      - { entity: snippet, effect: reads, facts: [Title] }
    contexts:
      web:
        place: snippets-web::revision
---

# Read an earlier revision without an account

## Trigger

Someone reading a shared snippet wants to see how its code looked before.

## Outcome

The Visitor has read the earlier revision without signing in, and nothing about
the snippet or the Visitor is kept.
