---
appliesTo:
  - type: entity
    id: page
    effect: reads
permits:
  - related: [{ verb: contains, entity: space }, { verb: has, entity: space-membership }, { verb: holds, entity: member }]
  - actors: [assistant]
---

# Only a space's members and the Assistant read its pages

A page is read by the Members who belong to its space, whatever their role, and
by the Assistant, which reads pages to answer questions and to review spaces.
Anyone else asking for a page learns nothing about it, not even its title.

## Rationale

Spaces are how a team keeps some knowledge to the people it concerns. The
Assistant reads widely so it can do its work, which is why what it may show
anyone is bounded separately by what that person may read.
