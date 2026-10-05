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
  - text: The AI agent leaves a filing suggestion naming a collection the library does not have yet, with tags and its reason
    kind: actor
    actor: ai-agent
    entities:
      - { entity: filing-suggestion, effect: creates, to: Pending, facts: [Collection, Tags to add, Reason] }
      - { entity: collection, effect: reads, facts: [] }
      - { entity: tag, effect: reads, facts: [] }
    contexts:
      agent:
        place: bookmarks-agent
  - text: No collection is created while the suggestion is pending
    kind: condition
    actor: ai-agent
    entities:
      - { entity: collection, effect: reads, facts: [] }
    contexts:
      agent:
        place: bookmarks-agent
---

# Propose a new collection

## Trigger

The AI agent finds Unsorted bookmarks on a subject no existing collection fits.

## Outcome

A pending filing suggestion proposes the new collection by name, with its
reason, and the library has no new collection until the Owner accepts it.
