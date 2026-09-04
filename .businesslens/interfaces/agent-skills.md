---
type: agent
actors: [ai-agent, developer]
entryPoints:
  - agent: /businesslens-map
  - agent: /businesslens-ideate
  - agent: /businesslens-verify
references:
  - kind: doc
    role: context
    target: https://github.com/businesslens/pdd/blob/main/docs/skills.md
    title: Agent skills overview
---

# BusinessLens agent skills

The supported Interface inside a coding-agent harness. Three installed skills —
map, ideate, and verify — carry their own format contract and rubric, so the
agent can judge product meaning without another service. The Developer converses
through the same Interface: every change to product meaning stops at their
explicit approval before anything is written.

## Capability boundary

Everything that decides or checks what the model means: mapping behavior that is
already established, deciding behavior that is not yet built, and comparing the
recorded model against current repository behavior. It never implements product
behavior, never executes the repository, and never moves a model between
repositories — the Blueprint namespace stays in the terminal.
