---
entities:
  - product-model
domain: model-authoring
availability: [{ place: agent-skills }]
references:
  - kind: doc
    role: implementation
    target: https://github.com/businesslens/pdd/blob/main/skills/businesslens-map/SKILL.md
    title: businesslens-map
---

# Map established behavior

Builds a Product Model from what a repository already does. The agent reads the
repository's instructions, documentation, entry points, handlers, persistence,
integrations, configuration, and tests, traces observable behavior end to end,
and proposes the Actors, Interfaces, Capabilities, Scenarios, rules, and
coverage that the evidence supports.

## Intent

Adoption should start from an honest account of the present, not an aspirational
one. This is for taking on a repository that has no model, for an area the team
has decided to stop trusting, and for widening coverage on purpose — not for
asking whether an already-mapped area is still current, and not for deciding
behavior that does not exist yet.
