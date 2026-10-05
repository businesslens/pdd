---
kind: edge
routes:
  web: Web
steps:
  - text: The Member asks the Assistant a question
    kind: actor
    actor: member
    entities:
      - { entity: assistant, effect: reads, facts: [] }
    contexts:
      web:
        place: wiki-web::workspace::assistant
  - text: The Assistant finds two pages the Member may read that answer it differently
    kind: actor
    actor: assistant
    entities:
      - { entity: page, effect: reads, facts: [Title, Content, Last edited at] }
      - { entity: member, effect: reads, facts: [] }
  - text: The Assistant gives both answers and cites both pages
    kind: actor
    actor: assistant
    entities:
      - { entity: page, effect: reads, facts: [Title] }
    contexts:
      web:
        place: wiki-web::workspace::assistant
---

# Point out pages that disagree

## Trigger

A Member asks something two pages answer differently.

## Outcome

The Member sees that the wiki disagrees with itself and which pages to check,
rather than one answer chosen for them.
