---
kind: primary
routes:
  agent: Agent
steps:
  - text: The AI agent asks for what is waiting in the inbox
    kind: actor
    actor: ai-agent
    entities: []
    contexts:
      agent:
        place: notes-agent
  - text: The Product confirms that the Owner allows assistant access
    kind: product
    actor: ai-agent
    entities:
      - { entity: owner, effect: reads, facts: [Assistant access] }
    contexts:
      agent:
        place: notes-agent
  - text: The Product provides the unsorted notes, the notebook names and the tag names
    kind: product
    actor: ai-agent
    entities:
      - { entity: note, effect: reads, facts: [Title, Body, Created at] }
      - { entity: notebook, effect: reads, facts: [Name] }
      - { entity: tag, effect: reads, facts: [Name] }
    contexts:
      agent:
        place: notes-agent
  - text: The AI agent leaves a suggestion for one note naming an existing notebook, tags and its reason
    kind: actor
    actor: ai-agent
    entities:
      - { entity: suggestion, effect: creates, to: Pending, facts: [Suggested notebook, Suggested tags, Reason, Suggested at] }
      - { entity: note, effect: reads, facts: [] }
      - { entity: notebook, effect: reads, facts: [] }
      - { entity: tag, effect: reads, facts: [] }
    contexts:
      agent:
        place: notes-agent
  - text: The note stays unsorted and unchanged while the suggestion is pending
    kind: condition
    actor: ai-agent
    entities:
      - { entity: note, effect: reads, facts: [] }
      - { entity: suggestion, effect: reads, facts: [] }
    contexts:
      agent:
        place: notes-agent
---

# Suggest where to file an inbox note

## Trigger

The AI agent works through the Owner's inbox while the Owner allows it.

## Outcome

A pending suggestion proposes a notebook and tags for the note, with a reason,
and waits on the Owner's suggestion list; the note itself is unchanged.

## Edge cases

- The note already has a pending suggestion → the new one is refused until the Owner decides the first.
- The suggestion names a notebook the Owner does not have → it is refused; the AI agent may propose new tags but never a new notebook.
