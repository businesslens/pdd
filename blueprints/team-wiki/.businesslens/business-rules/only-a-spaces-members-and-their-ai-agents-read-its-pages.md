---
appliesTo:
  - type: entity
    id: page
    effect: reads
permits:
  - related: [{ verb: contains, entity: space }, { verb: has, entity: space-membership }, { verb: holds, entity: member }]
  - related: [{ verb: contains, entity: space }, { verb: has, entity: space-membership }, { verb: holds, entity: member }, { verb: connects, entity: ai-agent }]
---

# Only a space's members and their AI agents read its pages

A page is read by the Members who belong to its space, whatever their role, and
by an AI agent one of those Members connected. An agent is given, and may cite,
only pages in the spaces the Member who connected it belongs to. Anyone else
asking for a page learns nothing about it, not even its title.

## Rationale

Spaces are how a team keeps some knowledge to the people it concerns. An agent
reaches the wiki only as an extension of the Member who connected it, never as
a reader of its own.
