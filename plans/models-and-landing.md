# The three models and the landing site: what carries the change

Status: **designed, not started.** Written against `main` at `a657638` and the
landing repository's `add-tests` branch at `6162720`, which pins
`businesslens ^0.8.0` and a Product Report v11 catalog contract.

[Actor is not a resource type](./actor-is-an-entity.md),
[The Entity at the centre](./entity-at-the-center.md) and
[Business Rules](./business-rules.md) change the format. This plan says where
each change is demonstrated and what breaks downstream. **A shape no shipped
model carries is a shape nothing renders, nothing tests, and nobody learns.**

## The principle

- **`test/fixtures/fixture-shop` is the test gate.** Every positive shape
  appears at least once, so the parser, `lint`, the projection and the viewer
  are exercised on the full format by one model. It may be a little artificial
  for it. Negative cases — each new `lint` finding — live in `test/lint.test.ts`,
  which writes broken files beside the fixture, as it does today.
- **`blueprints/content-feed-reader` is the teaching Blueprint.** It carries
  every shape a reader should learn, and only where the product genuinely has
  it. `test/teaching-blueprint.test.ts` holds it to zero warnings and every
  count at two or more.
- **`.businesslens/` is what is true of BusinessLens.** It is rewritten
  mechanically first, then **re-mapped with the shipped `businesslens-map`**,
  because the map skill's two new sweeps have their first real run on the
  product that ships them.

## Coverage matrix

| Shape | fixture-shop | content-feed-reader | self-model |
| --- | --- | --- | --- |
| Entity that acts — person, external | Shopper | Reader, Visitor | Developer |
| Entity that acts — person, internal | Store admin | — | — |
| Entity that acts — system, external | Payment gateway *(new)* | — | AI agent |
| Entity carrying only `acts` | Payment gateway | Visitor | — |
| Named facts | Order: *Subtotal*, *Tax*, *Discount*, *Total charged*, *Margin*, … | Collection, Item, Source | every resource-type Entity |
| `creates` + `to` | Order at checkout → Pending | Collection → Private | re-map decides |
| `changes` with `from` + `to` | Order Pending → Confirmed | Collection Private → Published | re-map decides |
| `changes` with neither | Cart contents | Collection renamed | Product Model delta |
| `removes` + `from` | Cart consumed at checkout | Source unfollowed; saved Item removed | — |
| `reads` | Catalog product browsed | Item read | Product Model viewed |
| Alias — two instances in one Step | merge duplicate Orders *(new)* | move an Item between Collections *(new)* | — |
| Attributed `actor` on a Product Step | *The refund is issued* → store-admin | *The Product creates a private collection* → reader | *writes only what the Developer approved* → developer |
| Unattended Scenario, `unattended` grant | expire an unpaid Order *(new)* | collect on the Product's own schedule | — |
| Journey Step effects with `capability` | browse-and-buy | all four Journeys | all three Journeys |
| Entity target, `effect` + `to` | refund: Order → Refunded | publish: Collection → Published | Product Model changes |
| `permits: []` | Orders are never deleted; a Refunded order is never cancelled | — | — |
| `actors` | store-admin | reader | developer |
| `related`, one hop | Shopper owns Order | Reader owns Collection | — |
| `related`, two hops | Refund ← is repaid by — Order ← owns — Shopper | — | — |
| `self` | Shopper's own delivery address | — | — |
| `when` fact threshold, `at-most`/`over` | refunds at-most 100 | — | — |
| `when` with `entity` | Store settings · *Self-service cancellation* | — | — |
| Target `from` — a move gated by origin | cancel only while Pending | — | — |
| `when.state` on a read | — | Visitor reads while Published or Unlisted | — |
| `when.state` on an information change | edit delivery details while Pending *(new)* | — | — |
| `configuredBy` as a grant and as a value | refunds over the threshold Store settings holds | — | — |
| Derivation via `facts` | Total charged = Subtotal + Tax − Discount | — | — |
| Field-level visibility with `contexts` | Margin on `admin-web::order-console::order-detail` | — | — |
| AND across Rules | *who may change an order* + *refunds need an operator* | — | — |
| Invariant Rule, no `permits` | payment before confirmation; refund never exceeds the charge | membership does not control saving | the other six |
| Composition note — no creation | Catalog product | Source | — |
| Title-match exemptions | — | — | *The Product*, *The Developer* |

The Blueprint carries no threshold, no configuration, no two-hop membership,
no origin-gated move and no prohibition because a feed reader has none. Those
are the fixture's, and the fixture is allowed to be a shop that grew a settings
record for it.

## fixture-shop

Every file changes. In the order the work runs:

1. **`actors/` → `entities/`.** `shopper` — `kind: person`, `acts: external`,
   fact *Delivery address*, relation `owns` → order, one-to-many.
   `store-admin` — `kind: person`, `acts: internal`. New `payment-gateway` —
   `kind: system`, `acts: external`, nothing kept: it posts settlement webhooks.
2. **New Entities.** `refund` — facts *Amount*, *Reason*; states Requested,
   Settled. `store-settings` — facts *Refund approval threshold*,
   *Self-service cancellation*. Order gains the relation `is repaid by` →
   refund, one-to-many, so a path from a Refund walks the inverse.
3. **Order is rewritten.** Facts named: *Items ordered*, *Delivery details*,
   *Subtotal*, *Tax*, *Discount*, *Total charged*, *Margin*, *When placed*.
   *Which shopper placed it* becomes the relation. States gain **Cancelled**.
   `transitions` goes.
4. **Interfaces.** New `payment-webhook.md` — `type: webhook`,
   `actors: [payment-gateway]`. `admin-web` expands and holds the Screen
   `order-detail` directly — one audience, one access mode, so no Experience —
   presenting order and refund, which the field-level Rule's `contexts` and
   the Screen-reach check need. Both storefronts gain the Screen
   `order-status`, presenting order and refund to the shopper.
5. **Capabilities.** `entities` removed from all three. New `settle-payment`
   (webhook), `cancel-order` (storefront and admin-web) and `track-order`
   (storefront). Checkout now leaves an Order **Pending**; settlement confirms
   it.
6. **Scenarios.** `entities:` on every Step. New: *confirm an order when the
   gateway settles* (payment-gateway actor Step), *settle a refund*, *cancel
   your own unpaid order* (shopper, while Pending), *expire an unpaid order*
   (unattended), *merge duplicate orders* (`as: duplicate` moved, `as:
   original` changed), *check an order and its refund* (the two-hop grant,
   exercised). *Refund an order* becomes one Step that creates a Refund
   **and** moves the Order to Refunded — the co-effect the Entity page draws.
   *Complete checkout* gains a Step where the shopper confirms their delivery
   address, attributed and changing shopper.
7. **Rules.** From two to twelve:

   | Rule | Target | `permits` |
   | --- | --- | --- |
   | Payment before confirmation | *unchanged* | — |
   | A refund never exceeds the charge | `refund`, `facts: [Amount]` | — |
   | Total charged | `order`, `facts: [Total charged]` | — |
   | Who may change an order | `order`, `effect: changes` | `related` owns → shopper while Pending; `actors: [store-admin]`; `actors: [payment-gateway]` while Pending; `unattended: true` while Pending |
   | Refunds need an admin | `order`, `changes`, `to: Refunded` | `actors: [store-admin]` with `at-most: 100`; `configuredBy: store-settings` with `over: { configuredBy: store-settings }` |
   | Unpaid orders can be cancelled | `order`, `changes`, `from: Pending`, `to: Cancelled` | owner with `when: [{ entity: store-settings, fact: Self-service cancellation, is: true }]`; `actors: [store-admin]`; `unattended: true` |
   | A refunded order is never cancelled | `order`, `changes`, `from: Refunded`, `to: Cancelled` | `[]` |
   | Orders are never deleted | `order`, `effect: removes` | `[]` |
   | Delivery details are editable while unpaid | `order`, `changes`, `facts: [Delivery details]` | `related` owns → shopper with `when: [{ state: Pending }]` |
   | Margin is for operators | `order`, `reads`, `facts: [Margin]`, `contexts` on `order-detail` | `actors: [store-admin]` |
   | A refund is visible to its shopper | `refund`, `effect: reads` | `related` is repaid by → order, owns → shopper; `actors: [store-admin]` |
   | Shoppers keep their own address | `shopper`, `changes`, `facts: [Delivery address]` | `self: true` |

   *Refunds apply only to existing orders* folds into *A refund never exceeds
   the charge*. Rule ids never open with a verb, and `order` and `refund` are
   both product verbs, which is why two of the titles start with *who* and
   *a*.
8. **Tests.** `test/lint.test.ts` writes `actors/shopper.md` in thirty-three
   places and gains one negative case per finding in the three plans.
   `test/e2e.test.ts` and `test/parsers.test.ts` name `actors/`. The
   redundant-selector warning is a negative case there, never in the fixture.
   The golden fixture still lints with zero warnings.

## content-feed-reader

1. **`actors/` → `entities/`.** `reader` — `kind: person`, `acts: external`,
   fact *Library name*; relations `owns` → collection, `keeps` → item,
   `follows` → source, each one-to-many. `visitor` — `kind: person`,
   `acts: external`, nothing kept.
2. **Facts named** on Collection, Item and Source; `transitions` removed from
   all three; `entities` removed from all ten Capabilities.
3. **`entities:` on every one of 113 Steps.**
4. **New Scenario** *move an item between collections* under
   `organize-collection`, with `as: source` and `as: target`.
5. **Rules.** From four to five:

   | Rule | Target | `permits` |
   | --- | --- | --- |
   | Collection membership does not control saving | *unchanged* | — |
   | Only an owner changes a collection | `collection`, `changes`; `collection`, `removes` | `related` owns → reader |
   | Reading state is private to its Reader | `item`, `changes` | `related` keeps → reader |
   | Unlisting revokes anonymous access | `collection`, `reads` | owner; `actors: [reader, visitor]` while Published |
   | Items arrive by schedule or on follow *(new)* | `item`, `creates` | `unattended: true`; `actors: [reader]` |

6. **`README.md`** and `docs/from-a-blueprint.md` stop saying *then its
   Actors*.
7. **`test/teaching-blueprint.test.ts`** counts change: `actors` leaves,
   `entities` becomes 5, `capabilityScenarios` 26, `businessRules` 5. The
   Unlisted state's prose changes to match the Rule: the address serves
   nothing until the owner publishes again.
8. **Re-published** with `npm run blueprints:publish` once the catalog accepts
   v13. `scripts/blueprints-check.mjs` gates it as before.

## The self-model

Two passes, in this order.

**Mechanical.** `actors/developer.md` and `actors/ai-agent.md` move to
`entities/` with `kind` and `acts`. `entities/actor.md` is deleted: it
modelled the resource type this release removes. The other twelve
resource-type Entities get their 47 facts named, and four of them change what
they say — Entity loses *the transitions between them with their causes*,
Capability loses *the Entities it changes*, Business Rule gains *who may act
and under what condition*, and both Scenario types gain *what each Step does to
the Product's things*. `entities` leaves every Capability. Every one of 151
Steps gets `entities:`.

**Re-map**, with the shipped `businesslens-map`, as the last step of the
release. It is fine to re-map completely. What must be true afterwards:

- The Entities that act are Developer and AI agent, and the Steps that
  attribute to them read correctly under the title-match exemptions for *The
  Product* and *The Developer*.
- The Capabilities that changed have Scenarios saying so: `lint-product-model`
  rejects a Step nobody may perform and closes an operation a Rule forbids;
  `view-product-model` reads an Entity's lifecycle and its constraints;
  `explore-product-topology` reads *what changes what*;
  `verify-model-alignment` reports an unenforced grant as not established;
  `map-established-behavior` completes the Entities each Step touches and turns
  an authorization check into a grant; `decide-intended-behavior` runs the same
  Entity sweep.
- At least one Rule carries a true grant. The candidate is *product meaning
  changes need explicit approval*, on Product Model changes; the re-map decides
  whether the Developer is its actor or its condition, since the AI agent
  performs the write and the Developer approves it.
- `coverage.md` keeps its `unmapped` honest about the exported Nuxt layers.

**What the re-map decided** (done, lints clean):

- The Product model carries no States. Its coverage status is authored with it
  and travels with it — an open or pull creates a model in whatever status the
  Blueprint carried — so it is a named fact, *Coverage*, not a lifecycle the
  Product moves it through.
- Two Entities joined: *Blueprint* (Exported → Proposed, created by export and
  contribute, read by open and pull) and *Skill installation* (created by
  install, changed by update). The two Actors are `entities/developer.md` and
  `entities/ai-agent.md`.
- *Product meaning changes need explicit approval* targets the Product model's
  creates, changes, and removes and grants the Developer alone. Every write of
  product meaning is a Product Step attributed to the Developer; the AI agent
  proposes and inspects, and holds no grant.
- *The report never edits the model* is the `permits: []` example: changes to
  the Product model, scoped to the local report Interface, forbidden to
  everyone.
- Three Scenarios were added for the changed Capabilities: `lint` fails a Step
  no grant permits, `view` reads a thing's lifecycle and who may move it, and
  `verify` reports an unenforced grant.
- The title-match lint gained one refinement the self-model forced: a title
  inside a longer declared title is covered by it, and *the Product* is scrubbed
  case-insensitively.

## The landing repository

`businesslens/landing` hosts the docs site, the catalog and its card grid, and
renders Blueprints through the exported `businesslens/nuxt/report-viewer`
layer. It has no `.businesslens/` of its own. Paths are relative to that
repository.

| | Where | Change |
| --- | --- | --- |
| L1 | `shared/contracts/blueprints.ts` | Import the unversioned `ProductReportSchema` and `REPORT_SCHEMA_VERSION` instead of `ProductReportV11Schema`, and derive the media type's `version=` from it, so the next bump is a dependency update rather than a rename. `BlueprintStatsSchema.actors` becomes `entities`. |
| L2 | `server/catalog/projection.ts` | `stats.actors` reads `report.counts.actors`, which leaves the report. Use `counts.entities`. |
| L3 | `server/catalog/artwork.ts` | Per-Experience `actors` stays: `experience.actorIds` survives as a role reference. The fallback window's `counts.actors` becomes the count of `report.entities` that `acts`. |
| L4 | `app/utils/blueprints.ts` | The stat row shows *Entities* where it showed *Actors*. |
| L5 | `app/utils/homeContent.ts` | The Actors card goes; eight resource types. ADR-0014 chose three columns for nine. Recommend two rows of four and a landing ADR superseding 0014: *eight resource types, and acting is a facet of Entity*. |
| L6 | `app/utils/faqContent.ts` | Line 90 lists the resource types; line 200 says the Capability causes each move, which is now the Step; line 276 says *the Actor*, which is now *an Entity that acts*. |
| L7 | `app/components/landing/hero/MapHero.vue:74`, `app/pages/index.vue:42` | Alt texts enumerate the resource types. |
| L8 | `public/brand/icons/resource-types/actors.webp`, `docs/design/experiences/marketing.md` | The Actors plate retires. The Entities plate is still owed; ADR-0014's exemption stands. |
| L9 | `tests/e2e/landing.spec.ts:60`, `tests/e2e/report-parity.spec.ts:73`, `tests/integration/blueprintArtwork.test.ts`, `tests/integration/blueprintProjection.test.ts` | Card list, rail sections, and count assertions name Actors. |
| L10 | `tests/fixtures/catalog/report.json` | A v11 `example-task-tracker` with zero Entities. **Done differently:** migrated in place to v13 rather than regenerated from a pdd export, because `tests/screenshots/site-screens.spec.ts` records why the fixture is deliberately not a pdd Blueprint — wording and `generatedAt` churn. Its three Actors are Entities that act, and it gained a Task with a three-state lifecycle composed from its Steps, a `related` grant (the owner closes), an `actors` grant (a lead reopens), and a fact-scoped `when` grant (a member takes a task nobody holds). |
| L11 | `package.json` | Bump `businesslens` to the release carrying v13. |
| L12 | `content/blog/*.md` | Three posts name Actors as a resource type. Dated content; optional. |

`/docs/actors` disappears; the sidebar rebuilds from frontmatter and only L5
links to it.

## Order of operations

1. This repository: the three plans, fixture-shop, the Blueprint, the
   mechanical self-model pass, `npm run verify`, the self-model re-map, release
   to npm.
2. Landing: L1–L11, redeploy.
3. This repository: `npm run blueprints:publish`.

Between 1 and 2 the catalog refuses a v13 report and `pull` serves v11
Blueprints to a v13 CLI, which refuses them by name. Accepted.
