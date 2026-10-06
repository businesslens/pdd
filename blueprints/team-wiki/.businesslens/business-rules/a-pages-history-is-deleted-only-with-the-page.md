---
appliesTo:
  - type: entity
    id: revision
    effect: removes
permits:
  - related: [{ verb: keeps, entity: page }, { verb: contains, entity: space }, { verb: has, entity: space-membership }, { verb: holds, entity: member }]
    when: [{ entity: space-membership, fact: Role, is: Editor }]
---

# A page's history is deleted only with the page, by an Editor

A page's revisions are removed only when a Member whose role in the page's
space is Editor deletes the page, once they confirm. No revision is removed on
its own, so a page's history is complete for as long as the page exists.
