---
kind: validation
routes:
  agent: Agent
steps:
  - text: The AI agent asks to change a page itself instead of suggesting the change
    kind: actor
    actor: ai-agent
    entities:
      - { entity: page, effect: reads, facts: [] }
    contexts:
      agent:
        place: wiki-agent
  - text: The Product refuses and says that the agent connection changes no page and offers leaving a suggestion instead
    kind: product
    actor: ai-agent
    entities:
      - { entity: page, effect: reads, facts: [] }
      - { entity: suggestion, effect: reads, facts: [] }
    contexts:
      agent:
        place: wiki-agent
---

# Refuse a direct change from the AI agent

## Trigger

The AI agent tries to edit, move or restore a page itself.

## Outcome

The page and its history are exactly as they were, and the agent is told that a
suggestion is the only change it can propose.
