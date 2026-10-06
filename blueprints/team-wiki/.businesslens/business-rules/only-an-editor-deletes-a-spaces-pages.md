---
appliesTo:
  - type: entity
    id: page
    effect: removes
permits:
  - related: [{ verb: contains, entity: space }, { verb: has, entity: space-membership }, { verb: holds, entity: member }]
    when: [{ entity: space-membership, fact: Role, is: Editor }]
---

# Only an Editor deletes a space's pages

A page is deleted, with its history, only by a Member whose
role in that space is Editor, and only once they confirm.
