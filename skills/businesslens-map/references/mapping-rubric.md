# Mapping rubric

## Inspect by behavior

- Start at user and operator entry points, then trace handlers or services,
  persistence or external effects, and observable outcomes.
- Read configuration, authorization, telemetry, jobs, and tests when they
  materially change product behavior.
- Use documentation as a lead. Confirm current claims in implementation.
- Never execute target code and never claim deployed or live state from source.

## Choose stable resources

- Actors differ by Product goals, triggers, responsibilities, or privileges;
  classify each as person/system and internal/external.
- An AI agent harness that loads a skill and acts in the repository is an Actor:
  id `ai-agent`, kind system, relationship external. It initiates, it reads and
  writes on the person's behalf, and it chooses what to inspect and propose. Do
  not name it after one use of it, and do not promote a fixed-command CI runner
  by analogy.
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
- Experiences are optional coherent Actor contexts with stable access and
  capability boundaries across one or more Interfaces. Omit them when an
  Interface is already one coherent context; do not equate them with a page,
  command group, route tree, API, or CLI.
- Screens are optional stable user-visible views. Model their information,
  actions, product-significant states, and capability boundary—not components,
  layouts, routes mechanically discovered from source, or visual variants.
- Reuse one Screen across web and mobile when its product semantics are shared;
  separate it only when purpose, information, actions, states, or boundaries
  materially differ.
- Domains optionally group recognizable Product areas; zero is valid.
- Capabilities are durable Product abilities, not UI labels, Journey titles, or
  sequence steps. Map availability Contexts to an undivided Interface or an
  Experience only when the repository supports that claim.
- Business rules are reusable policies or invariants with typed behavioral or
  direct Context targets. Derive Domain backlinks instead of targeting Domains.
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

## Judge coverage

- `draft`: the model itself is still being authored or reviewed.
- `partial`: the model is useful and known product areas remain unmapped.
- `complete`: the intended product breadth is modeled.

Coverage never states whether behavior is implemented or verified. List
uninspected or ambiguous areas explicitly. A small, honest partial model is
better than a broad model built from guesses.

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
no author to ask, split and record it as a judgment call rather than choosing.

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

An Entity has only two authored edges — the `entities` list on a Capability that
acts on it and on a Screen that presents it — so an Entity nothing declares is
unused vocabulary and fails `lint`.

## Use References honestly

Attach the artifacts that established each resource's meaning: `role:
implementation` for the code you traced, `role: intent` for the spec, PRD or
proposal that states the behavior, `role: context` for background you read. For
code targets, prefer `path#symbol` over line ranges and use only tracked files.
A Reference records where a claim came from, never that it is verified, and none
is required for any Coverage status — but a resource with nothing attached
should be one you can justify from inspection alone.

Visual or research References may guide inspection. Keep their role honest,
never treat their existence as proof, and never run screenshot capture
workflows.
