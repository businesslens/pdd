---
title: Capabilities
description: Durable Product abilities with explicit availability Contexts, and the local Capability Scenarios that make each ability observable.
section: open-source
group: Product Model
order: 12
terms:
  - term: Capability
    definition: "A durable ability of the Product: what it can do, independent of any one route, command, or module."
  - term: Capability Scenario
    anchor: capability-scenarios
    definition: "One observable acceptance case for a Capability: a trigger, typed Steps, and an outcome."
  - term: Context
    anchor: availability
    definition: "Where behavior is available, occurs, or is constrained: one Interface, Experience, or Screen. How specific it must be depends on what uses it."
  - term: Step
    anchor: what-a-step-does-to-the-products-things
    definition: "One action or condition in a Scenario. Actions are performed by an Actor or the Product; effects on Entities are recorded explicitly."
  - term: Ends with
    anchor: what-a-step-does-to-the-products-things
    definition: "The last creation, change, or removal of each Entity instance in a Scenario, including the resulting State when specified."
  - term: Scenario kind
    anchor: the-capability-scenario-file
    definition: "A category for a Scenario, such as primary or edge, defined in the model's taxonomies.yaml."
  - term: Trigger
    on: capability-scenario
    anchor: the-capability-scenario-file
    definition: "The observable condition that starts the Scenario."
  - term: Outcome
    on: capability-scenario
    anchor: the-capability-scenario-file
    definition: "The observable result once the Scenario has run."
  - term: Route
    on: capability-scenario
    anchor: routes-steps-and-context-places
    definition: "One named way the same Steps play out in different places. A route varies Context only; different Steps mean a different Scenario."
  - term: Decision point
    on: capability-scenario
    anchor: capability-scenario-decision-points
    definition: "A question with alternative branches that lead to the same Capability Scenario outcome. A different outcome requires another Scenario."
  - term: Edge case
    on: capability-scenario
    anchor: the-capability-scenario-file
    definition: "A condition and its consequence recorded within a Scenario, without changing its path."
---

# Capabilities

**A Capability is a durable ability of the Product:** catalog search, guest
checkout, reading-state tracking, or release approval. It completes the
sentence “the Product can …”.

A Capability has no necessary beginning or end. It remains meaningful beyond
one route, command, or implementation module and can participate in several
Screens, Capability Scenarios, and optional [Journeys](./journeys.md).

Capabilities and their observable
[Capability Scenarios](#capability-scenarios) form the behavioral core of
the Product Model. A Capability does not need a Journey, but it does need at
least one Capability Scenario covering every availability Context.

## When you create one

Create a Capability when an ability is reusable across goals or independently
important to Product boundaries, availability, Screens, Business Rules, or
verification. Do not create one for an implementation function, endpoint, UI
label, or sequence step that has no durable Product meaning.

A Capability is the smallest durable behavior that remains independently
meaningful, not necessarily the smallest button, API operation, or code
function. **The contract decides how many there are.** Parts of an ability are
separate Capabilities when they differ in who may do them (a permission of their
own), where they are offered (availability), or in verb. A different Actor does
not split one — it is offered in every Experience it is used from — and neither
does a Business Rule that only constrains one part, such as a time limit. A
permission of its own means a separate grant of who may do it. Parts that differ
only in which grant applies, told apart by a fact of the thing they act on — a
channel's privacy, whether a message is the Actor's own — are one Capability
whose grants carry that condition in `when`:

| What you see | Capabilities |
| --- | --- |
| Create, configure, archive and delete repositories | Four: different verbs |
| Switching an item's format, which needs a permission editing does not | Two: a permission of its own |
| Adding an authenticator app or backup codes as a second factor | One: ways of doing one verb, even though each creates a different Entity |
| Requesting a password reset, then choosing the new password from the emailed link | One: the Steps of one run, which has no outcome without the link |
| Confirming the email of an account that already exists | Its own: a later act on something a run produced |
| Notification settings, each saved on its own as it changes | One: settings in one section of the Product's navigation are one Capability, however the screen saves them |
| Adding, changing and removing permission entries on one settings page | Three: settings are facts of one thing, but entries of a list are things of their own, each added, changed and removed by its own Capability |
| An API call that replaces a whole permission list | The same add, change and remove Capabilities, available on the API too; never one of its own |
| Changing a password the Product requires at sign-in | The same Change password Capability, available there too, joined to sign-in by a Journey |
| Entering a second factor after any sign-in method | Its own: a continuation several Capabilities share. Each sign-in ends its Scenario at the hand-off, and a Journey joins them |
| Filtering, sorting and searching a list | Scenarios of the browsing Capability, unless one differs by contract |

Ways a setting selects between follow the [Variation](./variations.md) rules
instead: a sign-in method the deployment selects makes one Capability per
method, while methods that coexist, the Actor choosing one at sign-in, are
Scenarios of one. A method a setting adds beside the others still coexists with
them: it is a Scenario of that Capability, and a Business Rule without grants
says it exists only while enabled. Splitting neither creates nor removes a
[Domain](./domains.md): the four repository Capabilities were about Repositories
before the split.

Every Capability declares explicit availability Contexts, naming
[Experiences](./interfaces.md#experiences) only where the Interface uses them. An optional
[Domain](./domains.md) can organize it, but Domains are not required.

## The file

A Capability without Scenarios or assets may stay compact at
`capabilities/<capability-id>.md`. Once it owns a Scenario or asset, it expands
to `capabilities/<capability-id>/capability.md`.

```md [capabilities/checkout.md]
---
domain: ordering
availability:
  - place: customer-web::shopping
  - place: customer-mobile::shopping
references:
  - kind: code
    role: implementation
    target: src/services/orders.ts#OrderService.submit
---

# Checkout

Turns a valid cart into a confirmed order.

## Intent

Complete a purchase without confirming an unpaid order.
```

| Field or section | Required | Constraint |
| --- | --- | --- |
| `availability` | yes | Declare at least one strict Context with one `place`. The place is a bare undivided Interface id or an `interface-id::experience-id`. |
| `domain` | no | Name one existing Domain when the grouping is useful. |
| `references` | no | Use the documented [Reference](./references.md) shape. |
| H1 and lead paragraph | yes | Name the Capability and describe the durable Product ability. |

Capability files do not list Actors, Entities, Capability Scenarios, Journey
Scenarios, Journeys, Screens, or Business Rules. Other resources own those
relations, and consumers derive backlinks: what a Capability changes is what its
Scenarios' Steps say, and an `entities` key on a Capability is an error naming
the Step key that carries it. A Capability Scenario's containing Capability
folder creates its direct acceptance relation, while a Journey Scenario annotates concrete
Steps with Capabilities. Journey Capability backlinks are derived from those
Steps rather than authored on the Journey.

Capability Scenario coverage is the only direct acceptance coverage for a
Capability. The union of its Capability Scenarios must cover every availability
Context the Capability declares through its Step Contexts; use by a Journey Scenario
does not satisfy that requirement. A missing Context is an error. A
single-Capability goal remains local Capability behavior and never requires a
Journey wrapper. A wizard is
[nested Screens](./interfaces.md#screens-nest) on the structure side, and the
Scenario walking its steps is a Capability Scenario unless it crosses
Capabilities, which makes it a [Journey Scenario](./journeys.md#journey-scenarios).

A Screen's Capabilities derive from Steps placed exactly on that Screen, across
both Scenario kinds. There is no authored Screen list. A Screen needs at least
one placed Capability; unmodeled behavior belongs in Coverage.

## Availability

Each item is the same strict Context shape used elsewhere:

```yaml
availability:
  - place: reader-web::public-discovery
  - place: reader-web::personal-workspace
  - place: reader-mobile::personal-workspace
```

This does not promise `public-discovery` on `reader-mobile`. Availability is
intended Product meaning, not implementation status; `businesslens-verify`
checks whether the implementation satisfies it.

**List every Experience in which one of the Capability's Actors uses it.** When
Guests read pages in a public Experience and signed-in Users read them in an
authenticated one, the Capability names both, and each Experience holds its own
counterpart Screen, unless every Experience of the Interface shares that
Screen. A Screen reached both before and after signing in exists in each
Experience that reaches it.

For an Interface with no Experiences, use the Interface as the Context place:

```yaml
availability:
  - place: operator-cli
```

Scenario Step Contexts select most-specific places within this availability. They do
not alter or expand the Capability's availability, and every selected Context
is verified independently.

## Capability Scenarios

**A Capability Scenario is one concrete, observable acceptance case for exactly
one Capability.** It states a particular starting condition, the local behavior,
and one terminal result for that ability.

A Scenario always belongs to exactly one parent, which determines its resource
type. A Scenario owned by a Capability is a Capability Scenario; a
Scenario owned by a Journey is a
[Journey Scenario](./journeys.md#journey-scenarios). There is no unowned
Scenario and no way for one Scenario to serve both parents.

Capability Scenarios are part of the behavioral core and are the only direct
acceptance coverage for a Capability. Missing coverage is an error, whether or
not the Product has any [Journeys](./journeys.md).

## What a Step does to the Product's things

A Step records one action or condition in a Scenario. Its `kind` is `actor`
for an Actor's action, `product` for the Product's action, or `condition` for a
condition that holds. Its effects on Entities are recorded explicitly.

**`entities` is required on every Step**, and a Step that touches nothing
writes `entities: []`, so an omission is always a claim rather than a silence.
Each entry names an
[Entity](./entities.md), what the Step does to it, and the states it leaves and
lands in:

```yaml
- text: The Product refunds the order
  kind: product
  actor: store-admin
  entities:
    - { entity: order,  effect: changes, from: Confirmed, to: Refunded, facts: [] }
    - { entity: refund, effect: creates, to: Requested, facts: [Amount, Reason] }
```

`effect` is `creates`, `changes`, `removes`, or `reads`, defaulting to
`changes`. State keys are explicit and never inferred from an adjacent Step:
`creates` takes `to`, `removes` takes `from`, `changes` takes both or neither —
neither being an information change, the rename case — and `reads` carries no
state. Every `from` and `to` names a state the Entity declares, and there is no
wildcard `from`: *archive from any state* is one Scenario per origin state.

**A Step changes as many Entities as it changes.** One observable act can move
two things at once, and splitting it into two Steps would turn an acceptance
case into an implementation trace. Two instances of one Entity in a Scenario are
told apart by `as`, a scenario-local alias — `collection (source)` and
`collection (target)` — and once an Entity is aliased anywhere in a Scenario,
every mention of it is. Steps chain per instance: where an earlier Step left a
thing in a state, a later Step's `from` must equal it, or name a different
instance.

**A read is a bare mention.** `reads` carries no state, is never counted as a
change, and never saves an Entity from being an orphan. It exists so a Step
whose text says *the Reader chooses a saved item* also says so where a tool can
read it. A Step whose text names an Entity's title and declares it nowhere is an
error.

**Step facts are exhaustive product claims.** Every `reads`, `changes` and
`creates` entry requires `facts`: the unique named Entity facts read, changed or
initialized, including product-defined defaults on creation. `facts: []` means
no named facts, such as an existence check or state-only transition; it never
means unspecified or all facts. Incidental implementation fields are not part
of this list. `removes` has no authored `facts`, because it removes the whole
Entity; clearing an individual value is a change.

```yaml
- text: The Product creates the account with its email and default preferences
  kind: product
  entities:
    - { entity: account, effect: creates, facts: [Email, Preferences] }
```

A Screen separately records what it shows and collects. A creation can run
without a Screen or initialize facts no form collects. An Actor read placed on
a Screen must find its named facts in `shows`; Product and condition reads may
consult information that is not displayed. Verification checks every named
Product fact the operation affects, so omitting one is a missing claim, not an
alternative encoding of the same operation.

**Ends with** is the last creation, change, or removal of each Entity instance
in Step order. It includes the resulting State when
specified, and also shows removals and changes without a named State. Later
reads do not replace that result.

The lifecycle of every Entity is composed from these entries across the whole
model, and a [Business Rule](./business-rules.md) that says who may perform an
operation is checked against the Step that performs it: a Step doing something a
Rule forbids to everyone, or something no grant could permit its actor, is a
`lint` error.

**A Step says who it is for.** An `actor` Step names who performs it. A
`product` or `condition` Step may also carry `actor`, meaning the Step is
attributable to that Actor — the Product did it for them, or the condition holds
for them. Every actor a Step names joins the Scenario's derived Actor set, and a
Rule reads it as *who did* against its grants' *who may*.

### Behavior nobody triggers

A schedule the Product owns, an expiry, a retry — real Product behavior with no
Actor to name. Write it as a Scenario whose **first Step is a `condition`
carrying `unattended: true`**, and give the Capability availability where an
Actor *observes the outcome*, never a synthetic Interface.

```yaml
steps:
  - text: The Product's own polling schedule comes due for a followed source
    kind: condition
    unattended: true
    entities:
      - { entity: source, effect: reads, facts: [Feed address] }
```

An unattended Scenario derives no Actors, and is the only Scenario that may have
none.

### When you create a Capability Scenario

Create a Capability Scenario for every materially different observable behavior
of one Capability, including relevant primary, permission, validation,
conflict, and external-failure cases.

A Capability Scenario is a variation of one stable behavior, not an operation
hidden beneath a vague umbrella. `create-a-private-repository`,
`reject-a-duplicate-repository-name`, and `reject-unauthorized-creation` can be
Scenarios of `create-repository`. Create, rename, archive, and delete are not
automatically Scenarios of `manage-repositories`; when they carry independent
Product meaning, they are separate Capabilities.

Split a Capability Scenario when:

- a condition produces a materially different local Outcome; or
- an Interface route materially changes the observable behavior.

Web and mobile may share one Capability Scenario when they promise the same
behavior and Outcome. Checkout succeeding on Tuesday is not a separate case;
checkout being rejected because stock is unavailable is.

### The Capability Scenario file

Capability Scenarios normally live at
`capabilities/<capability-id>/scenarios/<id>.md`. A Scenario with assets expands
to `<id>/capability-scenario.md`.

```md [capabilities/create-repository/scenarios/create-a-private-repository.md]
---
kind: primary
routes:
  web: Web
steps:
  - text: The contributor names the repository and chooses private visibility
    kind: actor
    actor: repository-contributor
    entities: []
    contexts:
      web:
        place: web-ui::repository-collaboration::new-repository
  - text: The Product checks that the name is free in the contributor's namespace
    kind: product
    entities:
      - { entity: repository, effect: reads, facts: [] }
    contexts:
      web:
        place: web-ui::repository-collaboration::new-repository
  - text: The Product creates the repository with the contributor as its owner
    kind: product
    actor: repository-contributor
    entities:
      - { entity: repository, effect: creates, to: Active, facts: [] }
    contexts:
      web:
        place: web-ui::repository-collaboration::repository-home
references:
  - kind: code
    role: implementation
    target: services/repository/create.go#CreateRepository
---

# Create a private repository

## Trigger

A contributor wants a new repository that nobody else can see.

## Outcome

An Active repository exists, owned by the contributor and visible to nobody
else.
```

| Field or section | Required | Constraint |
| --- | --- | --- |
| Filename | yes | Use a globally unique lowercase kebab-case Scenario ID. |
| `kind` | yes | Choose a Scenario category, such as `primary` or `edge`, defined in `taxonomies.yaml`. |
| `routes` | yes | Map each unique lowercase kebab-case route ID to a unique human-readable name. |
| `steps` | yes | Give a non-empty ordered list of typed Steps. Each Step has one-line `text`, `kind: actor|product|condition`, and optional route-specific `contexts`. |
| `steps[].actor` | for Actor Steps | Name the Entity that acts and performs the Step when `kind: actor`. On a `product` or `condition` Step it is optional and says who the Step is attributable to. |
| `steps[].entities` | yes | List what this Step does to the Product's things, or `[]` when it touches nothing. One entry per `(entity, as)` pair; one observable act may move several. |
| `steps[].entities[].entity` | yes | Name an existing Entity. |
| `steps[].entities[].as` | no | A scenario-local alias telling two instances of one Entity apart. Once an Entity is aliased in a Scenario, every mention of it is. |
| `steps[].entities[].effect` | no | Use `creates`, `changes`, `removes`, or `reads`. Defaults to `changes`. |
| `steps[].entities[].from`, `to` | by effect | Name states the Entity declares: `to` with `creates`, `from` with `removes`, both or neither with `changes`, and neither with `reads`. Required for `creates` and `removes` when the Entity has states. |
| `steps[].entities[].facts` | on reads, changes and creates | Exhaustive unique named facts affected; `[]` explicitly means none. Forbidden on removal. |
| `steps[].contexts` | when contextualized | Map every declared route to a strict Context whose `place` is the most-specific occurrence: a Screen when the Step occurs on one, otherwise the leaf Experience or undivided Interface. Omit it only when the Step is shared by all routes and has no Context. |
| `references` | no | Use the documented [Reference](./references.md) shape. |
| Lead paragraph | no | Start with a named H2; move starting-condition prose into `## Trigger`. |
| `## Trigger` | yes | State the observable starting condition. |
| `## Steps` | no | Structured Steps live only in frontmatter. |
| `## Decision points` | no | Give each H3 decision one Product question and at least two `condition → outcome` branches. |
| `## Edge cases` | no | List conditions and their consequences without changing the Scenario's path. When present, use a non-empty bullet list with each item on one physical line. |
| `## Outcome` | yes | State one local observable result of the Capability. |

A Capability Scenario cannot declare `result`, `actors`, `availability`, or a
Step `capability`; its parent Capability is implicit. A Step key of `entity`,
`state`, `changes`, or `reads` is an error naming `entities`, whose entries
carry all four. Both Scenario types
require frontmatter `steps`, and neither declares its parent—the folder it sits
in is the parent.
It cannot use Journey-only `## Goal` or `## Success criterion` sections, and
each recognized Scenario H2 may appear only once.
Business Rules own their Scenario relations; Capability Scenarios do not
duplicate a `businessRules` list. Screen participation is derived from Step
Contexts; Screens do not list Scenario IDs.

Journey Scenarios reference the Capability, never this Capability Scenario.
That prevents a concrete local case from becoming a reusable operation resource.

### Routes, Steps, and Context places

A route is one named supported traversal through unchanged Scenario behavior.
Use multiple routes when the Trigger, ordered Step text, Step kinds, responsible
Actors, and Outcome are the same but the Context places differ. If any behavior
changes, create another Scenario.

Every contextualized Step maps every route. A Step without `contexts` is shared by all
routes and has no Context. Every route must have a Context at least once, and two routes
cannot repeat the same Context-place sequence. Changing `place` between consecutive
contextualized Steps is an explicit Context transition, including movement between Screens in one
Experience.

A Step Context is concrete and most-specific. When the Step occurs on a
Screen, its `place` names that Screen, at any depth — a
[parent Screen](./interfaces.md#screens-nest) is a place of its own, meaning
on it and in none of its children. Otherwise it names the leaf Experience or
undivided Interface, even when other behavior there has Screens. An `actor` Step placed on a Screen that `reads` an
Entity the Screen does not present is an error; a Product or condition Step
reads what the Product consults, and a fact-free read of an Entity that acts names a
participant, so those mentions are exempt. A Step on a Screen an Interface shares across its
Experiences names that Screen as `interface-id::screen-id`; it is inside the
Capability's availability only when every Experience of that Interface is, and
it counts as coverage for each. Actor support, Screen participation, and
backlinks are all derived from these Context claims.

### Capability Scenario decision points

Each Decision point asks a Product question with alternative branches that
lead to the same Capability Scenario Outcome. Give it an H3 title, one
non-empty question, and at least two `condition → outcome` branches. A branch
with a materially different Outcome belongs in another Capability Scenario.
