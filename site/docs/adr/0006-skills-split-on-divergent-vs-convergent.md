# The authoring skills split on divergent vs. convergent, not on empty vs. existing

> **Current state (2026-10).** The skill names below describe the release this decision was made
> for. The installed skills are now `businesslens-map`, `businesslens-ideate`, and
> `businesslens-verify`; ideate absorbed `plan`, and `businesslens-implement` was retired. The
> loop's middle phase is **Implement**, run by the reader's own workflow rather than by any
> BusinessLens skill. See `CONTEXT.md`.

`businesslens-plan` already does two jobs — a guided definition for a blank repository, or
feature planning on an existing model — so it looked natural to split it in half on whether a
model exists. We split somewhere else instead: **ideate** proposes and never writes, **plan**
writes entities, **implement** writes code.

## Considered and rejected

Splitting on empty-vs-existing produces two skills that both author model files and differ only
in the state of the directory. The hard part — what makes a good journey, scenario or edge case —
is identical in both, so they would either duplicate `planning-rubric.md` or share it while
remaining nominally separate. `businesslens-plan` therefore stays intact.

## Consequences

- `businesslens-ideate` must **never write into `.businesslens/`**, on an empty repo or a
  populated one. A Product Model holds what the product does, not what it might. Its output is a
  shortlist a person chooses from; the moment they choose, `plan` takes over.
- Ideate's value is highest on an *existing* model, where it can read the actors, journeys, rules
  and domains that are there and propose what is missing or next. That is the mode to design
  first, not the blank-page one.
- It has no precedent in the repo — all other skills are convergent and produce files — so its
  `SKILL.md` shape is being invented rather than matched.
- `businesslens-implement` is not called `build`: `businesslens export` compiles a Product
  Report, and `.businesslens/build/` is where that output lands.
