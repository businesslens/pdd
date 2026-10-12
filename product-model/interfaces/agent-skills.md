---
type: agent
actors: [ai-agent, developer]
entryPoints:
  - agent: /pdd-map
  - agent: /pdd-ideate
  - agent: /pdd-verify
references:
  - kind: doc
    role: context
    target: https://github.com/itai-gendler/pdd-kit/blob/main/docs/skills.md
    title: Agent skills overview
---

# pdd-kit agent skills

The supported Interface inside a coding-agent harness. Three installed skills —
map, ideate, and verify — carry their own format contract and rubric, so the
agent can judge product meaning without another service. The Developer converses
through the same Interface: every change to product meaning stops at their
explicit approval before anything is written.
