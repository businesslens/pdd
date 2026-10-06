---
appliesTo:
  - type: entity
    id: revision
    effect: creates
permits:
  - related: [{ verb: keeps, entity: page }, { verb: contains, entity: space }, { verb: has, entity: space-membership }, { verb: holds, entity: member }]
    when: [{ entity: space-membership, fact: Role, is: Editor }]
---

# Only an Editor's save adds a revision

A revision is added to a page's history only by a Member whose role in the
page's space is Editor: by creating the page, editing it, restoring an earlier
revision, or accepting a suggestion. An AI agent never adds one.
