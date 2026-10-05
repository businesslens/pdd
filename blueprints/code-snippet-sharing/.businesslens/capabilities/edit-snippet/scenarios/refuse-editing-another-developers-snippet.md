---
kind: validation
routes:
  web: Web
steps:
  - text: The Developer tries to edit a snippet another Developer owns
    kind: actor
    actor: developer
    entities:
      - { entity: snippet, effect: reads, facts: [] }
    contexts:
      web:
        place: snippets-web::workspace::snippet
  - text: The Product checks who owns the snippet
    kind: product
    actor: developer
    entities:
      - { entity: snippet, effect: reads, facts: [] }
    contexts:
      web:
        place: snippets-web::workspace::snippet
  - text: The edit is refused and the snippet is unchanged
    kind: condition
    actor: developer
    entities:
      - { entity: snippet, effect: reads, facts: [] }
    contexts:
      web:
        place: snippets-web::workspace::snippet
---

# Refuse editing another Developer's snippet

## Trigger

A Developer tries to change a snippet they do not own.

## Outcome

The snippet and its history are unchanged, and the Developer gains no authority
over it. Where it is public, forking it is how they get a copy to change.
