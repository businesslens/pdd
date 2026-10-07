---
kind: primary
routes:
  agent: Agent
steps:
  - text: The AI agent asks for the pages of a space the Member it acts for belongs to
    kind: actor
    actor: ai-agent
    entities:
      - { entity: member, effect: reads, facts: [] }
      - { entity: space, effect: reads, facts: [] }
      - { entity: page, effect: reads, facts: [] }
    contexts:
      agent:
        place: wiki-agent
  - text: The Product gives the AI agent the pages of that space with when each was last edited
    kind: product
    actor: ai-agent
    entities:
      - { entity: page, effect: reads, facts: [Title, Content, Last edited at] }
      - { entity: space, effect: reads, facts: [Name] }
    contexts:
      agent:
        place: wiki-agent
  - text: The AI agent leaves a suggestion for the less recently edited of two pages that disagree, explaining the disagreement and citing the other page
    kind: actor
    actor: ai-agent
    entities:
      - { entity: suggestion, effect: creates, to: Proposed, facts: [Reason, Explanation, Proposed content, Cited pages, Drafted at] }
      - { entity: page, effect: reads, facts: [Title, Last edited at] }
    contexts:
      agent:
        place: wiki-agent
  - text: Both pages stay unchanged while the suggestion waits for the Editors of their space
    kind: condition
    actor: ai-agent
    entities:
      - { entity: page, effect: reads, facts: [] }
      - { entity: suggestion, effect: reads, facts: [] }
      - { entity: space, effect: reads, facts: [] }
    contexts:
      agent:
        place: wiki-agent
---

# Suggest an update to conflicting pages

## Trigger

A Member's AI agent finds two pages in a space that say different things about
the same subject.

## Outcome

A proposed suggestion marked Conflicting waits among the space's suggestions on the
web, citing the page it disagrees with. Neither page has changed.
