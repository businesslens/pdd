---
appliesTo:
  - type: entity
    id: suggestion
    effect: changes
permits:
  - related: [{ verb: receives, entity: page }, { verb: contains, entity: space }, { verb: has, entity: space-membership }, { verb: holds, entity: member }]
    when: [{ entity: space-membership, fact: Role, is: Editor }]
---

# Only an Editor decides on a suggestion

A suggestion's proposed content is adjusted, and the suggestion published or
dismissed, only by a Member whose role in the page's space is Editor. The
Assistant drafts a suggestion and never decides on it.

## Rationale

The Assistant proposes and people decide: a suggestion reaches a page only
through someone who answers for that space.
