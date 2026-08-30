---
kind: primary
routes:
  harness: Harness
steps:
  - text: The Developer asks for a scope to be verified, naming a branch, a resource, or the current product
    kind: actor
    actor: developer
    contexts:
      harness:
        place: agent-skills
  - text: The AI agent runs the structural check, then reads source and tests to confirm every availability Context, Scenario route, and Journey Step in scope
    kind: actor
    actor: ai-agent
    contexts:
      harness:
        place: agent-skills
  - text: The Product reports the scope it inspected, the contracts that hold, and the final structural check
    kind: actor
    actor: ai-agent
    contexts:
      harness:
        place: agent-skills
  - text: The report says the inspected scope is aligned, and claims nothing about the parts of the product it did not inspect
    kind: condition
    contexts:
      harness:
        place: agent-skills
---

# Report an aligned scope

## Trigger

The Developer wants to know whether the code currently supports what the model
says, after a change or before a release.

## Outcome

The Developer knows exactly which contracts were checked and that they hold.
Nothing was written, and no receipt of this run survives it.

## Edge cases

- Shared implementation between two Interfaces is never taken as evidence that both are supported; each declared Context is confirmed on its own.
