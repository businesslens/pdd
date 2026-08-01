---
title: ideate
description: Decide what the product should do — propose directions, or write a decided change into the model. Nothing is written without your approval.
section: open-source
group: Skills
order: 13
---

# `businesslens-ideate`

One conversation that converges: it proposes, you choose, and then it writes
what you chose into `.businesslens/`. You never have to declare which half you
are in before you start — the skill works that out from what you say.

This is the skill that moves the model **ahead** of the code, on purpose. Git
is the change model: the branch holds the plan,
[`businesslens-sync`](./skill-businesslens-sync.md) attaches evidence after
implementation, and the verified model returns to evidence-backed truth.

## When to use it

- **You do not know what to build yet.** On an empty repository it proposes
  distinct product shapes; on an existing model it proposes directions the
  product could take. It writes nothing until you pick one.
- **You know what to build.** It drafts the model change — journeys,
  scenarios, rules, actors, experiences — shows you what it intends to write,
  and writes it once you approve.
- **A blank repository.** It runs the full guided product interview and
  authors the whole product as a draft model (`coverage: draft`).
- **A design deliverable.** A draft model nobody implements yet is a validated,
  portable product spec.

A repository with code but no model gets routed to
[`businesslens-init`](./skill-businesslens-init.md) first — it never plans
against unmapped code.

## Invocation

```text
/businesslens-ideate                                  # what could this be, or what's next
/businesslens-ideate add guest checkout               # a decided change
/businesslens-ideate quick: add dark mode
/businesslens-ideate thorough: rethink onboarding
```

`quick` asks at most a few batched questions and drafts the rest from model
context; `thorough` runs the full interview (why, who, surfaces, features,
rules, journeys, scenario and decision space, removals, done-when). Without a
keyword it infers depth from the ask, and a blank repository is always
thorough.

## The two halves

| | Explore | Converge |
| --- | --- | --- |
| You said | "what should I build", or a domain | a specific change |
| It produces | a ranked shortlist, each with its cost | entities in the model |
| It writes | nothing | only after you approve |

It moves from explore to converge when **you** choose, never on its own
initiative. When your ask is genuinely ambiguous it explores first and offers to
converge.

## What it proposes, and what it does not

Exploring an existing model, it looks for directions the product could take but
does not: a domain the product implies but never covers, an actor it turns
away, a journey that stops short of the goal behind it, a limitation in
`product.md` that has quietly stopped being true. Candidates are ranked by what
they would change for a user, not by effort, and each names what it would cost
elsewhere in the model — the rule it complicates, the journey it lengthens, the
actor it introduces. An idea with no stated cost has usually not been thought
through.

Structural holes in what already exists — a journey with no permission
scenario, a business rule no scenario covers, a feature reachable from no
journey — belong to [`businesslens-doctor`](./skill-businesslens-doctor.md) and
[`businesslens-deep-dive`](./skill-businesslens-deep-dive.md). It names them and
hands them off rather than turning the conversation into an audit.

## What it reads and writes

Reads the existing model and repository material. After approval, writes model
entity files to their intended state (new files carry **no** codeRefs — planned
behavior has no evidence yet), new scenario kinds in `taxonomies.yaml`, and on
a blank repository the minimal scaffold (`config.yaml`, `taxonomies.yaml`,
`product.md`, `coverage.md` at `status: draft`, `.gitignore`).

Validation's `needs at least one codeRef` findings on the planned entities are
the evidence checklist for new journeys and scenarios. The model diff remains
the complete plan, including changes and removals.

## Why approval matters

A Product Model holds what the product **does**, not what it might. A proposal
written into `.businesslens/` without a decision behind it would be
indistinguishable from a decision someone made, and the model would stop being
trustworthy as a description of the product. The approval step at the end of
the conversation is what keeps that line intact — and the model edit then lands
uncommitted on your branch, reviewable as a diff before you commit it.

## Guardrails

- Never writes into `.businesslens/` without your explicit approval.
- Never invents implementation detail — no stacks, endpoints, schemas, or file
  names in entity prose.
- Never adds a codeRef for behavior that does not exist.
- Never weakens evidenced current truth except where the change deliberately
  retires it.
- Never plans against unmapped code, implements, executes target code, or
  submits the Product Model.

It writes files, so run it in normal mode — your harness's plan mode is
read-only and will block the write. See
[How it fits](./how-it-fits.md).

Tutorials: [From an idea](./from-an-idea.md) · [Find your flow](./flows.md).
