---
kind: primary
routes:
  web: Web
steps:
  - text: The Member chooses to restore the revision they are reading
    kind: actor
    actor: member
    entities:
      - { entity: revision, effect: reads, facts: [Title, Content, Saved at] }
    contexts:
      web:
        place: wiki-web::workspace::revision
  - text: The Product explains that the page will say what it said then, and that later revisions stay in the history
    kind: product
    actor: member
    entities:
      - { entity: page, effect: reads, facts: [] }
      - { entity: revision, effect: reads, facts: [] }
    contexts:
      web:
        place: wiki-web::workspace::revision
  - text: The Member confirms
    kind: actor
    actor: member
    entities: []
    contexts:
      web:
        place: wiki-web::workspace::revision
  - text: The Product makes that title and content the page's current revision, marked as restored
    kind: product
    actor: member
    entities:
      - { entity: page, effect: changes, facts: [Title, Content, Last edited at] }
      - { entity: revision, effect: creates, facts: [Title, Content, Saved at, Origin] }
    contexts:
      web:
        place: wiki-web::workspace::revision
  - text: The Product shows that the page now says what was restored, with no difference left
    kind: product
    actor: member
    entities:
      - { entity: page, effect: reads, facts: [Title, Content, Last edited at] }
    contexts:
      web:
        place: wiki-web::workspace::revision
---

# Restore an earlier revision

## Trigger

An Editor wants a page back the way it was before an unwanted change.

## Outcome

The page says what it said at the chosen revision. Every revision, including the
ones after it, is still in the history.

## Edge cases

- The Editor declines to confirm → the page is unchanged.
