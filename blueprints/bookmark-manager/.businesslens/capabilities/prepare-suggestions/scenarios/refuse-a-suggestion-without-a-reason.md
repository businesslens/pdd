---
kind: validation
routes:
  agent: Agent
steps:
  - text: The AI agent leaves a suggestion that gives no reason
    kind: actor
    actor: ai-agent
    entities: []
    contexts:
      agent:
        place: bookmarks-agent
  - text: The Product refuses it, and says that every suggestion must say why
    kind: product
    actor: ai-agent
    entities: []
    contexts:
      agent:
        place: bookmarks-agent
---

# Refuse a suggestion without a reason

## Trigger

The AI agent proposes a filing or a merge without explaining it.

## Outcome

No suggestion is left, and the AI agent is told a reason is required.
