# Mapping rubric

## Inspect by behavior

- Start at user and operator entry points, then trace handlers or services,
  persistence or external effects, and observable outcomes.
- Read configuration, authorization, telemetry, jobs, and tests when they
  materially change product behavior.
- Use documentation as a lead. Confirm current claims in implementation.
- Never execute target code and never claim deployed or live state from source.

## Choose stable resources

- An Actor is a role, not a resource type: an Entity that carries
  `kind: person|system` and `acts: external|internal`, relative to the Product
  boundary. Actors differ by Product goals, triggers, responsibilities, or
  privileges; two roles with the same goals and permissions are one Entity.
- An AI agent harness that loads a skill and acts in the repository is an Entity
  that acts: id `ai-agent`, `kind: system`, `acts: external`. It initiates, it
  reads and writes on the person's behalf, and it chooses what to inspect and
  propose. Do not name it after one use of it, and do not promote a
  fixed-command CI runner by analogy.
- An external system is an Actor only when it initiates. An outbound client the
  target repository calls—a polled feed, payment processor, mail provider, model
  API—is not an Actor and gets no Interface. Map it inside the Capability that
  calls it, give that Capability availability Contexts for the Interfaces where
  an Actor observes the result, and cover its failure behavior with a
  Capability Scenario.
- Interfaces are supported interaction contracts such as customer web, reader
  mobile, operator CLI, or partner API—not every deployable or internal API.
  Interfaces are inbound; an inbound webhook or callback endpoint qualifies and
  makes its caller an Actor. Assign the authored interaction type that matches
  the contract; never infer it from technology, naming, or implementation.
- An Experience is who is there and what they can do — a coherent Actor context
  with one access mode, and one version where several are served at once —
  inside exactly one Interface, the folder that holds it; never what it looks
  like. Whether an Interface is divided into Experiences is derived, never
  judged: it is divided when it serves more than one `access` value, when its
  Actors split into groups no Capability available there bridges (a Capability
  bridges the Actors its Scenario Steps name), or when it serves two or more
  versions at once through one entry point, each Experience carrying `version`.
  Otherwise it holds no Experiences and availability names the Interface
  directly. `lint` decides and reports a violation as an error; the one
  exception is an Experience whose name also exists under
  another Interface — a counterpart, which justifies itself. Do not equate an
  Experience with a page, command group, route tree, API, or CLI.
- Screens are optional stable views an Actor reaches: places, decided under
  "Places, not designs" below — not components, layouts, routes mechanically
  discovered from source, or visual variants.
- A Screen belongs to one Interface, Experience or parent Screen. The same view
  on web and on mobile is two Screens with the same name — counterparts, told
  apart by their path — each listing its own facts and Capabilities, so a
  divergence between them is visible instead of silent.
- Domains optionally group recognizable Product areas; zero is valid.
- Capabilities are durable Product abilities, not UI labels, Journey titles, or
  sequence steps. Map availability Contexts to an undivided Interface or an
  Experience only when the repository supports that claim.
- Business Rules are durable constraints, derivations, or permissions with typed
  behavioral, direct Context, or Entity targets. An Entity target selects an
  operation on a thing (`effect`, `from`, `to`) or the facts it governs; who may
  perform it is a `permits` grant — `actors`, `related`, `self`, `unattended`,
  `configuredBy`, each optionally conditioned by `when` — and permission claims
  live only here, never in Scenario prose. Derive Domain backlinks instead of
  targeting Domains.
- Capability Scenarios state observable acceptance for one Capability through
  typed Steps and named routes of most-specific Context places. Cover primary,
  permission, validation, conflict, and external-failure behavior only where it differs.
  Where the line falls between a Scenario and an `## Edge cases` bullet is the
  author's call and belongs in the Coverage round — Scenarios are usually the
  largest single group in the model, and deciding the whole set alone is the
  quietest way to author most of it unreviewed.
- Journeys represent stable user or operator goals, never a wrapper for one
  Capability. Omit Journeys when no established goal crosses Capabilities.
- Journey Scenarios are observable paths through a goal. Write one ordered
  typed Steps list, annotate responsible Actors and the Steps that exercise
  locally identified Capabilities, and place every named route at its
  most-specific Context place. An achieved path must
  traverse at least two distinct Capabilities.
- Add a decision point only when branches converge on one result without
  changing the Capability sequence. Otherwise write separate Scenarios.
- Treat shared backend code as no evidence of web/mobile/API/CLI parity. Verify
  each declared availability Context independently.

## Places, not designs

The model says what an Actor can reach, see, do and trigger at each place,
never how it looks or is built. Decide every borderline fact with the redesign
test:

> Rebuild a view with a different component library, layout, typography,
> colors, spacing, icons, motion and copy. Everything that would still have to
> be true is the model's: who can reach the view, what facts it shows, what
> abilities it offers, what conditions change that, and what happens next.
> Everything the redesign is free to change is design's, and the model says
> nothing about it.

- Out of the model: component libraries, theming, layout, typography, color,
  radius and borders, iconography, motion, microcopy and tone, gestures versus
  buttons, breakpoints, loading and hover states, navigation chrome, the order
  of navigation items, and quality attributes such as accessibility or
  performance unless they change what an Actor can do. Attach the design
  system or design files as `visual` References with `role: intent`; write
  none of it in prose.
- Text: model that an Actor is told something and under which condition — a
  Step, an Edge case, a Rule outcome — never the words. Legally required text
  is a Rule ("consent is captured before creation") whose wording is a
  Reference.
- A Screen is a place. It lists the Capabilities its own Steps use and, for
  each Entity it presents, the facts on screen — read or entered alike, so a
  form presents what it collects and the creating Step cites nothing. Name
  facts as `{ entity, facts }`; a bare id only while the model is not
  `complete`, and always for an Entity with no named facts.
- A child Screen is a region whose content depends on an act inside its
  parent — picking a row, choosing a tab, advancing a step. Whether it is
  visible at the same time, and whether it has its own address, do not decide
  it; the same content drawn differently is design. A parent Screen is a
  place: a Step placed there is on the parent, not in any child. Capabilities
  do not flow up or down.

  | Case | Modeling |
  | --- | --- |
  | Confirmation dialog | two Steps on the host Screen: ask, confirm |
  | Slideover or panel with its own facts | a child Screen of the view it opens over |
  | Tabs showing different facts | child Screens |
  | Rows / Graph drawing of one set | design; one Screen |
  | Wizard | one parent Screen, one child per step, a Scenario walking them in order |
  | Master-detail | detail is a child Screen of the list |
  | Overlay preserving the parent's state | Scenario Outcome, not structure |
  | Modal versus page versus inline | design; not modeled |

- A wizard is nested Screens on the structure axis. The Scenario walking it is
  a Journey only where it crosses Capabilities, otherwise a Capability
  Scenario; the two axes are independent.
- Every ability a Screen exposes has a Scenario with a Step placed exactly on
  that Screen — an export button included. There is no cheaper spelling of
  "this ability exists here". Write the Scenario, or leave the Capability off
  the Screen and record the behavior as Unmapped in Coverage.
- Filters, sorting and search are Scenarios of the Capability that presents
  the set, never Capabilities of their own; cite the facts they use as `facts`
  on the `reads` Step. Search that presents a set nothing else does — one
  search returning products, orders and customers — is a Capability.
- Empty, unauthorized and blocked are condition Steps, Edge cases, Rule
  outcomes or a child Screen, never a state on the Screen; a screenshot of a
  state attaches to the Scenario or Edge case that reaches it.
- `navigation` on an Interface or Experience names only Screens reachable from
  every place inside it — a cart, a global search. Nothing else about
  navigation is authored: no sitemaps, menus, back links or item order. Entry
  points say what is addressable; Steps say movement.
- Variation: `languages` on the Product, narrowed on an Interface, never on
  Experiences or Screens. A flag, A/B test or dynamic configuration that
  changes what an Actor can do is a fact on a settings Entity read by a Rule
  `when`; the experiment itself — cohorts, assignment, metrics — is not
  modeled, and one that changes only looks is design. Versions served at once
  are places: an own entry point (`/api/v2`, a separate app) is an Interface,
  a shared one is Experiences under it, each carrying `version`. Who sees which
  is a fact on the Actor or tenant Entity read by a Rule. Historical versions
  are never modeled; Git is the history.

## Describe coverage

Record scope, covered behavior, approved exclusions, known Unmapped behavior
and material Limitations. There is no status, and an empty Unmapped list never
means complete. Coverage never states whether behavior is implemented or
verified. A small, honest model with recorded gaps is better than a broad model
built from guesses.

## Decide Entity granularity deliberately

An Entity is a thing an Actor points at and the Product tells apart from another
one — identity, not storage. The unit is the naming test: a shopper says *"this
order"*, never *"this order line"*, so the lines are information kept inside
Order. Containers and parts are not Entities.

The failure that costs the most is the opposite one: collapsing a family of
things into a single Entity because they share a word. Do not weigh this one —
**write the `## Information kept` list first and read the answer off it.** One
Entity if a single list is true of every candidate. Several the moment the list
needs *"depending on the kind"*, or carries a fact that holds for some members
and not others; the shared word is then a category and its members are the
Entities.

Being stored, parsed and rendered the same way is not the test, and it is the
argument that most often wins when it should not. That is how the Product
*handles* the candidates; the question is what it *keeps* about them.

When the call is still close, **split**. A merge stays available to anyone later.
A collapse throws away exactly the differences a reader came for and leaves
nothing in the model saying they existed, so the next reader cannot tell there
was a question. Put both shapes and their counts to the author when you can; with
no author to ask, split and surface the unresolved granularity question in the
proposed delta. Once resolved, record the resulting product meaning without
retaining the compared shapes or replaying the discussion on later runs.

One shape defeats the list test: a candidate whose kept information is a
**subset** of another's. An intersection always exists, so "a single list is true
of both" is trivially satisfiable and proves nothing. Ask instead whether the
smaller one has an address of its own — a file, a route, a scope a command
accepts, an id another resource cites. Being kept inside the larger thing is not
the test; that is storage, which is never the test. And read the
closed-vocabulary exclusion against the thing you would name rather than the
classification above it: a fixed list of kinds is a vocabulary, the things those
kinds classify are not.

Three candidates pass the naming test and are still not Entities, because the
Product handles them rather than keeps them. A **representation** of an Entity —
a serialization, export or rendering — is that thing in another shape; if you
can regenerate it, it is a projection. A **receipt** the Product keeps for
itself — a marker, a lock, an index that makes its own work safe — is for the
Product, not an Actor. And the Product's own **surfaces, shipped content and
closed vocabularies** are what it *is*: where there are no instances, only
members of a fixed list, that is a vocabulary. Discriminator: does the Product
keep information about instances of this, or is this the Product itself?

A Capability declares nothing about Entities. The authored edge to a thing is
the `entities` list on a Scenario Step that creates, changes, or removes it, and
on a Screen that presents it with its facts; an Entity is also kept alive by
being named as an
actor, or read by a Business Rule as a condition's `entity` or a `configuredBy`.
A Step's `reads` and a relation from another Entity never count, so an Entity
none of those point at is unused vocabulary and fails `lint`.

## Use References honestly

Attach the artifacts that established each resource's meaning: `role:
implementation` for the code you traced, `role: intent` for the spec, PRD or
proposal that states the behavior, `role: context` for background you read. For
code targets, prefer `path#symbol` over line ranges and use only tracked files.
A Reference records where a claim came from, never that it is verified, and none
is required — but a resource with nothing attached
should be one you can justify from inspection alone.

Visual or research References may guide inspection. Keep their role honest,
never treat their existence as proof, and never run screenshot capture
workflows.
