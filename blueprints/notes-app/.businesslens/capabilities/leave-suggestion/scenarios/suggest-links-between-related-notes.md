---
kind: primary
routes:
  agent: Agent
steps:
  - text: The AI agent asks for a note and the notes around it
    kind: actor
    actor: ai-agent
    entities: 
      - { entity: note, as: subject, effect: reads, facts: [] }
    contexts:
      agent:
        place: notes-agent
  - text: The Product provides the note and the other notes it asked for
    kind: product
    actor: ai-agent
    entities:
      - { entity: note, as: subject, effect: reads, facts: [Title, Body, Linked notes] }
      - { entity: note, as: related, effect: reads, facts: [Title, Body] }
    contexts:
      agent:
        place: notes-agent
  - text: The AI agent leaves a suggestion to link the note to related notes it does not link to yet, with its reason
    kind: actor
    actor: ai-agent
    entities:
      - { entity: suggestion, effect: creates, to: Proposed, facts: [Suggested links, Reason, Suggested at] }
      - { entity: note, as: subject, effect: reads, facts: [] }
      - { entity: note, as: related, effect: reads, facts: [] }
    contexts:
      agent:
        place: notes-agent
  - text: Neither note changes while the suggestion is proposed
    kind: condition
    actor: ai-agent
    entities:
      - { entity: note, as: subject, effect: reads, facts: [] }
      - { entity: note, as: related, effect: reads, facts: [] }
      - { entity: suggestion, effect: reads, facts: [] }
    contexts:
      agent:
        place: notes-agent
---

# Suggest links between related notes

## Trigger

The AI agent finds notes that are about the same thing but do not link to each
other.

## Outcome

A suggestion proposes the links, with a reason, and waits on the
Owner's suggestion list; no note is changed.
