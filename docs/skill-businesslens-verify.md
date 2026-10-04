---
title: verify
description: Check that the Product Model and the code agree, and resolve every gap you approve until they do or something blocks.
section: open-source
group: Skills
order: 19
---

# `businesslens-verify`

**Verify checks that the Product Model and the code agree, and fixes each gap
the way you decide.**

Use it after you build a change, after a refactor, when you suspect drift, or
before a release.

```text
/businesslens-verify
/businesslens-verify current
/businesslens-verify checkout
/businesslens-verify report only
```

With no scope, it checks what changed on the current branch.

## What you get

1. **Lint**, so a broken file is reported before anything else.
2. **Findings.** It reads the code (never runs it) and compares it with every
   claim in scope. Each finding is labeled, and findings that share one decision
   are grouped into one question.
3. **One question per decision**, with what the model says, what the code does,
   the files it read, and a recommendation.
4. **The fix, after you approve.** A model change is shown in full and written;
   a code change goes to your coding agent.
5. **A fresh check after every change.** Earlier findings are discarded and
   derived again. If the same gap comes back unchanged after a build, it stops
   rather than loop.
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
> After you approve, verify hands the change to your coding agent and checks
> again.

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

By default verify resolves: it writes approved model changes and hands approved
code changes to your coding agent. `report only` returns the same findings and
recommendations and changes nothing.

Verify never writes code itself. When no coding agent is available to take a
code fix, it stops with a **handoff packet** (the expected behavior, the
affected resources, the gap, acceptance criteria, and file leads) that you
can give to any agent or person. The agent that builds must not edit
`.businesslens/`.

Findings are never saved: every run derives them again from the model and the
code as they are now.

## Related

- [Development loop](./index.md#the-development-loop)
- [Lint in CI](./cli-lint.md#run-it-in-ci): lint checks structure; only verify
  checks meaning.
