---
kind: edge
result: achieved
routes:
  greenfield: Greenfield
steps:
  - text: The Developer installs the BusinessLens skills for their harness
    kind: actor
    actor: developer
    capability: install-agent-skills
    entities:
      - { entity: skill-installation, effect: creates }
    contexts:
      greenfield:
        place: businesslens-cli
  - text: The Developer asks their agent to decide what it should do
    kind: actor
    actor: developer
    capability: decide-intended-behavior
    entities: []
    contexts:
      greenfield:
        place: agent-skills
  - text: The AI agent proposes directions, then drafts the exact model that follows from the one chosen
    kind: actor
    actor: ai-agent
    capability: decide-intended-behavior
    entities: []
    contexts:
      greenfield:
        place: agent-skills
  - text: The Developer approves the delta and the Product writes it
    kind: actor
    actor: developer
    capability: decide-intended-behavior
    entities:
      - { entity: product-model, effect: creates }
    contexts:
      greenfield:
        place: agent-skills
  - text: The Developer checks the written model's structure
    kind: actor
    actor: developer
    capability: lint-product-model
    entities:
      - { entity: product-model, effect: reads }
    contexts:
      greenfield:
        place: businesslens-cli
---

# Decide a new product

## Trigger

There is an idea and no implementation, and the team wants the product agreed
before anything is built.

## Outcome

The Journey goal is achieved: the repository holds an approved model of intended
behavior, and an acceptance contract to build against. Nothing was implemented.
