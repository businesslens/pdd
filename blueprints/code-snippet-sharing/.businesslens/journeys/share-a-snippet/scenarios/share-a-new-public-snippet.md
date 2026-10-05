---
kind: primary
result: achieved
routes:
  web: Web
steps:
  - text: The Developer writes a new snippet, sets its visibility to Public and saves
    kind: actor
    actor: developer
    capability: create-snippet
    entities:
      - { entity: snippet, effect: creates, to: Public, facts: [Title, Description, Language, Tags, Code, Address] }
      - { entity: revision, effect: creates, facts: [Number, Code, Language, Saved at] }
    contexts:
      web:
        place: snippets-web::workspace::snippet-editor
  - text: The Product opens the new snippet, showing its address
    kind: product
    actor: developer
    capability: view-snippet
    entities:
      - { entity: snippet, effect: reads, facts: [Address] }
    contexts:
      web:
        place: snippets-web::workspace::snippet
  - text: The Developer passes the address on
    kind: actor
    actor: developer
    entities:
      - { entity: snippet, effect: reads, facts: [Address] }
    contexts:
      web:
        place: snippets-web::workspace::snippet
  - text: The Visitor opens the address and reads the snippet's code
    kind: actor
    actor: visitor
    capability: view-snippet
    entities:
      - { entity: snippet, effect: reads, facts: [Title, Code] }
    contexts:
      web:
        place: snippets-web::public-snippets::snippet
---

# Share a new public snippet

## Trigger

The Developer has code they want others to read and reuse.

## Outcome

The Journey goal is achieved: the Visitor reads the new snippet at its address
without signing in.
