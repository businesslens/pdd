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
  - text: The Product shows why the suggestion was raised, the pages it cites, and its proposed content beside the page as it stands
    kind: product
    actor: member
    entities:
      - { entity: suggestion, effect: reads, facts: [Reason, Explanation, Proposed content, Cited pages] }
      - { entity: page, effect: reads, facts: [Title, Content] }
    contexts:
      web:
        place: wiki-web::workspace::suggestion
  - text: The Member changes the proposed content
    kind: actor
    actor: member
    entities:
      - { entity: suggestion, effect: changes, facts: [Proposed content] }
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

# Edit a suggestion before publishing

## Trigger

An Editor agrees with a suggestion only in part.

## Outcome

The page says what the Editor made of the suggestion, as a new revision they
saved, and the suggestion is published.
