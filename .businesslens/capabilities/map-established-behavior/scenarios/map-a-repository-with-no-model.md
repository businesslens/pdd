---
kind: primary
routes:
  harness: Harness
steps:
  - text: The Developer asks for the repository to be mapped
    kind: actor
    actor: developer
    contexts:
      harness:
        place: agent-skills
  - text: The AI agent reads the repository's instructions, documentation, entry points, services, persistence, integrations, configuration, and tests without running any of it
    kind: actor
    actor: ai-agent
    contexts:
      harness:
        place: agent-skills
  - text: The AI agent presents the proposed model, the areas it left unmapped, its limitations, and every judgement that could defensibly have gone the other way
    kind: actor
    actor: ai-agent
    contexts:
      harness:
        place: agent-skills
  - text: The Developer approves the proposed product meaning
    kind: actor
    actor: developer
    contexts:
      harness:
        place: agent-skills
  - text: The Product writes the complete model layout, sets coverage from the breadth it actually modeled, and reports the structural check
    kind: product
    changes:
      - entity: product-model
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
