---
kind: primary
routes:
  web: Web
steps:
  - text: The Assistant reviews the pages of a space
    kind: actor
    actor: assistant
    entities:
      - { entity: page, effect: reads, facts: [Title, Content, Last edited at] }
      - { entity: space, effect: reads, facts: [] }
  - text: The Assistant finds a page that newer pages in the space have moved on from
    kind: actor
    actor: assistant
    entities:
      - { entity: page, effect: reads, facts: [Content, Last edited at] }
      - { entity: space, effect: reads, facts: [] }
  - text: The Assistant drafts updated content for the page, explains what looks out of date, and cites the newer pages
    kind: actor
    actor: assistant
    entities:
      - { entity: suggestion, effect: creates, to: Open, facts: [Reason, Explanation, Proposed content, Cited pages, Drafted at] }
      - { entity: page, effect: reads, facts: [Title] }
  - text: The suggestion waits among the open suggestions of the space's Editors, and the page is unchanged
    kind: product
    actor: assistant
    entities:
      - { entity: suggestion, effect: reads, facts: [Reason, Drafted at] }
      - { entity: page, effect: reads, facts: [Title] }
      - { entity: space, effect: reads, facts: [] }
    contexts:
      web:
        place: wiki-web::workspace::suggestions
---

# Suggest an update to a stale page

## Trigger

The Assistant reviews a space, as it does regularly.

## Outcome

An open suggestion marked Stale waits for the space's Editors, citing the pages
it relies on. The page says what it said before.

## Edge cases

- The page already has an open suggestion → the Assistant drafts no second one.
- An Editor dismissed a suggestion for the page and nothing it cited has changed since → the Assistant does not raise it again.
