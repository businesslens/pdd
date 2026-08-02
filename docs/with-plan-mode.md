---
title: With plan mode
description: Using BusinessLens alongside Claude Code and Codex plan mode — two approval gates, at two altitudes.
section: open-source
group: Integration
order: 17
---

# With Claude Code or Codex

Plan mode plans **the agent's next edits**. BusinessLens plans **what the
product does**. Running both gives you two approval gates, at two altitudes:

```text
/businesslens-ideate guest checkout
        → it proposes, you approve, it writes the model edit
        → commit that edit on its own

Shift-Tab into plan mode
        → the agent reads .businesslens/ and plans the implementation
        → you approve

implement

/businesslens-sync
        → a verdict per planned scenario, evidence attached
```

The first gate settles **what the product will do**. The second settles **how it
gets built**.

## Run `ideate` in normal mode, not plan mode

`businesslens-ideate` writes files, and plan mode is read-only — it will block
the write.

This is not a limitation to work around. The skill has its own
approve-before-writing step, which *is* the plan-mode experience, one altitude
up: it proposes candidate directions, you pick one, and only then does it write.

## Why the model edit gets its own commit

Commit the model edit **before** you implement, on its own.

A reviewable product delta is the entire safety property, and it disappears the
moment it is mixed into a working tree full of implementation. A reviewer
reading a 40-file pull request cannot see which two files changed what the
product does — unless those two files landed in their own commit.

## Feeding the model into plan mode

You do not have to do anything. The agent reads `.businesslens/` from the
repository like any other file, and a model authored by `businesslens-init` or
pulled from a Blueprint carries a `.businesslens/README.md` telling whatever
reads it that the model is the specification and its scenarios are the
definition of done.

That README is the only orientation file BusinessLens writes, and it lives
inside `.businesslens/`. Nothing outside that directory is ever touched — not
`AGENTS.md`, not `CLAUDE.md`, not your repository README.

## Codex

Codex users invoke skills with `$` rather than `/`:

```text
$businesslens-ideate guest checkout
$businesslens-sync
```

Everything else is identical. See [Installation](./installation.md) for
harness-specific install paths.

## Things to avoid

- **Treating plan-mode output as the spec.** It dies with the conversation. If
  it contains a decision about what the product *does*, that decision belongs in
  the model.
- **Ideating against unmapped code.** Run `businesslens-init` first — the skill
  stops and tells you. Planning against code nobody has read produces a model
  that contradicts reality on day one.
