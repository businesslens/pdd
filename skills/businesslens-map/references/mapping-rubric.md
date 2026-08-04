# Mapping rubric

## Inspect by behavior

- Start at user and operator entry points, then trace handlers or services,
  persistence or external effects, and observable outcomes.
- Read configuration, authorization, telemetry, jobs, and tests when they
  materially change product behavior.
- Use documentation as a lead. Confirm current claims in implementation.
- Never execute target code and never claim deployed or live state from source.

## Choose stable entities

- Actors differ by Product goals, triggers, responsibilities, or privileges;
  classify each as person/system and internal/external.
- Interfaces are supported interaction contracts such as customer web, reader
  mobile, operator CLI, or partner API—not every deployable or internal API.
- Experiences are coherent Actor contexts with stable access and capability
  boundaries across one or more Interfaces. Do not equate them with a page,
  command group, route tree, API, or CLI.
- Screens are optional stable user-visible views. Model their information,
  actions, product-significant states, and capability boundary—not components,
  layouts, routes mechanically discovered from source, or visual variants.
- Reuse one Screen across web and mobile when its product semantics are shared;
  separate it only when purpose, information, actions, states, or boundaries
  materially differ.
- Domains optionally group recognizable Product areas; zero is valid.
- Capabilities are durable Product abilities, not UI labels, Journey titles, or
  sequence steps. Map exact Interface–Experience availability only when the
  repository supports that claim.
- Business rules are reusable policies or invariants.
- Journeys represent stable user or operator goals.
- Scenarios are observable paths through a journey. Cover primary, permission,
  validation, conflict, and external-failure paths only where behavior differs.
- Add a decision point only when one condition creates at least two materially
  different product outcomes.
- Treat shared backend code as no evidence of web/mobile/API/CLI parity. Verify
  each declared availability pair independently.

## Judge coverage

- `draft`: the model itself is still being authored or reviewed.
- `partial`: the model is useful and known product areas remain unmapped.
- `complete`: the intended product scope is modeled.

Coverage never states whether behavior is implemented or verified. List
uninspected or ambiguous areas explicitly. A small, honest partial model is
better than a broad model built from guesses.

## Use References honestly

References are optional. Use `role: implementation` for established artifacts
and `role: context` for background. For code targets, prefer `path#symbol` over
line ranges and use only tracked files. A Reference is not proof, and none is
required for any Coverage status.

Visual or research References may guide inspection. Keep their role honest,
never treat their existence as proof, and never run screenshot capture
workflows.
