---
appliesTo:
  - type: entity
    id: suggestion
    effect: reads
permits:
  - related: [{ verb: receives, entity: page }, { verb: contains, entity: space }, { verb: has, entity: space-membership }, { verb: holds, entity: member }]
    when: [{ entity: space-membership, fact: Role, is: Editor }]
  - actors: [assistant]
---

# Only Editors and the Assistant see suggestions

A suggestion is seen by the Editors of its page's space, who decide on it, and
by the Assistant, which keeps track of what it has already raised. Viewers see
pages as they are published, never drafts of what they might become.
