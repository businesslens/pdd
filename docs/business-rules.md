---
title: Business rules
description: Durable assertions of what must remain true — constraints, derivations, and who may perform an operation on a thing — applied to behavior, Contexts, or Entity operations.
section: open-source
group: Product Model
order: 16
---

# Business rules

**A Business Rule states what must remain true:** an order is confirmed only
after payment succeeds; total charged always equals subtotal plus tax minus
discount; a refund is issued only by a store operator. Constraints,
derivations, and permissions are all Rules. **Permission claims appear only in
Business Rules** — a Scenario shows someone doing a thing, and the Rule says
whether they may.

The Rule is the single owner of where it applies. Its `appliesTo` list targets
Capabilities, Journeys, their Scenarios, direct Contexts, or an operation on an
[Entity](./entities.md). Other resources do not copy Rule IDs, so one
constraint remains reusable and reviewable instead of drifting across several
files.

## When you create one

**A Rule governs two or more behaviors, a Context independent of any single
behavior, or a thing.** Anything true of exactly one Capability is that
Capability's own business — a `condition` Step, or its Scenario's Outcome — and
`lint` warns when a Rule's behavioral targets resolve to a single resource with
no `contexts` narrowing them. A Rule with an Entity target is always valid: a
durable invariant or permission on a thing is a Rule even when it selects a
single operation.

Write something that must remain true, not a sequential step.

## The file

Business Rules normally live at `business-rules/<rule-id>.md`. A Rule with
assets expands to `business-rules/<rule-id>/business-rule.md`. Its id never
opens with a verb.

```md [business-rules/refunds-need-an-operator.md]
---
appliesTo:
  - type: entity
    id: order
    effect: changes
    to: Refunded
permits:
  - actors: [store-admin]
    when:
      - { fact: Total charged, at-most: 100 }
  - configuredBy: store-settings
    when:
      - { fact: Total charged, over: { configuredBy: store-settings } }
---

# Refunds need an operator

A refund is issued by a store operator, and above the store's approval threshold
only by whoever the store configures.

## Rationale

A refund moves money the shopper has already paid, so it is never the shopper's
own act, and the threshold is the store's decision rather than the Product's.
```

| Field or section | Required | Constraint |
| --- | --- | --- |
| `appliesTo` | yes | Give at least one target. A behavioral target's `type` is `capability`, `capability-scenario`, `journey`, or `journey-scenario` with an `id`; a direct target's is `context`; an Entity target's is `entity` with an `id`. |
| `permits` | no | Omit to make no authorization claim; `[]` to forbid the selected operation to everyone; a list of grants to permit it through any one of them. Valid only when every target is an Entity target. |
| `references` | no | Use the documented [Reference](./references.md) shape. |
| H1 and lead paragraph | yes | Name the Rule and state its durable assertion. |
| `## Intent` | no | Explain the outcome the Rule protects. |
| `## Rationale` | no | Explain why the constraint exists. |

## Behavioral and Context targets

A behavioral target without `contexts` applies everywhere that resource is
supported. When present, `contexts` is a non-empty list of strict Context
objects. A Rule Context may name any Interface, Experience, or Screen place. An
ancestor place includes supported descendants: an Interface Context can
deliberately select occurrences in its Experiences and Screens. Every selected
Context must overlap the target's supported places. Duplicate selectors and
ancestor/descendant selectors in the same list are rejected because one makes
the other redundant.

A direct Context target has no `id` and nests the same Context shape under
`context`:

```yaml
appliesTo:
  - type: context
    context:
      place: operator-cli
```

Targets are additive. Do not target a Capability and one of its Capability
Scenarios in the same Rule, or a Journey and one of its Journey Scenarios; the
child target is redundant. Domains are not authored Rule targets. Consumers
derive Domain backlinks through targeted behavior.

## Entity targets: an operation on a thing

An Entity target names a thing and, optionally, the operation on it:

```yaml
appliesTo:
  - type: entity
    id: order
    effect: changes            # optional — creates | changes | removes | reads
    from: Confirmed            # optional — the state the operation leaves
    to: Refunded               # optional — the state it lands in
    facts: [Margin]            # optional — the facts it governs
    contexts: [{ place: admin-web::order-detail }]   # optional
```

**A target selects; a grant conditions.** `effect`, `from`, and `to` select
Steps by the keys their `entities` entry already carries: `from` is valid with
`changes` and `removes`, `to` with `creates` and `changes`, and neither with
`reads`. Every state named is one the Entity declares. Whether the instance is
in some state *when the operation happens* is a condition and lives in a grant's
`when`. `facts` names facts of the Entity by exact name; a fact-scoped Rule
governs information — a derivation, or field-level visibility — not an
operation. `contexts` scopes the Rule to places; an Entity has no availability,
so the selector must name a Screen that presents the Entity, or an ancestor of
one.

**A place-scoped Rule is not escaped by omitting `contexts`.** A Step that omits
them is shared by every route, which puts its operations inside the Scenario's
own places — the union of the places its contextualized Steps name — and a
place-scoped Rule selects it there.

**The minimal selector is canonical.** A `from` that every Step landing in `to`
already leaves from is a warning, as is a `when` state condition every selected
Step already satisfies. Refunds only ever leave Confirmed, so
`{ changes, to: Refunded }` is the Rule. It is also the safer form: a refund
added later from Pending is governed by it, and silently open under the
narrower one.

A Rule reaches Capabilities through Steps: every Capability whose Scenario has a
Step performing the selected operation is in the Rule's derived reach, and the
report draws the Rule on that Entity's lifecycle — restricting the arcs it
grants, forbidding the ones it closes.

## Permission

`permits` has three states:

| `permits` | Says |
| --- | --- |
| omitted | this Rule makes no authorization claim |
| `[]` | the selected operation is forbidden to everyone |
| a list of grants | the operation is permitted through any one of them |

Silence is not a claim. A lifecycle composed from Steps can be incomplete, so a
Step that never appears cannot be read as *nobody may*. `permits: []` is the one
way to say it, and it is checkable: a Step performing that operation is a
`lint` error naming the Rule, and `businesslens-verify` confirms the code
refuses it.

```yaml
# a Refunded order is never cancelled — and nothing else is claimed
appliesTo: [{ type: entity, id: order, effect: changes, from: Refunded, to: Cancelled }]
permits: []
```

**A Rule with `permits` targets Entities only.** An operation is an Entity
effect on a Step. *Who may perform this Capability* with no Entity in sight is
what Interface `actors` already records as *who uses it*.

### The algebra

- Targets within one Rule select the union of governed operations.
- Grants within one Rule are **OR**.
- Keys within one grant are **AND**.
- Rules that select the same operation are **AND** — every matching Rule
  constrains it.
- An operation no Rule with `permits` selects is open.

```yaml
# the owner, or an admin
permits:
  - { actors: [store-admin] }
  - { related: [{ verb: owns, entity: shopper }] }

# an admin, and only while the Order is still Confirmed
permits:
  - { actors: [store-admin], when: [{ state: Confirmed }] }

# the owner under 100; at 100 and above, an admin
permits:
  - { related: [{ verb: owns, entity: shopper }], when: [{ fact: Total charged, under: 100 }] }
  - { actors: [store-admin],                      when: [{ fact: Total charged, at-least: 100 }] }
```

AND across Rules is what lets a broad Rule and a narrow one compose: *owner or
admin may change an Order* plus *admin may refund* yields admin-only refunds
without either Rule knowing about the other. It also means grants meant as
alternatives must sit in one Rule: *the owner may read a Collection* and *a
Visitor may read a Published Collection*, written as two Rules, AND to
owner-only. `lint` warns when two permission Rules carry identical target
selectors.

### Grant keys

**Every grant names a who.** A grant needs at least one of `actors`, `related`,
`self`, `unattended`, `configuredBy`. An empty grant, or a grant with only
`when`, is an error: *anyone* already has an encoding — list every Entity that
acts. A grant may carry more than one who-key, but only one of them can do
work: `related` and `self` already fix which Entity the actor is, so an `actors`
list beside either restates it when it names that endpoint and contradicts it
when it does not — the second can never be satisfied and is an error. *An admin
who is also the owner* is not a grant shape; it is an `owns` relation whose
endpoint is the admin Entity. AND within a grant is for a who-key and its `when`
conditions.

| Grant key | Says | Value |
| --- | --- | --- |
| `actors` | these may | ids of Entities that `acts` |
| `related` | whoever stands in this relation to the instance may | a path of `{ verb, entity }` segments |
| `self` | the instance itself may | `true` |
| `when` | only while these conditions hold | a list of conditions, AND-ed |
| `unattended` | the Product's own schedule may | `true` |
| `configuredBy` | gated, by data the Product does not own | the id of the Entity holding the configuration |

**`related`** is a path from the Rule's one Entity target, walking declared
relations and their derived inverses. Each segment names the verb and the
Entity it arrives at, so a hop is never ambiguous:

```yaml
# document  ←—contains—  workspace  —has member→  user
appliesTo: [{ type: entity, id: document, effect: changes }]
permits:   [{ related: [{ verb: contains, entity: workspace }, { verb: has member, entity: user }] }]
```

`lint` checks that the Rule has exactly one Entity target to start from, that
each segment matches exactly one relation, declared or inverse, from the Entity
the path is currently at, and that the last segment lands on an Entity that
`acts`. A hop through a self-relation is refused, because naming the Entity
gives it no direction. **`lint` never touches an instance.**

**`self: true`** is the zero-hop path: the instance itself may. *Shoppers keep
their own address* targets the Shopper's *Delivery address* fact and permits
`self`; `actors: [shopper]` would have said any Shopper. It requires the
targeted Entity to `acts`.

**`when`** is a list of conditions, AND-ed. Each names a `fact` with exactly one
operator, or a `state`:

```yaml
when:
  - { fact: Total charged, over: 100 }                                  # hard-coded
  - { fact: Total charged, over: { configuredBy: approval-policy } }    # customer-set
  - { entity: workspace-settings, fact: Approval required, is: true }   # feature flag
  - { state: Published }                                                # the instance's state
```

| Operator | Meaning |
| --- | --- |
| `over` | > |
| `under` | < |
| `at-least` | ≥ |
| `at-most` | ≤ |
| `is` | = |
| `is-not` | ≠ |
| `present` | the fact has a value |
| `absent` | it does not |

The operator implies the comparison; the fact declares no type. `at-least` and
`at-most` exist because `over: 99.99` is the wrong rule for money and for time.
`lint` checks the fact and any named Entity resolve, and nothing more — whether
*Total charged* holds a number is `verify`'s job against code. A threshold is a
scalar or `{ configuredBy: <entity-id> }`.

`fact` defaults to a fact of the targeted Entity and may name another through
`entity`, which is how thresholds and feature flags work: the value is a fact of
a settings Entity and the Rule reads it — which is also what keeps that settings
Entity from being an orphan. `state` says *the instance is in state X when the
operation happens*: it must be a state of the targeted Entity, it is valid on
every target but `creates`, and it cannot be combined with `entity`. It exists
because two kinds of Step carry no state for a target to select by — a `reads`
Step, and an information change. *Anyone may read a Published collection* and
*the shopper edits delivery details only while Pending* are both `when` state
conditions.

### A product's own roles

A modelled product's own RBAC is product behaviour, not this layer. A fixed,
shipped set of roles is a closed vocabulary: Entities that act, and
`permits.actors` works directly. User-defined roles created at runtime are
instances: an Entity `Role` with its own lifecycle, `assign-role` a Capability,
and this layer constrains who may create one — never one Entity per customer
role.

## What `lint` checks

`lint` checks structural eligibility. It cannot prove runtime ownership, a
fact's value, or customer configuration, and never claims a runtime grant is
satisfied. A Step's actor has a **possible grant** in a Rule when some grant of
that Rule could admit it — which reads the grant's keys the way
[the algebra](#the-algebra) does, **AND**, so every key the grant carries must
hold at once, and a key it omits constrains nothing:

- `actors`, when present, lists the Step's actor;
- `related`, when present, ends on the actor's Entity;
- `self`, when set, requires the actor to be the targeted Entity;
- `unattended` is set exactly when the Scenario is unattended;
- `configuredBy` constrains nothing structurally, because the value is the
  customer's;
- and every `state` condition in that grant equals the Step's `from` when the
  Step has one.

Only one who-key narrows the actor, so a grant reads as that key and its `when`
conditions. `related` ending on Shopper already says the actor is a Shopper, and an
`actors` list beside it that excludes Shopper describes nobody, so `lint`
refuses it. Alternatives are separate grants — that is what OR within a Rule is
for.

Structure — errors unless marked:

- `permits` on a Rule with a behavioral or Context target.
- A grant with none of `actors`, `related`, `self`, `unattended`,
  `configuredBy`; `unattended` or `self` other than `true`; `related: []`.
- `permits.actors`, a `related` endpoint, or a `self` target naming an Entity
  that does not `acts`; `configuredBy` naming a missing Entity.
- `related`, a defaulted `fact`, or a `state` condition on a Rule with other
  than exactly one Entity target.
- A `related` segment matching no relation, declared or inverse; matching more
  than one; or passing through a self-relation.
- A grant whose `actors` excludes the type its `related` path ends on.
- A condition with no operator or two, an operator outside the eight, a `fact`
  that does not resolve, or a `state` that is not a state of the targeted
  Entity, sits on a `creates` target, or is combined with `entity`.
- An Entity target whose `id`, `from`, `to`, `facts` entry, or `contexts` place
  does not resolve; `from` on a `creates` or `reads` target; `to` on a
  `removes` or `reads` target; a `contexts` place that presents the Entity
  nowhere.
- A behavioral target resolving to exactly one resource with no `contexts` —
  a warning naming the Capability that should own it.
- **Warning:** two permission Rules with identical target selectors.
- **Warning:** a target `from`, or a grant `state` condition, that every Step
  the target selects already satisfies.

Rules against Steps and Screens — errors, ungraded by `coverage.status`:

- A Step performing an operation a Rule closes with `permits: []`, naming the
  Rule.
- A Step performing a governed operation whose actor has no possible grant in
  some Rule selecting it.
- A governed operation on a Step with no `actor` in an attended Scenario.
- An unattended Scenario performing a governed operation that no `unattended`
  grant permits.
- A Screen presenting an Entity whose reads are governed, where no Actor using
  the Screen's container has a possible grant.

Fact-scoped Rules are checked by Screen reach only, since a Step cannot cite a
fact; the rest is `verify`'s. A derivation is prose plus `facts`; there is no
machine-readable arithmetic.
