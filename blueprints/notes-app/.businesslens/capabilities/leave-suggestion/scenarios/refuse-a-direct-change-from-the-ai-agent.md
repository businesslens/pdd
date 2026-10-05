---
kind: permission
routes:
  agent: Agent
steps:
  - text: The AI agent asks to file a note in a notebook itself instead of suggesting it
    kind: actor
    actor: ai-agent
    entities:
      - { entity: note, effect: reads, facts: [] }
      - { entity: notebook, effect: reads, facts: [] }
    contexts:
      agent:
        place: notes-agent
  - text: The Product refuses, and says that the agent connection changes no note and offers leaving a suggestion instead
    kind: product
    actor: ai-agent
    entities:
      - { entity: note, effect: reads, facts: [] }
      - { entity: suggestion, effect: reads, facts: [] }
    contexts:
      agent:
        place: notes-agent
---

# Refuse a direct change from the AI agent

## Trigger

The AI agent tries to file, tag, edit, link or delete a note itself.

## Outcome

The note is exactly as it was, and the AI agent is told that a suggestion is
the only change it can propose.
