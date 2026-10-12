# The home page hero leads with the category

The home page names what the project is before it names the problem it solves:

> OPEN SOURCE
>
> Product-Driven Development for coding agents
>
> Your AI agent is guessing what the product is. PDD gives it a durable Product
> Model — versioned with the code, readable by agents, and reviewable by people.

This supersedes only the hero-placement consequence of
[ADR-0007](./0007-pdd-names-the-practice.md). Its vocabulary decision remains:
PDD is the practice, BusinessLens is its open-source implementation, and a
Product Model is the artifact.

## Why

The previous hero led with the strongest problem line but made the category a
small eyebrow. A visitor could understand the pain before they understood what
the project was. Promoting Product-Driven Development and its audience to the
headline makes that answer immediate; retaining the problem as the first
sentence of the subhead keeps the urgency.

`OPEN SOURCE` takes the eyebrow because it is the most useful remaining context
at that scale and distinguishes BusinessLens's implementation without inventing
a second brand.

## Consequences

- The headline accent is `for coding agents`; Product-Driven Development remains
  the primary phrase.
- The old problem headline remains endorsed and opens the subhead.
- The subhead keeps the repository, agent, and human benefits, but drops the
  longer implementation-verification clause. Verification is explained below
  the fold.
- Social metadata already uses the category headline and needs no change. The
  social image remains a hook rather than a literal rendering of the hero.
