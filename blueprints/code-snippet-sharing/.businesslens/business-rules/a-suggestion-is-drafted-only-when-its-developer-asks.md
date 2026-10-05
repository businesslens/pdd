---
appliesTo:
  - type: entity
    id: suggestion
    effect: creates
permits:
  - actors: [developer]
---

# A suggestion is drafted only when its Developer asks

The Product drafts a suggestion only when a Developer asks for one in the
editor, from the code and language in front of them and nothing else they
keep. It never drafts suggestions on its own schedule or for snippets nobody is
editing.

## Rationale

Sending code to a language model is the Developer's call, made each time they
ask, so a snippet's code never leaves the Product for drafting unless its
Developer is there and wants a suggestion.
