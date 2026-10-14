---
kind: primary
routes:
  harness: Harness
steps:
  - text: The Developer asks for the product, or part of it, to be implemented, having opted in to implementing with pdd-verify
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

The Developer asks for the product to be implemented, and has opted in to
implementing with pdd-verify: the skills were installed with orchestration on,
this request names pdd-verify, or the repository's agent instructions or this
request carry the sentence "Implement with pdd-verify: plan the work from
`product-model/` in phases and check each part before the next."

## Outcome

Every slice in scope is implemented and inspected aligned, or reported blocked
with the reason. The model was not edited by the implementation, and the run
ends with a structural check and the phases implemented in order.

## Edge cases

- Behavior the model describes and the code lacks needs no authority question; one is asked only where existing code contradicts the model.
- A product question raised while implementing is settled with the Developer and written to the model after approval before the remaining plan is derived again.
- With no Developer reachable, a slice that depends on an open question stops, and slices that do not depend on it continue.
- Slices not yet handed over are the plan, not findings, while a phase is inspected.
- Without the opt-in, asking to implement is the Developer's own workflow: verify does not start, and the agent may recommend a check once the work is done. An agent that reaches verify for it anyway steps aside and implements the usual way, never refusing the request.
- Once the Developer has opted in, a request to implement without pdd-verify is the Developer's own workflow for that request.
- Asked for one slice at a time or for everything in one go, the AI agent changes how much it implements before inspecting, never what it inspects.
