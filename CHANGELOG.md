# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.9.0] - 2026-08-26

### Added

- **Entity — a thing the Product keeps or reasons about.** Capabilities name the
  Product's verbs; Entities name its nouns. The test is identity, not storage: a
  draft the Product never persists still qualifies, a row no Actor can name does
  not. The unit is the naming test — a shopper says "this order", never "this
  order line". It carries `## Information kept` and/or `## States` with
  frontmatter `transitions`, at least one of the two. What the Product keeps,
  never how it is stored: no types, no keys, no join entities.
- **Three edges, each with one owner.** A Capability declares the `entities` it
  **changes** — covering changes to information, which a transition cannot
  express — and declares nothing for a thing it merely reads, so *what can alter
  this* keeps an answer. A transition is `{ from, to, by }`, cross-checked
  against that declaration. A Screen declares the `entities` it presents. An
  Entity nothing references is an error.
- **Every Entity edge is resolved on the wire, not only in the folder.** A report
  cannot carry a relation to a thing that does not exist, a transition to a state
  the Entity lacks or by a Capability that does not list it, an `entityIds`
  member naming nothing, or a Step claiming a state its lifecycle never reaches.
  A report expands straight into an authored folder, so an edge the folder
  rejects must not survive the wire.
- Ids, References and assets are checked on an Entity exactly as on every other
  element, and both "for every element" lists are now derived from the model and
  from the schema rather than written by hand — a new element kind fails the
  build until every check has it.
- `## Relations` and `## Transitions` are invalid sections on an Entity, for the
  reason `## Steps` is invalid on a Scenario: the frontmatter list is the one
  authority and a prose section beside it is a second one that can disagree.
  `state` stays Screen-only — a capture depicts a view, and no artifact depicts
  "Confirmed".
- An **Actor** may carry `## Information kept` for what the Product keeps about
  them, so a Reader's reading position has a home without modelling the Reader
  twice. An Actor is who acts; an Entity is what is acted upon.
- **Entities relate to each other.** `relations: [{ entity, verb, cardinality }]`
  declares an edge in the product's own words — `holds many-to-many item` — with
  the inverse derived so the two sides cannot disagree. Relationships between
  things a user can point at are product meaning; the guard is the format's
  existing test, *is it observable to an Actor*.
- **A relation states both ends.** `one-to-one`, `one-to-many`, `many-to-many`,
  read source to target. One end is not a relationship: *a Source publishes many
  Items* leaves unanswered whether an Item may come from two feeds, and *can I
  save this article into two collections* is a product decision a reader will
  ask about — `collection-membership-does-not-control-saving` only means anything
  because the answer is yes. An author who needed the second end and had nowhere
  to put it wrote the relationship twice facing itself, which the Content Feed
  Reader Blueprint did.

  **`many-to-one` does not exist.** That relationship is declared from the other
  Entity, where it reads `one-to-many`, so one `1:N` has exactly one encoding and
  two independent authors cannot write it from opposite sides. Two Entities that
  declare relations at each other are a `lint` warning naming both files.

  The Entity page reads each row's *far* end, so an Item published by one Source
  says so — it previously copied the authored end onto the inverse and printed
  "publishes many Source" on the page of a thing that has exactly one. The
  Topology label carries both ends in the notation an ERD reader already has:
  `publishes 1:N`, `holds M:N`.
- **A Scenario Step may name the `entity` it acts on and the `state` it leaves
  it in.** The Scenario's Entity set is derived from its Steps, exactly as its
  Actor set is, and `lint` closes the loop: the state must be one the Entity
  has, and some transition must reach it by that same Capability.
- **A new Topology view, "What it keeps"** — the Product's own ERD, and the only
  view whose subject is its nouns. Entities and the authored relations between
  them, each labelled with its verb and both cardinality ends, each drawn once
  because the inverse is derived. A relation an Entity declares at itself is drawn as a loop
  rather than the stub a step router collapses it to. Capabilities are
  deliberately absent: one edge per (Capability, Entity) pair buried the reading
  the view exists for, and what changes a thing is on the thing's own page.
  Entities also take their place on the Everything canvas, and their relations
  join its resolved relation web.
- A Capability page shows what it changes, a Screen what it presents, and a
  Scenario what it moves. The authored direction was declared in the model and
  dropped by the viewer.
- The Product Model's own description gains **what it keeps**.
- **Unattended Scenarios.** A Scenario's first Step may be a `condition`
  carrying `unattended: true`, and such a Scenario needs no Actor Step. A
  schedule the Product owns, an expiry, or a retry is real Product behavior with
  nobody to name, and requiring an Actor forced it to be written as somebody
  else's request or left uncovered. The Content Feed Reader Blueprint stated a
  recurring collection schedule in prose and had no Scenario for it; it does now.
- `agent` joins the Interface interaction types: the surface an AI coding
  harness reaches through installed skills or tools. Two independent authors
  modelling one such surface picked two different existing values, because none
  of the nine fitted.
- An Interface may hold `screens/` beside `experiences/`, for a Screen genuinely
  shared across its Experiences. Previously a search or settings view common to
  several Experiences had to be duplicated into each one.
- **The Product Report renders Entities.** An Entity has a rail entry with its
  count and icon, a collection, a page, search results, connections, and a place
  on the Everything topology canvas. Its page reads the lifecycle forward from each state — the
  states it can move to sit beside the state's own prose, and a terminal state
  says so rather than simply having no outbound row. A Screen's `Product states`
  stay the view's own and are never merged with an Entity's lifecycle.
- `docs/product-model.md` draws the two hierarchies and two axes it had only
  described, and states every structural boundary as the rule that decides it.
  A new Entities page joins the Product Model group.

### Changed

- **Relational structure lives in frontmatter.** `transitions` moves out of a
  Markdown section and joins `relations` there, because both name other elements
  by id — which is the rule every other field already follows. The prose form
  also had a silent mis-parse: `- Available → Sold by owner` read as
  `to: "Sold", by: "owner"` and linted clean.
- **A kind of file in a Product Model is an `Element`, not an entity.** That use
  was the loose one and gave the word up, so the kind that genuinely means a
  thing with identity could have it. The rename now reaches BusinessLens's own
  model and the Content Feed Reader Blueprint, which had kept the old sense in
  prose throughout — a Screen declaring `entities: [product-model, …]` in
  frontmatter while calling an Element an entity two lines below it was the
  exact collision the rename existed to remove.
- **One vocabulary for the id-naming rule.** It had three spellings:
  `spec/format.md` and the docs said *verb-entity*, `businesslens-map` and the
  `lint` message itself said *verb-object*, and both of those nouns had been
  retired as kind names. It is **verb-noun** everywhere, including the finding a
  reader actually sees. "Entity" no longer stands in for a plain JSON object in
  the two contracts either.
- **A thing's states leave the views that showed them.** Screen
  `## Product states` becomes `## View states` and holds only the view's own;
  `## Information presented` narrows to what that view shows. The Blueprint was
  writing Private/Published/Unlisted on two Screens and on the Collection.
- The Blueprint gains `item`, its most-mentioned noun and previously absent; the
  fixture gains `catalog-product` and `cart`, the latter appearing 15 times in
  prose and nowhere in the model.
- **An AI agent harness is an Actor**, with the id `ai-agent`. Three independent
  mappings of one repository split on whether the agent that loads a skill is a
  participant or the runtime an `agent` Interface is delivered through. It is a
  participant: it initiates, it reads and writes on the person's behalf, and it
  chooses what to inspect, propose, and when to stop — latitude a browser
  delivering a `web` Interface does not have. Named `ai-agent` rather than after
  one use of it, since the same participant appears in products unrelated to
  code. This promotes nothing else by analogy.
- **A behavioral id's noun half names something the model declares.**
  `install-agent-skills`, not `install-skills`, when `agent-skills` is an
  Interface. `lint` warns only where the author already declared the fuller
  term. Two independent mappings agreed on 95% of the Capabilities they found
  while sharing 29% of the ids; the concepts matched and the nouns did not.
- **An Entity, Domain, or Business Rule id never opens with a verb.** They name
  what a thing is, or what must remain true, so they read as nouns and
  assertions rather than commands. A single-segment id such as `order` is a noun
  by construction and is exempt.
- The report SDK type is `ProductReportV11`, matching the schema version it
  describes. `ReportObject` and its state and transition types are exported
  alongside it.
- **Folder schema 7 and Product Report v11 are the only accepted formats.**
  There is no compatibility reader.
- **Behavioral ids are verb-noun; cross-cutting ids are the bare noun.**
  `browse-catalog`, not `catalog-browsing`. Ids are the model's whole identity
  mechanism, and two models of one product that name the same behavior
  differently cannot be diffed, merged, or compared. The golden fixture and the
  Content Feed Reader Blueprint are renamed accordingly.
- **Whether an Interface holds Experiences is derived, never judged.** It holds
  them exactly when it serves more than one `access` value or two Actor sets
  with disjoint Capability coverage; `lint` computes this from fields already
  authored. A counterpart Experience under another Interface is exempt, so
  platform pairs keep their symmetry. One product previously had two lint-clean
  encodings — two Interfaces, or one Interface with two Experiences — whose ids
  shared nothing.
- **A Business Rule governs two or more behaviors, or a Context independent of
  any behavior.** Anything true of exactly one Capability is a `condition` Step
  or its Outcome, and `lint` warns otherwise. The boundary was previously
  unstated, and two independent authors classified the same two facts in exactly
  opposite directions.
- A Domain must state a `## Boundary` naming something it does not own, and
  warns when it holds fewer than two Capabilities.
- On an Interface, every `entryPoints` key must equal that Interface's own
  `type`. The key was unvalidated there while being enforced on Experiences and
  Screens, so one field carried three vocabularies and all of them linted clean.
- **`blueprint open` no longer overwrites the author's coverage prose.**
  `unmapped`, `limitations`, and `rationale` describe the model's own
  completeness and survive expansion intact; only `method`, which is a claim
  about how a model was derived, is replaced. A Blueprint carries no claim about
  its own origin.
- `businesslens-map` must end every proposed delta with a `Judgment calls`
  section naming each choice that could have gone the other way. A reviewer can
  see what a model says but not what it omits, which is where two independent
  maps of one repository actually diverged.
- **Attach what you read.** `businesslens-map` no longer treats References as
  optional polish: it attaches to each element the artifacts that established its
  meaning — the code it traced, the spec or PRD stating intent, the document it
  took context from — and `businesslens-ideate` attaches the `role: intent`
  artifact a decision came from. Permission with no trigger is why a whole
  release shipped with References on Capabilities and Interfaces and nowhere
  else.
- **`businesslens-map` asks rather than collapsing a distinction.** Its Entity
  rule is the identity and naming test rather than the retired state count, one
  Entity per thing the Product treats differently, and Entity granularity joins
  the required `Judgment calls` list. Folding several things into one element is
  not a smaller model; the information is gone and no reader can recover it.
- **The rounds reach `businesslens-ideate` and `businesslens-verify` too.**
  Ideate invents the same model from scratch, and verify re-authors parts of it
  in three of its five resolution branches — its scoped-map branch *is* mapping.
  Both were still draft-then-approve, which is where approval becomes a
  formality. Ideate works all four rounds in thorough mode and keeps its three
  batched questions for a quick change, which has no frontier. Verify's
  authoring branches settle the undetermined calls before drafting; its
  authority question in step 6 is untouched, because that one already asks the
  right thing the right way. Each skill carries its own copy, as a self-contained
  skill must.
- **`businesslens-verify` verifies the nouns.** Information kept, each named
  state, each transition's cause, each relation and its cardinality, and every
  `entities` list on a Capability and a Screen. `businesslens-ideate` covers
  Entities at all, which it did not.
- **`businesslens-map` settles the undetermined calls with the author, in
  rounds, before writing anything.** Boundary first, because everything hangs
  off which surfaces are Interfaces and who the Actors are; then Granularity,
  quoting both counts wherever a family could be one Entity or several; then
  Naming. Each question carries its options, what each one costs, and a
  recommendation, so the author corrects a draft rather than filling a blank.
  Finding facts stays the agent's job — it asks only what it cannot look up.
  With no author reachable it does not quietly choose: the defaults apply and
  every unanswered question lands in `Judgment calls` as an open question.

  Three independent mappings of one repository agreed on about 93% of the
  Capabilities they found and shared 69% of the ids. Every divergence that
  mattered was a decision the source cannot settle. `Judgment calls` had been
  surfacing these *after* the model was written, as a list to review, which
  makes approval a formality.

  A fourth round covers the acceptance surface: how many Scenarios each
  Capability needs, and where the line falls between a Scenario and an
  `## Edge cases` bullet. A guided run negotiated every element count except
  that one, chose 19 of its 71 elements alone, and invented the rule it used to
  decide them — then reported it against itself when asked what the rounds had
  missed. Availability joins the same round wherever a Capability would be
  offered on two Interfaces because one implementation serves both, which is the
  parity inference the rubric already refused and the same run made anyway.
- **How many Entities is a step, not a judgement.** Write the
  `## Information kept` list first: one Entity if a single list is true of every
  candidate, several the moment it needs *"depending on the kind"*. Being
  stored, parsed and rendered alike is named as not the test, because that is
  the argument that most often wins when it should not. When the call is still
  close, split — a merge stays available to anyone later, while a collapse
  deletes the difference and leaves nothing saying the question existed.
- **Three more things are not Entities**, each of which passes the naming test
  and is still not product meaning. A **representation** of an Entity — a
  serialization, export or rendering — is that thing in another shape; if you
  can regenerate it, it belongs in that Entity's information. A **receipt** the
  Product keeps so its own work is safe is for the Product, not an Actor. The
  Product's own **surfaces, shipped content and closed vocabularies** are what
  it *is*: where there are no instances, only members of a fixed list, that is a
  vocabulary. The discriminator is stated outright, because it traps a tool
  whose subject is models — does the Product keep information about instances of
  this, or is this the Product itself?

### Fixed

- `docs/cli-open.md`, `docs/cli-export.md`, `docs/product-model.md`,
  `spec/report.md` and the three bundled skill format references still described
  folder schema 6 and Product Report v10 — one of them asserting that v10 was the
  only accepted report version, which the schema had not agreed with since v11.

## [0.8.0] - 2026-08-25

### Added

- **Co-located assets.** Files beside `<type>.md` are product assets owned by
  the entity; anything under the reserved `implementation/` directory
  describes this realization and stays home. Class comes from the path, which is
  the only rule a tool writing a capture on CI can satisfy. An optional
  `assets:` list titles and scopes those files without ever setting their class,
  and unlisted files stay legal.
- An optional `state:` on a reference or asset, valid only on a Screen and
  validated against its `## Product states`, so several captures of one view are
  placed beside the state each depicts instead of arriving as a flat list.
- A `prd` Reference kind for attaching a product requirements document as
  `intent` or `context` without making that external document the Product Model
  authority.
- An optional ordered `screens:` list on an Interface or Experience declaring
  reading order over its own children. Reachability stays with the tree.
- `businesslens view` serves repository files from a read-only, extension-
  allowlisted mount, and the report viewer renders local `visual` references and
  co-located assets as thumbnails instead of inert text.
- **Every entity has a page**, at its own URL, with the authored body at full
  width — steps, inline routes, decision points, screen states, rule statements,
  connections, and references are no longer confined to a drawer. Every page
  has Overview; Capability and Journey pages alone add Scenarios.
- **A concrete Actor's marker draws what it is.** The Actor mark carries the
  authored `kind` as its silhouette — a person or a system, at the size every
  other kind's mark uses — and the Product-boundary `relationship` is written as
  a word where each reading has room for it. A Scenario Step names its Actor
  with that mark in a chip that opens the Actor, rather than as prose.
- The open section and the open entity page live in the URL, so a report has
  deep links, a working browser back button, and a refresh that lands where it
  left. `BusinessLensReportViewer` exposes both as bindable models.
- Each collection states the question it answers and the derivation behind its
  reading order, in the vocabulary the named topology views already use.
- Every collection opens grouped by the containment the format declares for it,
  and says so when an entity relates to more than one group.
- Counterpart Screens, Experiences and Interfaces cross-link from their pages:
  the same thing on another Interface is named as such rather than appearing to
  be a duplicate row.
- One entity's neighbourhood is drawn on the named Topology canvas, at a width
  that can render it, when the reader chooses the page's Neighbourhood action.
- The stable BusinessLens Product Report: an entity-first browse, search,
  scenario, journey, and named-topology experience over one complete report
  projection. It renders every authored entity on its page while ranking
  collection and Overview readings for repeated human use.
- A shared Vue Flow foundation in the report-viewer layer (`@vue-flow/core` with a
  `@dagrejs/dagre` layered layout, both optional peer dependencies): one
  entity box and one container box for nine visual categories (with both
  Scenario types distinguished in content), a fixed relation-verb
  vocabulary, a measured Interface → Experience → Screen containment map, a
  sitemap of the same hierarchy drawn either as a top-down tree or radially
  from the Product core, plus focused entity filtering on the named Topology
  surface.

### Changed

- **Context is now the single location concept.** Folder schema 6 replaces
  scalar availability boundaries and Scenario Places with one strict
  `{ place: ... }` Context shape across Capability availability, Scenario
  Steps, and Business Rule selectors. A Context place resolves to an Interface,
  Experience, or Screen; Screens derive their place from their path and declare
  no availability of their own.
- Product Report v10 mirrors the same model with `{ placeId: ... }` Contexts,
  removes the former availability and Place wire records, and is the only
  accepted report version. The CLI, report SDK, Product Report, bundled skills,
  fixtures, and Content Feed Reader Blueprint consume schema 6 and report v10
  directly.
- Product Model terminology now names the Interface → Experience → Screen
  hierarchy directly. The under-defined “surface” alias, including
  `surface-parent`, surface-tree IDs, and the former Delivery surfaces view, has
  been replaced by concrete entity names and `screen-parent`.
- Product Report entity readings present authored Capability Context once
  instead of repeating it in the fact strip and under “Available in.” Derived
  Journey and Scenario Contexts stay with their concrete routes, Screen
  placement stays in identity, and Rule Context selectors stay with
  applicability. Journey starting places retain the exact first route Context
  and appear as “Starts at”; raw entry-point routes remain report data rather
  than human-facing report content.
- Collection rows, relations, search results, and topology entities open their
  URL-backed pages directly. References stay in Overview, Neighbourhood opens
  Topology, and the inspector and slideover are removed. The private report
  experiment layer remains under the final `report-viewer-lab` name with no
  active report experiments; the background audition remains independent in
  `theme-lab`.
- **Capability and Journey Scenarios share one route-and-Steps model.** Every
  Scenario now owns named `routes` and one ordered, typed `steps` list. An Actor
  Step names its responsible Actor, a Journey Step may name its Capability, and
  a contextualized Step maps every route to its exact Interface, Experience, or
  Screen. Route-neutral Steps remain first-class without a Context. The
  separate Journey
  `flow`, `operation`, stage ids, per-Step route objects, Scenario-wide Actors
  and availability, authored Screen Scenario backlinks, and Markdown `## Steps`
  are removed. Folder schema 3 and Product Report v7 are no longer accepted;
  this release has no compatibility reader.
- Every Interface now declares one required interaction `type` (`web`,
  `mobile-app`, `desktop-app`, `cli`, `api`, `webhook`, `messaging`, `voice`,
  or `device`). Reports preserve it directly and use it to distinguish
  Interface contexts visually instead of guessing from ids or route names.
- A Journey Step names a durable Capability, never a Capability Scenario, while
  its text states the concrete observable action or condition. Capability
  Scenarios may split and merge without leaving dangling Journey composition
  references.
- **Journey pages have one Scenario reading.** The peer `Flows` tab and the
  duplicate Journey-local diagram are removed because they projected the same
  authored Steps while silently dropping Steps without a Capability. The named
  topology view is now **Journey composition**: it explicitly answers the
  narrower Capability-composition question. Outside visible Domain groupings,
  Capability nodes use the consistent Capability color rather than inheriting
  a Domain color that could be mistaken for status.
- **Capability and Journey Scenarios share one Steps treatment.** Both render
  the same Step-by-route matrix. Columns use the authored route name and stable
  order; placed cells show the exact typed Interface → Experience → Screen
  hierarchy. Step-kind labels explain Actor actions, Product actions, and
  conditions; Capability labels appear only where they discriminate Journey
  Steps. Steps without a Context and Context transitions are described in
  plain language, without exposing internal route ids.
- **The report navigation rail lists kinds, flat.** Kinds do not nest —
  instances do — so both Scenario kinds leave the rail and are read on the page
  for the Capability or Journey that owns them. The Capability and Journey main
  screens open their collections directly, without a redundant parent/Scenario
  tab strip. Ten destinations instead of twelve, and no indentation claiming a
  hierarchy the other eight rows have too.
- **Collection chrome scales with the collection.** The per-relation filter
  dropdowns collapse into one control with a chip per *active* filter, and it is
  not rendered at all below eight entities — seven dropdowns above four Journeys
  was a wall, not an offer. The card-style switcher is gone; the dense row is
  the only layout, and it carries the fact that distinguishes an entity from its
  neighbours (a Screen's scope, a Scenario's parent) where the repeated kind
  label used to be.
- Entity tables render the name of a relation the format makes single-valued
  rather than the count `1`, and drop any column constant across the rows on
  screen.
- The bundled skills carry a worked Capability Scenario. The reference every
  skill reads described `routes`, typed `steps`, and per-route Contexts in
  prose but showed no Scenario file, leaving the model's most structured
  artifact to be inferred. The example is single-route, because that is the
  case where the `routes` requirement is least guessable.
- The bundled skills name the Product's portable identity keys — `summary`,
  `category`, `authors`, and `license`. Report hosts read all four, and a model
  authored without them reaches a Blueprint incomplete.
- `npm run check` asserts that every entity kind, frontmatter key, and required
  section named in `spec/format.md` also appears in the canonical skill
  reference. The reference may be terser than the contract; it may not omit a
  name, because an agent cannot author a key it was never told about. It found
  the three missing Product keys above on its first run.
- A README for the `businesslens/nuxt/theme` layer, which shipped as a public
  export with no documentation of its palette roles, type scale,
  `<BusinessLensBrand>` lockup, or icon-family composable.
- **Folder schema 5 — a breaking change with no compatibility reader.** An
  entity is compact as `<id>.md` until it owns an asset or typed child
  collection, then expands to `<id>/<type>.md`. Both shapes derive the same id
  and cannot coexist. This keeps leaf-heavy collections readable while giving
  every kind—Screens most of all—a co-located namespace when needed.
  `product.md` similarly expands to `product/product.md` only when it owns
  `logo.svg`. Two coexisting shapes, and an expanded folder missing its
  `<type>.md`, are `lint` errors — neither is a state a correct model passes
  through. An expanded folder that owns nothing *yet* is a warning instead: the
  rule still holds, and expansion normalizes the folder back to the compact
  form, but an author reaches the expanded shape in two steps and the
  intermediate step is not a defect.
- **The Interface → Experience → Screen hierarchy nests.** An Experience
  belongs to exactly one Interface and
  a Screen to exactly one scope, so the path is the parent relation. An
  Experience no longer writes `interfaces:`, a Capability Scenario no longer
  writes `capability:`, a Journey Scenario no longer writes `journey:`, and a
  Screen no longer writes `availability:`. Reparenting is a `git mv` that reads
  correctly in a pull request.
- **Interface, Experience, and Screen ids are qualified** by the path that
  distinguishes them. Experience and Screen names repeat across Interfaces on purpose: two entities of the same
  kind sharing a path suffix below their Interface are counterparts — the same
  thing on two Interfaces. Behavior-tree ids stay bare and globally unique.
- **Domain is a subject axis, not a capability folder.** It now requires a
  `## Boundary` section, and only Capability authors `domain:` — a Screen's,
  Experience's or Journey's Domains are derived through their Capabilities
  rather than restated where a second copy could disagree.
- Product Report `schemaVersion` is `10.0.0`, and the catalog media type moves
  to `version=10`. There is exactly one accepted report version, as before.
- Scenario documentation moves onto its parent's page. A Scenario is not a
  top-level entity — it has a mandatory single parent that decides its kind —
  so Capability Scenarios are documented in `docs/capabilities.md`, Journey
  Scenarios in `docs/journeys.md`, and the containment rule that separates them
  in `docs/product-model.md`. The standalone `docs/scenarios.md` is removed.
- An external system is an Actor only when it **initiates** interaction with
  the Product, and only then does it arrive through an Interface.
  Interfaces are inbound by definition; an outbound connection the Product
  opens to a third party — a polled feed, a payment processor, a mail provider,
  a model API — is not an Interface and its far side is not an Actor. Model the
  call inside the Capability that makes it, scope that Capability to the
  Interfaces where an Actor observes the result, and make its
  product-significant failure behavior a Capability Scenario. Direction, not
  ownership, is the axis: the same third party calling the Product back through
  a webhook is a genuine Actor with a genuine Interface. No entity type, folder
  schema, parser, or linter behavior changes — `lint` cannot recover direction
  from the files, so the rule lives in `spec/format.md`, the Product Model
  docs, and the mapping rubric.
- The Content Feed Reader Blueprint applies that rule. It drops the
  `feed-provider` Actor and the `syndicated-feed-integration` Interface;
  `feed-synchronization` now lives on the Reader-facing Interfaces where its
  result is seen, carries the RSS specification as a context Reference, and is
  triggered by a Reader-initiated refresh on the Source list Screen — a trigger
  the model previously never stated. Its catch-up failure variation no longer
  contradicts itself about whether the backlog was unchanged or caught up.
- **Breaking.** `businesslens/nuxt/report-viewer` accepts the canonical
  `ProductReportV10` directly and owns the complete Product Report projection
  and topology engine. The lossy `businesslens/report/view-model` export and
  the former whole-report audition layer are removed. The private,
  unpublished `report-viewer-lab` remains as an empty boundary for future
  experiments, while `theme-lab` continues to own background auditions.
- **Breaking.** Logo, lockup, and favicon selection are no longer theme-lab
  experiments. The approved mark, wordmark, brand renderer, favicon, and
  install-icon family now live at canonical paths in `businesslens/nuxt/theme`;
  `businesslens/theme-lab/variants` exposes background choices only.
- The Product Report keeps entity identity collision-safe across collections,
  preserves focus across live recompiles, separates Capability and Journey
  Scenario readings, shows Screen-to-Journey derivation provenance, renders
  ordered Journey path lanes, and uses fixed named views instead of a generic
  cross-kind grouping builder. Mobile navigation is a dedicated drawer.
- Product Report v10 stores authored supporting H2 sections as ordered
  `{ heading, content }` records instead of an opaque Markdown string. Lint
  rejects Journey and Scenario lead prose, duplicate or conflicting structured
  sections, malformed structured lists, and duplicate values in set-valued
  relations rather than allowing authored content to disappear or inflate
  derived relationships.
- The Content Feed Reader catalog Blueprint now models two actor-facing access
  boundaries: Reader work and Visitor consumption. Feed collection is an
  outbound Capability dependency rather than a synthetic Actor or Interface.
  The model has two Actors, two Interfaces, three Experiences, three Domains,
  eight Screens, ten Capabilities, twenty-four Capability Scenarios, four
  Journeys, eight Journey Scenarios, and four Business Rules. Domains group
  Capabilities on one axis — Sources, Reading, Collections — so no Capability
  needs its Domain's definition widened to admit it.
- Both teaching models now demonstrate a Journey that is attempted and not
  reached. The Blueprint carries two `not-achieved` Journey Scenarios and the
  golden fixture one, so `result` is an axis with real values rather than a
  constant, and `failureOnlyCapabilityIds` is exercised against authored
  content instead of always deriving empty.
- The Product Report treats Capability Scenarios and Journey Scenarios as
  separate entity kinds rather than one kind carrying a type flag. They remain
  contained by their Capability or Journey while preserving their own search
  results, pages, terminal results, and derived backlinks.

### Fixed

- The release artifact smoke test follows the promoted stable boundaries: it
  requires the approved icon under `theme`, not an old `theme-lab` audition
  path, and rejects the retired lossy Report View Model export instead of
  requiring it. The stale assertions stopped the first `v0.8.0` publish
  attempts before npm.
- `package.json` no longer lists `plans/shared-theme-lab.md` among its packaged
  files. The file was deleted while the entry stayed, and npm drops a missing
  `files` entry silently, so the packed tarball simply carried no `plans/` at
  all and nothing reported it.
- The docs group allowlist no longer permits `Learn from examples`, which no
  page has used since the feed-reader walkthrough was removed. An allowed group
  with nothing behind it is a sidebar section the navigation cannot build.
- Two routes of one Scenario that repeat the same Context place sequence are
  now a finding in both `lint` and report validation. A route id names one
  traversal, so a second id over the same sequence claims a lane the Product
  does not have. The Content Feed Reader Blueprint carried two:
  `publish-on-mobile` and `unlist-from-mobile`, which never left the web
  Interface, and could not have — neither Capability declares a mobile context.
- Entity pages no longer inherit the scroll offset of the collection or entity
  that opened them, so each reading begins at its own title, identity, and lead.
- The local viewer resolves the Blueprint logo at `product/logo.svg`, where
  schema 5 puts it once the Product expands.
- An unexpected entry in a collection is now an explicit finding. A file nested
  one level too deep, or saved with the wrong extension, previously vanished
  from the model with no finding at all.
- The local viewer's Content-Security-Policy sets `manifest-src`, which was
  blocking `site.webmanifest`.
- The Product Report light and dark page surfaces are part of the shared theme
  again. The warm base, top glow, and paper grain moved from the optional
  theme-lab audition layer into `businesslens/nuxt/theme`, where the promoted
  Product Report and the bundled local viewer inherit them without depending on a
  lab layer.
- Journey composition no longer implies a Screen is reached from a Step that
  cannot expose it. A Screen is authored against the whole Journey Scenario, so
  it now attaches to the last Capability-bearing Step whose Capability declares that
  Screen and shares an availability context with it — a non-visual integration
  Step no longer appears to land on a Reader Screen.
- Journey composition lays ordered Capability-bearing Steps downward with variations side by side. A
  left-to-right chain was wider than the canvas for a short Journey, so it
  scaled the whole graph down and left the height unused.

## [0.7.2] - 2026-08-05

### Added

- Add `--help` and strict option parsing to the Blueprint catalog publisher so
  its maintainer-only production flow is discoverable before a credential is
  configured.

### Fixed

- Open the `BL` ligature apart in the generated tab icons, so a browser tab shows
  two letters instead of one blob at 16px. Only the favicon family is respaced —
  the logo artwork and the larger app icons keep the ligature as drawn.
- Restrict the Blueprint publisher credential to the exact production catalog
  origin or a loopback development origin, preventing a mistaken `--catalog`
  value from sending it to an arbitrary HTTPS host.

## [0.7.1] - 2026-08-04

### Fixed

- Compile the public `businesslens/theme-lab/variants` subpath into `dist` so
  plain Node consumers such as Playwright can import it from `node_modules`
  without relying on unsupported TypeScript stripping.

## [0.7.0] - 2026-08-04

### Added

- `businesslens view` renders the current Product Model privately on localhost,
  recompiles automatically after debounced source edits, streams revisions to
  open browsers, retains the last valid report during lint errors, writes no
  generated report, and opens no network listener beyond `127.0.0.1`.
- Root `businesslens` exports for the pure Product Report view-model projection,
  the shared Nuxt report renderer, and a sibling BusinessLens-wide theme Layer,
  so hosts share UI without a second public npm package.
- An opt-in shared Nuxt theme-lab Layer for auditioning the same backgrounds,
  marks, lockups, and favicon families across the landing site and local report
  viewer without promoting undecided presentation into the stable theme.
- An optional `.businesslens/logo.svg` Product logo used by the local viewer and
  Blueprint presentation.
- First-class Interface entities for supported Product interaction contracts,
  with exact Interface–Experience availability across Capabilities, Journeys,
  Screens, Scenarios, and Business Rules.
- Required Actor classification as `person|system` and `external|internal`.
- Platform-neutral Screen entities for meaningful web and mobile product views,
  including product-visible information, actions, states, capability boundaries,
  relationships, and optional public routes or deep links.
- Universal References on every semantic entity, with independent artifact
  kinds (`code|spec|proposal|doc|adr|visual|research`) and attachment roles
  (`intent|implementation|context`). Referenced content stays outside the
  Product Model and never replaces its prose or proves alignment.
- `businesslens-map` for initial adoption, scoped remapping, and deliberate
  Product Model coverage expansion without executing target code.
- `businesslens-verify` as the single post-build invocation. It classifies
  model/code gaps, negotiates only authority decisions, automatically runs
  internal intent-resolution or scoped-mapping phases, hands code corrections
  to a harness-injected builder, and re-verifies until aligned or blocked.
- `report only` verification mode, an explicit missing-builder handoff, and an
  unchanged-gap stopping rule. Verification findings are re-derived rather than
  persisted in a receipt or ledger.
- Accepted decisions covering repository-owned files, unified References,
  non-persisted verification, and the three-skill boundary.

### Changed

- The CLI now uses a real hierarchical command parser with concise root help,
  command-specific options, nested Blueprint help, standard `-h`/`-V` flags,
  strict option ownership, and usage validation before command execution.
- `-c, --cwd` now always means "run from this directory". A model directly in the
  current directory wins over the Git-root model whether or not `--cwd .` was
  typed explicitly.
- **Breaking.** A catalog Blueprint has no separate `blueprint.yaml`. Product
  ID, title, summary, description, category, tags, authors, license, and report
  content come from `product.md`; visual identity comes only from
  `.businesslens/logo.svg`, and catalog operational state remains outside the
  Product Model.
- **Breaking.** Product Report v7 is the only accepted report contract. It
  carries portable Product identity and attribution, uses `summary` for the
  short Product description, and renames computed entity totals to `counts`.
- **Breaking.** `blueprint contribute` no longer accepts `--slug`; the Product
  ID is the canonical contribution directory, branch suffix, catalog slug, and
  pull name.

- **Breaking.** Folder schema 3 and Product Report v7 are now the only accepted
  formats. Schema 1/2, Product Report v4/v5/v6, and their compatibility paths are
  removed rather than migrated.
- **Breaking.** Feature is renamed Capability throughout the folder format,
  parser, SDK, CLI, skills, docs, fixtures, and Blueprint. `features/` is
  rejected; Capabilities live in `capabilities/`.
- **Breaking.** Experiences now declare their Interfaces and no longer carry
  `exit`. Journeys use Capabilities and exact availability, may cross Domains,
  and no longer declare one Domain. Business Rules exclusively own Rule scope.
- Domains are optional Capability groupings. Screens remain optional and now
  use exact availability without embedding visual evidence.
- The bundled Content & Feed Reader Blueprint now demonstrates the complete
  model, including cross-platform Screens, product states, mobile deep links,
  and external visual and research references.
- **Breaking.** The public skill set is exactly `businesslens-map`,
  `businesslens-ideate`, and `businesslens-verify`. Ideate also handles a narrow
  already-decided verification handoff without reopening broad brainstorming.
- **Breaking.** `businesslens validate` is now `businesslens lint`. The old
  spelling is refused with exit code 2 and a replacement message; it is not an
  alias. Lint output contains only `ok`, `errors`, `warnings`, and `counts`—no
  branch situation or authority inference.
- **Breaking.** `references` replaces both `codeRefs` and `links`. Reference
  records are strict, duplicate targets fail lint, code targets require tracked
  files, and missing local non-code targets warn.
- `coverage.status` now describes model breadth only: `draft` while the model
  itself is under review, `partial` with known unmapped areas, and `complete`
  when intended product scope is modeled. A complete model may have zero
  References.
- **Breaking.** Product Report v7 declares a `workspace` or `portable` Reference
  profile. Portable projection replaces evidence-redaction terminology and
  keeps only HTTP(S) intent/context References.
- **Breaking.** Coverage no longer contains counts, mapped entities, or a
  redaction flag. Entity totals live only in Counts; Coverage is independent
  from References. Blueprint open and pull preserve model breadth while
  removing repository-local Coverage source areas.
- Every model creation path carries canonical orientation in
  `.businesslens/README.md`. BusinessLens still never writes target-root
  `AGENTS.md`, `CLAUDE.md`, or README files.
- Canonical report expansion now owns that orientation file for `open`, `pull`,
  and `contribute`; Blueprint contributions accept every valid model-breadth
  Coverage status and publish no source-repository provenance.
- Lint now requires the complete committed model shell (`README.md` plus a
  `.gitignore` covering `build/` and `cache/`), and CLI argument, provider,
  scope, slug, and catalog-origin errors consistently exit with usage code 2.
- Documentation now teaches three starting doors and one ongoing loop:
  `ideate → injected build → verify (including final lint) → merge`. Map is explicitly not a
  daily maintenance command, and lint is explicitly not semantic verification.

### Fixed

- Product logos are parsed as namespace-aware XML and restricted to a static SVG
  allowlist, closing namespace-prefix and escaped-reference paths around the
  active-content checks. Logo responses from the local viewer also carry a
  script-free sandbox CSP.
- `blueprint pull` retrieves the optional logo from the selected catalog's
  same-origin endpoint, so custom catalogs and commit-pinned reports cannot be
  paired with the current logo from the official PDD `main` branch.
- Releases tag an already prepared package and changelog exactly once; the tag
  push is now the single automatic publication trigger.

### Removed

- `businesslens-init`, `businesslens-sync`, `businesslens-doctor`, and
  `businesslens-deep-dive`. Their useful scopes now belong to map or verify.
- The `businesslens-contribute` skill. Catalog contribution remains the
  deterministic `businesslens blueprint contribute` CLI command.
- Git branch-state routing from lint and the internal `branch-state` module.

## [0.6.0] - 2026-07-31

BusinessLens consolidates onto one site. The Platform is retired; the Blueprint
catalog moves to `businesslens.io` and becomes anonymous to browse and to pull.

The previous published npm version is `0.5.0`. An intermediate draft of this
release included authenticated Platform workflows, but it was never published;
the final `0.6.0` replaces those workflows with the anonymous catalog and the
pull-request contribution flow described below.

### Added

- `businesslens open <report>` expands a local Product Report back into a
  canonical `.businesslens/` Product Model, making `export` and `open`
  semantic inverses.
- `businesslens pull <blueprint-name>` anonymously retrieves a Blueprint and
  expands it without a user-facing `report.json` download. It writes a
  greenfield block into `AGENTS.md` and sends
  `user-agent: businesslens/<version>` to the catalog.
- **Features** and **business rules** are first-class product-model entities
  with their own directories, IDs, relationships, and validation rules.
- A `businesslens/report` library entry point exporting the Product Report
  schema, its cross-entity validator, and the canonical digest. It depends only
  on `zod` and never loads the CLI.
- `redactSourceEvidence` in the `businesslens/report` contract strips every
  repository reference from a report before it leaves its owning workspace —
  `codeRefs`, repository `entryPoints`, repository-relative `links`, and
  `coverage.sourceAreas`. Product-facing routes and HTTP(S) URLs are kept.
  `coverage.mapped` remains a model-quality signal, and
  `coverage.evidenceRedacted` records both that those counts describe the
  origin repository and that validation must reject any repository path still
  present.
- `businesslens-plan` and `businesslens-verify` skills for planning in the
  Product Model and verifying implementation evidence before merge.
- `businesslens-implement` builds the software a Product Model describes, with
  its scenarios as the acceptance contract.
- `businesslens-ideate` proposes candidate product directions as a shortlist.
  It is the only skill that never writes to the model.
- Draft greenfield product models, with missing-evidence warnings during
  planning and support for exporting planned Product Model Versions before
  implementation is complete.
- `blueprints/` — the Blueprint source layout, with a `blueprint.yaml` manifest
  and MIT-licensed content.
- `blueprints:check`, wired into `verify`, parses every manifest, builds every
  Blueprint, and rejects any that carries source evidence. It does not trust
  `contribute`, because anyone can open a pull request by hand.
- `blueprints:publish` pushes built Blueprints to the catalog.
- `resolveModelRoot` allows the model to live outside the Git root or without a
  repository, adding general monorepo support.
- A structured open-source documentation section with tutorials, individual
  skill pages, and deterministic navigation frontmatter.
- `docs/terminology.md` defines every product-model entity and separates the
  terms that are easy to confuse.

### Changed

- **Breaking.** `businesslens publish` is now `businesslens contribute`, and
  opens a pull request against `businesslens/pdd` through the `gh` CLI rather
  than submitting to a Platform. No API key is involved. The model in the pull
  request is regenerated from a redacted report, so it carries no source paths
  and is byte-identical to what `pull` produces.
- **Breaking.** `businesslens build` is now `businesslens export`. `build` still
  works and warns; it will be removed after 0.6.x.
- `export` emits a source-free **Product Report v4** at
  `.businesslens/build/report.json`, replacing the portable v3 `project.json`.
  The report carries no repository URL, commit, branch, or workspace metadata.
- **Breaking.** `.businesslens/` is now called the **Product Model** throughout
  the CLI, docs, and skills. "Product map" is reserved for a visual or
  navigable view of that model. Draft coverage is an evidence state and no
  longer implies a reusable Blueprint.
- Product Report validation rejects content that cannot round-trip into
  canonical Markdown and inconsistent mapped-coverage counts. Product Model
  validation continues to reject non-draft behavioral claims without evidence.
- `--catalog` defaults to `https://businesslens.io` and accepts any origin.
  Precedence is `--catalog`, `BUSINESSLENS_CATALOG_URL`, then the default.
- `businesslens-publish` is now `businesslens-contribute`.
- Skill runners pin the CLI to the version the skills were installed from rather
  than resolving the latest published version, which could validate a model
  against an older published format.

### Fixed

- Report expansion is idempotent. `open` appended its coverage limitation
  unconditionally, so every open/pull cycle gained another copy and broke the
  guarantee that a pulled Blueprint matches what the catalog holds.
- Docs dispatch sends an immutable commit-pinned revision to the landing
  pipeline ([#2](https://github.com/businesslens/pdd/pull/2)).

## [0.5.0] - 2026-07-26

### Added

- `build` and `publish` CLI commands, the `businesslens-publish` skill with its
  isolated runner, and the CI publishing recipe
  ([#1](https://github.com/businesslens/pdd/pull/1)).

## [0.4.0] - 2026-07-26

Initial public launch of the repository.

### Added

- CLI: `install`, `update`, and `validate` commands.
- Agent skills: `businesslens-init`, `businesslens-sync`,
  `businesslens-deep-dive`, `businesslens-validate`, and
  `businesslens-doctor`.
- The `.businesslens/` product-map format and its contract in
  `docs/format.md`.
- Claude plugin manifest and marketplace entry.

[Unreleased]: https://github.com/businesslens/pdd/compare/v0.8.0...HEAD
[0.8.0]: https://github.com/businesslens/pdd/compare/v0.7.2...v0.8.0
[0.7.2]: https://github.com/businesslens/pdd/compare/v0.7.1...v0.7.2
[0.7.1]: https://github.com/businesslens/pdd/compare/v0.7.0...v0.7.1
[0.7.0]: https://github.com/businesslens/pdd/compare/v0.6.0...v0.7.0
[0.6.0]: https://github.com/businesslens/pdd/compare/v0.5.0...v0.6.0
[0.5.0]: https://github.com/businesslens/pdd/compare/v0.4.0...v0.5.0
[0.4.0]: https://github.com/businesslens/pdd/releases/tag/v0.4.0
