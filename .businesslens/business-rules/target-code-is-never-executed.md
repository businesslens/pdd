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
    target: AGENTS.md
    title: Skill-writing standards
  - kind: doc
    role: context
    target: skills/businesslens-verify/SKILL.md
---

# Target code is never executed

No BusinessLens analysis runs the repository it is looking at: not its
application, builds, migrations, generators, package scripts, or tests. Source
and tests are read. Where a change to implementation is needed, the agent the
Developer asked to implement makes it the Developer's usual way, under its normal
permissions; that implementation is the Developer's workflow, not a BusinessLens
analysis, and the inspection that follows reads source again.

## Rationale

A repository being analyzed is untrusted by construction — that is the whole
reason someone is analyzing it. Reading is safe on any repository; running is
safe only on ones already trusted, which would make the workflow useless exactly
where it matters most.
