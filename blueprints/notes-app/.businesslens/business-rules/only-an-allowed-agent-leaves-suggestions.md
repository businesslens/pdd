---
appliesTo:
  - type: entity
    id: suggestion
    effect: creates
permits:
  - actors: [ai-agent]
    when: [{ entity: owner, fact: Assistant access, is: true }]
---

# Only an allowed AI agent leaves suggestions

A suggestion is left by an AI agent, and only while its Owner has assistant
access turned on. The Owner never writes suggestions; they decide them.

## Rationale

Suggestions exist to bring an agent's help to the Owner's notes, and only an
agent the Owner allowed may offer it.
