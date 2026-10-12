---
kind: primary
routes:
  web: Web
steps:
  - text: The Developer opens the history of a snippet
    kind: actor
    actor: developer
    entities:
      - { entity: snippet, effect: reads, facts: [Title] }
    contexts:
      web:
        place: snippets-web::workspace::snippet
  - text: The Product lists the snippet's revisions, newest first, each with its number and when it was saved
    kind: product
    actor: developer
    entities:
      - { entity: snippet, effect: reads, facts: [] }
      - { entity: revision, effect: reads, facts: [Number, Saved at] }
    contexts:
      web:
        place: snippets-web::workspace::snippet
  - text: The Developer opens an earlier revision
    kind: actor
    actor: developer
    entities:
      - { entity: revision, effect: reads, facts: [Number] }
    contexts:
      web:
        place: snippets-web::workspace::snippet
  - text: The Product presents that revision's code highlighted for the language it had then, and what changed from the revision before it
    kind: product
    actor: developer
    entities:
      - { entity: revision, effect: reads, facts: [Number, Code, Language, Saved at] }
      - { entity: snippet, effect: reads, facts: [Title] }
    contexts:
      web:
        place: snippets-web::revision
  - text: The snippet and its latest code are unchanged
    kind: condition
    actor: developer
    entities:
      - { entity: snippet, effect: reads, facts: [] }
    contexts:
      web:
        place: snippets-web::revision
---

# Review a snippet's history

## Trigger

A Developer wants to see how a snippet changed, or what its code was before.

## Outcome

The Developer has read an earlier revision and what changed in it, and the
snippet is exactly as it was.

## Edge cases

- The snippet has only revision 1 → the history lists that one revision.
- The Developer wants the earlier code back → they copy it from the revision and save it as a new edit, which keeps a newer revision.
