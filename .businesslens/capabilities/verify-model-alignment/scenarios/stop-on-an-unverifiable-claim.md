---
kind: edge
routes:
  harness: Harness
steps:
  - text: A claim in scope depends on runtime behavior or an external system that reading source cannot settle
    kind: condition
    contexts:
      harness:
        place: agent-skills
  - text: The AI agent states precisely which evidence is missing and what would resolve it
    kind: actor
    actor: ai-agent
    contexts:
      harness:
        place: agent-skills
  - text: The AI agent marks that scope blocked rather than guessing, and reports the rest of the run normally
    kind: actor
    actor: ai-agent
    contexts:
      harness:
        place: agent-skills
---

# Stop on an unverifiable claim

## Trigger

Verification reaches a claim that source inspection cannot establish safely.

## Outcome

The Developer knows exactly what could not be checked and why. No confident
verdict was invented, and the rest of the inspected scope was still reported.
