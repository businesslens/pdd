---
name: businesslens-ideate
description: Think through what a product or feature should do and write the decision into the .businesslens/ product model, only after the user approves. Covers proposing candidate product directions on a blank slate or an existing model, and authoring the entities for a change the user has already decided on. Use whenever the user is deciding or describing what the product should do; use businesslens-init to map an existing codebase, and businesslens-sync once the code is written.
---

# Ideate against a product model

One conversation that converges: propose, let the user choose, then write what
they chose. Nothing enters `.businesslens/` without explicit approval.

Planning is editing the model to describe intended behavior. Git is the change
model: the branch holds the plan, `businesslens-sync` attaches evidence after
implementation, and the verified model returns to evidence-backed truth.

Read these references before authoring:

- [references/format.md](references/format.md) — entity shapes, the draft
  rule, and the greenfield scaffold.
- [references/planning-rubric.md](references/planning-rubric.md) — what good
  entities and scenarios look like.

## Workflow

1. Confirm the working directory is a Git repository. Never execute the
   repository's application, build, migrations, or tests; inspect files only.
2. Detect the model situation:
   - `.businesslens/` Product Model exists → **existing product**.
   - No model and no meaningful implementation → **blank slate**.
   - No model but implementation exists → stop; direct the user to
     `businesslens-init` to map today's truth first, then re-run this skill.
     Never plan against unmapped code.
3. Detect where the user entered the conversation:
   - They named no specific change — "what should I build", "what's missing",
     a domain but not a product → **explore** (steps 4-5).
   - They named a change to make → **converge** (steps 6-8).

   When it is genuinely unclear, explore first and offer to converge. Never
   assume a decision the user did not state.

### Explore — propose, and write nothing

4. Blank slate — from what the user tells you about the domain and the people
   in it, propose 3-5 distinct product shapes. Distinct means they would lead
   to different models, not different names for one idea. For each: who it
   serves, the one job it does, why someone would choose it, and what it
   deliberately is not. State the smallest version worth building.
5. Existing product — read the model in full and propose directions it could
   take that it does not take today: a domain the product implies but never
   covers, an actor it turns away, a journey that stops short of the goal
   behind it, a limitation in `product.md` that has stopped being true. Rank by
   what each would change for a user, not by how much work it is, and say
   plainly what you would do first and why. Name what each would cost elsewhere
   in the model — the rule it complicates, the journey it lengthens, the actor
   it introduces. An idea with no cost has usually not been thought through.

   Structural holes in what already exists — a journey with no permission
   scenario, a business rule no scenario covers, a feature reachable from no
   journey — are `businesslens-doctor` and `businesslens-deep-dive` findings.
   Mention them in a sentence and hand them off; do not turn this into an audit.

   Then present the shortlist and stop. When the user chooses, continue at
   step 6 with their choice.

### Converge — draft, get approval, then write

6. Choose depth. If the user says `quick` or `thorough`, honor it; otherwise
   infer: a small, well-specified ask is quick, a vague or cross-cutting one is
   thorough. A blank slate is always thorough.
   - **quick** — read the affected model areas, draft the change yourself, and
     ask at most three batched questions covering only decisions the model and
     repository cannot answer.
   - **thorough, existing product** — full interview: why, who, which surfaces,
     which features, business rules, journeys, the scenario space (success,
     permission, validation, conflict, external failure), material decision
     branches, what gets removed, and done-when.
   - **thorough, blank slate** — full guided product interview. Cover, in
     order, and batch the questions: the product (name, one-paragraph why),
     actors (who, by goals), experiences (surfaces, access, entry points,
     exit), domains, features (stable capabilities), business rules (durable
     constraints), journeys (one per stable user goal), scenarios per journey
     (primary path plus the failure paths that matter; each with Trigger,
     ordered Steps, Decision points when behavior branches, and Outcome), and
     known limitations. Capture `## Intent` wherever the reason for a boundary
     or behavior materially guides implementation.

   Propose concrete drafts after each answer; the user corrects rather than
   dictates.
7. **Present the intended model change and get explicit approval before
   writing anything.** Summarize what will be added, changed, and removed,
   entity by entity. A model edit the user did not approve is indistinguishable
   from a decision nobody made.
8. On approval, write the model:
   - **Blank slate** — scaffold and author the whole model: `config.yaml`
     (`schema: 1`, empty `sdd.paths`, no obsolete hosted-service settings),
     `product.md`, `.gitignore`, every entity file **without codeRefs**, and
     `coverage.md` with `status: draft` and a method noting the model was
     planned before implementation.
   - **Existing product** — edit the living model on the current branch to the
     intended state: add or revise journeys, scenarios, experiences, actors,
     domains, features, business rules, intent, and decision points; keep
     still-valid `codeRefs` on modified entities; add **no** codeRefs for
     unbuilt behavior; add missing scenario kinds to `taxonomies.yaml`; delete
     entities the change retires and repair reverse relations.

### Finish

9. Resolve `<businesslens-ideate-skill-dir>` to this installed skill directory,
   then run the bundled validator outside the untrusted target:

   ```bash
   node <businesslens-ideate-skill-dir>/scripts/run-businesslens.mjs \
     --root "$PWD" validate --json
   ```

   Fix every finding except expected `needs at least one codeRef` results on
   newly unevidenced journeys and scenarios (errors on a brownfield branch,
   warnings on a draft model). Those findings are the evidence checklist —
   leave them. Do not treat their absence as proof that a modified or deleted
   entity needs no implementation work; the model diff is the full plan.
10. Report: what was written (entities added, changed, removed), open questions
    recorded, the full implementation worklist, the missing-evidence subset,
    and the next steps — commit the model change on its own, implement, then
    `businesslens-sync`. For a design nobody will implement yet, the model
    itself is the deliverable.

## Guardrails

- **Never write into `.businesslens/` without explicit approval.** Exploring
  writes nothing at all; converging writes only what the user accepted at
  step 7.
- Never present a proposal as a decision, and never move from explore to
  converge on your own initiative — the handoff is the user's to make.
- Never invent implementation detail — no stacks, endpoints, schemas, or
  file names in entity prose.
- Never add a `codeRef` for behavior that does not exist, and never point at
  an untracked path. Planned behavior carries no evidence, not fake evidence.
- Never weaken or delete evidenced current truth except where the change
  deliberately retires it — and say so in the report.
- Never present planned behavior as current; unevidenced entities are open
  work by definition.
- Never execute target code; never submit or contribute the Product Model.
- Never write outside `.businesslens/`. BusinessLens owns that directory and
  nothing else — not `AGENTS.md`, not `CLAUDE.md`, not the repository README.
- Do not pad a shortlist. Three real options beat six with three of them
  filler. Say when the honest answer is that nothing substantial is missing.
