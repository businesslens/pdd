---
title: verify
description: Check that the Product Model and the code agree, see every gap in one report, and fix the ones you choose. Opt in to implement with verify, in phases.
section: open-source
group: Skills
order: 19
---

# `pdd-verify`

**Verify checks that the Product Model and the code agree: it reports every
gap, and fixes the ones you choose, the way you decide.**

Implement your usual way, then ask your agent to check the code against the
model, or run verify yourself after a refactor, when you suspect drift, or
before a release. When your agent finishes implementing a change, it may
recommend a check; it doesn't run one unless you ask.

```text
/pdd-verify
/pdd-verify current
/pdd-verify checkout
/pdd-verify report only
```

With no scope, it checks what changed on the current branch.

| Mode | How it starts | What it does |
| --- | --- | --- |
| **Check** (the default) | Ask to check the code against the model, or run `/pdd-verify` | Reports every gap, then fixes the ones you choose |
| **Report only** | `/pdd-verify report only` | Reports every gap and changes nothing |
| **Implement with verify** (opt-in) | `/pdd-verify implement …`, or ask to implement after [opting in](#implement-with-verify-opt-in) | Plans the work in phases; your agent implements each phase and verify checks it before the next |

## What you get

1. **Lint**, so a broken file is reported before anything else.
2. **Findings.** It reads the code (never runs it) and compares it with every
   claim in scope. Each finding is labeled, and findings that share one decision
   are grouped.
3. **A report before anything changes**: every group, with what the model
   says, what the code does, the files it read, and a recommendation.
4. **You choose what to fix.** Pick some, all or none. A model change is shown
   in full and written only after you approve it; your agent makes a code
   change your usual way.
5. **A fresh check after every fix.** Earlier findings are discarded and
   derived again, and anything new comes back to you to choose. If the same
   gap comes back unchanged after an implementation attempt, it stops rather
   than loop.
6. **A final report**: what was checked, what agrees, what you fixed, what you
   left, what is still blocked, and the final lint result. It says "aligned
   for the inspected scope", never "the whole product is proven" unless it
   checked everything.

## What it checks

| Claim | Verify confirms |
| --- | --- |
| Routes and places | Each Scenario runs through its Steps, at the places they name, to its outcome; each Journey Scenario reaches its goal |
| Each [Interface](./interfaces.md) | Every place a [Capability](./capabilities.md) is offered, separately: shared backend code doesn't prove web, mobile and API all work |
| Things, States and facts | The product keeps each fact an [Entity](./entities.md) lists, and each Step changes exactly the States and facts it names |
| [Screens](./interfaces.md#screens) | What each place shows and collects matches its view's code (never layout, styling or copy) |
| Languages | The languages the product and each Interface claim match what the code serves |
| Who may | Each [Business Rule](./business-rules.md) grant is enforced, and everyone else refused. A grant the code doesn't enforce is reported as *not established*; an operation closed with `permits: []` must be refused |
| What varies | Each alternative of a [Variation](./variations.md) is still offered, chosen by what the model names, with the stated default |

For example: the model says the store's *Refund review mode* picks Standard or
Strict, Standard by default. Verify checks the code reads that setting, defaults
to Standard and still offers both; a removed branch or a different deciding flag
is a finding.

## Finding labels

| Label | Means | What happens next |
| --- | --- | --- |
| aligned | The code does what the model says | Nothing |
| model-right | The model is right; the code must change | If you choose it, your coding agent fixes the code |
| code-right | The code is right; the model must change | Verify drafts the model change for approval |
| neither-right | You must decide what should happen first | Verify settles it with you, then both may change |
| unmapped | The code does something the model doesn't describe | Verify maps that area for approval |
| unverifiable | Reading the source can't settle it (live config, an outside system) | Reported with what would settle it |

An example finding:

> **model-right**: `refunds-need-an-operator`
>
> - **Model:** a Store admin may refund an Order of up to 100; above that, only
>   the approver the store configures.
> - **Code:** `OrderService.refund` checks for a Store admin but never compares
>   the total with 100.
> - **Recommendation:** keep the Rule; add the threshold check.
>
> If you choose to fix it, your agent adds the check and verify checks again.

## Scope

- **The current branch** (the default): committed, staged and unstaged changes
  pick what to check. Git chooses *where to look*, never *which side is right*:
  a model approved before the branch is still the plan.
- **`current`** or **`full`**: the whole product as it is now.
- **A name**: one Entity, Interface, Experience, Screen, Domain, Capability,
  Scenario, Journey, Business Rule, Variation or path, plus what it depends on.

If there is no model yet but there is code, verify maps the scope it needs
itself, with your approval.

## Report only or resolve

By default verify reports, then resolves what you choose: it writes approved
model changes, and your agent makes the code changes. `report only` returns
the same findings and recommendations and changes nothing.

Verify's checking never writes or runs code. Code is written by your agent,
which never edits `product-model/`. When you implement in another tool or
session, verify stops with a **handoff packet** (the expected behavior, the
affected resources, the gap, acceptance criteria, and file leads) that you can
give to any agent or person.

Findings are never saved: every run derives them again from the model and the
code as they are now.

## Implement with verify (opt-in)

By default, implementing is yours: "implement guest checkout" goes to your
agent and your usual workflow, and verify stays out of it until you ask for a
check. If you'd rather pdd-kit orchestrate the whole implementation and
verification loop, turn it on in one of three ways:

| Turn it on | Applies to | Turn it off |
| --- | --- | --- |
| `npx pdd-toolkit install --orchestrate=on` | Every conversation in the agents you installed for | `npx pdd-toolkit update --orchestrate=off` |
| The sentence below in your `AGENTS.md` | Everyone working in the repository | Remove the sentence |
| `/pdd-verify implement …`, or the sentence in a request | That request | Nothing to undo |

**The install option** is the simplest, and nothing outside the skills
directory changes. With a project install, the setting travels with the
skills: commit them, and your team gets it too. See [`install`](./cli-install.md#orchestration).

**The sentence** works where no install option reaches: with the Claude Code
plugin, or when you want the choice written in the repository, where it is
reviewed in pull requests:

```md [AGENTS.md] wrap
Implement with pdd-verify: plan the work from `product-model/` in phases and check each part before the next.
```

Put it in `AGENTS.md`, or the file your agent reads instead (Claude Code reads
`CLAUDE.md`, which can import `@AGENTS.md`; Gemini CLI reads `GEMINI.md`).
pdd-kit never writes it for you.

**For one request**, name the skill: `/pdd-verify implement guest checkout`
(`$pdd-verify` in Codex), or "use pdd-verify to implement guest checkout".
Adding the sentence to the request works too.

Once you've opted in, you can still implement your own way once: ask your
agent to implement without pdd-verify. And if your agent ever picks verify for
"implement X" without any of these, verify steps aside and your agent
implements it the usual way.

Once you opt in, asking to implement starts verify:

1. **A plan.** Everything the model describes that the code doesn't do yet is
   the plan, cut into **slices**: one Capability with its Scenarios and the
   Screens and Rules that go with it, or one Journey after its Capabilities.
   Slices are grouped into **phases**: the first holds the shared groundwork
   (storage, sign-in, the app shell) and the slices that need nothing else;
   each next phase holds the slices the earlier ones made possible.
2. **Your agent implements each phase your usual way**: plan mode, an SDD tool,
   your repository's conventions and tests. It never edits `product-model/`.
3. **Verify checks every slice of the phase** before the next phase starts, and
   hands back anything still missing.
4. **Questions come to you.** If the model is ambiguous or seems wrong, the work
   stops and verify settles it with you, updating the model only with your
   approval. Nothing is decided in code.
5. **A report**: what was implemented in order, anything blocked, and anything
   the implementation added that the model doesn't describe yet.

### Choose the pace

| Say | What happens | Use it when |
| --- | --- | --- |
| Nothing, or "in phases" | One phase at a time, each slice checked before the next phase (the default) | Most work: a new product, a Blueprint, a large change |
| "One slice at a time" or "slice by slice" | One slice, checked, then the next | You want to review each part, or the model is new to you |
| "In one go", "all at once" or "without phases" | Every slice at once, then every slice checked | A small change, or you want the fastest run |

The pace changes how much your agent implements before a check, never what is
checked: every slice is checked against the model either way.

## Related

- [Development loop](./index.md#the-development-loop)
- [Lint in CI (optional)](./cli-lint.md#run-it-in-ci-optional): lint checks structure; only verify
  checks meaning.
