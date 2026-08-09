---
title: Plan mode
description: Use BusinessLens for approved product meaning and plan mode for the implementation approach, then return to automatic verification.
section: open-source
group: Integrations
order: 22
---

# Use BusinessLens with Claude Code or Codex plan mode

Plan mode decides the agent's next edits. BusinessLens decides the durable
product contract.

Use plan mode for the Build step in the
[development loop](./the-loop.md): ideate the Product contract first, plan and
implement against `.businesslens/`, then verify the result.

Run ideate outside a read-only plan mode because it writes only after its own
explicit product-meaning approval. Every model creation path places orientation
in `.businesslens/README.md`; BusinessLens never edits repository `AGENTS.md`,
`CLAUDE.md`, or root README files.

Codex invocation commonly uses `$businesslens-ideate` and
`$businesslens-verify`. The workflow is otherwise the same.
