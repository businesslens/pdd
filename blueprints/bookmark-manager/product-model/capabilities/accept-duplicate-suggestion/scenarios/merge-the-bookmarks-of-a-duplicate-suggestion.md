---
kind: primary
routes:
  web: Web
steps:
  - text: The Owner reviews a proposed duplicate suggestion with its bookmarks and reason
    kind: actor
    actor: owner
    entities:
      - { entity: duplicate-suggestion, effect: reads, facts: [Shared page, Kept bookmark, Reason] }
      - { entity: bookmark, as: kept, effect: reads, facts: [Title, Address, Saved at] }
      - { entity: bookmark, as: duplicate, effect: reads, facts: [Title, Address, Saved at] }
    contexts:
      web:
        place: bookmarks-web::suggestions
  - text: The Owner accepts it, keeping the bookmark it proposes or picking another
    kind: actor
    actor: owner
    entities:
      - { entity: duplicate-suggestion, effect: changes, facts: [Kept bookmark] }
      - { entity: bookmark, as: kept, effect: reads, facts: [] }
    contexts:
      web:
        place: bookmarks-web::suggestions
  - text: The Product gives the kept bookmark every tag and note the others carry
    kind: product
    actor: owner
    entities:
      - { entity: bookmark, as: kept, effect: changes, facts: [Note, Tags] }
      - { entity: tag, effect: reads, facts: [] }
    contexts:
      web:
        place: bookmarks-web::suggestions
  - text: The Product deletes the other bookmarks
    kind: product
    actor: owner
    entities:
      - { entity: bookmark, as: duplicate, effect: removes }
    contexts:
      web:
        place: bookmarks-web::suggestions
  - text: The Product marks the suggestion accepted
    kind: product
    actor: owner
    entities:
      - { entity: duplicate-suggestion, effect: changes, from: Proposed, to: Accepted, facts: [] }
    contexts:
      web:
        place: bookmarks-web::suggestions
---

# Merge the bookmarks of a duplicate suggestion

## Trigger

The Owner agrees that bookmarks the AI agent grouped lead to the same page.

## Outcome

One bookmark remains for the page, carrying every tag and note the set had, and
the suggestion is accepted.

## Decision points

### Which bookmark is kept?

The Owner keeps the AI agent's choice or picks another bookmark of the set.

- The Owner keeps the proposed bookmark → it survives with its own title, address and collection.
- The Owner picks another bookmark → that one survives instead, with its own title, address and collection.

## Edge cases

- One of its bookmarks was deleted since, but two or more remain → the remaining ones are merged.
