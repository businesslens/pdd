---
kind: primary
routes:
  harness: Harness
steps:
  - text: The Developer asks for the product, or part of it, to be built from the model
    kind: actor
    actor: developer
    entities: []
    contexts:
      harness:
        place: agent-skills
  - text: The AI agent finds what the model describes that the code does not do yet and orders it into slices
    kind: actor
    actor: ai-agent
    entities:
      - { entity: product-model, effect: reads, facts: [Product, Coverage, Method] }
    contexts:
      harness:
        place: agent-skills
  - text: The AI agent implements one slice in the usual way of working, then inspects that slice again from source
    kind: actor
    actor: ai-agent
    entities: []
    contexts:
      harness:
        place: agent-skills
  - text: The AI agent moves to the next slice once the inspected slice is aligned
    kind: actor
    actor: ai-agent
    entities: []
    contexts:
      harness:
        place: agent-skills
---

# Build the model slice by slice

## Trigger

The Developer asks for the product to be built from the model, without naming
any workflow.

## Outcome

Every slice in scope is built and inspected aligned, or reported blocked with
the reason. The model was not edited by the build, and the run ends with a
structural check and the slices built in order.

## Edge cases

- Behavior the model describes and the code lacks needs no authority question; one is asked only where existing code contradicts the model.
- A product question raised while building is settled with the Developer and written to the model after approval before the remaining plan is derived again.
- With no Developer reachable, a slice that depends on an open question stops, and slices that do not depend on it continue.
- Later slices are the plan, not findings, while an earlier slice is inspected.
