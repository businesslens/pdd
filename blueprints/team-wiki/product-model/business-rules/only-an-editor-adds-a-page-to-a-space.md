---
appliesTo:
  - type: entity
    id: page
    effect: creates
permits:
  - related: [{ verb: contains, entity: space }, { verb: has, entity: space-membership }, { verb: holds, entity: member }]
    when: [{ entity: space-membership, fact: Role, is: Editor }]
---

# Only an Editor adds a page to a space

A page is added to a space, at its top or under another page, only by a Member
whose role in that space is Editor.
