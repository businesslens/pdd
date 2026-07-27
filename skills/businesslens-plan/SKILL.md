---
name: businesslens-plan
description: Plan product behavior directly in the .businesslens/ product map before implementation — a fully guided product definition for a blank repository, or a quick-or-thorough feature-planning dialogue on an existing map. Use when the user wants to plan, design, or specify a product or a feature; use businesslens-init to map an existing codebase.
---

# Plan in the product map

Planning is editing the map to describe intended behavior. Git is the change
model: the branch holds the plan, `businesslens-verify` attaches evidence
after implementation, and the verified map returns to evidence-backed truth.

Read these references before authoring:

- [references/format.md](references/format.md) — entity shapes, the draft
  rule, and the greenfield scaffold.
- [references/planning-rubric.md](references/planning-rubric.md) — what good
  entities and scenarios look like.

## Workflow

1. Confirm the working directory is a Git repository. Never execute the
   repository's application, build, migrations, or tests; inspect files only.
2. Detect the situation:
   - `.businesslens/` map exists → **feature planning** (step 5).
   - No map and no meaningful implementation → **new product** (step 3).
   - No map but implementation exists → stop; direct the user to
     `businesslens-init` to map today's truth first, then re-run this skill
     for the feature. Never plan against unmapped code.
3. New product — run the full guided interview. Cover, in order, and batch
   the questions: the product (name, one-paragraph why), actors (who, by
   goals), experiences (surfaces, access, entry points, exit), domains,
   journeys (one per stable user goal), scenarios per journey (primary path
   plus the failure paths that matter; each with Trigger, ordered Steps,
   Outcome), and known limitations. Propose concrete drafts after each
   answer; the user corrects rather than dictates.
4. New product — scaffold and author the whole map: `config.yaml`
   (`schema: 1`, empty `sdd.paths`, no platform), `taxonomies.yaml`,
   `product.md`, `.gitignore`, every entity file **without codeRefs**, and
   `coverage.md` with `status: draft` and a method noting the map was
   planned before implementation. Insert the managed `AGENTS.md` block from
   `references/format.md`. Continue at step 7.
5. Feature planning — choose depth. If the user says `quick` or `thorough`,
   honor it; otherwise infer: a small, well-specified ask is quick, a vague
   or cross-cutting one is thorough.
   - **quick** — read the affected map areas, draft the plan yourself, and
     ask at most three batched questions covering only decisions the map and
     repository cannot answer.
   - **thorough** — full interview: why, who, which surfaces, which
     journeys, the scenario space (success, permission, validation,
     conflict, external failure), what gets removed, and done-when.
6. Feature planning — edit the living map on the current branch to the
   intended state: add or revise journeys, scenarios, experiences, actors,
   and domains; keep still-valid `codeRefs` on modified entities; add **no**
   codeRefs for unbuilt behavior; add missing scenario kinds to
   `taxonomies.yaml`; delete entities the change retires and repair reverse
   relations.
7. Resolve `<businesslens-plan-skill-dir>` to this installed skill directory,
   then run the bundled validator outside the untrusted target:

   ```bash
   node <businesslens-plan-skill-dir>/scripts/run-businesslens.mjs \
     --root "$PWD" validate --json
   ```

   Fix every finding except expected `needs at least one codeRef` results on
   newly unevidenced journeys and scenarios (errors on a brownfield branch,
   warnings on a draft map). Those findings are the evidence checklist —
   leave them. Do not treat their absence as proof that a modified or deleted
   entity needs no implementation work; the map diff is the full plan.
8. Report: what was planned (entities added, changed, removed), open
   questions recorded, the full implementation worklist, the missing-evidence
   subset, and the next steps — implement, then `businesslens-verify`; commit
   the planned map to the working branch. For a design nobody will implement
   yet, the planned map itself is the deliverable.

## Guardrails

- Never invent implementation detail — no stacks, endpoints, schemas, or
  file names in entity prose.
- Never add a `codeRef` for behavior that does not exist, and never point at
  an untracked path. Planned behavior carries no evidence, not fake evidence.
- Never weaken or delete evidenced current truth except where the plan
  deliberately retires it — and say so in the report.
- Never present planned behavior as current; unevidenced entities are open
  work by definition.
- Never execute target code; never publish or contact the platform.
