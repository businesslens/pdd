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
    contexts:
      branch:
        place: agent-skills
  - text: The AI agent finds approved model meaning the code does not support and prepares the acceptance packet
    kind: actor
    actor: ai-agent
    capability: verify-model-alignment
    contexts:
      branch:
        place: agent-skills
  - text: The harness supplies no builder that may change implementation
    kind: condition
    contexts:
      branch:
        place: agent-skills
  - text: The Product stops holding the complete packet and reports the scope as blocked
    kind: product
    contexts:
      branch:
        place: agent-skills
---

# Stop without a builder

## Trigger

Verification reaches a gap that only an implementation change can close, in a
session with nothing authorized to make one.

## Outcome

The Journey goal is not achieved. Nothing was implemented from inside a
BusinessLens phase, the model was left unchanged, and the Developer holds
everything a builder would need.
