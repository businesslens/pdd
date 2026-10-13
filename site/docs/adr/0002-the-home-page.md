# ADR-0002: The home page

Status: accepted, 2026-10-12.

read_when: changing the home page hero, its entry paths, the resource
collections it teaches, or how public copy names the practice and the product.

## Decision

**PDD names the practice; pdd-kit implements it.** Product-Driven Development is
the practice, pdd-kit is its open-source implementation (format, CLI, skills),
and a Product Model is what the practice produces. Public copy names PDD before
pdd-kit. PDD gets no logo, wordmark or nav item of its own: it is a word, not a
sub-brand.

**The hero leads with the category.** From `homeContent.ts`:

> Open source
>
> Product-Driven Development **for coding agents**
>
> Your AI agent is guessing what the product is. PDD gives agents and humans a
> shared product model that is git-tracked, reviewable, and verifiable.

The eyebrow is `Open source`; the title accent is `for coding agents`. The
problem opens the subhead rather than the headline.

**Three doors, as hero buttons.** *Map existing repo* (`/pdd-map`), *Start from
an idea* (`/pdd-ideate`) and *Start from a Blueprint*
(`pdd-kit blueprint pull`), each an engraved plate that opens its steps in a
dialog, under the shared install command. Map and ideate continue in `/docs`
(`/docs/from-your-repo`, `/docs/from-an-idea`); only the Blueprint door
continues on the site, at `/blueprints`.

**Seven main resource collections**, in PDD's order: Entities, Interfaces,
Domains, Capabilities, Journeys, Business rules, Variations. Four to a row
(four, then three). Contained types (Experiences, Screens, Scenarios) are left
to the documentation; Product is the whole and is not a card.

## Why

- A visitor should know what the project is before they meet the problem it
  solves, so the category is the headline.
- Map and ideate do their work in the reader's own repository and agent; the
  site can show a Blueprint's report, but not the result of running a skill on
  someone else's code. Sending those two doors to their docs is honest about
  where their value shows up.
- Independent collections answer independent Product questions; mandatory
  children are reached through their owner. Variations varies resources of any
  other type, so it is a peer of all six, not a child of one.

## Consequences

- The social card (`public/pdd-kit-social-card.png`) carries the hero's line,
  *Product-Driven Development for coding agents* (the maintainer's call,
  2026-10-13; it previously carried a separate hook). A redrawn card gets a new
  file name, because link previews cache the image by its URL.
- The header's **Get started** goes to `/docs`, the one destination that serves
  all three doors. The hero has no Get started of its own.
- Door names are fixed in `CONTEXT.md`, because they appear on the home page, in
  `/faq` and in the docs.
- `tests/integration/homeContent.test.ts` asserts the seven collections and
  forbids a last row of one card.
