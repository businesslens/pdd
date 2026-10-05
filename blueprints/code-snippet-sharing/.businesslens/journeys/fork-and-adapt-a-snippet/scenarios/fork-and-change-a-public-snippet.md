---
kind: primary
result: achieved
routes:
  web: Web
steps:
  - text: The Developer finds a public snippet in Discover and opens it
    kind: actor
    actor: developer
    capability: browse-public-snippets
    entities:
      - { entity: snippet, as: original, effect: reads, facts: [Title, Description, Language, Tags] }
    contexts:
      web:
        place: snippets-web::discover
  - text: The Developer forks the original snippet
    kind: actor
    actor: developer
    capability: fork-snippet
    entities:
      - { entity: snippet, as: original, effect: reads, facts: [Title, Description, Language, Tags, Code] }
      - { entity: snippet, as: fork, effect: creates, to: Private, facts: [Title, Description, Language, Tags, Code, Address, Forked from] }
      - { entity: revision, as: first, effect: creates, facts: [Number, Code, Language, Saved at] }
    contexts:
      web:
        place: snippets-web::workspace::snippet
  - text: The Product opens the fork snippet in the editor
    kind: product
    actor: developer
    capability: fork-snippet
    entities:
      - { entity: snippet, as: fork, effect: reads, facts: [Title, Description, Language, Tags, Code] }
    contexts:
      web:
        place: snippets-web::workspace::snippet-editor
  - text: The Developer changes the code of the fork snippet and saves
    kind: actor
    actor: developer
    capability: edit-snippet
    entities:
      - { entity: snippet, as: fork, effect: changes, facts: [Code] }
      - { entity: revision, as: second, effect: creates, facts: [Number, Code, Language, Saved at] }
    contexts:
      web:
        place: snippets-web::workspace::snippet-editor
  - text: The Product shows the fork snippet with its new code, the original snippet it was forked from, and a history of two revisions
    kind: product
    actor: developer
    capability: view-snippet
    entities:
      - { entity: snippet, as: fork, effect: reads, facts: [Code, Forked from] }
      - { entity: revision, as: second, effect: reads, facts: [Number, Saved at] }
    contexts:
      web:
        place: snippets-web::workspace::snippet
---

# Fork and change a public snippet

## Trigger

A Developer finds a public snippet that is nearly what they need.

## Outcome

The Journey goal is achieved: the Developer owns a private fork holding their
change as revision 2, it names the original, and the original snippet and its
owner are unaffected.
