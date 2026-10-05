---
kind: validation
routes:
  web: Web
steps:
  - text: The Developer tries to change who can read a snippet another Developer owns
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
  - text: The change is refused and the snippet keeps its visibility
    kind: condition
    actor: developer
    entities:
      - { entity: snippet, effect: reads, facts: [] }
    contexts:
      web:
        place: snippets-web::workspace::snippet
---

# Refuse a visibility change by another Developer

## Trigger

A Developer tries to change the visibility of a snippet they do not own.

## Outcome

The snippet's visibility is unchanged and the Developer gains no authority over
it.
