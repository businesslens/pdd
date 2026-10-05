---
kind: validation
routes:
  agent: Agent
steps:
  - text: The AI agent asks for what is waiting in the inbox
    kind: actor
    actor: ai-agent
    entities: []
    contexts:
      agent:
        place: notes-agent
  - text: The Product finds that the Owner does not allow assistant access
    kind: product
    actor: ai-agent
    entities:
      - { entity: owner, effect: reads, facts: [Assistant access] }
    contexts:
      agent:
        place: notes-agent
  - text: The Product refuses, telling the AI agent that assistant access is off, and discloses nothing
    kind: product
    actor: ai-agent
    entities: []
    contexts:
      agent:
        place: notes-agent
---

# Refuse an AI agent while assistant access is off

## Trigger

An AI agent asks for the Owner's notes, or tries to leave a suggestion, while
the Owner does not allow assistant access.

## Outcome

The AI agent learns nothing about any note and no suggestion is left.
