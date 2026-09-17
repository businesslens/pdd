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
  - text: The Product captures an exact repository worklist before inspection
    kind: product
    entities: [{ entity: coverage-review, effect: creates, to: Pending }]
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
  - text: The AI agent presents the proposed model, its declared scope, explicit exclusions, known unmapped behavior, limitations, and every judgement that could defensibly have gone the other way
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
  - text: The AI agent records conclusions for every captured file against the authored model
    kind: actor
    actor: ai-agent
    entities:
      - { entity: coverage-review, effect: changes, from: Pending, to: Pending }
      - { entity: product-model, effect: reads }
    contexts:
      harness:
        place: agent-skills
  - text: The Product completes the Coverage review only after checking every input still matches and the final Product Model is structurally sound
    kind: product
    entities:
      - { entity: coverage-review, effect: changes, from: Pending, to: Completed }
      - { entity: product-model, effect: reads }
    contexts:
      harness:
        place: agent-skills
---

# Map a repository with no model

## Trigger

A repository with established code and no `.businesslens/` needs one.

## Outcome

The repository holds an approved Product Model whose coverage states what was
modeled, its approved exclusions and remaining gaps. Local repository accounting
is saved in the shared Coverage document; only unfinished work stays local. The repository was never executed.

## Edge cases

- A repository with neither a model nor meaningful implementation is a decision to make, not behavior to map.
- Documentation is treated as a lead; a claim it makes is confirmed against implementation before it enters the model.
- What each observable act does to the things the repository keeps is named on its Step — created, changed with the states it leaves and lands in, removed, or read — so a thing with no Step touching it is a finding, not a silence.
- An authorization check in the code becomes a grant on a Business Rule, never a sentence inside a Scenario.
- Whole-repository mapping captures an exact input worklist, accounts for every file and completes a Coverage review only against unchanged source inputs and a structurally valid final model.
