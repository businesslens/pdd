---
kind: validation
routes:
  agent: Agent
steps:
  - text: The AI agent asks for the pages of a space the Member it acts for does not belong to
    kind: actor
    actor: ai-agent
    entities:
      - { entity: member, effect: reads, facts: [] }
      - { entity: space, effect: reads, facts: [] }
      - { entity: page, effect: reads, facts: [] }
    contexts:
      agent:
        place: wiki-agent
  - text: The Product finds that the Member does not belong to the space
    kind: product
    actor: ai-agent
    entities:
      - { entity: space-membership, effect: reads, facts: [] }
      - { entity: member, effect: reads, facts: [] }
      - { entity: space, effect: reads, facts: [] }
    contexts:
      agent:
        place: wiki-agent
  - text: The Product says the space is unavailable, without revealing its name or its pages
    kind: product
    actor: ai-agent
    entities:
      - { entity: space, effect: reads, facts: [] }
      - { entity: page, effect: reads, facts: [] }
    contexts:
      agent:
        place: wiki-agent
---

# Refuse a space the Member does not belong to

## Trigger

A Member's AI agent asks to review a space that Member does not belong to.

## Outcome

The agent learns nothing about the space, can leave no suggestion there, and
nothing changed.
