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
    entities:
      - { entity: skill-installation, effect: creates }
    contexts:
      adoption:
        place: businesslens-cli
  - text: The Developer asks their agent to map the repository
    kind: actor
    actor: developer
    capability: map-established-behavior
    entities: []
    contexts:
      adoption:
        place: agent-skills
  - text: The AI agent captures the repository input worklist before inspecting it
    kind: actor
    actor: ai-agent
    capability: review-coverage
    entities:
      - { entity: coverage-review, effect: creates, to: Pending }
    contexts:
      adoption:
        place: businesslens-cli
  - text: The AI agent inspects established behavior without executing anything and proposes the model, its scope, exclusions, gaps and judgement calls
    kind: actor
    actor: ai-agent
    capability: map-established-behavior
    entities: []
    contexts:
      adoption:
        place: agent-skills
  - text: The Developer approves the proposed meaning, and the Product writes it
    kind: actor
    actor: developer
    capability: map-established-behavior
    entities:
      - { entity: product-model, effect: creates }
    contexts:
      adoption:
        place: agent-skills
  - text: The AI agent records conclusions for every captured file against the approved model
    kind: actor
    actor: ai-agent
    capability: review-coverage
    entities:
      - { entity: coverage-review, effect: changes, from: Pending, to: Pending }
      - { entity: product-model, effect: reads }
    contexts:
      adoption:
        place: businesslens-cli
  - text: The Developer checks the written model's structure before committing it
    kind: actor
    actor: developer
    capability: lint-product-model
    entities:
      - { entity: product-model, effect: reads }
    contexts:
      adoption:
        place: businesslens-cli
  - text: The AI agent requests completion, and the Product binds the Coverage review to the final model only when every captured input still matches
    kind: actor
    actor: ai-agent
    capability: review-coverage
    entities:
      - { entity: coverage-review, effect: changes, from: Pending, to: Completed }
      - { entity: product-model, effect: reads }
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
sound model of the behavior it already has, with its scope, explicit exclusions
and known gaps named. Its completed Coverage review accounts for the exact
inputs inspected and identifies the model they were assessed against.
