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
  with one access mode —
  inside exactly one Interface, the folder that holds it; never what it looks
  like. Whether an Interface is divided into Experiences is derived, never
  judged: it is divided when it serves more than one `access` value, when its
  Actors split into groups no Capability available there bridges (a Capability
  bridges the Actors its Scenario Steps name ).
  Otherwise it holds no Experiences and availability names the Interface
  directly. `lint` decides and reports a violation as an error; exceptions are a valid Variation (`variantOf`) relationship and an Experience
  whose name also exists under another Interface — a counterpart. Do not equate an
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
  live only here, never in Scenario prose. Title a Rule with its assertion
  about what it selects — a permission names the operation and who may perform
  it — never with a consequence, a feature, or the mechanism behind it; those
  go in the lead or `## Rationale`. Derive Domain backlinks instead of
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

The model records what an Actor can reach, see, supply, do and trigger. Layout,
styling and ordinary copy remain external design References. When exact wording
is a product requirement, a Business Rule identifies its authoritative Reference;
verify that wording, or report it unverifiable when the source is unavailable.

- A Screen's `entities` distinguish `shows` (Product disclosure) from `collects`
  (Actor input). Each is a non-empty list of named Entity facts when present.
  A prefilled editable fact can occur in both. A bare Entity id is only for an
  Entity without named facts. Read permissions apply only to `shows`.
- Never author Screen `capabilities`: derive them from Capabilities exercised by
  Steps placed exactly there, including both Scenario kinds. Parent and child
  Screens have separate sets. A Screen needs at least one placed Capability.
- On every `reads`, `changes` and `creates` Entity entry, write `facts`: the
  exhaustive named Product facts read, changed or initialized, including
  product-defined defaults. `[]` means no named facts, never unspecified.
  Removal names the whole Entity and has no authored `facts`. Do not infer
  operation effects from form fields or include incidental implementation data.
- A child Screen subdivides its parent's persistent selected subject or process;
  changing that parent context also changes or ends the child. Tabs within a
  resource reading and wizard stages qualify. Opening a destination from a view
  alone does not establish ownership: a shared resource panel belongs once at
  the common Interface or Experience container of its launch sites. URLs,
  co-visibility and modal/page presentation do not decide ownership. Different
  drawings of the same information remain one Screen. Confirmation normally
  stays behavior on its host; preserving the underlying view is an Outcome.
  Treat ambiguous ownership as an authoring question, never claim that lint
  establishes semantic determinism.
Choose the nearest qualifying persistent context as the parent. A generic
settings/category selector is not itself a selected subject or an in-progress
process. A process stage requires its own Actor decision or input while retaining
the same draft or operation; a completion message, generated credential reveal
or read-only result alone is an Outcome on that process Screen, not a child.

- A wizard is a Journey only when its Scenario crosses Capabilities.
- Ordinary filtering, sorting and searching are browsing Scenarios. Split them
  when the general Capability test establishes an independent purpose,
  permission, availability or outcome; returning the same set is not decisive.
- A view condition belongs in Scenario conditions, Edge cases or Rule outcomes.
  Attach a condition's capture to its Scenario, not to a new Screen state key.
- `navigation` lists Screens reachable from every place in its Interface or
  Experience. Entry points describe arrival; Steps describe movement.
- Languages belong to the Product, optionally narrowed by Interface. There is no
  Experience `version` field. Independently supported contracts may be separate
  Interfaces; addresses and headers alone never decide. Variations apply across supported
  resource types, following the shared format reference. Keep one anchor-owned
  subtype (Experiment, Configuration or Version), typed variationUsage on every
  member, and complete independent content. Link existing selection Entities and
  facts; never invent Entities to populate usage fields. Check eligibility, selection,
  defaults, overrides and stability as relevant to the subtype. Selection prose
  is not executable; report missing evidence or unresolved conditions. Ordinary
  outcomes stay Scenarios and visual-only differences stay References. Do not
  claim deterministic granularity from lint alone. A permission flag may
  be a grant's `when` on an Entity operation, never a Capability target.
- A Rule can prohibit a fact nobody reads. Require resolvable references, not an
  example of prohibited behavior. Experiments and messages can be ordinary
  Product Entities and behavior when the Product manages them.


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
