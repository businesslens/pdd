---
appliesTo:
  - type: entity
    id: suggestion
    effect: reads
permits:
  - related: [{ verb: receives, entity: page }, { verb: contains, entity: space }, { verb: has, entity: space-membership }, { verb: holds, entity: member }]
    when: [{ entity: space-membership, fact: Role, is: Editor }]
  - actors: [ai-agent]
---

# Only Editors and AI agents see suggestions

A suggestion is seen by the Editors of its page's space, who decide on it, and
by an AI agent acting for a Member of that space, so that it does not raise the
same suggestion twice. Viewers see pages as they are published, never drafts of
what they might become.
