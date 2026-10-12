---
kind: validation
routes:
  agent: Agent
steps:
  - text: The AI agent tries to file, tag, merge or delete a bookmark itself instead of suggesting it
    kind: actor
    actor: ai-agent
    entities:
      - { entity: bookmark, effect: reads, facts: [] }
      - { entity: tag, effect: reads, facts: [] }
    contexts:
      agent:
        place: bookmarks-agent
  - text: The Product refuses, and says that the agent connection changes nothing in the library and offers leaving a suggestion instead
    kind: product
    actor: ai-agent
    entities:
      - { entity: bookmark, effect: reads, facts: [] }
    contexts:
      agent:
        place: bookmarks-agent
---

# Refuse a direct change from the AI agent

## Trigger

The AI agent tries to change the library directly.

## Outcome

The library is exactly as it was, and the AI agent is told that a suggestion is
the only change it can propose.
