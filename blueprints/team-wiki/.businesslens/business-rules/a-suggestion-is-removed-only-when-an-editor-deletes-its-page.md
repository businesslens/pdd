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

A suggestion is removed only when a Member whose role in the page's space is
Editor deletes that page, once they confirm. Every suggestion for the page goes
with it, whether Proposed, Accepted or Dismissed, so none is left pointing at a
page that no longer exists. Otherwise a suggestion leaves the proposed
suggestions only by being accepted or dismissed, and is kept afterwards.
