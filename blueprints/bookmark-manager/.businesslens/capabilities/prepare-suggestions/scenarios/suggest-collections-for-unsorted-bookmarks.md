---
kind: primary
routes:
  agent: Agent
steps:
  - text: The AI agent asks for the Unsorted bookmarks
    kind: actor
    actor: ai-agent
    entities:
      - { entity: bookmark, effect: reads, facts: [] }
    contexts:
      agent:
        place: bookmarks-agent
  - text: The Product provides the Unsorted bookmarks with the names of the collections and tags the library already has
    kind: product
    actor: ai-agent
    entities:
      - { entity: bookmark, effect: reads, facts: [Title, Address, Note, Tags, Imported from folder] }
      - { entity: collection, effect: reads, facts: [Name] }
      - { entity: tag, effect: reads, facts: [Name] }
    contexts:
      agent:
        place: bookmarks-agent
  - text: The AI agent leaves a filing suggestion for bookmarks that belong in an existing collection, with tags and its reason
    kind: actor
    actor: ai-agent
    entities:
      - { entity: filing-suggestion, effect: creates, to: Pending, facts: [Collection, Tags to add, Reason] }
      - { entity: bookmark, effect: reads, facts: [] }
      - { entity: collection, effect: reads, facts: [] }
      - { entity: tag, effect: reads, facts: [] }
    contexts:
      agent:
        place: bookmarks-agent
  - text: The bookmarks stay Unsorted and unchanged while the suggestion is pending
    kind: condition
    actor: ai-agent
    entities:
      - { entity: bookmark, effect: reads, facts: [] }
    contexts:
      agent:
        place: bookmarks-agent
---

# Suggest collections for Unsorted bookmarks

## Trigger

The Owner's AI agent works through the bookmarks the Owner has not filed yet.

## Outcome

A pending filing suggestion with its reason waits on the Owner's Suggestions,
and no bookmark has changed.

## Edge cases

- The suggestion repeats one the Owner declined or one still pending → it is refused, and the AI agent is told why.
- Nothing is Unsorted → the AI agent is told so, and no suggestion is left.
