---
appliesTo:
  - type: entity
    id: suggestion
    effect: creates
permits:
  - actors: [snippet-assistant]
---

# Only the Snippet assistant drafts a suggestion

A suggestion is always the Snippet assistant's proposal, drafted only when the
Developer asks for one, from the code and language in front of them and nothing
else they keep.

## Rationale

Developers must be able to tell what was proposed to them from what they wrote,
so a suggestion always comes from the assistant and is shown as its proposal.
