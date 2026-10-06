---
kind: edge
result: not-achieved
routes:
  branch: Branch
steps:
  - text: The Developer asks for the branch to be verified
    kind: actor
    actor: developer
    capability: verify-model-alignment
    entities: []
    contexts:
      branch:
        place: agent-skills
  - text: The AI agent finds approved model meaning the code does not support and prepares the acceptance packet
    kind: actor
    actor: ai-agent
    capability: verify-model-alignment
    entities:
      - { entity: product-model, effect: reads, facts: [Product, Coverage, Method] }
    contexts:
      branch:
        place: agent-skills
  - text: Implementation is to happen in another tool or session
    kind: condition
    entities: []
    contexts:
      branch:
        place: agent-skills
  - text: The Product stops holding the complete packet and reports the scope as blocked
    kind: product
    entities: []
    contexts:
      branch:
        place: agent-skills
---

# Stop when the Developer implements elsewhere

## Trigger

Verification reaches a gap that only an implementation change can close, and
the Developer will make it in another tool or session.

## Outcome

The Journey goal is not achieved in this run. Nothing was implemented from
inside a BusinessLens phase, the model was left unchanged, and the Developer
holds everything their own tool needs to build it.
