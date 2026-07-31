---
name: businesslens-sync
description: Repair an existing .businesslens/ product model after code changed without the model being planned first, correcting affected entities and stale evidence without rebuilding unrelated areas. Use when the model has drifted from unplanned work; for planned work use businesslens-plan before implementing and businesslens-verify after.
---

# Synchronize the product model

Recover model truth after unplanned code changes. The primary loop is plan
(update the model) → implement → verify; sync is the repair lane for
everything that bypassed it. Update only the product truth affected by the
repository changes.

Read [references/format.md](references/format.md) and
[references/evidence-policy.md](references/evidence-policy.md) before editing.

## Workflow

1. Require an existing `.businesslens/` Product Model. If it is absent, stop and direct
   the user to `businesslens-init`.
2. Run `npx businesslens validate --json` to establish the current baseline.
   Record pre-existing errors separately from drift introduced by the change.
3. Determine the change range from explicit user context first. Otherwise
   inspect the working tree, staged diff, and recent commits. Do not assume a
   generated cache establishes the correct baseline.
4. Map changed files to existing entity `codeRefs`, then inspect new routes,
   commands, handlers, services, models, configuration, and tests that may
   expose behavior not yet referenced.
5. Update only affected entities:
   - changed behavior → revise feature/rule/journey/scenario prose, decisions,
     relationships, and evidence;
   - added behavior → add the smallest justified scenario, journey, feature,
     business rule, experience, actor, or domain;
   - removed behavior → remove obsolete entities and relations;
   - moved implementation → repair `codeRefs`;
   - completed SDD work → link the relevant spec and describe the resulting
     behavior, not the proposal.
6. Check reverse relationships after every structural edit: actors referenced
   by experiences/features/journeys, domains referenced by features/journeys/
   rules, features referenced by journeys and rules, business rules referenced
   by features/scenarios, experiences referenced by features/journeys, and
   globally unique scenario IDs.
7. Run `npx businesslens validate --json` until green. Fix errors caused by
   the sync; do not conceal unrelated pre-existing problems.
8. Update `coverage.md` when inspected or unmapped areas materially changed.
9. Report the change range, entities changed, evidence repaired, validation
   result, and any remaining limitations.

## Guardrails

- Never execute target repository code.
- Never rewrite the entire model when a targeted update is sufficient.
- Never copy prescriptive SDD text into the descriptive product model.
- Never submit or contribute the Product Model from this skill;
  `businesslens-contribute` is the explicit public-catalog workflow.
