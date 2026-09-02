---
domain: agent-enablement
references:
  - kind: code
    role: implementation
    target: src/core/skill-installation.ts
  - kind: doc
    role: context
    target: docs/installation.md
---

# Skill installation

One place a supported coding-agent harness loads the BusinessLens skills from,
together with the marker that says BusinessLens put them there. The marker is
what makes an installation recognizable again: without a valid one, a directory
carrying a skill's name is somebody else's, and the Product leaves it alone.

## Information kept

- **Provider** — the harness the skills were installed into
- **Scope** — whether it sits in the repository or in the Developer's own configuration
- **Version** — the BusinessLens command that wrote it, which an update brings current
- **Skills** — the names of the skills it holds, so a retired one can be removed
- **Installed at** — when it was first written, kept across every refresh
