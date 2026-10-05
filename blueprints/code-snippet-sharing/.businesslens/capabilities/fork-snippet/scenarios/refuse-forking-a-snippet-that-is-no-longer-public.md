---
kind: validation
routes:
  web: Web
steps:
  - text: The Developer chooses to fork a snippet another Developer owns
    kind: actor
    actor: developer
    entities:
      - { entity: snippet, effect: reads, facts: [Title] }
    contexts:
      web:
        place: snippets-web::workspace::snippet
  - text: The snippet has been made unlisted or private since it was opened
    kind: condition
    actor: developer
    entities:
      - { entity: snippet, effect: reads, facts: [] }
    contexts:
      web:
        place: snippets-web::workspace::snippet
  - text: The Product says the snippet can no longer be forked
    kind: product
    actor: developer
    entities:
      - { entity: snippet, effect: reads, facts: [] }
    contexts:
      web:
        place: snippets-web::workspace::snippet
  - text: No copy is made
    kind: condition
    entities: []
    contexts:
      web:
        place: snippets-web::workspace::snippet
---

# Refuse forking a snippet that is no longer public

## Trigger

A Developer chooses to fork a snippet whose owner has stopped sharing it in
public.

## Outcome

Nothing is copied, and the Developer knows the snippet is no longer open to
forking.

## Edge cases

- The snippet is unlisted and the Developer holds its address → they can read it, but it is not offered for forking.
