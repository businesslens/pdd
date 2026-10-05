---
kind: primary
routes:
  web: Web
steps:
  - text: The Member asks the Assistant a question in their own words
    kind: actor
    actor: member
    entities:
      - { entity: assistant, effect: reads, facts: [] }
    contexts:
      web:
        place: wiki-web::workspace::assistant
  - text: The Assistant reads the pages that bear on the question among those the Member may read
    kind: actor
    actor: assistant
    entities:
      - { entity: page, effect: reads, facts: [Title, Content] }
      - { entity: member, effect: reads, facts: [] }
  - text: The Assistant answers and cites each page it drew on
    kind: actor
    actor: assistant
    entities:
      - { entity: page, effect: reads, facts: [Title] }
    contexts:
      web:
        place: wiki-web::workspace::assistant
  - text: Nothing in the wiki changes by being asked
    kind: condition
    actor: member
    entities:
      - { entity: page, effect: reads, facts: [] }
    contexts:
      web:
        place: wiki-web::workspace::assistant
---

# Answer a question with citations

## Trigger

A Member wants an answer that their team has written down somewhere.

## Outcome

The Member has an answer in a few sentences, each part of it traceable to a
cited page they may open.

## Edge cases

- The Member opens a citation → the cited page opens as it stands now.
