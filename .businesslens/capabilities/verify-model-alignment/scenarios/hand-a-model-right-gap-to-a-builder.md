---
kind: primary
routes:
  harness: Harness
steps:
  - text: Inspection finds approved model meaning the current code does not support
    kind: condition
    entities:
      - { entity: product-model, effect: reads, facts: [Product, Coverage, Method] }
    contexts:
      harness:
        place: agent-skills
  - text: The AI agent keeps the model unchanged and prepares the acceptance packet describing what must become true
    kind: actor
    actor: ai-agent
    entities: []
    contexts:
      harness:
        place: agent-skills
  - text: The Developer authorizes the implementation change
    kind: actor
    actor: developer
    entities: []
    contexts:
      harness:
        place: agent-skills
  - text: The AI agent implements the packet in the usual way of working, as the builder that was asked for, then inspects the scope again from source
    kind: actor
    actor: ai-agent
    entities: []
    contexts:
      harness:
        place: agent-skills
---

# Hand a model-right gap to a builder

## Trigger

The model is the side that is right, so implementation has to move.

## Outcome

The implementation was changed by the agent the Developer asked to build, under
its normal permissions, and the fresh inspection reports the result. No
BusinessLens analysis phase wrote or executed product code, and the model was
left unchanged.

## Edge cases

- If the same gap comes back unchanged after a build attempt, the run stops and reports it rather than looping.
- When the Developer implements in another tool or session, the run stops holding the complete packet instead of asking the Developer to invoke another workflow.
- A model claim the builder finds ambiguous or wrong ends the attempt and comes back as a question for the Developer; it is never settled in code.
