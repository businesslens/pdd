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
  - text: The Product shows why the suggestion was raised, the pages it cites, and its proposed content beside the page as it stands
    kind: product
    actor: member
    entities:
      - { entity: suggestion, effect: reads, facts: [Reason, Explanation, Proposed content, Cited pages] }
      - { entity: page, effect: reads, facts: [Title, Content] }
    contexts:
      web:
        place: wiki-web::workspace::suggestion
  - text: The Member dismisses the suggestion
    kind: actor
    actor: member
    entities:
      - { entity: suggestion, effect: changes, from: Open, to: Dismissed, facts: [] }
    contexts:
      web:
        place: wiki-web::workspace::suggestion
  - text: The suggestion leaves the open suggestions and the page is unchanged
    kind: condition
    actor: member
    entities:
      - { entity: page, effect: reads, facts: [Content] }
      - { entity: suggestion, effect: reads, facts: [] }
    contexts:
      web:
        place: wiki-web::workspace::suggestions
---

# Dismiss a suggestion

## Trigger

An Editor decides a suggestion an AI agent left is wrong or not worth making.

## Outcome

The suggestion is dismissed, the page says what it said before, and its history
has no new revision.
