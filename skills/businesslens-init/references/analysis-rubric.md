# BusinessLens analysis rubric

The model is descriptive: record what the product does today. Keep desired
behavior in the repository's SDD layer.

## Entity quality

- Define actors by goals or privileges, not screens.
- Define experiences by audience and stable capability boundary, not pages.
- Group journeys into recognizable product domains.
- State journeys as user or operator goals with meaningful outcomes.
- Write scenarios as concrete observable paths, not implementation branches.
- Prefer a smaller set of well-supported entities over speculative labels.

## Coverage quality

- Inspect instructions and documentation before tracing entry points.
- Follow routes and commands through handlers, services, persistence,
  configuration, integrations, telemetry, and tests.
- Cover material success, permission, validation, conflict, and dependency
  failure paths when the repository evidences them.
- List meaningful unmapped areas and uncertainty.
- Use `complete` only when all high-signal surfaces were inspected and material
  gaps are absent.
