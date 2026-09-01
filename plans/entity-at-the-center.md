# The Entity at the centre: what the model says about the things a Product keeps

Status: **designed, not started.** Settled across thirteen grilling rounds
against `main` at `2f366fe`, folder schema 7, Product Report v11.

Ships in one release with
[Actor is not a resource type](./actor-is-an-entity.md), which is designed and
owns the permission model. Read that one first: it decides that there is a
single resource type, so every "Entity" below includes what used to be an Actor.

## The whole design in three sentences

> **The Entity says what a thing is and what it can be.**
> **Steps say what happens to it.**
> **Business Rules say who may.**

Nothing is stated twice, nothing is inferred from a neighbour, and the word
*may* appears in exactly one place in the format.

## The measurement

The Entity is nominally the centre of the model and factually absent from most
of the acceptance surface. Counting Steps that name any Entity, across all three
models this repository ships:

| Model | Steps | Steps naming an Entity | Steps whose *text* names an Entity declared nowhere |
| --- | --- | --- | --- |
| `.businesslens` (self) | 151 | **13 (9%)** | 6 |
| `test/fixtures/fixture-shop` | 22 | **4 (18%)** | 10 |
| `blueprints` | 113 | **27 (24%)** | 62 |

The misses are ordinary — *"The admin opens the order in the console"*,
*"The Product preserves the cart"*, *"The item is removed from that collection"*.
Each names an Entity in English while the model says nothing.

Neither cause is the author's judgment. **The skills never ask for it**:
`businesslens-map` spends a paragraph on *how many* Entities to create and not
one word on naming them on a Step; the word appears once in the whole skill.
And **the resources that owned the relationship said the least**: a Capability
declared `entities: [id, …]` — thirteen ids on `map-established-behavior`, with
no verb, no effect, no state. `productTopologyGraphs.ts:379` records the
consequence: Capability→Entity edges were dropped from the topology because
thirteen identical unlabelled edges draw nothing.

## What is stored

### The Step is the only source of truth about what happens

**`entities:` is required on every Step**, and a Step touching nothing writes
`entities: []`. Silence becomes impossible; an omission becomes a claim that can
be reviewed, linted, and contradicted by code.

```yaml
- text: The Reader moves the item from one collection to another
  kind: actor
  actor: reader
  entities:
    - { entity: collection, as: source, effect: changes }
    - { entity: collection, as: target, effect: changes }
    - { entity: item,                   effect: reads   }

- text: The Product cancels the order and opens a refund
  kind: product
  actor: store-admin
  entities:
    - { entity: order,  effect: removes, from: Confirmed }
    - { entity: refund, effect: creates, to: Pending     }
```

`effect` is `creates | changes | removes | reads`, defaulting to `changes`.
State keys are explicit and never inferred from an adjacent Step:

| effect | keys | required |
| --- | --- | --- |
| `creates` | `to` | when the Entity declares states |
| `changes` | `from` + `to`, or neither | both or neither — never one |
| `removes` | `from` | when the Entity declares states |
| `reads` | — | never carries state |

`changes` with neither key is an information change — the rename case.

**`as` is a scenario-local instance alias**, optional, lowercase kebab, its id
its own label. Entries without one are a single unnamed instance. An
`(entity, as)` pair appears at most once per Step — so one observable act
touching two collections is one Step, which the old one-per-Entity rule
forbade only because the model had no instance identity.

The report projection had already voted for the merged list:
`ScenarioStepMentionView` models a read as a fourth effect and
`BlrStepEntity.vue` renders all four through one chip. Only the authored format
still split `changes` from `reads`. Every rule that made the two asymmetric
survives: a read never counts as a change and never saves an Entity from being
an orphan.

### The Entity keeps only what nothing else can state

```markdown
---
domain: ordering
relations:
  - { entity: catalog-product, verb: was placed for, cardinality: many-to-many }
---

# Order

A shopper's confirmed intent to buy.

## Information kept

- **Items ordered** — the items and their quantities
- **Total charged** — the amount taken from the shopper

## States

### Pending
### Confirmed
```

**`transitions` is deleted.** Two reasons, and the second is the stronger one.
It stated a second time what a Step already states. And a per-Entity list
structurally cannot express a combined lifecycle — *settling a payment confirms
an Order **and** creates a Shipment* is one act on two things, which only a Step
can say. Steps are not merely an acceptable home for the lifecycle; they are the
only home whose shape fits it.

**`## Information kept` facts gain names.** A fact is `- **Name** — prose`, cited
by that exact name. This is not a new idiom: `## States` already works this way,
where an H3 titled `Pending` is cited as `from: Pending`. Only a Business Rule
may cite a fact; Steps and Screens cannot. A fact is **addressable, never
typed** — addressable is what field-level permission needs, typed is a data
model, and *"the moment you write a type, you have left product meaning"*.

### What every other resource says

- **Capability `entities` is deleted.** It duplicated its own Steps. `lint`
  refuses a file that still carries it with a message naming the replacement —
  the precedent set for `build` and the bare command spellings. No deprecation
  window: a schema-7 model is rejected by the loader anyway.
- **Screen `entities` stays authored.** A Screen has no Steps and appears in no
  Scenario as a performer, so nothing anywhere else states what it presents. Its
  list duplicates nothing. This is the rule in general: **a resource with an
  acceptance surface must not restate what its Steps demonstrate; a resource
  without one authors its own facts.**
- **A Step's `actor` becomes valid on Product and condition Steps**, meaning
  *the Actor this Step is attributable to*; `kind` says whether they performed
  it or the Product did it for them. A Product Step with no actor is the Product
  acting on its own. This replaces a separate `authority` field that made every
  author choose between two Actor-shaped keys.

## The permission model

Owned by [Actor is not a resource type](./actor-is-an-entity.md#the-permission-model)
and summarised here only where it touches Steps.

Business Rules are the **only** constraint layer and are open by default: an
operation no Rule mentions is unconditional. `appliesTo` gains an Entity target,
and `permits` is a list of grants — grants are OR, keys within a grant are AND.

Two couplings run back into this plan:

- **A Step's `actor` is who *did*; a grant's `actors` is who *may*.** A Step
  satisfying no grant is a hard error, ungraded. Where a Rule restricts an
  operation, the Step performing it **must** name an actor.
- **`unattended` is a grant**, checked against the Scenario's existing
  `unattended: true` marker rather than any new Step key.

## What `lint` reports

**Deleted** — each checks a field that no longer exists:

| Site | Finding |
| --- | --- |
| `lint.ts:503` | Capability names missing entity |
| `lint.ts:545` | transition names a Capability that does not list this Entity |
| `lint.ts:589` | undemonstrated transition |
| `lint.ts:678` | Capability declares Entities but no Step changes any |
| `lint.ts:809` | Capability "X" does not declare Entity "Y" |
| `lint.ts:824` | no transition reaches this state by this Capability |
| — | `transitions` required exactly when `## States` is present |

**Changed:**

- **No orphans** (`lint.ts:644`) — stands, with `changedBy` derived from Steps.
- **Missing-entity reference** (`lint.ts:795`, `lint.ts:801`) — collapse into one
  check over the merged list.
- **Actor placement** (`lint.ts:828`) — inverts, from *`actor` is only valid on
  an Actor Step* to *an Actor Step requires one; others may carry one*.

**Added — completeness:**

- **`entities:` missing from a Step** — an error. The key is required; the list
  may be empty.
- **A Step whose `text` names a known Entity title and declares it nowhere.**
  Graded by `coverage.status`. Not the undefined-vocabulary check abandoned in
  [`plans/entity.md`](./entity.md) for noise — that matched all prose words and
  surfaced `confirms(10) publication(9)`. Matching only known Entity **titles**
  flags 6 of 151 Steps in the self-model. One measured hazard: an Entity whose
  title collides with the model's own vocabulary — BusinessLens models `Product`
  as an Entity and every Product Step opens with "The Product", producing 63 of
  its 69 raw hits.

**Added — integrity:**

- **State keys** — `from`/`to` name declared states; `changes` carries both or
  neither; `to` required on `creates` and `from` on `removes` when the Entity has
  states; `reads` carries neither; an `(entity, as)` pair appears once per Step.
- **Step chaining, per instance** — where a prior Step in the same Scenario left
  an `(entity, as)` pair in a state, this Step's `from` must equal it. The
  message names the way out: *"if these are different collections, give them
  aliases."* Guessing becomes a prompt to be explicit.

**Added — composition warnings**, replacing the deleted undemonstrated-transition
finding. All four are derived by composing every Scenario:

- **Unreached state** — declared, and no Step ever leaves anything in it.
- **Unproduced origin** — a Step declares `from: Confirmed` and nothing produces
  Confirmed.
- **No creation** — an Entity with states that no Step ever creates.
- **No termination** — nothing ever removes it. A note, not a fault.

**Added — rules:**

- A Step whose `actor` is outside `permits.actors`; a restricted operation on a
  Step with no `actor` in an attended Scenario; an unattended Scenario performing
  an operation whose Rule sets `unattended: false`; a Screen no permitted Actor
  reaches; a Rule target that does not resolve.

## What is presented

- **The Entity page gets its state machine drawn**, on the existing
  `BlrFlowCanvas`, composed from everything the model holds: **nodes** from
  `## States`, **arcs** from Steps, **arc labels** from each Step's Capability,
  **arc constraints** from the Business Rules selecting that operation — so an
  arc reads *ended by `cancel-order` · store-admin only* — and **co-effects**,
  so an arc reads *Pending → Confirmed · `settle-payment` · also creates
  Shipment*. That last one is the only place the model makes a combined
  cross-entity lifecycle visible, and it costs no new authoring. Unreached
  states are drawn as unreached nodes.

  This reverses the decision in `BlrResourceBody.vue` — *"folding the moves into
  the state cards made the two indistinguishable"* — which solved the wrong
  problem. The answer to *a reader cannot count the transitions* is not *never
  draw the machine*.

- **A Capability page gets an aggregate line per Entity** —
  *Order · creates → Pending · changes → Confirmed · 3 Scenarios* — replacing
  today's unqualified chip row. Deliberately not a lifecycle fragment per
  Entity: `map-established-behavior` touches thirteen, and thirteen fragments is
  what "chrome scales with the collection" forbids. Arriving at the Entity page
  *from* a Capability highlights that Capability's arcs instead.

- **A Journey states what it leaves behind**, derived, beside its
  `## Success criterion`.

- **A new named Topology view** — Capabilities → Entities, edges labelled by
  effect. Not an extension of `what-it-keeps`: adding Capabilities changes what
  that view means, and filters narrow a view that already means something.
  Changes-only, reads behind a filter.

- **Entity leads the rail and takes hue slot 0**, with **Domain keeping slot 4**.
  An earlier draft demoted Domain to the neutral umber, because eight hues plus a
  neutral could not cover twelve kinds. Deleting `actor` as a kind frees one, so
  that demotion is no longer needed. The Actors rail row becomes an *acts* facet
  over the one Entities collection — see
  [Actor is not a resource type](./actor-is-an-entity.md#what-disappears).

- **Instance aliases are rendered**, so a Step reads *collection (source)
  changed · collection (target) changed* rather than the same word twice.

## What the skills do

- **`businesslens-map` gains a sweep** after Steps are drafted: re-read every
  Step's text against the Entity list and complete the `entities` key. A sentence
  inside a paragraph is what produced 9%.
- **`businesslens-verify` verifies the Step's claims** — that the code really
  does create, change, remove or read that Entity and move it between those
  states — **the Rules' `permits`**, and, now that `entities: []` is an explicit
  claim rather than silence, **an empty list the code contradicts**. That last
  one was refused earlier as inference; a required key turns it into a
  falsifiable claim.

  An enforcement `verify` cannot locate is reported as **not established**, never
  as `code-right`. The rest of what `verify` does with Rules — grants,
  `configuredBy`, and the `when` comparison `lint` deliberately leaves
  unchecked — belongs to
  [the other plan](./actor-is-an-entity.md#what-verify-does).
- `agents/openai.yaml` follows the skill.

## Release

Breaking, one release together with
[Actor is not a resource type](./actor-is-an-entity.md): **folder schema 7 → 8**,
**Product Report v11 → v12**, all three shipped models rewritten.
`spec/format.md` and `spec/report.md` change **before** the parser, linter and
projection; `docs/entities.md`, `docs/capabilities.md`, `docs/journeys.md`,
`docs/screens.md` and `docs/business-rules.md` follow. `docs/actors.md` is
deleted by the other plan, folded into `docs/entities.md`.

**ADR-0018 — Steps are the single source of truth; the Entity describes, Rules
constrain.** Records what is superseded, not only what is added: ADR-0011 keeps
its half (a thing's states belong to the thing); ADR-0014 keeps relations in
frontmatter and loses transitions entirely. ADR-0016 and ADR-0017 belong to the
other plan.

## Design record: what was tried and rejected

Recorded because the next reader will propose them again.

**An `operations` table on the Entity**, enumerating every Capability that may
create, change, remove or read it, deny-by-default. Rejected: it was the deleted
Capability `entities` list moved to the other side and enriched; it restated
what Steps already say; and its gate caught only internal inconsistency — a Step
claiming a false `creates` is a *truth* error, and truth is `verify`'s domain
against source, not `lint`'s against the model. This repository has made the
same mistake before and written it down: *"The threshold had been invented so the
rule would be computable, which was optimising determinism over truth."*

**Deriving an arc's origin from Step order.** Rejected for explicit `from`:
inference from a neighbouring Step is exactly the implicit reading this design
removes, and explicitness turns the restatement into a checkable guard.

**Making the unreached state an error for a `complete` model.** Proposed as a
determinism patch — forcing coverage to reach every state would pull two authors
back together. Withdrawn: surfacing what the composed machine is missing is the
honest version, and the four composition warnings above do it without coercing
coverage.

**Dropping the chaining check.** Proposed once the two-collections example showed
it firing falsely. Withdrawn in favour of instance aliases, which make the check
correct rather than removing it.

**The accepted cost.** Two authors with different Scenario sets derive different
lifecycles over the same states, and `plans/model-review.md` measured that
divergence as large — capability granularity 4x, journeys 4-vs-5 with half
disjoint. This is a real loss against ADR-0002's top axis. It is taken because
the alternative shape cannot express a cross-entity lifecycle at all, and
because the composition warnings surface the resulting gaps rather than hiding
them.

## Known weak point

Every derived reading here — the state machine, the Capability aggregate, the
Journey's "leaves", the topology view — is only as complete as the Steps. Four
things defend that, and only the first three exist before code is read:

1. `businesslens-map`'s sweep authors it.
2. `entities:` is a **required** key, so an omission becomes an explicit
   `entities: []` rather than silence.
3. Q8's `lint` check matches known Entity **titles** against Step prose.
4. `verify` contradicts a false `entities: []` against source.

The gap that remains: a Step that touches an Entity and does not name it in its
text is invisible to (3). The measurement counted the Steps that *do* name one —
it did not measure that inverse, and it cannot be measured from the models alone.
(2) is what converts it from an unfalsifiable silence into a claim (4) can catch.
