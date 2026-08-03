---
title: With plan mode
description: Use BusinessLens for approved product meaning and plan mode for the implementation approach, then return to automatic verification.
section: open-source
group: Integration
order: 20
---

# With Claude Code or Codex plan mode

Plan mode decides the agent's next edits. BusinessLens decides the durable
product contract.

```text
/businesslens-ideate guest checkout
        → approve and write the Product Model delta

plan mode
        → read .businesslens/ and approve the implementation approach

build

/businesslens-verify
        → inspect, resolve gaps through the injected builder, re-check
```

Run ideate outside a read-only plan mode because it writes only after its own
explicit product-meaning approval. Every model creation path places orientation
in `.businesslens/README.md`; BusinessLens never edits repository `AGENTS.md`,
`CLAUDE.md`, or root README files.

Codex invocation commonly uses `$businesslens-ideate` and
`$businesslens-verify`. The workflow is otherwise the same.
