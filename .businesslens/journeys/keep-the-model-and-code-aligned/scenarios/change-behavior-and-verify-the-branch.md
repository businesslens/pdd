---
kind: primary
result: achieved
routes:
  branch: Branch
steps:
  - text: The Developer asks their agent to plan the behavior change
    kind: actor
    actor: developer
    capability: decide-intended-behavior
    entities: []
    contexts:
      branch:
        place: agent-skills
  - text: The AI agent proposes the exact model delta and the acceptance each Capability would carry
    kind: actor
    actor: ai-agent
    capability: decide-intended-behavior
    entities:
      - { entity: product-model, effect: reads }
      - { entity: capability, effect: reads }
    contexts:
      branch:
        place: agent-skills
  - text: The Developer approves the delta, and the Product writes only that meaning
    kind: actor
    actor: developer
    capability: decide-intended-behavior
    entities:
      - { entity: product-model, effect: changes }
    contexts:
      branch:
        place: agent-skills
  - text: The change is implemented through the plan, specification, or build flow the harness already provides, outside BusinessLens
    kind: condition
    entities: []
    contexts:
      branch:
        place: agent-skills
  - text: The Developer asks for the branch to be verified
    kind: actor
    actor: developer
    capability: verify-model-alignment
    entities: []
    contexts:
      branch:
        place: agent-skills
  - text: The AI agent inspects the changed surface, finds the model's contract supported, and reports the scope and the final structural check
    kind: actor
    actor: ai-agent
    capability: verify-model-alignment
    entities:
      - { entity: product-model, effect: reads }
    contexts:
      branch:
        place: agent-skills
---

# Change behavior and verify the branch

## Trigger

A product change is starting, and the team wants it to land with intent and
implementation agreeing.

## Outcome

The Journey goal is achieved: the branch's model meaning was approved before the
work, the implementation supports it, and the run says which scope that claim
covers.
