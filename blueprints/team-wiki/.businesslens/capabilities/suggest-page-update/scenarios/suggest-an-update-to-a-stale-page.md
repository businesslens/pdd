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
  - text: The AI agent leaves a suggestion for a page that newer pages in the space have moved on from, with updated content, its explanation and the newer pages it cites
    kind: actor
    actor: ai-agent
    entities:
      - { entity: suggestion, effect: creates, to: Open, facts: [Reason, Explanation, Proposed content, Cited pages, Drafted at] }
      - { entity: page, effect: reads, facts: [Title] }
      - { entity: space, effect: reads, facts: [] }
    contexts:
      agent:
        place: wiki-agent
  - text: The page stays unchanged while the suggestion waits for the Editors of its space
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

# Suggest an update to a stale page

## Trigger

A Member's AI agent reviews a space for pages that have fallen behind.

## Outcome

An open suggestion marked Stale waits among the space's suggestions on the web,
citing the pages it relies on. The page says what it said before.

## Edge cases

- The page already has an open suggestion → the new one is refused until an Editor decides the first.
- A cited page is in another space → the suggestion is refused; a suggestion cites only pages in the space of the page it would update.
