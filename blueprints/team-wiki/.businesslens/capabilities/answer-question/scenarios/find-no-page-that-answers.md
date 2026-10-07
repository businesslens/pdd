---
kind: edge
routes:
  agent: Agent
steps:
  - text: The AI agent asks for the pages that bear on a question the Member it acts for asked
    kind: actor
    actor: ai-agent
    entities:
      - { entity: member, effect: reads, facts: [] }
      - { entity: page, effect: reads, facts: [] }
    contexts:
      agent:
        place: wiki-agent
  - text: No page in the spaces that Member belongs to matches
    kind: condition
    actor: ai-agent
    entities:
      - { entity: page, effect: reads, facts: [Title, Content] }
      - { entity: member, effect: reads, facts: [] }
      - { entity: space, effect: reads, facts: [] }
    contexts:
      agent:
        place: wiki-agent
  - text: The Product tells the AI agent that the wiki holds no answer for that Member
    kind: product
    actor: ai-agent
    entities:
      - { entity: member, effect: reads, facts: [] }
    contexts:
      agent:
        place: wiki-agent
---

# Find no page that answers

## Trigger

A Member asks their AI agent something the pages they may read do not cover.

## Outcome

The agent has nothing to cite and can tell the Member the wiki does not answer
the question.

## Edge cases

- The only page that answers is in a space the Member does not belong to → the agent is told exactly what it would be told if no page did, learning neither the page nor its space.
