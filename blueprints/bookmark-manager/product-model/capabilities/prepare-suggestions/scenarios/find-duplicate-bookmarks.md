---
kind: primary
routes:
  agent: Agent
steps:
  - text: The AI agent asks for the bookmarks in the library
    kind: actor
    actor: ai-agent
    entities:
      - { entity: bookmark, effect: reads, facts: [] }
    contexts:
      agent:
        place: bookmarks-agent
  - text: The Product provides every bookmark with its address and when it was saved
    kind: product
    actor: ai-agent
    entities:
      - { entity: bookmark, effect: reads, facts: [Title, Address, Saved at] }
    contexts:
      agent:
        place: bookmarks-agent
  - text: The AI agent leaves a duplicate suggestion for bookmarks that lead to the same page under different addresses, naming the one to keep and its reason
    kind: actor
    actor: ai-agent
    entities:
      - { entity: duplicate-suggestion, effect: creates, to: Proposed, facts: [Shared page, Kept bookmark, Reason] }
      - { entity: bookmark, effect: reads, facts: [] }
    contexts:
      agent:
        place: bookmarks-agent
  - text: Every bookmark in it stays in the library while the suggestion is proposed
    kind: condition
    actor: ai-agent
    entities:
      - { entity: bookmark, effect: reads, facts: [] }
    contexts:
      agent:
        place: bookmarks-agent
---

# Find duplicate bookmarks

## Trigger

The AI agent looks for pages the Owner has kept more than once.

## Outcome

A proposed duplicate suggestion with its reason waits on the Owner's Suggestions,
and every bookmark in it is still in the library.

## Edge cases

- The Owner dismissed the same set before → the suggestion is refused, and the AI agent is told why.
