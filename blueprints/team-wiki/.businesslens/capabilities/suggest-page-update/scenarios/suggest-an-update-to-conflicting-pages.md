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
  - text: The Assistant finds two pages in the space that say different things about the same subject
    kind: actor
    actor: assistant
    entities:
      - { entity: page, effect: reads, facts: [Content] }
      - { entity: space, effect: reads, facts: [] }
  - text: The Assistant drafts updated content for the less recently edited page, explains the disagreement, and cites the other page
    kind: actor
    actor: assistant
    entities:
      - { entity: suggestion, effect: creates, to: Open, facts: [Reason, Explanation, Proposed content, Cited pages, Drafted at] }
      - { entity: page, effect: reads, facts: [Title, Last edited at] }
  - text: The suggestion waits among the open suggestions of the space's Editors, and both pages are unchanged
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

# Suggest an update to conflicting pages

## Trigger

The Assistant reviews a space, as it does regularly.

## Outcome

An open suggestion marked Conflicting waits for the space's Editors, citing the
page it disagrees with. Neither page has changed.
