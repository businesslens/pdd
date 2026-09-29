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
- An Experience is who is there and what they can do — a coherent Actor
  context with one access mode inside exactly one Interface, the folder that
  holds it — never what it looks like. Whether an Interface is divided into
  Experiences is derived, never judged: it is divided when it serves more than
  one `access` value, or when its Actors split into groups no Capability
  available there bridges (a Capability bridges the Actors its Scenario Steps
  name). Otherwise it holds no Experiences and availability names the
  Interface directly. `lint` decides and reports a violation as an error;
  Experiences that are alternatives in a Variation, and an Experience whose
  name also exists under another Interface — a counterpart — justify
  themselves. `access` is the most open the context can be; a setting that
  closes it (content public only while guests are allowed) is a grant's
  `when`, never a reason for an Experience of its own. Do not equate an Experience with a page, command group, route
  tree, API, or CLI.
- Screens are optional stable views an Actor reaches: places, decided under
  "Places, not designs" below — not components, layouts, routes mechanically
  discovered from source, or visual variants.
- A Screen belongs to one Interface, Experience or parent Screen. The same view
  on web and on mobile is two Screens with the same name — counterparts, told
  apart by their path — each listing its own facts and Capabilities, so a
  divergence between them is visible instead of silent.
- Create Domains from the Product's own sections — its navigation, settings and
  administration areas — one per section holding two or more Capabilities (the
  finest navigation level that still holds two or more; a parent menu is a
  section only when none of its children is); existing Domains are the author's
  and are never re-cut.
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
  Capability. Write one wherever the Product itself carries an Actor from one
  Capability into another toward one outcome — a redirect, a required next Step,
  an emailed link — and none where the Actor merely chooses what to do next.
  Returning the Actor to where they were already going after signing in is not a
  hand-off, and neither is a continuation the Product runs without the Actor,
  such as merging automatically once checks pass. The test is structural; do not
  omit a Journey it finds.
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

The model records what an Actor can reach, see, supply, do and trigger at each
place. It never says how that looks or is built. One test decides every case:

> Rebuild a view with a different component library, layout, typography,
> colors, spacing, icons, motion and copy. Everything that would still have to
> be true is the model's: who can reach the view, what facts it shows, what
> abilities it offers, what conditions change that, and what happens next.
> Everything the redesign is free to change is design's, and the model says
> nothing about it.

Design lives in `visual` References with `role: intent`. Ordinary copy is
design; when exact wording is a product requirement, a Business Rule identifies
its authoritative Reference.

- **Screen facts.** A Screen's `entities` distinguish `shows` (what the Product
  discloses) from `collects` (what the Actor supplies). Each present list is
  non-empty and names Entity facts; a prefilled editable fact can be in both. A
  bare Entity id is only for an Entity without named facts. Read permissions
  apply only to `shows`.
- **Screen Capabilities are derived.** Never author Screen `capabilities`: they
  are the Capabilities of Steps placed exactly on that Screen, from both
  Scenario kinds. Parent and child Screens keep separate sets, and every Screen
  needs at least one.
- **Step facts.** On every `reads`, `changes` and `creates` entry, write
  `facts`: the exhaustive named Product facts read, changed or initialized,
  including product-defined defaults. `[]` means none, never unspecified.
  `removes` has no `facts`. Do not infer operation effects from form fields or
  list incidental implementation data.
- **Nesting.** A child Screen subdivides its parent's persistent selected
  subject or process: changing the parent context changes or ends the child.
  Tabs within one resource reading and wizard stages qualify. Choose the
  nearest qualifying context as the parent. A process stage needs its own Actor
  decision or input on the same draft or operation; a completion message, a
  generated credential reveal or a read-only result is an Outcome on the
  process Screen, not a child. A generic settings or category selector is
  neither a selected subject nor a process. Opening a destination from a view
  does not make that view its owner: a panel opened from several views sits
  once at their common Interface or Experience. URLs, co-visibility, modal
  versus page, and different drawings of the same information decide nothing.
  Treat ambiguous ownership as a question for the author.
- **Conditions.** An empty, unauthorized or blocked view is a `condition` Step,
  Edge case or Rule outcome in the Scenario that meets it, and its capture
  attaches to that Scenario. Confirmation stays behavior on its host;
  preserving the underlying view is an Outcome.
- **Movement and reach.** Steps say movement and entry points say arrival;
  `navigation` lists only Screens reachable from every place in its Interface
  or Experience.
- **Journeys and browsing.** A wizard is a Journey only when its Scenario
  crosses Capabilities. Ordinary filtering, sorting and searching are Scenarios
  of the browsing Capability unless they differ by contract — the split test in
  the format reference: a permission (a separate grant of who may), availability
  or verb of their own; a Rule that only constrains one part does not split it.
  Settings in one section of the Product's navigation are one Capability however
  the screen saves them — each field on its own or one Save button — and
  settings in different sections are separate Capabilities: all notification
  settings are one. The same verb reached from another context is the same
  Capability, available there too: changing a password the Product requires at
  sign-in is Change password, joined to sign-in by a Journey. Ways of doing one
  verb that share all of those are Scenarios of one Capability, and the Steps of
  one run, including a link the run sends to finish it, are one Capability. A
  continuation several Capabilities share is its own: each ends its Scenarios at
  the hand-off, stated in their Outcome, and a Journey joins them.
- **Languages.** `languages` belongs to the Product, optionally narrowed by an
  Interface. Content kept in several languages is an Entity fact, and how a
  language is chosen for someone is a kept fact such as *Preferred language*
  with the Steps that set it; neither is `languages` or a Variation.
- **One encoding per kind of difference.** A flag deciding whether someone may
  perform an Entity operation is a grant's `when` (*self-service cancellation
  on or off*). A setting, assignment or version choosing between complete,
  supported forms of a resource is a Variation of the smallest resource that
  contains the difference: *a checkout that skips address review for half of
  Shoppers* is an Experiment of two Scenarios of Checkout; *a store that keeps a
  VAT invoice or a sales tax receipt* is a Configuration of Entities, carried
  into the Scenarios that create each. A branch on state the behavior meets —
  out of stock, payment declined — is Scenario conditions and outcomes; a
  difference only in looks is design. A different address or header alone
  never makes a separate Interface.
- **What selects.** A Variation chooses by a fact that exists to choose — a
  setting, an experiment assignment, a version discriminator — or by the
  deployment, fixed before the behavior starts. A fact describing the thing the
  behavior acts on is state, read by a `condition` Step or decision point even
  when someone set it earlier: a page's own editor format is a condition of
  editing, while a sign-in method the deployment selects makes each method a
  Capability in a Variation; methods that coexist, the Actor choosing one at
  sign-in, are Scenarios of one Capability. A method a setting adds beside the
  others still coexists with them: it is a Scenario of that Capability, and a
  Business Rule without grants says it exists only while enabled. Scenarios vary
  only when what an Actor does differs and one choice decides it, even when
  several settings combine to make that choice: sign-in that starts at the only
  provider automatically drops the Actor's choice, so it selects Scenario
  alternatives. When two or more settings would each vary or split the same
  Scenario, whether they change the Actor's Steps or the outcome — a captcha and
  a provider password on one registration — none makes a Variation; each is a
  decision point. A setting that changes only the Product's own Steps — group
  sync replacing or adding Roles — is a decision point in one Scenario, as is
  any choice made during a run; the one exception is a Step that must name a
  different alternative of another Variation, which varies with it. When such a
  setting changes the outcome — registration requiring email confirmation leaves
  the account inactive, an unknown social account is registered or refused — the
  branches are separate Scenarios, each with a `condition` Step reading the
  setting, not a Variation. If another setting also varies or splits that
  Scenario, each setting is a decision point instead. The unconfirmed account
  sign-in later meets is state. A resource that exists only under some
  alternatives or only while a setting enables it (registration while the
  sign-in method is password; social sign-in while a provider is configured)
  stays ordinary; a Business Rule without `permits` applying to it names the
  Variation or the setting.
- **Every context it is used from.** A Capability is available in every
  Experience in which one of its Actors uses it — guests reading pages in a
  public Experience and signed-in Users in an authenticated one — never only
  in the most open. Each Experience holds its own counterpart Screen unless
  every Experience shares it, and a Screen reached before and after signing
  in exists in each Experience that reaches it.
- **Variations.** One `variations/<id>.md` per set, per the shared format
  reference: membership only in its `alternatives`; the mechanism,
  `takesEffect` and `stability` once on the set; `selectedWhen` (and a
  Version's `label`) per alternative. A set exists only when two or more
  resources of one type are all supported now and something selects between
  them; a threshold or other parameter stays content of one resource.
  Alternatives of a Scenario Variation share their Capability or Journey, and a
  Step is never an alternative. Link
  existing Entities and facts; never invent Entities, settings, allocations,
  defaults or timing. Omit an optional field the evidence does not establish,
  say so in a required one, and record the gap in Coverage.
- **Prohibitions.** A Rule can prohibit a fact nobody reads; it needs
  resolvable references, not an example of the prohibited behavior.
  Experiments and messages are ordinary Entities and behavior only when the
  Product manages them.

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
