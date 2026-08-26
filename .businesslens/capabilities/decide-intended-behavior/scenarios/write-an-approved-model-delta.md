---
kind: primary
routes:
  harness: Harness
steps:
  - text: The Developer names the behavior the product should have
    kind: actor
    actor: developer
    contexts:
      harness:
        place: agent-skills
  - text: The AI agent proposes concrete wording for every entity added, changed, or removed, with the acceptance each Capability and Journey would carry
    kind: actor
    actor: ai-agent
    contexts:
      harness:
        place: agent-skills
  - text: The Developer approves the exact delta
    kind: actor
    actor: developer
    contexts:
      harness:
        place: agent-skills
  - text: The Product writes only that delta, repairs the relationships it affects, and reports the structural check
    kind: product
    contexts:
      harness:
        place: agent-skills
  - text: The acceptance contract is handed back for the Developer's own build flow, and nothing is implemented here
    kind: condition
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
