---
kind: primary
routes:
  harness: Harness
steps:
  - text: The Developer asks for the product, or part of it, to be implemented from the model
    kind: actor
    actor: developer
    entities: []
    contexts:
      harness:
        place: agent-skills
  - text: The AI agent finds what the model describes that the code does not do yet and groups its slices into phases
    kind: actor
    actor: ai-agent
    entities:
      - { entity: product-model, effect: reads, facts: [Product, Coverage, Method] }
    contexts:
      harness:
        place: agent-skills
  - text: The AI agent implements one phase in the usual way of working, then inspects each of its slices again from source
    kind: actor
    actor: ai-agent
    entities: []
    contexts:
      harness:
        place: agent-skills
  - text: The AI agent moves to the next phase once every inspected slice is aligned
    kind: actor
    actor: ai-agent
    entities: []
    contexts:
      harness:
        place: agent-skills
---

# Implement the model in phases

## Trigger

The Developer asks for the product to be implemented from the model, without
naming any workflow.

## Outcome

Every slice in scope is implemented and inspected aligned, or reported blocked
with the reason. The model was not edited by the implementation, and the run
ends with a structural check and the phases implemented in order.

## Edge cases

- Behavior the model describes and the code lacks needs no authority question; one is asked only where existing code contradicts the model.
- A product question raised while implementing is settled with the Developer and written to the model after approval before the remaining plan is derived again.
- With no Developer reachable, a slice that depends on an open question stops, and slices that do not depend on it continue.
- Slices not yet handed over are the plan, not findings, while a phase is inspected.
- Asked for one slice at a time or for everything in one go, the AI agent changes how much it implements before inspecting, never what it inspects.
