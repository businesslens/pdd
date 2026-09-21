# Verification rubric

## Trace behavior

- Compare the model's observable contract, not matching vocabulary.
- Trace each Capability Scenario route through every typed Step and
  most-specific Context place to its observable outcome.
- Trace every Journey Scenario route from its first Actor-owned Context place
  through each Capability-bearing Step to the terminal goal result. Verify
  every Context place independently and confirm the correlations are supported.
- Confirm every Actor Step is supported at its Context places and every derived
  availability place supports at least one Scenario Actor.
- Verify Interface Contexts independently. Shared services do not prove web,
  mobile, CLI, or supported API parity.
- Distinguish a missing Interface implementation from a missing shared
  Capability. Undeclared internal APIs remain implementation details.
- Tests corroborate source; they do not replace inspecting implementation.
- Partial implementation is a gap, not alignment.
- For Screens, compare places against the view's code: for each Entity listed,
  the facts the view renders or collects are exactly the facts named (a bare
  id claims only presence, and is a finding in a `complete` model when the
  Entity has named facts); each Capability listed is one a Step placed on that
  Screen uses; each child Screen's content depends on an act inside its
  parent, and a region that does is not folded into the parent; each
  `navigation` Screen is reachable from every place in its container. Do not
  require component, layout, theme, copy, viewport, or screenshot similarity:
  the model claims none of it, and a finding about looks is not a finding.
- For Steps, confirm each `facts` list is what the code reads or changes at
  that place, and that an `actor` Step's `reads` sits on a Screen presenting
  the Entity (Product and condition Steps, and reads of an Actor, are exempt).
- For a fact-scoped Rule, confirm the code at every Screen presenting the fact
  and every Step citing it — never Entity presence alone.
- For `languages`, confirm the Product's list against the locales the code
  serves and each Interface's list against what that surface loads.
- Do not claim deployed configuration, external systems, or live data state from
  source code.
- External visuals and research are context. Do not capture or fetch them as a
  verification workflow, and never treat their existence as proof.

## The border

A finding is about what an Actor can reach, see, do and trigger at each place,
never how it looks or is built. Decide with the redesign test:

> Rebuild a view with a different component library, layout, typography,
> colors, spacing, icons, motion and copy. Everything that would still have to
> be true is the model's: who can reach the view, what facts it shows, what
> abilities it offers, what conditions change that, and what happens next.
> Everything the redesign is free to change is design's, and the model says
> nothing about it.

Component libraries, theming, layout, typography, color, iconography, motion,
microcopy and tone, gestures versus buttons, breakpoints, loading and hover
states, navigation chrome, the order of navigation items, and quality
attributes that do not change what an Actor can do are never compared; they
live in `visual` References with `role: intent`. Wording is not a claim: the
model says an Actor is told something under a condition — a Step, an Edge
case, a Rule outcome — and legally required text is a Rule whose wording is a
Reference, so compare the condition and the fact of telling, not the words.

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

Both internal authoring flows write current product meaning under the format's
persistence rule. Keep rejected approaches and selection history in the
conversation, including when drafting resource prose, supporting sections,
limitations, or README. Preserve current constraints and material unresolved
questions or missing evidence; an unchosen option is not a product exclusion.

Use when code-right or neither-right is chosen. Draft the smallest exact Product
Model delta. Cover affected Interfaces, optional Experiences, Capabilities,
  availability Contexts, Rules, Capability Scenarios, Journeys, Journey Scenarios,
  relationships, and removals. Get approval before writing. Skip broad
  brainstorming because the verification finding already supplies the problem.

## Internal scoped mapping

Use only for established behavior in an absent or deliberately untrusted model
area. Inspect it like adoption mapping, draft honest coverage and necessary
relationships, and get approval before writing. Do not silently remap trusted
areas.

Screens it drafts are places, never designs. A Screen lists the Capabilities
its own Steps use and, for each Entity it presents, the facts on screen —
read or entered alike, so a form presents what it collects — as
`{ entity, facts }`, bare only while the model is not `complete`. A child
Screen is a region whose content depends on an act inside its parent — picking
a row, choosing a tab, advancing a step; co-visibility and an own address do
not decide it, and the same content drawn differently is one Screen. A
confirmation dialog is two Steps on the host Screen; a slideover, tab or
detail pane with its own facts is a child; a wizard is a parent with one child
per step and a Scenario walking them, a Journey only where it crosses
Capabilities. Every ability a Screen exposes gets a Scenario with a Step placed
on that Screen. Filters, sorting and search are Scenarios of the Capability
that presents the set, facts cited on the Step; search presenting a set nothing
else does is a Capability. `navigation` names only Screens reachable from every
place in an Interface or Experience; nothing else about navigation is authored.
`languages` sit on the Product, narrowed on an Interface; a flag that changes
what an Actor can do is a settings Entity fact read by a Rule `when`, the
experiment itself unmodeled; versions served at once are places — own entry
point an Interface, shared one Experiences carrying `version`; historical
versions are never modeled.

## Stop safely

- Builder unavailable: return a complete handoff packet.
- Same build-directed gap unchanged after one attempt: stop the loop.
- Source cannot establish runtime/external behavior: report unverifiable.
- Product authority remains undecided: wait for that decision.
- Structural blocker prevents model comparison: report the lint finding first.
