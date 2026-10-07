---
kind: primary
routes:
  web: Web
steps:
  - text: The Developer enters the code, chooses its language, and gives it a title, a description and tags
    kind: actor
    actor: developer
    entities: []
    contexts:
      web:
        place: snippets-web::workspace::snippet-editor
  - text: The Developer sets the visibility to Public and saves
    kind: actor
    actor: developer
    entities: []
    contexts:
      web:
        place: snippets-web::workspace::snippet-editor
  - text: The Product creates a public snippet owned by the Developer, at an address of its own, and keeps its code as revision 1
    kind: product
    actor: developer
    entities:
      - { entity: snippet, effect: creates, to: Public, facts: [Title, Description, Language, Tags, Code, Address] }
      - { entity: revision, effect: creates, facts: [Number, Code, Language, Saved at], with: snippet }
    contexts:
      web:
        place: snippets-web::workspace::snippet-editor
  - text: The Product opens the new snippet, showing the address anyone can read it at
    kind: product
    actor: developer
    entities:
      - { entity: snippet, effect: reads, facts: [Title, Code, Address] }
    contexts:
      web:
        place: snippets-web::workspace::snippet
---

# Create a public snippet

## Trigger

The Developer has a piece of code they want anyone to be able to find and reuse.

## Outcome

The new snippet is public from the moment it is saved: anyone can read it at its
address, it is listed in Discover, and other Developers can fork it.
