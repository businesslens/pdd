---
kind: primary
routes:
  agent: Agent
steps:
  - text: The AI agent asks for the bookmarks the latest import added
    kind: actor
    actor: ai-agent
    entities:
      - { entity: bookmark, effect: reads, facts: [] }
    contexts:
      agent:
        place: bookmarks-agent
  - text: The Product provides those bookmarks with the browser folders they came from and the collections and tags already kept
    kind: product
    actor: ai-agent
    entities:
      - { entity: bookmark, effect: reads, facts: [Title, Address, Saved at, Imported from folder] }
      - { entity: collection, effect: reads, facts: [Name] }
      - { entity: tag, effect: reads, facts: [Name] }
    contexts:
      agent:
        place: bookmarks-agent
  - text: The AI agent leaves a filing suggestion for each group of imported bookmarks, usually following their browser folder, with its reason
    kind: actor
    actor: ai-agent
    entities:
      - { entity: filing-suggestion, effect: creates, to: Proposed, facts: [Collection, Tags to add, Reason] }
      - { entity: bookmark, effect: reads, facts: [] }
    contexts:
      agent:
        place: bookmarks-agent
  - text: The imported bookmarks stay Unsorted while the suggestions are proposed
    kind: condition
    actor: ai-agent
    entities:
      - { entity: bookmark, effect: reads, facts: [] }
    contexts:
      agent:
        place: bookmarks-agent
---

# Classify imported bookmarks

## Trigger

The Owner has imported their browser's bookmarks and their AI agent sets about
filing them.

## Outcome

Proposed filing suggestions cover the imported bookmarks, each with its reason,
and the imported bookmarks are still Unsorted.
