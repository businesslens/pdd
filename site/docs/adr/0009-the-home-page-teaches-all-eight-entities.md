# The home page teaches all eight model entities, nested

Status: the argument for teaching the model's own nouns in their own nesting
remains current; the count and the vocabulary below were superseded by
[ADR-0014](./0014-the-home-page-teaches-nine-resource-types.md).

`app/pages/index.vue:42-59` showed four groupings — "Actors and experiences", "Journeys and
scenarios", "Features and rules", "Intent and evidence". The first three pair real entities. The
fourth names none: the PDD Product Model documentation is explicit that intent,
evidence, References, taxonomies, and Coverage are not standalone Product entities.

The home page now shows the canonical eight — product, actors, experiences, domains, features,
journeys, scenarios, business rules — in the nesting from that page, using its words.

## Considered and rejected

**Keeping the four groupings.** Fewest words on the page, and they scan. But they teach vocabulary
the documentation contradicts. That is the
exact drift [`CONTEXT.md`](../../CONTEXT.md) exists to prevent, and it had gone unnoticed because
nothing checks marketing copy against the glossary.

**The eight in a flat grid.** Honest about the names, easier on a narrow screen, but it discards
the containment — and the containment is the insight. A scenario sits inside a journey because the
journey is the durable goal and the scenario is one observable path to it; that relationship is
what makes scenarios an acceptance contract rather than a list of test cases. Flattened, the model
reads as eight nouns of equal weight, which is what makes people think it is heavy.

## Consequences

- The tree follows the owning Product Model pages in `pdd/docs/`. They live in
  another repository, so the cross-repository vocabulary coupling remains real.
- Marketing copy is now bound by the glossary the same way documentation is. Inventing a friendlier
  grouping is a vocabulary change, and vocabulary changes review `CONTEXT.md`
  and the affected Product Model pages together.
- Eight items is more than the section held before, so the layout carries the weight rather than
  the copy shedding entities to fit. If it will not fit, the fix is the layout.
