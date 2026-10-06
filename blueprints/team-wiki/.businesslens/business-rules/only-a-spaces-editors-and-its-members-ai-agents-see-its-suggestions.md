---
appliesTo:
  - type: entity
    id: suggestion
    effect: reads
permits:
  - related: [{ verb: receives, entity: page }, { verb: contains, entity: space }, { verb: has, entity: space-membership }, { verb: holds, entity: member }]
    when: [{ entity: space-membership, fact: Role, is: Editor }]
  - related: [{ verb: receives, entity: page }, { verb: contains, entity: space }, { verb: has, entity: space-membership }, { verb: holds, entity: member }, { verb: connects, entity: ai-agent }]
---

# Only a space's Editors and its Members' AI agents see its suggestions

A suggestion is seen by the Editors of its page's space, who decide on it, and
by an AI agent a Member of that space connected, so that it does not raise the
same suggestion twice. Viewers see pages only as Editors saved them.
