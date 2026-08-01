---
title: Find your flow
description: Every situation you can be in with a Product Model, and what to do about it — starting from existing code, from nothing, or from a Blueprint.
section: open-source
group: Concepts
order: 6
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
| You want to start from a Blueprint | `npx businesslens@latest blueprint pull <name>` | A ready-made model of a proven product shape |

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
| You've written code for what the model describes | `/businesslens-sync` — attach the evidence |

Writing the code is not something BusinessLens does for you — use your usual
coding workflow, or a spec-driven toolchain alongside it. When the model
arrived by `blueprint pull` or `blueprint open`, the managed block in your
`AGENTS.md` already tells whatever writes the code that the model is the
specification and its scenarios are the definition of done.

Until evidence is attached, `coverage.md` stays at `status: draft` and missing
evidence appears as warnings rather than errors. That is the expected state for
a product that hasn't been built yet, not a problem to fix.

After the last row above, greenfield and brownfield are the same thing. There is
no third mode.

## Day to day — what did you edit since you branched?

| The model | The code | Where that leaves you | What you do |
| --- | --- | --- | --- |
| — | — | Nothing has moved | Nothing |
| **edited** | — | You've described a change nobody has written yet | **Write the code**, then sync |
| **edited** | **edited** | You described a change and wrote it, but nothing has checked that the code matches | `/businesslens-sync` |
| — | **edited** | The code behaves differently, and the model still describes the old behavior | `/businesslens-sync` |

Those four rows are every possibility. Two things can change, each of them
either did or didn't, and that is the whole space.

**You never have to work out which row you're in.** `sync` reads it from git
and tells you. When a plan exists it checks the code against the plan; when
none does, it works out what the code became. Either way it attaches evidence
where the model and the code already agree, and brings you everything else one
decision at a time — so nothing about what your product *does* changes without
you saying so.

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
| You don't know which row above you're in | `npx businesslens validate` |
| Something looks wrong and `validate` doesn't explain it | `/businesslens-doctor` |
| One area of the model is described too thinly | `/businesslens-deep-dive <id>` |
| You don't know what to build next | `/businesslens-ideate` |

**You rarely type `validate` yourself.** Every skill runs it, `blueprint
export` and `blueprint contribute` run it before they produce anything, and CI
runs it on every pull request. Type it when you want the picture below, when
you edited `.businesslens/` by hand, or to reproduce a CI failure locally.
[Full breakdown](./cli-validate.md#when-it-runs-itself).

When you do, it answers both questions at once. It checks the model against the
format contract — the deterministic gate, the one to run in [CI](./ci.md), and
it needs no agent — and then tells you which of the four rows above you are in:

```text
Product Model is valid (2 actors, 2 experiences, 2 domains, …).

On feat/guest-checkout, against main:
  model  3 file(s) changed
  code   11 file(s) changed

You described a change and wrote code for it, but nothing has checked that
the code matches. /businesslens-sync checks every planned addition,
change, and removal, and attaches evidence.
```

Those are separate answers, and only the first one sets the exit code. **A
model can be perfectly valid while the code has moved out from under it** —
the drift is semantic, and no rule can see it. That's the case the second half
exists for.

`--json` output is unchanged, so nothing in CI has to care.

`doctor` is for what's left: a finding you can't account for, a model you
inherited, evidence that looks stale in ways a validator can't detect.

## Sharing a model

| Situation | What you do |
| --- | --- |
| Hand the model to another repository | `npx businesslens blueprint export`, then `npx businesslens blueprint open <report>` in the target |
| Propose it for the public catalog | `/businesslens-contribute` |

Both produce a **Blueprint** — the same product behavior with this
repository's code evidence removed, because those paths prove nothing anywhere
else. Contributing opens a public pull request under your own GitHub identity;
it is never automatic, and nothing else in BusinessLens sends your model
anywhere.

## Where to go next

- [The product model](./product-model.md) — what the model holds, and why git is the change model
- [Skills overview](./skills.md) — what each skill reads, writes, and refuses to do
- [CLI reference](./cli.md) — every command and option
