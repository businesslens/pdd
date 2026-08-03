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

Invoke the skills inside your coding agent, not in the terminal. For example:

```text
/businesslens-ideate guest checkout
```

```text
/businesslens-verify this branch
```

Codex commonly uses `$businesslens-ideate` and `$businesslens-verify` instead.

Ideate writes only the approved Product Model delta. Build uses your normal
plan, SDD, coding-agent, or team workflow. Verify inspects the requested scope,
resolves gaps, re-checks after changes, and runs final structural lint. See the
[`ideate`](./skill-businesslens-ideate.md) and
[`verify`](./skill-businesslens-verify.md) pages for their detailed behavior.

## Beyond the daily loop

- Use `businesslens-map` for initial adoption, deliberate Coverage expansion,
  or an established area you no longer trust. It is not a daily step.
- Use `businesslens-verify current` for an occasional whole-product audit. The
  daily loop normally uses `businesslens-verify this branch`.
