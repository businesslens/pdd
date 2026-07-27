---
name: businesslens-init
description: Initialize Product-Driven Design in a repository by inspecting the codebase and building a complete, evidence-backed .businesslens/ product map. Use for first-time BusinessLens setup, replacing an incomplete scaffold, or rebuilding the map from scratch; use businesslens-plan for a blank repository with no code to map.
---

# Initialize BusinessLens

Build the repository's durable description of what the product does today.
Do not stop after creating folders or placeholder files.

Read these references before authoring:

- [references/format.md](references/format.md) — file layout and entity shapes.
- [references/analysis-rubric.md](references/analysis-rubric.md) — entity boundaries and coverage quality.
- [references/evidence-policy.md](references/evidence-policy.md) — what qualifies as evidence.

## Workflow

1. Confirm the working directory is a Git repository. Never execute the
   repository's application, build, migrations, or tests; inspect files only.
   If the repository contains no meaningful implementation to describe, stop
   and direct the user to `businesslens-plan` — a new product is planned as
   a draft map, not initialized from empty code.
2. Inspect existing instructions and product material first: `AGENTS.md`,
   `CLAUDE.md`, READMEs, documentation, architecture notes, and any SDD roots
   such as `openspec/`, `specs/`, or `.kiro/`.
3. Run the bundled inventory script using the current repository as `--root`:

   ```bash
   node <businesslens-init-skill-dir>/scripts/inventory-repository.mjs --root "$PWD" --write
   ```

   Resolve `<businesslens-init-skill-dir>` to this installed skill directory.
   Read the resulting `.businesslens/cache/inventory.json`, then inspect the
   high-signal files it identifies.
4. If `.businesslens/` already contains a complete map, do not replace it
   silently. Explain that `businesslens-sync` is the targeted workflow. If it
   is absent or clearly an unfinished scaffold, continue.
5. Create the authored layout from `references/format.md`. Initialize:
   - `config.yaml` with `schema: 1` and detected SDD paths only. Do not add a
     platform URL or credentials.
   - `taxonomies.yaml`, `product.md`, `coverage.md`, and `.gitignore`.
   - `actors/`, `experiences/`, `domains/`, and `journeys/`.
6. Form repository-backed hypotheses for actors, experiences, domains, and
   journeys. Ask the user only about material ambiguity that repository
   evidence cannot resolve.
7. Trace behavior from entry points through handlers/services, persistence,
   external integrations, configuration, telemetry, and tests. Author the
   complete map:
   - actors defined by goals or privileges;
   - experiences defined by audience and capability boundary;
   - domains grouping recognizable product areas;
   - journeys expressing stable user or operator goals;
   - scenarios covering primary, permission, validation, conflict, and
     external-failure paths when evidenced.
8. Add direct `codeRefs` to every journey and scenario. Prefer symbols over
   fragile line numbers. Keep uncertainty in limitations.
9. Insert or refresh this managed block in the repository-root `AGENTS.md`,
   preserving all content outside the markers:

   ```markdown
   <!-- businesslens:begin -->
   ## BusinessLens product map

   This repository maintains its product truth in `.businesslens/` (Product-Driven Design).

   - **Before** building or changing behavior: read the relevant experience/journey/scenario files to understand current behavior and where it lives (`codeRefs`).
   - **Plan** product changes by updating the map first (`businesslens-plan`), implement, then attach evidence with `businesslens-verify`.
   - **After** unplanned behavior changes: update the affected entity files and run `npx businesslens validate`.
   - Never edit `.businesslens/cache/` — generated.
   <!-- businesslens:end -->
   ```

   When an SDD root exists, add one bullet explaining that the map records
   what IS while SDD prescribes what WILL BE, and that the two should link
   rather than duplicate content.
10. Run `npx businesslens validate --json`. Fix every error and reassess all
    warnings. Repeat until validation is green.
11. Finish `coverage.md` honestly. Use `complete` only when every high-signal
    surface was inspected and no material area remains unmapped.
12. Report entity counts, inspected areas, unmapped areas, limitations, and
    the validation result. Remind the user to review and commit authored map
    files; never recommend committing `.businesslens/cache/`.

## Guardrails

- Describe evidenced behavior, never desired behavior.
- Do not infer authorization, access, or operational guarantees from names.
- Do not create empty entity stubs and call initialization complete.
- Do not connect to or publish to the BusinessLens platform from this skill;
  publishing is the separate `businesslens-publish` workflow.
- Do not overwrite a mature existing map without explicit user approval.
