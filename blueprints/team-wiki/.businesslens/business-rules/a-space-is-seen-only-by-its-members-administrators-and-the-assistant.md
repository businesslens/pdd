---
appliesTo:
  - type: entity
    id: space
    effect: reads
permits:
  - related: [{ verb: has, entity: space-membership }, { verb: holds, entity: member }]
  - actors: [administrator, assistant]
---

# A space is seen only by its members, Administrators and the Assistant

A Member sees a space — on their home, in search results, in their suggestions
— only while they belong to it. Administrators see every space so that they can
manage it, and the Assistant sees every space so that it can review it.
