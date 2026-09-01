# Actor is not a resource type, and permission is a Business Rule

Status: **designed, not started.** Settled across four grilling rounds against
`main` at `2f366fe`, folder schema 7, Product Report v11.

Prerequisite for [The Entity at the centre](./entity-at-the-center.md). Both
ship in one release; the permission model spans them and is owned here.

## The two sentences

> **There is one resource type: the Entity. "Actor" is the word for the subset
> that acts.**
>
> **Business Rules are the only place the word *may* appears.**

## What is wrong today

**`owner` names nothing.** The Blueprint's `collection.md` uses the word five
times — *"an **owner** curates"*, *"The name its **owner** gave it"*, *"The
order the **owner** arranged its items in"*, *"Visible only to its **owner**"*,
*"discoverable as the **owner's**"* — and it maps to no resource. `reader.md`
says *"Each Reader has one private library"*, also prose. The model cannot say
who owns a Collection, and no Rule can say only they may publish it.

**The workaround has zero users.** `## Information kept` was added to Actors so
a Reader's reading position had a home *"without modelling the Reader twice"*.
**None of the six Actor files across all three shipped models uses it** —
including the Reader, the motivating example.

**And the justification is empirically false.** `docs/actors.md` says *"An Actor
is who acts; an Entity is what is acted upon. The same participant is never
modelled twice."* A Reader is acted upon constantly. The split is what forced
the bolted-on section that nobody used.

## The change

**One collection.** `actors/` disappears; its files move to `entities/`. One id
namespace. An Entity that acts says so:

```yaml
# entities/reader.md
kind: person
acts: external
relations:
  - { entity: collection, verb: owns, cardinality: one-to-many }
---
# Reader
## Information kept
- **Reading position** — how far through each item they are
## States
### Active
### Suspended
```

```yaml
# entities/payment-gateway.md — acting is reason enough to exist
kind: system
acts: external
```

```yaml
# entities/employee.md — a person the Product keeps records about, who never acts
kind: person
```

```yaml
# entities/order.md — neither
```

- **`kind`** is optional on every Entity, from the closed list `person | system`,
  said only where true. An Order says nothing, because *it's a thing* is the
  default. This is what lets a payroll Employee finally state what it is —
  something only Actors could do before.
- **`acts`** carries the boundary as its value: `external` or `internal`. It
  replaces `relationship`, whose name collided with `relations` — one meant
  *which side of the Product boundary*, the other *associations between things*,
  and putting both in one file made the collision unreadable.
- **The Entity content rule relaxes** to *at least one of `## Information kept`,
  `## States`, or `acts`*.
- **No elevation and no demotion.** A thing that starts acting gains one field.
  There is no file move, no id change, and no migration — which is the whole
  reason for one collection rather than two.

### When something acts

Two independent questions, neither ranking the other. **Does the Product keep or
reason about instances of it?** — everything modelled does; that's why everything
is an Entity. **Does it initiate, with a goal or privilege of its own, and must
you keep a stable inbound contract for it?** — then it `acts`.

| | keeps / reasons about | initiates under a contract | |
| --- | --- | --- | --- |
| Reader | yes | yes | Entity + `acts` |
| Store admin | yes | yes | Entity + `acts` |
| Payment gateway | reasons about | yes — posts webhooks | Entity + `acts` |
| AI agent harness | reasons about | yes | Entity + `acts` |
| Order | yes | no | Entity |
| Employee (payroll) | yes | no — never signs in | Entity |
| Feed source the Product polls | yes | no | Entity |
| An internal service with its own credentials | no | **no — you keep no contract with your own component** | not modelled |
| The Product's own scheduler | no | no — that is `unattended` | not modelled |

The third clause is what bounds *privilege*. **A privilege that exists only in
code is authorization, not product meaning**, so *"service X may cancel orders,
service Y may not"* is deliberately unsayable. Recorded, not discovered later.

Every system Actor surviving this test is external. `kind: system` with
`acts: internal` may be an empty combination — worth watching, not forbidding.

## What disappears

| Where Actor appears as a type | After |
| --- | --- |
| `actors/` collection | gone — files move to `entities/` |
| `docs/actors.md` | gone — folded into `docs/entities.md`, landing near 300 lines, the size of `capabilities.md` |
| `ENTITY_KIND_META.actor` | gone — one fewer kind |
| The **Actors** rail row | gone — one Entities collection, an *acts* facet, acting Entities grouped first |
| `ActorView`, `actorIds`, actor cards and facts | gone — Entity carries them |

**The word survives where it names a role**, in `steps[].actor`,
`interfaces.actors`, `experiences.actors`, `journeys.actors`, `permits.actors`
and the facet. An Actor is what an Entity *is being* in that position; what was
wrong was treating it as a kind of file. `by` was the alternative and it collides
with `appliesTo.by`.

**A hue frees up.** With `actor` gone there are eleven kinds for ten slots
instead of twelve, so **Entity takes slot 0 outright and Domain keeps slot 4** —
the demotion of Domain planned in the Entity work is no longer needed.

**The no-orphans rule has to admit acting.** Today an Entity must be changed by a
Capability or presented by a Screen. A payment gateway does neither. The rule
becomes *changed, presented, **or** named as an actor*.

## The permission model

Business Rules are the only constraint layer, and they are open by default: an
operation no Rule mentions is unconditional.

### `appliesTo` gains an Entity target

```yaml
appliesTo:
  - type: entity
    id: order
    effect: removes          # optional narrowing
    facts: [Margin]          # optional — a named fact, for field-level rules
    contexts: [{ place: web::workspace::order-detail }]   # optional — place scope
```

Optional narrowing mirrors how `contexts` already narrows a behavioral target.
No new target type. **Entity targets are exempt from the single-target warning**,
whose two suggested alternative homes — a `condition` Step, a Scenario Outcome —
do not exist for a permission.

### `permits` is a list of grants

**Grants are OR. Keys within a grant are AND.** Nothing is implicit, and both
operators are available without either being named:

```yaml
# the owner, or an admin
permits:
  - { actors: [store-admin] }
  - { related: [owns] }

# an admin who is also the owner
permits:
  - { actors: [store-admin], related: [owns] }

# the owner under £100; above that, an admin
permits:
  - { related: [owns],       when: { fact: Total charged, under: 100 } }
  - { actors: [store-admin], when: { fact: Total charged, over: 100  } }
```

A Rule needs at least one grant. `permits: []` is an error — *nobody may* is
already expressed by the lifecycle simply not having that operation, and
*cancel only before fulfilment* likewise, by the machine having no `removes`
from Fulfilled.

| Grant key | Says |
| --- | --- |
| `actors` | these Actors may |
| `related` | whoever stands in this relation to the instance may |
| `when` | only when this condition holds |
| `unattended` | the Product's own schedule may |
| `configuredBy` | gated, but by data the Product does not own |

### `related` is a path

A list of declared verbs from the targeted Entity to an acting one. One hop
covers ownership; two cover the membership shape that most B2B products have.

```
collection  ←—owns—  reader (acts)
```
```yaml
appliesTo: [{ type: entity, id: collection, effect: changes, to: Published }]
permits:   [{ related: [owns] }]
```

```
document  ←—contains—  workspace  —has member→  user (acts)
```
```yaml
appliesTo: [{ type: entity, id: document, effect: changes }]
permits:   [{ related: [contains, has member] }]
```

Direction needs no notation: a verb is declared once per entity pair, so from
`document` the verb `contains` has exactly one relation it can mean. `lint`
checks each verb exists, each hop connects to the next, and the last hop lands
on an Entity that acts. **It never touches an instance.**

### `when` is a condition, and facts stay untyped

```yaml
when: { fact: Total charged, over: 100 }                               # hard-coded
when: { fact: Total charged, over: { configuredBy: approval-policy } } # customer-set
when: { entity: workspace-settings, fact: Approval required, is: true } # feature flag
```

**The operator implies the comparison; the fact declares no type.** `lint` checks
the fact and any named Entity resolve, and nothing more — checking that
`Total charged` holds a number is `verify`'s job against code, and requiring the
Entity to declare it is the type system that
*"the moment you write a type, you have left product meaning"* forbids.

`when` defaults to a fact of the targeted Entity and may name another, which is
how configuration and feature flags work: the threshold or flag is a fact of a
settings Entity and the Rule reads it.

**Six operators**: `over`, `under`, `is`, `is-not`, `present`, `absent`.
Deliberately not `at-least`/`at-most` — they are `over`/`under` with an
off-by-one argument, and offering both guarantees two authors write one rule two
ways, which is the determinism axis ADR-0002 ranks first.

### What the common permission shapes look like

| Shape | Expressed |
| --- | --- |
| Role | `- { actors: [store-admin] }` |
| Ownership | `- { related: [owns] }` |
| Workspace membership | `- { related: [contains, has member] }` |
| Owner or admin | two grants |
| Admin *and* owner | one grant, two keys |
| Value threshold | `when: { fact: …, over: 100 }` |
| Configurable threshold / feature flag | `when: { entity: settings, fact: …, is: true }` |
| Gate the Product doesn't own | `- { configuredBy: role }` |
| Field-level visibility | `appliesTo: [{ …, facts: [Margin] }]` |
| Place-scoped | `appliesTo: [{ …, contexts: [...] }]` |
| Unattended behaviour | `- { unattended: true }` |
| Screens | at least one Actor reaching the Screen must be permitted |
| *Never deletable* / *only before fulfilment* | not permissions — the lifecycle has no such operation |

### How a modelled product's own RBAC lands

A product's permission feature is product behaviour, not this layer. **Role**
becomes an Entity with its own lifecycle, `assign-role` a Capability, and this
layer constrains who may create a Role.

| The product has | It is | Where it lands |
| --- | --- | --- |
| A fixed, shipped set of roles | a closed vocabulary | Entities that act — `permits.actors` works directly |
| User-defined roles created at runtime | instances | Entity `Role` — never one Entity per customer role |
| ABAC policies on attributes | instances | Entity `Policy`, and the Capabilities that define and evaluate it |

## What `lint` reports

**Added — structure:**

- An Entity with none of `## Information kept`, `## States` or `acts`.
- `kind` outside `person | system`; `acts` outside `external | internal`.
- An `actor` reference — on a Step, Interface, Experience or Journey — naming an
  Entity that does not `acts`.
- An Entity neither changed, presented, nor named as an actor (the widened
  orphan rule).

**Added — rules:**

- A Rule with no grants.
- A `related` path whose verb does not exist, whose hops do not connect, or whose
  last hop lands on an Entity that does not act.
- A `when` naming a fact or Entity that does not resolve; an operator outside the six.
- A Rule target that does not resolve, including a named fact.
- A Step whose `actor` satisfies no grant; a restricted operation on a Step with
  no `actor` in an attended Scenario; an unattended Scenario performing an
  operation no grant permits it; a Screen no permitted Actor reaches.

**Removed:** everything checking `actors/` as its own collection.

## What `verify` does

Confirms each Rule's grants are actually enforced in code. An enforcement it
cannot locate is reported as **not established**, never as `code-right`. A grant
with `configuredBy` is verified only as far as *the gate exists* — who passes it
is customer configuration and is not in the repository. A `when` operator is
where `verify` checks the comparison holds against a real value, since `lint`
deliberately does not.

## Release

Breaking, in one release with the Entity work: **folder schema 7 → 8**,
**Product Report v11 → v12**, all three shipped models rewritten with `actors/`
merged into `entities/`. Roughly 271 `Actor` occurrences across 29 TypeScript and
Vue files and 160 references across the models. `spec/format.md` and
`spec/report.md` change before the parser, linter and projection.

**ADR-0016 — there is one resource type; Actor is the subset that acts.**
Supersedes the `docs/actors.md` claim that *"the same participant is never
modelled twice"*, which was the rule that forced the unused workaround.

**ADR-0017 — permission is a Business Rule.** Records why the constraint layer is
not on the Entity, and the rejected alternative in
[the Entity plan's design record](./entity-at-the-center.md#design-record-what-was-tried-and-rejected).

## Decisions taken, with their reasons

**Not two collections.** Keeping `actors/` alongside `entities/` was the earlier
recommendation. It fails on one question: what happens when a thing starts
acting? Two collections make that a file move and an id-namespace change; one
collection makes it a field. The objection that a payment gateway would be an
Entity with nothing kept about it was against a definition the format does not
have — `docs/entities.md` says *"keeps **or reasons about**"*.

**Not typed facts.** Chosen over prose conditions, but the operator carries the
comparison instead of the fact declaring a type. Thresholds stay checkable
without the Entity becoming a schema.

**Not implicit AND/OR.** An earlier design had `actors` and `related` OR-ing
while `when` AND-ed, with the rule stated in prose. It was unknowable from the
file. The grants list makes it structural and gives both operators, which the
implicit version could not.

**Not internal-service privilege.** Briefly accepted, then reversed: a privilege
existing only in code is implementation, and the *stable inbound contract* clause
is what has always drawn that line.
