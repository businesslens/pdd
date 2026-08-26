---
kind: primary
routes:
  harness: Harness
steps:
  - text: Inspection finds approved model meaning the current code does not support
    kind: condition
    contexts:
      harness:
        place: agent-skills
  - text: The AI agent keeps the model unchanged and prepares the acceptance packet describing what must become true
    kind: actor
    actor: ai-agent
    contexts:
      harness:
        place: agent-skills
  - text: The Developer authorizes the implementation change
    kind: actor
    actor: developer
    contexts:
      harness:
        place: agent-skills
  - text: The Product hands the packet to the builder the harness supplies and inspects the scope again once it returns
    kind: product
    contexts:
      harness:
        place: agent-skills
---

# Hand a model-right gap to a builder

## Trigger

The model is the side that is right, so implementation has to move.

## Outcome

The implementation was changed by the harness's own builder under its own
permissions, and the fresh inspection reports the result. No BusinessLens phase
wrote or executed product code.

## Edge cases

- If the same gap comes back unchanged after a build attempt, the run stops and reports it rather than looping.
- With no builder available, the run stops holding the complete packet instead of asking the Developer to invoke another workflow.
