---
kind: conflict
routes:
  web: Web
steps:
  - text: The Member saves changes to a page they opened earlier
    kind: actor
    actor: member
    entities:
      - { entity: page, effect: reads, facts: [Title, Content] }
    contexts:
      web:
        place: wiki-web::workspace::page
  - text: Another Editor has saved the page since the Member opened it
    kind: condition
    actor: member
    entities:
      - { entity: revision, effect: reads, facts: [Saved at] }
      - { entity: member, effect: reads, facts: [Name] }
      - { entity: page, effect: reads, facts: [] }
    contexts:
      web:
        place: wiki-web::workspace::page
  - text: The Product keeps the Member's changes unsaved and shows them beside the other Editor's revision
    kind: product
    actor: member
    entities:
      - { entity: revision, effect: reads, facts: [Content] }
      - { entity: page, effect: reads, facts: [Content] }
    contexts:
      web:
        place: wiki-web::workspace::page
  - text: The Member reconciles the two and saves again
    kind: actor
    actor: member
    entities: []
    contexts:
      web:
        place: wiki-web::workspace::page
  - text: The Product makes the reconciled page the current revision, after the other Editor's
    kind: product
    actor: member
    entities:
      - { entity: page, effect: changes, facts: [Title, Content, Last edited at] }
      - { entity: revision, effect: creates, facts: [Title, Content, Saved at, Origin] }
    contexts:
      web:
        place: wiki-web::workspace::page
---

# Save after another Editor saved

## Trigger

Two Editors work on the same page and the second one saves.

## Outcome

Neither Editor's work is lost: the other Editor's revision stays in the history
and the reconciled page is current.
