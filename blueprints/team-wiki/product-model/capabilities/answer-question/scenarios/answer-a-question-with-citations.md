---
kind: primary
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
  - text: The Product finds the matching pages among those in the spaces that Member belongs to
    kind: product
    actor: ai-agent
    entities:
      - { entity: page, effect: reads, facts: [Title, Content] }
      - { entity: space, effect: reads, facts: [Name] }
      - { entity: member, effect: reads, facts: [] }
    contexts:
      agent:
        place: wiki-agent
  - text: The Product gives the AI agent each page with its title, its space and the address it opens at
    kind: product
    actor: ai-agent
    entities:
      - { entity: page, effect: reads, facts: [Title, Content, Last edited at] }
      - { entity: space, effect: reads, facts: [Name] }
    contexts:
      agent:
        place: wiki-agent
  - text: The AI agent answers the Member and cites each page it drew on
    kind: actor
    actor: ai-agent
    entities:
      - { entity: page, effect: reads, facts: [Title] }
      - { entity: member, effect: reads, facts: [] }
    contexts:
      agent:
        place: wiki-agent
  - text: Nothing in the wiki changes by being asked
    kind: condition
    actor: ai-agent
    entities:
      - { entity: page, effect: reads, facts: [] }
    contexts:
      agent:
        place: wiki-agent
---

# Answer a question with citations

## Trigger

A Member asks their AI agent something their team has written down.

## Outcome

The Member has an answer from their agent in which every part is traceable to a
cited page they may open, and nothing in the wiki changed.

## Edge cases

- Two pages answer the question differently → both are given with when each was last edited, and the agent cites both rather than choosing one.
