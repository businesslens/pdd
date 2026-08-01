---
title: Find your flow
description: Every situation you can be in with a Product Model, and what to do about it — starting from existing code, from nothing, or from a Blueprint.
section: open-source
group: Get started
order: 4
---

# Find the flow you're in

BusinessLens keeps two things, and everything you ever do is about which one
moved:

- **the model** — the files in `.businesslens/`, describing what the product does
- **the code** — the implementation that proves it

Find the row that matches your situation.

## Starting out

| Where you're coming from | First move | What you get |
| --- | --- | --- |
| The code already exists | `/businesslens-init` | A model of what the code does **today**, proven by the code |
| Nothing exists yet | `/businesslens-plan` | A model of what you **intend** to build |
| You want to start from a Blueprint | `npx businesslens@latest pull <name>` | A ready-made model of a proven product shape |

The first row is a **brownfield** start: the product is real, and the model has
to catch up to it. The other two are **greenfield**: the model comes first, and
the code has to catch up to *it*.

(Codex users invoke skills as `$businesslens-init` rather than
`/businesslens-init`.)

## Greenfield only — until the code exists

| Situation | What you do |
| --- | --- |
| The Blueprint describes something different from what you want | `/businesslens-plan` — edit the model before you write any code |
| The model is right, and no code exists yet | **Write the code.** The scenarios are your acceptance criteria |
| You've written code for what the model describes | `/businesslens-verify` — attach the evidence |

Writing the code is not something BusinessLens does for you — use your usual
coding workflow, or a spec-driven toolchain alongside it. When the model
arrived by `pull` or `open`, the managed block in your `AGENTS.md` already
tells whatever writes the code that the model is the specification and its
scenarios are the definition of done.

Until evidence is attached, `coverage.md` stays at `status: draft` and missing
evidence appears as warnings rather than errors. That is the expected state for
a product that hasn't been built yet, not a problem to fix.

After the last row above, greenfield and brownfield are the same thing. There is
no third mode.

## Day to day — what did you edit since you branched?

| The model | The code | Where that leaves you | What you do |
| --- | --- | --- | --- |
| — | — | Nothing has moved | Nothing |
| **edited** | — | You've described a change nobody has written yet | **Write the code**, then verify |
| **edited** | **edited** | You described a change and wrote it, but nothing has checked that the code matches | `/businesslens-verify` |
| — | **edited** | The code behaves differently, and the model still describes the old behavior | `/businesslens-sync` |

Those four rows are every possibility. Two things can change, each of them
either did or didn't, and that is the whole space.

Two notes on the last row:

- It doesn't matter **who** edited the code, or whether it was you. What matters
  is that the model wasn't edited alongside it.
- If the code moved but **behavior didn't** — a rename, a file move, a refactor —
  the model is still true and only its `codeRefs` are stale.
  `npx businesslens validate` catches those, and `/businesslens-sync` repairs
  them.

Changing the code without planning first is a legitimate way to work. Planning
first is the default because it gets the thinking done before the code sets, but
a small or obvious change is often faster to make and then record.

## Day to day — everything else

| Situation | What you do |
| --- | --- |
| You don't know where you stand, or something looks wrong | `/businesslens-doctor` |
| One area of the model is described too thinly | `/businesslens-deep-dive <id>` |
| You don't know what to build next | `/businesslens-ideate` |
| You want to check the model is sound | `npx businesslens validate` |

`validate` is the deterministic check and the one to run in
[CI](./ci.md) — it needs no agent. `doctor` is for when a result needs
explaining or the model looks stale in ways a validator can't see.

## Sharing a model

| Situation | What you do |
| --- | --- |
| Hand the model to another repository | `npx businesslens export`, then `npx businesslens open <report>` in the target |
| Propose it for the public catalog | `/businesslens-contribute` |

Both produce a **Blueprint** — the same product behavior with this
repository's code evidence removed, because those paths prove nothing anywhere
else. Contributing opens a public pull request under your own GitHub identity;
it is never automatic, and nothing else in BusinessLens sends your model
anywhere.

## Where to go next

- [Quickstart](./quickstart.md) — install the skills and walk the loop once
- [How it works](./guide.md) — why the loop is shaped this way
- [Skills overview](./skills.md) — what each skill reads, writes, and refuses to do
- [CLI reference](./cli.md) — every command and option
