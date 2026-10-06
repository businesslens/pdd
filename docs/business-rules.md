---
title: Business Rules
description: What must always hold in your product, and who may do what (constraints, derivations and permissions), each stated once with everything it applies to.
section: open-source
group: Product Model
order: 13
terms:
  - term: Business Rule
    aliases: [Rule]
    definition: "Something that must always hold in the Product, or who may do what. It is the only place the model says who may act."
  - term: Applies to
    aliases: [Binding]
    anchor: behavioral-and-context-targets
    definition: "What a Rule governs: a Capability, a Journey, one of their Scenarios, a place, or an operation on a thing."
  - term: Operation
    aliases: [What it changes]
    anchor: entity-targets-an-operation-on-a-thing
    definition: "What may be done to a thing: creates, changes, removes, or reads. A Step calls it an effect; a Business Rule selects the same word as an operation."
  - term: Who may
    aliases: [Permission]
    anchor: permission
    definition: "Who may perform an operation on a thing, listed as grants in a Business Rule. An empty list means nobody may."
---

# Business Rules

**A Business Rule is something that must always hold in your product, or who
may do what.** It comes in three kinds:

- a **constraint**: a refund never exceeds the charge;
- a **derivation**: Total charged equals subtotal plus tax minus discount;
- a **permission**: an order's margin is for operators only.

Permissions live only here. A Scenario shows someone doing a thing; the Rule
says whether they may.

## In practice

| In your product | The Rule | Kind |
| --- | --- | --- |
| A refund can never repay more than the order cost | A refund never exceeds the charge | Constraint |
| An order is confirmed only after its payment succeeds | Payment before confirmation | Constraint |
| The total is always subtotal plus tax minus discount | Total charged | Derivation |
| Only operators see what the store earns on an order | Margin is for operators | Permission |
| A shopper edits delivery details only while the order is unpaid | Delivery details are editable while unpaid | Permission |
| Once refunded, an order is never cancelled, by anyone | A refunded order is never cancelled | Permission |

## When you create one

- **It holds across behaviors, a place, or a thing.** Something true of exactly
  one Capability is that Capability's own condition Step or Outcome, not a Rule.
- **One Rule per assertion, however many places it applies.** *Payment before
  confirmation* governs every way an Order becomes Confirmed; it is not copied
  into each Capability that confirms one.
- **Write what must remain true, not a sequence.** *A refund never exceeds the
  charge*, not *check the amount, then issue the refund*.
- **Alternative grants share one Rule.** Two permission Rules on the same
  operation must both allow it, so *the owner may* and *an admin may*, written
  apart, would mean only someone who is both.
- **One permission Rule per operation.** Creating, changing and removing a
  Card are three Rules, each naming its `effect`, even when the same people may
  do all three.
- **A role condition reads the actor's own role.** On a per-board role, the
  Role a grant checks is the acting person's own membership, reached through
  `related`, never the membership being changed.
- **Ordinary copy is design; contractual wording is a Rule.** When exact words
  are required, the Rule says so and cites the authoritative
  [Reference](./references.md).

## The file

`business-rules/<id>.md`. The id and H1 state the assertion, never a verb or a
mechanism; the lead paragraph is the Rule itself.

```md [business-rules/a-refund-never-exceeds-the-charge.md]
---
appliesTo:
  - type: entity
    id: refund
    facts: [Amount]
---

# A refund never exceeds the charge

A refund's Amount is at most the Total charged of the order it repays.

## Rationale

The order is the audit boundary for the refund.
```

| Field or section | Required | Says |
| --- | --- | --- |
| `appliesTo` | yes | What the Rule governs: at least one target, below |
| `permits` | no | Who may perform the selected operation; see [Permission](#permission) |
| `references` | no | Code or documents behind it, in the [Reference](./references.md) shape |
| H1 and lead | yes | The assertion, stated plainly |
| `## Intent` | no | The outcome the Rule protects |
| `## Rationale` | no | Why it is necessary now, not which designs were rejected |

## What a Rule applies to

The Rule owns its targets. Nothing else lists the Rule; every backlink is
derived.

### Behavioral and Context targets

| `type` | Applies to |
| --- | --- |
| `capability`, `journey` | That behavior, wherever it is supported |
| `capability-scenario`, `journey-scenario` | One Scenario of it |
| `context` | A place, independent of any behavior |

A behavioral target may narrow itself with `contexts` to the places it holds
in. A place target looks like this:

```yaml
appliesTo:
  - type: context
    context:
      place: operator-cli
```

Do not target a Capability and one of its own Scenarios; the Capability already
covers it.

### Entity targets: an operation on a thing

An Entity target names a thing and, optionally, the operation on it, such as changing
an Order's delivery details, refunding an Order, reading its Margin:

```yaml
appliesTo:
  - type: entity
    id: order
    effect: changes          # optional: creates | changes | removes | reads
    from: Confirmed          # optional: the State it leaves
    to: Refunded             # optional: the State it lands in
    facts: [Margin]          # optional: only operations on these facts
    contexts: [{ place: admin-web::order-console::order-detail }]   # optional
```

The target selects which operations; whether the thing is in some State *when*
it happens is a condition on a grant. Write the smallest selector that is true:
refunds only ever leave Confirmed, so `{ effect: changes, to: Refunded }` is
the Rule, and it still covers a refund added later from another State.

## Permission

`permits` says who may perform the selected operation, and it needs Entity
targets only. A read restricted in one place (a download page) is `effect:
reads` on the Entity narrowed with `contexts` to that place. A restricted read
on the same Screen as ordinary reading cannot be told apart yet: note it as a
gap in [Coverage](./product-model.md#coverage).

| `permits` | Says |
| --- | --- |
| omitted | This Rule makes no permission claim |
| `[]` | Nobody may; a Step doing it is a `lint` error |
| a list of grants | Anyone matching one grant may |

```md [business-rules/delivery-details-are-editable-while-unpaid.md]
---
appliesTo:
  - type: entity
    id: order
    effect: changes
    facts: [Delivery details]
permits:
  - related: [{ verb: owns, entity: shopper }]
    when: [{ state: Pending }]
---

# Delivery details are editable while unpaid

A shopper edits an order's delivery details only while the order is still
unpaid.
```

Grants in one Rule are alternatives; the keys inside one grant must all hold.
When several permission Rules select the same operation, each must allow it.
An operation no permission Rule selects is open.

### Grant keys

Every grant names a who; `when` only narrows it.

| Key | Says | Example |
| --- | --- | --- |
| `actors` | These Entities may | `actors: [store-admin]` |
| `related` | Whoever stands in this relation to the thing may | `related: [{ verb: owns, entity: shopper }]`, the Order's own Shopper |
| `self` | The thing itself may | `self: true`, a Shopper edits their own address |
| `unattended` | The Product's own schedule may | `unattended: true`, cancel when the payment window closes |
| `configuredBy` | Whoever the customer configures may | `configuredBy: store-settings` |
| `when` | Only while these conditions all hold | `when: [{ state: Pending }]` |

A `when` condition is a State of the thing, or a fact with one operator
(`over`, `under`, `at-least`, `at-most`, `is`, `is-not`, `present`, `absent`):

```yaml
when:
  - { state: Pending }                                                    # the thing's State
  - { fact: Total charged, at-most: 100 }                                 # a fact of the thing
  - { entity: store-settings, fact: Self-service cancellation, is: true } # a setting
```

**A setting that only decides who may do something is a condition, not a
[Variation](./variations.md).** *Self-service cancellation* on or off is one
grant's `when`. Business Rules vary only when a setting switches between two
complete policies, such as Standard or Strict refund review.

### A product's own roles

Each role the Product ships is an Entity that acts, granted through `actors`:
one Entity per role, never one per role a customer configures. A role held per
team or workspace goes through a membership Entity that names it, reached by
`related`.

## How it connects

- A Rule reaches every Capability whose Steps perform the operation it selects,
  and governs that move in the Entity's
  [Lifecycle](./entities.md#states-and-the-lifecycle-nobody-authors).
- It cites Entity facts and States by exact name, and `related` walks the
  Entity's declared relations.
- Steps and Screens are checked against its grants: a Step's `actor`, or a
  Screen's audience, must be someone a grant could admit.
- Domains are never targets; a Rule's Domains are derived from what it governs.

## What lint checks

Errors:

- A missing H1 or lead, or an empty `appliesTo`.
- A target whose id, State, fact or place does not resolve; `from` on a
  `creates` or `reads` target, `to` on a `removes` or `reads` one; a Capability
  or Journey targeted beside one of its own Scenarios.
- `permits` on a Rule with a non-Entity target.
- A grant that names nobody; `actors`, a `related` end or `self` naming an
  Entity that does not act; a `related` hop that matches no relation, or more
  than one, or walks a self-relation (a Comment replying to a Comment has no
  direction); a grant whose `actors` leaves out the Entity its `related` path
  ends on, so nobody could satisfy it.
- A condition without exactly one of the eight operators, a fact or State that
  does not resolve, or a `state` on a `creates` target.
- A Step performing an operation `permits: []` forbids; a governed operation
  whose Step has no actor, or one no grant could admit; an unattended Scenario
  no `unattended` grant allows; a Screen presenting governed facts to an
  audience no grant admits.

Warnings:

- A Rule whose only target is one behavior with no `contexts`: it belongs to
  that Capability.
- Two permission Rules with identical targets.
- A `from` or `state` condition every selected Step already satisfies.
- An id that opens with a verb acting on something the model declares, such as
  `cancel-unpaid-orders` beside an Order Entity.
- A grant that names `ai-agent` without a `related` path to the person whose
  agent it is.
- An Actor changing or removing a thing whose other changes Rules govern, when
  no permission Rule selects that change.

A permission Rule that is an alternative in a Variation skips the Step and
Screen checks; [`businesslens-verify`](./skill-businesslens-verify.md) checks it
against the code.
