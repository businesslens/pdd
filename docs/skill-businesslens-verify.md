---
title: verify
description: Implement the Product Model in code, in phases, or check that the model and the code agree, and resolve every gap you approve until they do or something blocks.
section: open-source
group: Skills
order: 19
---

# `businesslens-verify`

**Verify makes the Product Model and the code agree: it implements what the
model describes and the code lacks, and fixes each other gap the way you
decide.**

Your agent uses it when you ask it to implement the model, all of it or a part.
Run it yourself after a refactor, when you suspect drift, or before a release.

```text
/businesslens-verify
/businesslens-verify current
/businesslens-verify checkout
/businesslens-verify report only
```

With no scope, it checks what changed on the current branch.

## Implement from the model

Ask your agent to implement, for example "implement our PDD", "implement it"
after ideate, or "implement saving an item". "Build" works too. You don't name
the skill.

1. **A plan.** Everything the model describes that the code doesn't do yet is
   the plan, cut into **slices**: one Capability with its Scenarios and the
   Screens and Rules that go with it, or one Journey after its Capabilities.
   Slices are grouped into **phases**: the first holds the shared groundwork
   (storage, sign-in, the app shell) and the slices that need nothing else;
   each next phase holds the slices the earlier ones made possible.
2. **Your agent implements each phase your usual way**: plan mode, an SDD tool,
   your repository's conventions and tests. It never edits `.businesslens/`.
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

To implement in another tool or session instead, say so: verify gives you a
**handoff packet** for the work.

## What you get

1. **Lint**, so a broken file is reported before anything else.
2. **Findings.** It reads the code (never runs it) and compares it with every
   claim in scope. Each finding is labeled, and findings that share one decision
   are grouped into one question.
3. **One question per decision**, with what the model says, what the code does,
   the files it read, and a recommendation.
4. **The fix, after you approve.** A model change is shown in full and written;
   your agent makes a code change your usual way.
5. **A fresh check after every change.** Earlier findings are discarded and
   derived again. If the same gap comes back unchanged after an implementation
   attempt, it stops rather than loop.
6. **A report**: what was checked, what agrees, what changed, what is still
   blocked, and the final lint result. It says "aligned for the inspected
   scope", never "the whole product is proven" unless it checked everything.

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
| model-right | The model is right; the code must change | Your coding agent fixes the code |
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
> After you approve, your agent adds the check and verify checks again.

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

By default verify resolves: it writes approved model changes, and your agent
makes approved code changes. `report only` returns the same findings and
recommendations and changes nothing.

Verify's checking never writes or runs code. Code is written by your agent,
which never edits `.businesslens/`. When you implement in another tool or
session, verify stops with a **handoff packet** (the expected behavior, the
affected resources, the gap, acceptance criteria, and file leads) that you can
give to any agent or person.

Findings are never saved: every run derives them again from the model and the
code as they are now.

## Related

- [Development loop](./index.md#the-development-loop)
- [Lint in CI](./cli-lint.md#run-it-in-ci): lint checks structure; only verify
  checks meaning.
