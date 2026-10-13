---
title: "AI is writing code for products it doesn’t understand"
description: Coding agents can read code, tests, and tickets. Without a reliable product definition, they still have to reconstruct what the product is supposed to be.
date: 2026-08-06
image: /blog/ai-writing-code-for-products.webp
badge: Perspective
authors:
  - name: Itai Gendler
    description: "@itai-gendler"
    to: https://github.com/itai-gendler
    avatar:
      src: /team/itai-gendler.png
      alt: Itai Gendler
---

Coding agents can read code, tests, and tickets. Without a reliable product
definition, they still have to reconstruct what the product is supposed to be.

**We are giving AI control of the codebase without giving it a reliable
definition of the product.**

Ask a coding agent to change what happens when a free trial ends. Should the
workspace become read-only? Is there a grace period? Can users export their data?
Do scheduled actions keep running? What happens to invited teammates?

The agent can find the relevant code and tests. What it cannot find is which of
those answers represent the product's current intent.

## Evidence is not a product definition

The answers are usually scattered across the pricing page, an old launch ticket,
billing and permission logic, tests, a support playbook, and somebody's memory.
Every source is useful. None defines the current product as a whole.

Trial expiration crosses billing, permissions, collaboration, data retention,
exports, and automations. Each system can behave consistently while producing a
customer experience nobody deliberately defined.

**The agent does not discover the product. It reconstructs one**, filling every gap
with a product decision nobody explicitly made—then writes code as if that
reconstruction had been approved.

Code is the closest evidence of what shipped, but it cannot explain what the
behavior means. A temporary workaround looks much like a deliberate business
rule. **Tests confirm what happens, not why it must happen.**

## Better documentation is not enough

Wikis, design documents, and decision logs are good at authoring. Their shared
weakness is that they cannot tell us when they have become false. When behavior
changes underneath a document, nothing fails; it quietly stops being true.

> The problem is not that a product definition is hard to write. The problem is
> that a written product definition has no way of knowing it is now wrong.

## Agents turn ambiguity into action

People reconstruct the product from the same fragments. Coding agents simply do
it faster—and then act on the reconstruction.

More context helps it see more evidence. It does not create the missing decision
that only lived in a conversation or distinguish an intentional constraint from
a historical accident.

**The result can be reasonable code for a subtly incorrect product.** Reviewers catch
some of it. The rest ships.

![Tickets, documents, tests, code, chats, and memory flow through reconstruction and produce a plausible product interpretation, shown as different from verified product intent.](/blog/agent-product-reconstruction.webp)

## What a durable product definition requires

Simply documenting the product more clearly is not enough. A durable product
definition must be:

- **Current and centralized:** one shared definition of how the product should
  work, updated as the product changes.
- **Versioned with the code:** changing in the same history as implementation.
- **Readable by people and agents:** structured without becoming opaque.
- **Organized around product definition:** who it serves, where they reach it, what it keeps, what it can do, and which rules must stay true.
- **Tied to evidence:** making drift visible when implementation and intent
  diverge.

![A current product definition connects to five requirements: versioned with code, readable by people, readable by agents, tied to evidence, and making drift visible.](/blog/product-definition-requirements.webp)

Call it a Product Model or a product definition. The name matters less than the
property: **it cannot quietly become fiction.**

With that definition, people can understand the current product without
archaeology, and agents can build from explicit decisions instead of inventing
the missing ones.

Over the past few weeks, I have been working on an open standard for product
definitions and an open-source implementation of it. Both are out now as
[pdd-kit](/blog/introducing-pdd-kit): [start with the docs](/docs), or install
it with `npx pdd-toolkit install`.

Where does your product definition live today? Have you run into this problem?
How do you handle it?
