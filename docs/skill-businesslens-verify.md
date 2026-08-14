---
title: verify
description: Inspect model/code alignment and automatically resolve every scoped gap until aligned or explicitly blocked.
section: open-source
group: Skills
order: 26
---

# `businesslens-verify`

Use Verify after implementation, after a refactor, when drift is suspected,
before release, or for a named or full current-state audit.

```text
/businesslens-verify this branch
/businesslens-verify current
/businesslens-verify checkout
/businesslens-verify report only
```

Verify lints structure, independently traces each declared availability scope,
Capability Scenario, and Journey Scenario flow entry without executing target
code, and classifies aligned, model-right, code-right, neither-right, unmapped,
and unverifiable cases. It groups root decisions and recommends an authority.

## Scope

- `verify this branch` uses Git changes to choose likely work. It includes
  model and code additions, edits, deletions, staged files, and working-tree
  changes.
- `verify current` or `verify full` inspects present behavior without needing a
  merge base or diff.
- `verify <named scope>` inspects one Actor, Interface, Experience, Screen,
  Domain, Capability, Capability Scenario, Journey, Journey Scenario,
  availability scope, flow entry, or path plus its necessary dependencies.

Git is a scope tool, never an authority tool. A model committed on the default
branch can still be the approved plan for code added later.

## Automatic resolution

In resolution mode, Verify automatically runs the next bounded phase:

- approved code correction through the builder injected by your harness;
- an approved narrow model delta;
- intent negotiation followed by model and code changes;
- scoped mapping of established absent behavior.

It re-derives findings after every change. An unchanged recurring gap stops the
loop, and a missing builder produces a complete handoff packet. The user never
has to manually invoke Map or Ideate to continue verification. Verify persists
no receipt, ledger, or lifecycle state.

## Allowed changes

The semantic inspection changes nothing. Automatic resolution may:

- write product meaning only after the user approves an exact delta;
- delegate implementation to an injected builder under its own repository
  permissions;
- refresh optional implementation References after alignment as navigation
  bookkeeping.

BusinessLens analysis phases never execute target code. The injected builder
may run the project's normal checks, but must not edit `.businesslens/`.

## Read-only reporting

`businesslens-verify report only` disables model writes, builder delegation,
and Reference refresh. It returns the same classified findings and
recommendations without mutations.

Verify runs final structural lint before it finishes. A green standalone lint
result checks the model's format; only Verify establishes semantic alignment for
the inspected scope.
