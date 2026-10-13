---
title: "SDD describes the change, not the product"
description: SDD tools mix product and implementation in one place. PDD draws the line and gives the product a model of its own.
date: 2026-10-06
image: /blog/pdd-and-spec-driven-development.webp
badge: Engineering
authors:
  - name: Itai Gendler
    description: "@itai-gendler"
    to: https://github.com/itai-gendler
    avatar:
      src: /team/itai-gendler.png
      alt: Itai Gendler
---

Spec-driven development works. If you use [OpenSpec](https://openspec.dev),
[spec-kit](https://github.com/github/spec-kit) or [Kiro](https://kiro.dev), you
know the shape: describe the change before you build it, plan it, break it into
tasks, and let the agent work against a written target instead of one sentence
in a chat. This post is not an argument against it. It is about where it falls
short, and what it does not cover properly: the product.

## What these tools keep

None of them throws the work away when it ships.

- **OpenSpec** keeps `openspec/specs/` as the source of truth for how the system
  behaves today. Each change carries a proposal, a design, tasks, and delta
  specs. Archiving merges the deltas into the main specs and files the rest
  under `changes/archive/`.
- **spec-kit** gives each feature its own directory with `spec.md`, `plan.md`
  and `tasks.md`, plus a project constitution. Whether those files stay living
  or become history is
  [left to each team](https://github.github.io/spec-kit/concepts/spec-persistence.html).
- **Kiro** writes `requirements.md`, `design.md` and `tasks.md` for each
  feature, and keeps `product.md`, `tech.md` and `structure.md` as steering
  files that every conversation reads.

So the files stay. The question is what they hold.

## The product gets mixed with the build

**What usually steers these frameworks is the technical side**: the design,
the plan and the tasks. The product requirements are rarely discussed in full, and
what is covered ends up mixed into the technical artifacts the framework
produces.

And the product never sits in one place. It is spread across feature and change
folders, so nothing describes the whole of it.

That matters. When the two are mixed, you can no longer tell what the product
must do from how it happens to be built today.

## The specs drift

**A spec is only as true as the last time someone updated it.** A hotfix, a
refactor, a change made outside the workflow, and it quietly stops matching the
code. spec-kit's own docs name the risk:
[silent divergence](https://github.github.io/spec-kit/concepts/spec-persistence.html).

Keeping them current is a chore nobody owns. Every change means touching the
proposal, the design and the specs, and the more files pile up, the more work
each change costs. So it gets skipped, and the next agent builds from a spec
that is no longer true.

Splitting the product from the implementation changes that. **The product lives
in one place**, so a product decision is written once, not restated in every spec
it touches. A purely technical change, like a refactor or a new library, never
has to touch it. And that one record serves every change, every agent and every
person who works on the product.

## Draw the line

PDD draws the line between product and implementation, in one place. A Product
Model holds what any rebuild of the product would have to keep, and nothing a
rebuild is free to change:

| In the Product Model | Left to the spec and the code |
| --- | --- |
| Who can reach each place | Architecture and data flow |
| What it shows and asks for | Components and layout |
| What can be done there | API style, endpoints and tokens |
| Which rules apply | Libraries and frameworks |
| What happens next | Tasks and file changes |

Because it is kept apart, the model can also be checked against the code on
every change, so drift shows up when it happens instead of a year later.

## SDD describes the change. PDD describes the product.

Spec-driven development is good at what it was built for: planning and building
a change. It was never meant to hold the product. Give the product a home of its
own, kept apart from the technical artifacts and checked against the code, and
**your specs can go back to doing what they do best: describing the build.**

Nothing else has to move. Keep the spec-driven framework you use, or use none at
all. The product just gets a place of its own.

For the problem this comes from, read
[AI is writing code for products it doesn’t understand](/blog/your-agent-is-guessing).
