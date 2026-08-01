# Evidence policy

## What counts as proof

- A scenario is proven only when its **observable behavior** is implemented. A
  similarly named function, route, or flag is not evidence by itself.
- Trace the full path: entry point → handler or service → persistence or
  external effect → the outcome the scenario names.
- Tests corroborate evidence; they do not replace reading the implementation.
  Documentation alone proves nothing — treat it as a lead and confirm it.
- Partial implementations are never rounded up to proof.
- Never claim live operational state — deployed configuration, external
  systems, data — from source code alone.

## What counts as a decision

- The model describes behavior the code does not have.
- The code has behavior no entity describes.
- Both describe it, differently. **Divergence is a decision even when the
  implementation is arguably better** — record what you found and let the user
  decide whether the model changes.
- Evidence would depend on a file Git does not track.
- You cannot establish it from source alone. Saying so is a real answer.

## Citing evidence

- Prefer `path#symbol`. Use line ranges only when read from the current
  checkout, and never invent them.
- Attach evidence to the scenario that claims the behavior **and** to its
  journey.
- Every path must already be tracked by Git.

## Recording what is left

- Keep the model descriptive. Link SDD intent rather than copying it.
- Record conflicting or incomplete evidence as a limitation in `coverage.md`,
  not as a claim inside an entity.
