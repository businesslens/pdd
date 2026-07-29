# Planning rubric

## Scope

- Plan one coherent intent at a time — something a reviewer can approve or
  reject as a whole on one branch. Split anything that could ship
  separately.
- Prefer the smallest well-defined plan over a speculative epic.

## Entities

- Actors are defined by goals or privileges, never by UI screens.
- Features are stable capabilities, not screen labels or one-off sequence
  steps.
- Business rules are durable assertions or policies, not implementation
  checks.
- Journeys express stable user or operator goals; scenarios are observable
  paths through a goal, not implementation branches.
- Cover the scenario space deliberately: primary success, permission or
  authorization failure, validation failure, conflict, and external-failure
  paths — when the planned behavior genuinely distinguishes them.
- Keep prose at product altitude: what a user observes, not how the system
  achieves it.
- Use a Decision point only when one product condition creates two or more
  materially different outcomes.
- Record intent when the reason behind a boundary, rule, or behavior would
  guide future implementation choices.

## Scenarios are the acceptance contract

`businesslens-verify` will check the implementation against each scenario's
Trigger, Steps, Decision points, and Outcome. Write them so a reviewer could
check them against source code without executing anything:

- Good: "Submitting an empty cart shows an error and keeps the cart."
- Too vague: "Cart validation works."
- Wrong altitude: "POST /cart returns 400."

A scenario that yields nothing checkable is too vague to plan.

## Dialogue

- Propose concrete drafts and let the user correct them; do not interrogate
  from a blank page.
- Batch open questions; ask only what the user must actually decide.
- Record undecided points as limitations or open questions in the report
  rather than guessing.
