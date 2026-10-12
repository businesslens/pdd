# Eight resource types, and acting is a facet of Entity

Supersedes the count in
[ADR-0014](./0014-the-home-page-teaches-nine-resource-types.md). Its argument —
that the page teaches the model's own nouns in the model's own nesting, never a
friendlier grouping the documentation contradicts — is unchanged, and is again
why this is an ADR rather than a quiet edit.

## What changed upstream

One thing, in the final `businesslens/pdd` 0.9.0 contract, recorded there as
ADR-0016 *One resource type: Actor is the subset that acts*.

**Actor stopped being a resource type.** A person or system that acts on the
Product is an Entity carrying `acts: external|internal` and `kind:
person|system`; everything else about it — what the Product keeps, its states,
its relations — is what any Entity has. There is no `actors/` directory. The
word Actor survives as a role: an Entity that acts *is an Actor* wherever it
acts — on a Scenario Step, an Interface, a Journey, a Business Rule grant.

The same release made Steps the single source of truth for what changes a
thing, and gave Business Rules the vocabulary to say who may. Neither changes
the card list; both change what two cards say.

## Decision

- The Product Model section teaches **eight resource types**: Entities,
  Interfaces, Experiences, Screens, Domains, Capabilities, Journeys, Business
  rules — in the order `docs/product-model.md` now defines them, which puts
  Entities first because the people the product is for live there.
- The grid runs **four columns**, so eight fills two clean rows. Three-for-nine
  was ADR-0014's arithmetic, and it does not survive eight.
- The Actors card goes. Its plate, `resource-types/actors.webp`, retires with
  it: a plate for a resource type the format no longer has would be the page
  being wrong about the format in a picture.
- The Entities card's note says what the card now covers: *What the product
  keeps, and who acts on it*. The Business rules note gains *and who may act*.
- The catalog card's stat row shows **Entities** where it showed Actors, because
  the Product Report no longer counts Actors apart from the Entities they are.
  The artwork's per-Experience Actor count stays: an Experience still names who
  it serves.
- The catalog contract imports the unversioned `ProductReportSchema` and derives
  the media type's version from `REPORT_SCHEMA_VERSION`, so the next contract
  bump is a dependency update rather than a rename in three files.

## Considered and rejected

**Keeping an Actors card that links to Entities.** A card is a resource type,
and the page would then teach nine when the format defines eight — the exact
error ADR-0014 corrected in the other direction.

**Standing the retired Actors plate in for Entities.** Three figures of
different standing say *people*, and an Entity is an order as much as a
shopper. A stand-in that works is a stand-in that stays. The Entities plate is
a scene instead: a steward taking the tally of a storehouse, with the goods, a
sheep, a boy and a labourer all in one count, so the plate says things and
people at once. Until it landed the card rendered the empty band ADR-0014
specified, and `homeContent.test.ts` kept the exemption named.

## Consequences

- The test fixture at `tests/fixtures/catalog/report.json` is a Product Report
  v13. Its three Actors are Entities that act, and it gained a fourth Entity —
  the Task — with a lifecycle composed from its Scenarios' Steps and two Rules
  that say who may move it, so the catalog renders every part of the format it
  serves without pulling a Blueprint from a pdd checkout.
- `/docs/actors` disappears from the docs site once pdd publishes; the sidebar
  rebuilds from frontmatter and only the retired card linked to it.
- The `businesslens` dependency must move to the release carrying Product
  Report v13 before this deploys. Until then the catalog refuses a v13 report,
  and `pull` serves v11 Blueprints to a v13 CLI, which refuses them by name.
  Accepted in the format repository's plan.
