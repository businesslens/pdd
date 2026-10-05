---
appliesTo:
  - type: capability
    id: suggest-snippet-details
  - type: capability
    id: create-snippet
  - type: capability
    id: edit-snippet
---

# A suggestion reaches a snippet only when its Developer saves

A suggestion proposes a title, a description and tags, and nothing else: never
code, language or visibility. Accepting a suggestion only fills the
editor's fields, which stay editable; the snippet keeps those values only when
the Developer saves it, and leaving without saving keeps nothing.

## Rationale

What a snippet says about itself is shown to everyone who reads it, so it must
always be something its owner chose to save, never something a language model
wrote on its own.
