# Actor is not a resource type, and permission is a Business Rule

Status: **designed, not started.** Settled across four grilling rounds against
`main` at `2f366fe`, then three more against `a657638` — folder schema 7,
Product Report v12.

Prerequisite for [The Entity at the centre](./entity-at-the-center.md) and
[Business Rules](./business-rules.md). All three ship in one release. The
permission model was owned here and has moved to the Rule plan; this plan keeps
what an Entity that acts is, and what a reference to one must satisfy.

## The two sentences

> **There is one resource type: the Entity. "Actor" is the word for the subset
> that acts.**
>
> **Permission claims appear only in Business Rules.**

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

- **`kind`** is from the closed list `person | system`, said only where true.
  An Order says nothing, because *it's a thing* is the default. It is
  **required when `acts` is set** — an Actor was always a person or a system,
  and a payment gateway with only `acts: external` would have lost the
  classification the facet groups by — and optional otherwise, which is what
  lets a payroll Employee finally state what it is.
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
wrong was treating it as a kind of file. `by` was the alternative; `actor` is
already the key on every Step, and `by` would have been a rename for no gain.

**Interface and Experience `actors` are reworded** from *allowed to use* to
*who uses it*. The list is descriptive: a permission claim appears only in a
Rule. The existing `lint` check that a Step's actor is among its place's actors
stays, as consistency between the Steps and the surface they happen on, and the
Screen-reach check in the Rule plan reads the same list.

**A hue frees up.** With `actor` gone there are eleven kinds for ten slots
instead of twelve, so **Entity takes slot 0 outright and Domain keeps slot 4** —
the demotion of Domain planned in the Entity work is no longer needed.

**The no-orphans rule has to admit acting.** Today an Entity must be changed by a
Capability or presented by a Screen. A payment gateway does neither. The rule
becomes *changed, presented, **or** named as an actor* — where *named as an
actor* means a Step's `actor`, an Interface's, Experience's or Journey's
`actors`, a grant's `actors`, or the end of a grant's `related` path. Every one
of those references must name an Entity that `acts`. A Rule reading an Entity —
a condition's `entity`, a `configuredBy` — also counts, so a settings Entity
that only Rules read is not an orphan.

## The permission model

Owned by [Business Rules](./business-rules.md). What this plan contributes to
it:

- **An Entity that acts is what a grant names.** `permits.actors`, the end of a
  `related` path and a `self` target all require `acts`, and `lint` says so.
- **Ownership is a relation, declared on the Entity that acts.** The Reader
  above declares `owns` towards Collection; a grant walks it back. This reverses
  ADR-0013's *a relation targets an Entity only* — an Entity that acts is an
  Entity, and the sentence that forbade it was the split this plan removes.
- **Nothing is on the Entity.** Not who may, not which Capability may. The
  rejected alternative is in
  [the Entity plan's design record](./entity-at-the-center.md#design-record-what-was-tried-and-rejected).

## What `lint` reports

**Added — structure:**

- An Entity with none of `## Information kept`, `## States` or `acts`.
- `kind` outside `person | system`; `acts` outside `external | internal`;
  `acts` without `kind`.
- An `actor` reference — a Step's `actor`, an Interface's, Experience's or
  Journey's `actors`, a grant's `actors`, `self` or `related` endpoint — naming
  an Entity that does not `acts`.
- An Entity neither changed, presented, nor named as an actor (the widened
  orphan rule).

**Rules** are in [the Rule plan](./business-rules.md#what-lint-reports).

**Removed:** everything checking `actors/` as its own collection.

## What `verify` does

Nothing of its own. What `verify` establishes for each kind of grant is
[the Rule plan's table](./business-rules.md#what-verify-does).

## Release

Breaking, in one release with the Entity and Rule work: **folder schema 7 → 8**,
**Product Report v12 → v13**, all three shipped models rewritten with `actors/`
merged into `entities/`. Roughly 200 `Actor` occurrences across 25 TypeScript
and Vue files and 160 references across the models. `spec/format.md` and
`spec/report.md` change before the parser, linter and projection. The self-model
loses `entities/actor.md`, which modelled the resource type this plan deletes,
and `docs/entities.md` loses the *why is Actor an Entity for BusinessLens*
example that leaned on it. What each model and the landing site does with this
is [The three models and the landing site](./models-and-landing.md).

**ADR-0016 — there is one resource type; Actor is the subset that acts.**
Supersedes the `docs/actors.md` claim that *"the same participant is never
modelled twice"*, which was the rule that forced the unused workaround;
ADR-0013's consequence that *a relation targets an Entity only* and ownership
stays a fact; and ADR-0008's `relationship: external` wording, which becomes
`acts: external` with the decision itself untouched.

**ADR-0017** belongs to [the Rule plan](./business-rules.md#release).

## Decisions taken, with their reasons

**Not two collections.** Keeping `actors/` alongside `entities/` was the earlier
recommendation. It fails on one question: what happens when a thing starts
acting? Two collections make that a file move and an id-namespace change; one
collection makes it a field. The objection that a payment gateway would be an
Entity with nothing kept about it was against a definition the format does not
have — `docs/entities.md` says *"keeps **or reasons about**"*.

**Not `kind` optional under `acts`.** The first draft made `kind` optional
everywhere. An Entity that acts without saying whether it is a person or a
system is a regression from the Actor it replaces, and the facet would have
nothing to group it by.

**Not `by`.** Considered as the Step key in place of `actor`. The collision it
was said to have — with `appliesTo.by` — did not exist; the only `by` was on
`transitions`, which the Entity plan deletes. The reason to keep `actor` is
that every Step already carries it.

**The permission decisions** — typed facts, implicit AND/OR, verb-only paths,
`permits: []` as an error — are recorded in
[the Rule plan's design record](./business-rules.md#design-record-what-was-tried-and-rejected).

**Not internal-service privilege.** Briefly accepted, then reversed: a privilege
existing only in code is implementation, and the *stable inbound contract* clause
is what has always drawn that line.
