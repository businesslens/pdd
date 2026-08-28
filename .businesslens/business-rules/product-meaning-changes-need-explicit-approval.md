---
appliesTo:
  - type: capability
    id: map-established-behavior
  - type: capability
    id: decide-intended-behavior
  - type: capability
    id: verify-model-alignment
references:
  - kind: doc
    role: intent
    target: skills/businesslens-map/SKILL.md
    title: Present the proposed model delta before writing
---

# Product meaning changes need explicit approval

No workflow writes product meaning until the Developer has seen the exact delta —
every entity added, changed, or removed, the limitations, and the material
uncertainty — and approved it. A proposal is never presented as a decision, and
a mature model is never silently replaced.

## Rationale

The model is the durable statement of what a product is for, and an agent's
reading of a repository is evidence, not authority. A reviewer can see what a
model says but not what it leaves out, so the judgements that could defensibly
have gone the other way are stated with the delta; otherwise approval is a
formality rather than a check.
