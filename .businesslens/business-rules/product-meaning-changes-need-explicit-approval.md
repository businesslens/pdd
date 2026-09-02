---
appliesTo:
  - type: entity
    id: product-model
    effect: creates
  - type: entity
    id: product-model
    effect: changes
  - type: entity
    id: product-model
    effect: removes
permits:
  - actors: [developer]
references:
  - kind: doc
    role: intent
    target: skills/businesslens-map/SKILL.md
    title: Present the proposed model delta before writing
---

# Product meaning changes need explicit approval

A Product Model is created, changed, or replaced only by the Developer: by
approving the exact delta a workflow proposes — every resource added, changed,
or removed, the limitations, and the material uncertainty — or by asking, by
name, for a Blueprint to land in a directory. The AI agent holds no grant of its
own. A proposal is never presented as a decision, and a mature model is never
silently replaced.

## Rationale

The model is the durable statement of what a product is for, and an agent's
reading of a repository is evidence, not authority. A reviewer can see what a
model says but not what it leaves out, so the judgements that could defensibly
have gone the other way are stated with the delta; otherwise approval is a
formality rather than a check. Saying who may write it as a grant, rather than
as a sentence in each Scenario, is what lets the structural check refuse a
Scenario in which anyone else does.
