---
kind: primary
result: achieved
routes:
  adoption: Adoption
steps:
  - text: The Developer installs the BusinessLens skills for their harness
    kind: actor
    actor: developer
    capability: install-agent-skills
    contexts:
      adoption:
        place: businesslens-cli
  - text: The Developer asks their agent to map the repository
    kind: actor
    actor: developer
    capability: map-established-behavior
    contexts:
      adoption:
        place: agent-skills
  - text: The AI agent inspects established behavior without executing anything and proposes the model, its coverage, and its judgement calls
    kind: actor
    actor: ai-agent
    capability: map-established-behavior
    contexts:
      adoption:
        place: agent-skills
  - text: The Developer approves the proposed product meaning
    kind: actor
    actor: developer
    capability: map-established-behavior
    contexts:
      adoption:
        place: agent-skills
  - text: The Developer checks the written model's structure before committing it
    kind: actor
    actor: developer
    capability: lint-product-model
    contexts:
      adoption:
        place: businesslens-cli
---

# Map an existing repository

## Trigger

A repository already has product behavior and nowhere that says what it is meant
to be.

## Outcome

The Journey goal is achieved: the repository holds an approved, structurally
sound model of the behavior it already has, with its unmapped areas named.
