# Verification rubric

Every format rule — what each resource claims, how Interfaces divide into
Experiences, the Capability split test, Business Rules, Journeys, Step and
Screen facts, Variations and what selects them — lives in
[format.md](format.md). This rubric holds only the verification method.

## Trace behavior

Compare the model's observable contract, not matching vocabulary. Tests
corroborate source; they do not replace inspecting implementation. Partial
implementation is a gap, not alignment. Never claim deployed configuration,
external systems, or live data state from source code.

- **Routes.** Trace each Capability Scenario route through every typed Step and
  most-specific Context place to its observable outcome. Trace every Journey
  Scenario route from its first Actor-owned Context place through each
  Capability-bearing Step to the terminal goal result, and compare the one
  authored Steps claim directly with repository behavior. Confirm every Step
  naming an actor is supported at its Context places and every derived
  availability place supports a Scenario Actor.
- **Interfaces.** Verify each availability Context independently; shared
  services do not prove web, mobile, CLI, or API parity. Distinguish a missing
  Interface commitment from a missing shared Capability. Undeclared internal
  APIs remain implementation detail. Confirm each Interface's division against
  who actually reaches its places — `lint` cannot see access until Experiences
  exist.
- **Nouns.** Confirm the Product keeps each named fact `## Information kept`
  claims, that each named state is one the Product distinguishes rather than an
  implementation flag, and that each declared relation and its cardinality
  hold. For every Step's `entities`, confirm the code performs each declared
  effect, moves the thing between exactly the states named, touches nothing the
  Step leaves out, and reads, changes or initializes exactly the `facts` it
  cites.
- **Screens.** Compare each place against its view's code: the facts disclosed
  match `shows` and the inputs match `collects`; each derived Capability is one
  a Step placed there uses; each child Screen subdivides its parent's
  persistent working context; each `navigation` Screen is reachable from every
  place in its container. Never require component, layout, theme, ordinary
  copy, viewport, or screenshot similarity.
- **Languages.** Confirm the Product's `languages` against the locales the code
  serves, and each Interface's list against what that surface loads.
- **Who may.** For each Business Rule with `permits`, confirm the code lets
  exactly the granted actors perform the operation, under the stated
  conditions, and refuses everyone else; an operation closed with
  `permits: []` must be refused. A grant the code does not enforce is reported
  as **not established**. Confirm a fact-scoped Rule — a derivation, a field's
  visibility or edit — against the code that computes, shows or writes the
  fact, at every Screen presenting it and every Step citing it, never Entity
  presence alone.
- **What varies.** Trace each alternative under its own `selectedWhen`: the
  code supports it now, reads the named setting, assignment or discriminator to
  choose it, applies the stated default for a missing or unsupported choice,
  and re-reads and keeps the choice as `takesEffect` and `stability` say. An
  alternative the code no longer offers, a choice made by something other than
  what the set names, or an undocumented default is a finding. Hold an
  alternative permission Rule's grants against the Steps and Screens that run
  under that alternative only — `lint` cannot. Where a resource's lead says it
  exists only under some alternatives or only while a setting, plan or licence
  enables it, confirm that is where the code offers it.
- **Wording.** External visuals and research are context; their existence is
  never proof. Inspect an authoritative text Reference when a Rule requires
  exact wording; if it cannot be accessed, report that requirement as
  unverifiable.

## The border

The model records what an Actor can reach, see, supply, do and trigger at each
place. It never says how that looks or is built. The redesign test decides
which side a difference falls on:

> Rebuild a view with a different component library, layout, typography,
> colors, spacing, icons, motion and copy. Everything that would still have to
> be true is the model's: who can reach the view, what facts it shows, what
> abilities it offers, what conditions change that, and what happens next.
> Everything the redesign is free to change is design's, and the model says
> nothing about it.

A difference the redesign is free to make is never a finding. Ordinary copy is
design; compare exact wording only when a Business Rule requires its
authoritative Reference, and report it unverifiable when that source is
unavailable.

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

## Separate scope from authority

Git diffs identify likely changed surfaces. They never establish a plan, choose
truth, or prove that an unchanged file is irrelevant. Include unchanged
dependencies when they determine scoped behavior.

When authority is not already explicit, present:

1. what the model says;
2. what code currently does;
3. exact inspected files;
4. the smallest meaningful choices;
5. a recommendation and why;
6. downstream findings the answer resolves.

Group questions by root decision. Do not ask a menu of symptoms.

Discuss the choices only while authority remains open. After resolution, report
the resulting decision without replaying settled alternatives on later runs.

## Internal intent resolution

Use when code-right or neither-right is chosen. Draft the smallest exact Product
Model delta, covering affected Interfaces, optional Experiences, Capabilities,
availability Contexts, Rules, Capability Scenarios, Journeys, Journey
Scenarios, relationships, and removals. Get approval before writing. Skip broad
brainstorming because the verification finding already supplies the problem.

## Internal scoped mapping

Use only for established behavior in an absent or deliberately untrusted model
area. Do not silently remap trusted areas. Inspect it like adoption mapping:
start at entry points, trace handlers, persistence and outcomes, confirm docs
in implementation, read permissions from authorization checks rather than
names, and read each Interface's access from who reaches its places. Draft
every resource by the format reference, apply the border above, draft honest
coverage and necessary relationships, and get approval before writing.

Both internal authoring flows write current product meaning under the format's
persistence rule: keep rejected approaches and selection history in the
conversation; preserve current constraints and material unresolved questions
or missing evidence; an unchosen option is not a product exclusion.

## Stop safely

- Builder unavailable: return a complete handoff packet.
- Same build-directed gap unchanged after one attempt: stop the loop.
- Source cannot establish runtime/external behavior: report unverifiable.
- Product authority remains undecided: wait for that decision.
- Structural blocker prevents model comparison: report the lint finding first.
