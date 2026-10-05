---
kind: edge
routes:
  web: Web
steps:
  - text: The Member opens an open suggestion from their suggestions
    kind: actor
    actor: member
    entities:
      - { entity: suggestion, effect: reads, facts: [Reason, Drafted at] }
      - { entity: page, effect: reads, facts: [Title] }
      - { entity: space, effect: reads, facts: [Name] }
    contexts:
      web:
        place: wiki-web::workspace::suggestions
  - text: The page has a revision saved after the suggestion was drafted
    kind: condition
    actor: member
    entities:
      - { entity: revision, effect: reads, facts: [Saved at] }
      - { entity: suggestion, effect: reads, facts: [Drafted at] }
      - { entity: page, effect: reads, facts: [] }
    contexts:
      web:
        place: wiki-web::workspace::suggestion
  - text: The Product shows the proposed content beside the page as it now stands and says the page has changed since
    kind: product
    actor: member
    entities:
      - { entity: suggestion, effect: reads, facts: [Proposed content] }
      - { entity: page, effect: reads, facts: [Content] }
    contexts:
      web:
        place: wiki-web::workspace::suggestion
  - text: The Member brings the proposed content up to date with the newer revision
    kind: actor
    actor: member
    entities:
      - { entity: suggestion, effect: changes, facts: [Proposed content] }
      - { entity: revision, effect: reads, facts: [] }
    contexts:
      web:
        place: wiki-web::workspace::suggestion
  - text: The Member publishes the suggestion
    kind: actor
    actor: member
    entities:
      - { entity: suggestion, effect: changes, from: Open, to: Published, facts: [] }
    contexts:
      web:
        place: wiki-web::workspace::suggestion
  - text: The Product makes the proposed content the page's current revision, marked as published from a suggestion
    kind: product
    actor: member
    entities:
      - { entity: page, effect: changes, facts: [Content, Last edited at] }
      - { entity: revision, effect: creates, facts: [Title, Content, Saved at, Origin] }
      - { entity: suggestion, effect: reads, facts: [] }
    contexts:
      web:
        place: wiki-web::workspace::suggestion
---

# Publish a suggestion for a page changed since

## Trigger

An Editor opens a suggestion for a page someone edited after the suggestion was
left.

## Outcome

The newer revision is not overwritten unseen: the page says what the Editor
reconciled, as a new revision after it, and the suggestion is published.
