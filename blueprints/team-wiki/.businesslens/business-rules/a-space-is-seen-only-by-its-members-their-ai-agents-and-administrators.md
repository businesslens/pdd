---
appliesTo:
  - type: entity
    id: space
    effect: reads
permits:
  - related: [{ verb: has, entity: space-membership }, { verb: holds, entity: member }]
  - related: [{ verb: has, entity: space-membership }, { verb: holds, entity: member }, { verb: connects, entity: ai-agent }]
  - actors: [administrator]
---

# A space is seen only by its members, their AI agents and Administrators

A Member sees a space — on their home, in search results, in their suggestions
— only while they belong to it, and an AI agent sees only the spaces the Member
who connected it belongs to. Administrators see every space so that they can
manage who belongs to it.
