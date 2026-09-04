---
kind: primary
routes:
  harness: Harness
steps:
  - text: The Developer names the behavior that should become true
    kind: actor
    actor: developer
    entities: []
    contexts:
      harness:
        place: agent-skills
  - text: The AI agent proposes concrete wording for every resource added, changed, or removed, with the acceptance contract each part would carry
    kind: actor
    actor: ai-agent
    entities:
      - { entity: product-model, effect: reads }
    contexts:
      harness:
        place: agent-skills
  - text: The Developer approves the exact delta
    kind: actor
    actor: developer
    entities: []
    contexts:
      harness:
        place: agent-skills
  - text: The Product writes only that delta, repairs the relationships it affects, and reports the structural check
    kind: product
    actor: developer
    entities:
      - { entity: product-model, effect: changes }
    contexts:
      harness:
        place: agent-skills
  - text: The acceptance contract is handed back for the build flow the harness already provides, and nothing is implemented here
    kind: condition
    entities: []
    contexts:
      harness:
        place: agent-skills
---

# Write an approved model delta

## Trigger

The Developer has decided what must become true and wants it recorded before
implementation starts.

## Outcome

The model states the intended behavior, and the Developer holds an acceptance
contract to build against. Coverage still describes model breadth and says
nothing about whether the change is built.

## Edge cases

- A small, specific change is settled with at most a handful of batched questions rather than a full pass over the model.
- A delta handed over by verification is applied as given; the decision behind it is not reopened.
- A new thing the product will keep, a new state, or a new Step is settled with what touches it and who may, so the delta never leaves a thing nothing changes or an operation nobody is allowed to perform.
