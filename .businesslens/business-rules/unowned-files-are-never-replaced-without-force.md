---
appliesTo:
  - type: capability
    id: install-agent-skills
  - type: capability
    id: update-agent-skills
  - type: capability
    id: open-blueprint
  - type: capability
    id: pull-blueprint
references:
  - kind: code
    role: implementation
    target: src/core/skill-installation.ts
---

# Unowned files are never replaced without force

Only artifacts BusinessLens can show it owns are overwritten. A skill directory
without a valid BusinessLens marker, and a Product Model directory that already
has content, both stop the run until the Developer says explicitly that the
replacement is intended — and where they do, the previous model is kept as a
timestamped copy rather than deleted.

## Rationale

Adoption tools are run casually, often on repositories the person running them
did not create. Refusing by default costs one flag; guessing wrong costs someone
work they cannot recover.
