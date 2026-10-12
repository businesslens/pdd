# PDD names the practice, BusinessLens names its implementation

Status: the vocabulary decision remains current; the hero placement below was
superseded by [ADR-0011](./0011-category-first-home-page-hero.md).
The historical redirect requirement below is superseded by
[ADR-0017](./0017-current-contract-only-before-launch.md).

The site led with "AI agents need a Product Model" and never said *Product-Driven Development*,
while `pdd/docs/index.md` opens with "BusinessLens is Product-Driven Development (PDD) for coding
agents." Two front doors giving two answers to what this is. The practice wins the name: **PDD is
the practice, BusinessLens is the open-source implementation of it — format, CLI, and skills — and
a Product Model is what the practice produces.** Public copy names PDD before it names
BusinessLens.

## Considered and rejected

**PDD as the name of the format**, the way OpenAPI names a format. The artifact on disk is
`.businesslens/`, the package is `businesslens`, and `format.md` is the BusinessLens format
contract — so the claim stays hollow until all three are renamed. PDD is something you do, not a
file you validate.

**Leaving Product Model as the headline concept**, with PDD kept as an essay-level term. Cheapest,
and it is what shipped, but it leaves the project with no name for the thing it asks people to
adopt. "Use a Product Model" names an artifact; "-Driven Development" names a change in how you
work, and the suffix already carries meaning for this audience.

## Consequences

- The home page eyebrow is `PRODUCT-DRIVEN DEVELOPMENT`. The h1 states the problem — the agent is
  guessing what the product is — and the Product Model appears in the subhead as the answer. The
  claim outlived the headline slot; it is a claim, not a name.
- **The metadata moves; the social card does not.** `app/pages/index.vue:12` (title) and `:14-15`
  (`ogTitle`, `ogDescription`) still assert the retired headline and are rewritten.
  `public/product-model-open-graph.png` draws "AI agents need a Product Model." into the artwork,
  and it **stays** — a social card carries the hook, not a mirror of the h1, and the claim is still
  endorsed. Rebuilding a hand-made brand asset to match a headline slot would be work spent on a
  coherence nobody perceives.
- **`content/blog/product-driven-design.md` contradicts the term in its own URL.** It renames to
  `product-driven-development` with a 301 in `nuxt.config.ts` `routeRules`, alongside the eight
  redirects already there.
- `CONTEXT.md` gains a PDD entry. It had none — the glossary that exists to stop vocabulary drift
  was silent on the term the product is named after.
- Do not give PDD its own logo, wordmark, or nav item. One BusinessLens mark, per
  [messaging](../messaging-system.md). PDD is a word, not a sub-brand, and the home page is
  already the page that explains it.
