# The home page teaches nine resource types, not eight entities

Supersedes the count and the vocabulary in
[ADR-0009](./0009-the-home-page-teaches-all-eight-entities.md). Its argument —
that the page teaches the model's own nouns in the model's own nesting, rather
than a friendlier grouping the documentation contradicts — is unchanged and is
why this ADR exists rather than a quiet edit.

## What changed upstream

Two things, both in `businesslens/pdd` 0.9.0.

**The format gained a resource type.** `Entity` names a thing the Product keeps
or reasons about — the nouns, where Capabilities are the verbs. The home page
taught eight and the format now defines nine at the top level, so the page was
short by one and said so nowhere.

**The word for *one of the nine* changed.** It was *entity*, which the format
then took for the new type above, and briefly *element*, which never shipped.
One authored file is a **Resource**; what it is one of is a **resource type**.
See [ADR-0015](https://github.com/itai-gendler/pdd-kit/blob/main/plans/adr/0015-resource-and-resource-type.md)
in the format repository, which owns that decision.

## Decision

- The Product Model section teaches **nine resource types**: Actors, Interfaces,
  Experiences, Screens, Domains, **Entities**, Capabilities, Journeys, Business
  rules — in the order `docs/product-model.md` defines them.
- The grid runs **three columns**, so nine fills three clean rows.
  `docs/design/experiences/marketing.md` had specified three-for-nine since
  round two; `homeContent.ts` had not followed.
- The exclusions ADR-0009 argued are unchanged, but the reason for one of them
  is corrected. Scenarios are excluded because **their type name names their
  parent**, not because they are the only type with a mandatory single parent —
  an Experience also sits inside exactly one Interface and keeps its own card.
- `CONTEXT.md` and this repository's prose say *resource type*, never *entity*,
  for one of the nine. *Entity* now means only the type of that name.
- The engraved plates move from `public/brand/icons/entities/` to
  `public/brand/icons/resource-types/`.

## Considered and rejected

**Holding the ninth card until its plate exists.** The copperplate set was drawn
when there were eight, and no plate for Entities exists. But a missing card is
the page being wrong about the format, while a missing drawing is the page being
unfinished — and only one of those misleads a reader. The card ships without a
band; `homeContent.test.ts` asserts the exemption by name, so a tenth cannot join
it quietly and the test goes red the day the plate lands.

**Borrowing `scenarios.webp`.** A plate exists for Scenarios, which have no card.
Standing it in under Entities would say the two are the same thing, which is what
the plate set exists to deny — and a stand-in that works is a stand-in that stays.

## Consequences

- `landing.desktop.spec.ts` holds every Product Model card to one height, and a
  card that simply omitted its band measured 24px short. The plate-less card
  therefore renders an **empty band** — same `aspect-video` box, dashed border —
  so it reserves exactly the space its drawing will take. Measured: every band is
  169px, drawn or not.
- **The Screens note was shortened**, from *"A meaningful view, not a route or a
  component"* to *"…not a route or module"*. Three columns are wider than four,
  and at that width every note fits one line except that one, whose final word is
  long enough to wrap — which lifted its whole row and nothing else. The design
  record already claimed three columns fit every note on one line; this makes it
  true.
- The Entities card links to `/docs/entities`, which is live once pdd 0.9.0 ships
  its docs. Until then it is a known dead link, accepted alongside the missing
  plate and backfilled with it.
