---
appliesTo:
  - type: capability
    id: map-established-behavior
  - type: capability
    id: decide-intended-behavior
  - type: capability
    id: verify-model-alignment
---

# Target code is never executed

No BusinessLens analysis runs the repository it is looking at: not its
application, builds, migrations, generators, package scripts, or tests. Source
and tests are read. Where a change to implementation is needed, it is handed to
a builder the harness supplies, which runs under its own permissions and is not
a BusinessLens workflow.

## Rationale

A repository being analyzed is untrusted by construction — that is the whole
reason someone is analyzing it. Reading is safe on any repository; running is
safe only on ones already trusted, which would make the workflow useless exactly
where it matters most.
