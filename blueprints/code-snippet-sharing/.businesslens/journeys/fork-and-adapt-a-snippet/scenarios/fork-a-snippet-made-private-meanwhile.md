---
kind: edge
result: not-achieved
routes:
  web: Web
steps:
  - text: The Developer opens a public snippet another Developer owns
    kind: actor
    actor: developer
    capability: view-snippet
    entities:
      - { entity: snippet, effect: reads, facts: [Title, Code] }
    contexts:
      web:
        place: snippets-web::workspace::snippet
  - text: Meanwhile its owner makes it private
    kind: condition
    entities: []
  - text: The Developer chooses to fork the snippet and is told it can no longer be forked
    kind: actor
    actor: developer
    capability: fork-snippet
    entities:
      - { entity: snippet, effect: reads, facts: [] }
    contexts:
      web:
        place: snippets-web::workspace::snippet
---

# Fork a snippet made private meanwhile

## Trigger

A Developer means to fork a public snippet whose owner makes it private first.

## Outcome

The Journey goal is not achieved: no fork is made, and the Developer gains
nothing of the snippet beyond what they already read while it was public.
