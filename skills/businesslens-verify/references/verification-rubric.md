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
- For Screens, compare product-visible information, actions, meaningful states,
  and capability boundaries. Do not require component, layout, theme, viewport,
  or screenshot similarity that the Product Model does not claim.
- Do not claim deployed configuration, external systems, or live data state from
  source code.
- External visuals and research are context. Do not capture or fetch them as a
  verification workflow, and never treat their existence as proof.

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

## Internal intent resolution

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

## Stop safely

- Builder unavailable: return a complete handoff packet.
- Same build-directed gap unchanged after one attempt: stop the loop.
- Source cannot establish runtime/external behavior: report unverifiable.
- Product authority remains undecided: wait for that decision.
- Structural blocker prevents model comparison: report the lint finding first.
