---
kind: primary
routes:
  harness: Harness
steps:
  - text: The Developer asks for the repository to be mapped
    kind: actor
    actor: developer
    entities: []
    contexts:
      harness:
        place: agent-skills
  - text: The AI agent reads the repository's instructions, documentation, entry points, services, persistence, integrations, configuration, and tests without running any of it
    kind: actor
    actor: ai-agent
    entities: []
    contexts:
      harness:
        place: agent-skills
  - text: The AI agent presents the proposed model, the areas it left unmapped, its limitations, and every judgement that could defensibly have gone the other way
    kind: actor
    actor: ai-agent
    entities: []
    contexts:
      harness:
        place: agent-skills
  - text: The Developer approves the proposed meaning
    kind: actor
    actor: developer
    entities: []
    contexts:
      harness:
        place: agent-skills
  - text: The Product writes the complete model layout, sets coverage from the breadth it actually modeled, and reports the structural check
    kind: product
    actor: developer
    entities:
      - { entity: product-model, effect: creates }
    contexts:
      harness:
        place: agent-skills
---

# Map a repository with no model

## Trigger

A repository with established code and no `.businesslens/` needs one.

## Outcome

The repository holds an approved Product Model whose coverage states what was
modeled and names what was not. Nothing outside `.businesslens/` was written and
the repository was never executed.

## Edge cases

- A repository with neither a model nor meaningful implementation is a decision to make, not behavior to map.
- Documentation is treated as a lead; a claim it makes is confirmed against implementation before it enters the model.
- What each observable act does to the things the repository keeps is named on its Step — created, changed with the states it leaves and lands in, removed, or read — so a thing with no Step touching it is a finding, not a silence.
- An authorization check in the code becomes a grant on a Business Rule, never a sentence inside a Scenario.
