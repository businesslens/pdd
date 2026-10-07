---
title: Trust model
description: What lint, verify, your tests and your own review each establish about whether the model and the code agree, what none of them can, and what enforces each safeguard.
section: open-source
group: Get started
order: 6
---

# How BusinessLens keeps model and code aligned

Four different things decide whether the Product Model and the code agree. One
is a program, one is your agent's judgment, one is your own tests, and the last
word is always yours. Knowing which is which tells you what a green result
means, and what it doesn't.

## The four layers

| | `lint` | `businesslens-verify` | Your tests and builds | You |
| --- | --- | --- | --- | --- |
| **Who runs it** | The `businesslens` CLI, on your machine or in CI | Your coding agent, following the skill | Your agent while implementing, and your CI | You |
| **What it examines** | The `.businesslens/` files, and which files Git tracks | The model, and the source and tests it reads | The code, by running it | The change shown to you, and the pull request |
| **What it establishes** | The model is well formed | Which claims the code supports, for the scope it inspected | The behavior the tests exercise works | What the product should do, and which side changes |
| **What it can't** | Whether the code does any of it | What source can't show: deployed configuration, outside systems, live data | Behavior no test exercises, or whether the tests match the model | Judge what you weren't shown |
| **Can it change anything** | No, it only reads | The model only with your approval; the code only through your agent | No | Yes: you approve and you merge |

## Lint checks structure

`lint` is deterministic: the same model and the same tracked files always get
the same result. It checks every file against the rules on its type's page
(start with [the model as a whole](./product-model.md#what-lint-checks)), and
that every code Reference points at a file Git tracks.

It rejects a model that contradicts itself. If a Scenario has a shopper refund
an Order while the refund Rule admits only a Store admin, lint fails. It cannot
tell whether the code checks either of them: a model whose Rule is never
enforced lints clean. That gap is [verify's job](#verify-is-judgment-scoped-to-what-it-read).
Run lint [in CI](./cli-lint.md#run-it-in-ci) on every pull request.

## Verify is judgment, scoped to what it read

Verify is your agent reading code against the model with a fixed rubric. It
reads source and tests and never runs them, gives each claim a
[label](./skill-businesslens-verify.md#finding-labels), and names the files it
read. A claim reading can't settle is labeled *unverifiable*, with what would
settle it.

Its findings are evidence, not proof. An agent can miss a gap or misread code,
so a clean run says **aligned for the inspected scope**, never that the whole
product is proven. The Verify page walks through
[a Rule the code doesn't enforce](./skill-businesslens-verify.md#finding-labels)
and [the loop that resolves it](./skill-businesslens-verify.md#what-you-get):
after every change, earlier findings are discarded and derived again, and a gap
that comes back unchanged after your agent's fix stops the run instead of
looping.

Findings are never saved. There is no stored "verified" status, because it
would outlive the code it described.

## Tests run in your workflow

BusinessLens reads tests as evidence; it never runs them. While implementing,
your agent runs your tests and builds the way it always does, under its normal
permissions. A passing suite is evidence for the behavior it exercises, not
proof of the model.

## You decide

- **Product meaning.** Map, ideate and verify write `.businesslens/` only after
  you approve the complete change they present. "Take your recommendation"
  answers the open questions; you still approve the result.
- **Which side is right.** When the model and the code disagree, verify asks
  you. Git chooses where it looks, never which side wins: a model approved
  before the branch is still the plan.
- **Review.** A model change reaches the pull request as a `.businesslens/`
  diff, beside the code it describes, and is reviewed like any other change.

## What enforces what

Only some of these safeguards are enforced by code. The rest depend on your
agent following instructions, and on what its host lets it do.

**Enforced by code**

- Every `lint` check, wherever it runs.
- The skills' lint runner runs only `lint`, from a temporary folder outside
  your repository, with the CLI version the skills were installed from.

**Instructions the skills give your agent**

- During analysis, never run the repository's code, scripts or tests.
- Write product meaning only inside `.businesslens/`, and only after approval.
- When implementing, never edit `.businesslens/`; bring a product question back
  to you instead of deciding it in code.
- In `report only`, change nothing. Never stage, commit or publish.

An agent follows these the way it follows any instruction: usually, with no
guarantee. None of them is a security boundary.

**Permissions your agent's host enforces**

What your agent can actually run, read, write or reach over the network is set
by its host (Claude Code, Codex, Cursor, Gemini CLI, GitHub Copilot): its
permission prompts, sandbox and allow-lists. That is the boundary. If running
unreviewed code matters, configure the host.

## Not enforced today

- Nothing in code stops an agent from running your code, or writing outside
  `.businesslens/`, during analysis. The skill's instruction and your host's
  permissions are all there is.
- No check confirms that a `.businesslens/` change was approved, or that the
  implementing agent left the folder alone. The pull request diff is where you
  see both.
- Verify runs only when your agent runs it. There is no CI job for it.

## Related

- [`businesslens-verify`](./skill-businesslens-verify.md): labels, scope and
  report-only mode.
- [`lint`](./cli-lint.md): options, JSON output and CI.
