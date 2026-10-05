---
kind: primary
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
  - text: The Product shows why the Assistant raised it, the pages it cites, and its proposed content beside the page as it stands
    kind: product
    actor: member
    entities:
      - { entity: suggestion, effect: reads, facts: [Reason, Explanation, Proposed content, Cited pages] }
      - { entity: page, effect: reads, facts: [Title, Content] }
      - { entity: assistant, effect: reads, facts: [] }
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
  - text: The Product makes the proposed content the page's current revision, marked as published from an Assistant suggestion
    kind: product
    actor: member
    entities:
      - { entity: page, effect: changes, facts: [Content, Last edited at] }
      - { entity: revision, effect: creates, facts: [Title, Content, Saved at, Origin] }
      - { entity: assistant, effect: reads, facts: [] }
      - { entity: suggestion, effect: reads, facts: [] }
    contexts:
      web:
        place: wiki-web::workspace::suggestion
---

# Publish a suggestion

## Trigger

An Editor agrees with a suggestion the Assistant drafted.

## Outcome

The page says what the suggestion proposed, as a new revision the Editor saved,
and the suggestion is published.
