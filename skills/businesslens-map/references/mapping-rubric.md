# Mapping rubric

Every format rule — Actors and roles, Interfaces and their division into
Experiences, Screens, Domains, naming, Entities, the Capability split test,
Business Rules and prohibitions, Journeys, Step and Screen facts, availability
in every context, Variations and what selects them — lives in
[format.md](format.md). This rubric holds only the mapping method: how to find
those resources in a repository and where the evidence stops.

## Inspect by behavior

- Start at user and operator entry points, then trace handlers or services,
  persistence or external effects, and observable outcomes.
- Read configuration, authorization, telemetry, jobs, and tests when they
  materially change product behavior.
- Use documentation as a lead. Confirm current claims in implementation.
- Never execute target code and never claim deployed or live state from source.
- Repository deployables, routes, commands, APIs and integrations are evidence,
  not automatic Interfaces. Map an Interface only for a supported Product
  interaction contract.
- Treat shared backend code as no evidence of web/mobile/API/CLI parity. Verify
  each declared availability Context independently; offering a Capability on
  two Interfaces because one implementation serves both is a question for the
  author, not a default.
- Read each Interface's access from who reaches its places in the code — which
  routes or commands work without signing in, which need a session, which only
  some roles may enter. `lint` cannot see this condition until Experiences
  exist; deciding it is yours.
- Read permissions from the authorization checks the code performs, never from
  names. A privilege that exists only in code is not product meaning.

## Acceptance coverage

Capability Scenarios state observable acceptance for one Capability. Cover
primary, permission, validation, conflict, and external-failure behavior only
where the Product distinguishes them. Where the line falls between a Scenario
and an `## Edge cases` bullet is the author's call and belongs in the Coverage
round.

## Entity granularity

Apply the Entity test in the format reference: write `## Information kept`
first and read the count off it. Put both shapes and their counts to the
author when you can; with no author to ask, split and surface the unresolved
granularity question in the proposed delta. Once resolved, record the resulting
meaning without retaining the compared shapes.

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
- **Languages.** Read `languages` from the locales the code ships, per Product
  and per Interface. Content kept in several languages and a person's chosen
  language are Entity facts (format reference), never `languages`.

## Describe coverage

Record scope, covered behavior, approved exclusions, known Unmapped behavior
and material Limitations. There is no status, and an empty Unmapped list never
means complete. Coverage never states whether behavior is implemented or
verified. A small, honest model with recorded gaps is better than a broad model
built from guesses.

## Use References honestly

Attach the artifacts that established each resource's meaning: `role:
implementation` for the code you traced, `role: intent` for the spec, PRD or
proposal that states the behavior, `role: context` for background you read. For
code targets, prefer `path#symbol` over line ranges and use only tracked files.
A Reference records where a claim came from, never that it is verified, and none
is required — but a resource with nothing attached should be one you can
justify from inspection alone.

Visual or research References may guide inspection. Keep their role honest,
never treat their existence as proof, and never run screenshot capture
workflows.
