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
  the facts disclosed match shows and inputs match collects (a bare
  id claims only presence, and is a finding when the Entity has named
  facts); each derived Capability is one a Step placed on that
  Screen uses; each child Screen subdivides its parent’s persistent working context; each
  `navigation` Screen is reachable from every place in its container. Do not
  require component, layout, theme, ordinary copy, viewport, or screenshot similarity:
  the model claims none of it, and a finding about looks is not a finding.
- For Steps, confirm each `facts` list exhaustively names what the code reads, changes
  or initializes at that place, and that an `actor` Step's `reads` sits on a Screen presenting
  the Entity (Product and condition Steps, and fact-free mentions of an Actor, are exempt).
- For a fact-scoped Rule, confirm the code at every Screen presenting the fact
  and every Step citing it — never Entity presence alone.
- For `languages`, confirm the Product's list against the locales the code
  serves and each Interface's list against what that surface loads.
- Do not claim deployed configuration, external systems, or live data state from
  source code.
- External visuals and research are context; their existence is never proof.
  Inspect an authoritative text Reference when a Rule requires exact wording;
  if it cannot be accessed, report that requirement as unverifiable.

## The border

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
  Interfaces; addresses and headers alone never decide. Other variation belongs
  in Scenario conditions/outcomes or cross-behavior Rules. A permission flag may
  be a grant's `when` on an Entity operation, never a Capability target.
- A Rule can prohibit a fact nobody reads. Require resolvable references, not an
  example of prohibited behavior. Experiments and messages can be ordinary
  Product Entities and behavior when the Product manages them.


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

Apply the border above to scoped mapping as well as verification.

## Stop safely

- Builder unavailable: return a complete handoff packet.
- Same build-directed gap unchanged after one attempt: stop the loop.
- Source cannot establish runtime/external behavior: report unverifiable.
- Product authority remains undecided: wait for that decision.
- Structural blocker prevents model comparison: report the lint finding first.
