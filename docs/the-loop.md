---
title: Development loop
description: Ideate intended behavior, build through your own flow, and invoke verify once before starting the next change.
section: open-source
group: Get started
order: 6
---

# Ideate, build, verify

After your Product Model exists, use the same loop for every product change:

```text
ideate → build → verify
   ▲                 │
   └── next change ──┘
```

| Step | What happens | What to use |
| --- | --- | --- |
| Ideate | Decide what must be true and approve the Product Model change. | `businesslens-ideate` |
| Build | Implement against the approved model. | Your own plan/build flow |
| Verify | Check that the model and code agree. | `businesslens-verify this branch` |

Ideate and Verify are BusinessLens skills. Build is deliberately yours:
BusinessLens does not provide or replace your plan mode, SDD framework, coding
agent, or team workflow.

Invoke skills inside your coding agent, not in the terminal. Claude Code uses
`/businesslens-ideate`; Codex commonly uses `$businesslens-ideate`. The same
prefix convention applies to `businesslens-verify`.

## 1. Ideate

Use `businesslens-ideate` when intended behavior changes:

```text
/businesslens-ideate guest checkout
```

Ideate decides the observable outcome, drafts the exact Product Model delta,
and waits for approval before writing. The approved model is intentionally
ahead of the code during the build phase.

## 2. Build

Use your normal implementation workflow. Build against the approved Scenarios,
Rules, and other Product Model meaning; BusinessLens does not prescribe how you
plan or change the code.

## 3. Verify

After implementation, invoke `businesslens-verify` once:

```text
/businesslens-verify this branch
```

Verify compares the changed code with the Product Model, resolves scoped gaps,
checks again after any change, and runs final structural lint. It finishes
aligned or with a precise blocker. You do not invoke another BusinessLens skill
to complete the loop.

## How Verify closes gaps

The everyday loop above is all you need to remember. Internally, Verify runs a
smaller automatic loop:

```text
inspect → resolve one gap
   ▲             │
   └── re-check ──┘
```

- If the model is right, Verify sends the approved acceptance packet to the
  builder supplied by your coding harness.
- If intended behavior changed, Verify drafts the smallest model delta and asks
  for approval before writing it.
- If an established area is absent or untrusted, Verify maps only that area.
- If the source cannot establish the answer, or the same build-directed gap
  returns unchanged, Verify stops with an explicit blocker.

The user still owns product decisions and authorization to change code. Verify
owns the routing and the return to inspection.

## Beyond the daily loop

1. **Initial adoption:** Use `businesslens-map` to create a Product Model from
   an established codebase.
2. **Later mapping:** Map is not limited to initial adoption. Use
   `businesslens-map` again for deliberate coverage expansion or when an
   established area can no longer be trusted. It is not a daily step.
3. **Whole-codebase verification:** Use `businesslens-verify current` for an
   occasional full audit, such as before a release, after a broad refactor, or
   when you suspect drift. The daily change loop normally uses
   `businesslens-verify this branch`.
