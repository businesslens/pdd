---
title: How it fits
description: Where BusinessLens sits next to your harness's plan mode and your spec-driven framework — three layers, three lifetimes, and when each one fires.
section: open-source
group: Concepts
order: 9
---

# How BusinessLens fits what you already use

You almost certainly already plan. Claude Code and Codex have a plan mode; you
may run OpenSpec or spec-kit on top. BusinessLens does not replace either. It
sits above both, and the difference is **how long the artifact lives**.

| Layer | Artifact | Answers | Lives |
| --- | --- | --- | --- |
| **Product** | `.businesslens/` | What the product does, for whom, proven where | As long as the product |
| **Change** | OpenSpec / spec-kit proposal | How this change is designed and split up | Until it lands, then archived |
| **Session** | Your harness's plan mode | What the agent types next | Dies with the conversation |

Each layer narrows the one above it. That is the whole relationship.

The practical consequence: **plan mode has no durable memory of what your
product does.** It re-derives your product from the code every session, and the
product decisions you make inside it evaporate when the conversation ends. The
Product Model is what gives it a memory. BusinessLens is an *input* to plan
mode, not a competitor to it.

## Which skill, by which side moved

Three skills carry the loop, separated by one question — **which side is the
source of truth for this edit?**

| Skill | Source of truth | What you end up with |
| --- | --- | --- |
| [`businesslens-init`](./skill-businesslens-init.md) | The code (there is no model yet) | A model describing today |
| [`businesslens-ideate`](./skill-businesslens-ideate.md) | **Your intent** | A model running ahead of the code, on purpose |
| [`businesslens-sync`](./skill-businesslens-sync.md) | The code | A model caught up to what got built |

Shortest form: **`ideate` is where you decide. `sync` is where you settle up.**

## With Claude Code or Codex

Two approval gates, at two altitudes:

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

The first gate settles what the product will do. The second settles how it gets
built. `businesslens-ideate` writes files, so run it in normal mode — plan mode
is read-only and will block the write. Its own approve-before-writing step is
the plan-mode experience, one altitude up.

(Codex users invoke skills as `$businesslens-ideate`.)

## With a spec-driven framework

```text
/businesslens-ideate guest checkout    → the product delta, in the model
openspec / spec-kit change             → the technical proposal, citing journey IDs
implement
/businesslens-sync                     → verdicts and evidence
archive the SDD change                 → the model stays
```

The SDD change is transient and the model is durable, which is why the citation
runs one way: proposals name the journeys they affect, and the model links back
with `links:` rather than copying spec content. See
[PDD ♥ SDD](./pdd-and-sdd.md) for the full borderline.

## With neither

Skip the middle row. `ideate` → implement however you like → `sync`. Nothing in
BusinessLens requires a framework.

## Does this change need a model edit at all?

One test: **if a user could notice the difference and describe it without
mentioning code, the model changes. Otherwise it does not.**

| Change | Model edit? |
| --- | --- |
| New capability, changed rule, new surface, retired journey | **Yes** |
| A bug fix where the documented behavior was itself wrong | **Yes** |
| Refactor, rename, file move, perf work, dependency bump | No — `validate` catches the stale `codeRefs` and `sync` repairs them |
| A bug fix restoring behavior the model already describes | No — the model was already right; `sync` repairs the evidence |

Most commits are in the bottom half. BusinessLens is not meant to be a tax on
every one of them.

## The default, and the escape hatch

The default is **ideate before you build**, because the scenarios you write
become the acceptance criteria your coding agent is held to and `sync` checks
against afterward. That is the payoff, and it is why the docs lead with it.

But you can always skip it. Build first, then run `sync` — it reads the diff,
works out what the code became, and brings you the model edit one decision at a
time. Nothing breaks and no state is invalid.

The honest tradeoff, per change rather than per team: ideate-first is faster for
anything non-obvious, because otherwise `sync` has to infer your intent from a
diff and will ask you more questions. Sync-first is faster for small or obvious
changes.

## Things to avoid

- **Ideating against unmapped code.** Run `businesslens-init` first. The skill
  stops and tells you. Planning against code nobody has read produces a model
  that contradicts reality on day one.
- **Leaving the model edit uncommitted while you build.** Commit it on its own.
  A reviewable product delta is the entire safety property, and it disappears
  the moment it is mixed into a working tree full of implementation.
- **Ideating a refactor.** See the test above.
- **Treating plan-mode output as the spec.** It dies with the conversation. If
  it contains a decision about what the product does, that decision belongs in
  the model.
- **Hand-editing `.businesslens/` and skipping `validate`.** Every skill runs it
  for you; type it yourself when you edited by hand.

## Where to go next

- [Find your flow](./flows.md) — the full decision table for every situation
- [PDD ♥ SDD](./pdd-and-sdd.md) — the product/technical borderline in detail
- [Skills overview](./skills.md) — what each skill reads, writes, and refuses to do
