---
kind: primary
result: achieved
routes:
  web: Web
steps:
  - text: The Developer changes the code of a public snippet they own and saves
    kind: actor
    actor: developer
    capability: edit-snippet
    entities:
      - { entity: snippet, effect: changes, facts: [Code] }
      - { entity: revision, effect: creates, facts: [Number, Code, Language, Saved at] }
    contexts:
      web:
        place: snippets-web::workspace::snippet-editor
  - text: The Product returns to the snippet at the same address, with the new revision at the top of its history
    kind: product
    actor: developer
    capability: view-snippet
    entities:
      - { entity: snippet, effect: reads, facts: [Code, Address] }
      - { entity: revision, effect: reads, facts: [Number, Saved at] }
    contexts:
      web:
        place: snippets-web::workspace::snippet
  - text: The Visitor opens the same address and reads the new code
    kind: actor
    actor: visitor
    capability: view-snippet
    entities:
      - { entity: snippet, effect: reads, facts: [Code] }
    contexts:
      web:
        place: snippets-web::public-snippets::snippet
  - text: The Visitor opens the previous revision and sees what changed
    kind: actor
    actor: visitor
    capability: view-revisions
    entities:
      - { entity: revision, effect: reads, facts: [Number, Code, Language, Saved at] }
    contexts:
      web:
        place: snippets-web::revision
---

# Improve a public snippet

## Trigger

The owner of a public snippet has a better version of its code.

## Outcome

The Journey goal is achieved: the address everyone holds shows the new code,
and the earlier code is one revision back in its history.
