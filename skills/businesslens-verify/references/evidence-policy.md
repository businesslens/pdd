# Evidence policy for verification

- A scenario is met only when its observable behavior is implemented — a
  similarly named function, route, or flag is not evidence by itself.
- Trace the full path: entry point → handler/service → persistence or
  external effect → the outcome the scenario names.
- Tests corroborate evidence; they do not replace reading the
  implementation. Documentation alone proves nothing.
- Divergence from the planned behavior is a gap even when the implementation
  is arguably better; record what was found and let the user decide whether
  the plan changes.
- Partial implementations are gaps, never rounded up to met.
- Never claim live operational state (deployed configuration, external
  systems, data) from source code alone — that verdict is unverifiable.
- Prefer `path#symbol` codeRefs; do not invent line numbers.
