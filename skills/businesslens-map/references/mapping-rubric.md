# Mapping rubric

## Inspect by behavior

- Start at user and operator entry points, then trace handlers or services,
  persistence or external effects, and observable outcomes.
- Read configuration, authorization, telemetry, jobs, and tests when they
  materially change product behavior.
- Use documentation as a lead. Confirm current claims in implementation.
- Never execute target code and never claim deployed or live state from source.

## Choose stable entities

- Actors differ by goals or privileges, not screens.
- Experiences are audience-and-capability boundaries such as a storefront,
  admin surface, API, or CLI.
- Screens are optional stable user-visible views. Model their information,
  actions, product-significant states, and capability boundary—not components,
  layouts, routes mechanically discovered from source, or visual variants.
- Reuse one Screen across web and mobile when its product semantics are shared;
  separate it only when purpose, information, actions, states, or boundaries
  materially differ.
- Domains group recognizable product areas.
- Features are durable capabilities, not UI labels or sequence steps.
- Business rules are reusable policies or invariants.
- Journeys represent stable user or operator goals.
- Scenarios are observable paths through a journey. Cover primary, permission,
  validation, conflict, and external-failure paths only where behavior differs.
- Add a decision point only when one condition creates at least two materially
  different product outcomes.

## Judge coverage

- `draft`: the model itself is still being authored or reviewed.
- `partial`: the model is useful and known product areas remain unmapped.
- `complete`: the intended product scope is modeled.

Coverage never states whether behavior is implemented or verified. List
uninspected or ambiguous areas explicitly. A small, honest partial model is
better than a broad model built from guesses.

## Use bookmarks honestly

`codeRefs` are optional navigation. Prefer `path#symbol` over line ranges and
use only tracked files. A bookmark is not proof; no bookmark is required for
any coverage status.

Supporting `links` may point to external visuals or research. Validate and use
them as leads, but never treat their existence as proof or run screenshot
capture workflows.
