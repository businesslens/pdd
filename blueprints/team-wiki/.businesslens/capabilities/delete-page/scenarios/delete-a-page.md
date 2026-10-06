---
kind: primary
routes:
  web: Web
steps:
  - text: The Member chooses to delete a page from the space's tree
    kind: actor
    actor: member
    entities:
      - { entity: page, effect: reads, facts: [Title] }
      - { entity: space, effect: reads, facts: [Name] }
    contexts:
      web:
        place: wiki-web::workspace::space
  - text: The Product asks the Member to confirm that the page and its history will be deleted for good
    kind: product
    actor: member
    entities:
      - { entity: page, effect: reads, facts: [Title] }
    contexts:
      web:
        place: wiki-web::workspace::space
  - text: The Member confirms
    kind: actor
    actor: member
    entities:
      - { entity: page, effect: reads, facts: [] }
    contexts:
      web:
        place: wiki-web::workspace::space
  - text: The Product deletes the page with its revisions and every suggestion left for it, whatever its state
    kind: product
    actor: member
    entities:
      - { entity: page,       effect: removes }
      - { entity: revision,   effect: removes, with: page }
      - { entity: suggestion, as: proposed,  effect: removes, from: Proposed,  with: page }
      - { entity: suggestion, as: accepted,  effect: removes, from: Accepted,  with: page }
      - { entity: suggestion, as: dismissed, effect: removes, from: Dismissed, with: page }
    contexts:
      web:
        place: wiki-web::workspace::space
  - text: The space's tree no longer shows the page
    kind: condition
    actor: member
    entities:
      - { entity: space, effect: reads, facts: [] }
      - { entity: page, effect: reads, facts: [Title, Parent page] }
    contexts:
      web:
        place: wiki-web::workspace::space
---

# Delete a page

## Trigger

An Editor decides a page with nothing beneath it no longer belongs in the space.

## Outcome

The page and its revisions are gone for good, along with every suggestion left
for it, accepted and dismissed ones included, and nobody in the space can open them again.
