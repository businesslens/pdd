---
kind: edge
routes:
  web: Web
steps:
  - text: The Member opens the history of a page
    kind: actor
    actor: member
    entities:
      - { entity: revision, effect: reads, facts: [Saved at, Origin] }
      - { entity: member, effect: reads, facts: [Name] }
      - { entity: page, effect: reads, facts: [] }
    contexts:
      web:
        place: wiki-web::workspace::page
  - text: The Member picks an earlier revision
    kind: actor
    actor: member
    entities:
      - { entity: revision, effect: reads, facts: [Saved at] }
    contexts:
      web:
        place: wiki-web::workspace::page
  - text: The Product presents what the page said at that revision, who saved it, and how it differs from the page now
    kind: product
    actor: member
    entities:
      - { entity: revision, effect: reads, facts: [Title, Content, Saved at, Origin] }
      - { entity: page, effect: reads, facts: [Title, Content] }
      - { entity: member, effect: reads, facts: [Name] }
    contexts:
      web:
        place: wiki-web::workspace::revision
  - text: The page itself is unchanged by being compared
    kind: condition
    actor: member
    entities:
      - { entity: page, effect: reads, facts: [] }
    contexts:
      web:
        place: wiki-web::workspace::revision
---

# Read an earlier revision

## Trigger

A Member wants to know what a page said before, or who changed it.

## Outcome

The Member has read the earlier revision side by side with the current page, and
nothing changed.
