---
kind: permission
routes:
  web: Web
steps:
  - text: The Member, a Viewer in the page's space, tries to restore an earlier revision
    kind: actor
    actor: member
    entities:
      - { entity: revision, effect: reads, facts: [Saved at] }
      - { entity: space, effect: reads, facts: [] }
      - { entity: page, effect: reads, facts: [] }
    contexts:
      web:
        place: wiki-web::workspace::revision
  - text: The Product finds that the Member's role in the space is Viewer
    kind: product
    actor: member
    entities:
      - { entity: space-membership, effect: reads, facts: [Role] }
      - { entity: space, effect: reads, facts: [] }
    contexts:
      web:
        place: wiki-web::workspace::revision
  - text: The Product explains that only the space's Editors restore revisions
    kind: product
    actor: member
    entities:
      - { entity: space, effect: reads, facts: [] }
      - { entity: revision, effect: reads, facts: [] }
    contexts:
      web:
        place: wiki-web::workspace::revision
---

# Refuse a Viewer restoring a revision

## Trigger

A Viewer reading an earlier revision tries to restore it.

## Outcome

The page and its history are unchanged; the Viewer can still read the revision.
