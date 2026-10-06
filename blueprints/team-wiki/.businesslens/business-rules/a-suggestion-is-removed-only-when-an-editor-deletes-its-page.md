---
appliesTo:
  - type: entity
    id: suggestion
    effect: removes
permits:
  - related: [{ verb: receives, entity: page }, { verb: contains, entity: space }, { verb: has, entity: space-membership }, { verb: holds, entity: member }]
    when: [{ entity: space-membership, fact: Role, is: Editor }]
---

# A suggestion is removed only when an Editor deletes its page

A suggestion still proposed for a page is removed only when a Member whose role
in the page's space is Editor deletes that page, once they confirm. Otherwise a
suggestion leaves the proposed suggestions only by being accepted or dismissed.
