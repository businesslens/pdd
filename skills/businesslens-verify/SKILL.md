---
name: businesslens-verify
description: Statically verify that the implementation delivers the product behavior planned in the .businesslens/ Product Model — diff the model against the merge base, check every planned addition/change/removal, attach codeRefs, and report a verdict per work item. Use after implementing planned model changes and before merging; use businesslens-sync when code changed without a plan.
---

# Verify implementation against the plan

Close the gap between what the model claims and what the code proves. The
scenario contract (Trigger, Steps, Outcome) is the acceptance criteria.

Read [references/format.md](references/format.md) and
[references/evidence-policy.md](references/evidence-policy.md) before
verifying.

## Workflow

1. Confirm the working directory is a Git repository with a `.businesslens/`
   Product Model. Never execute the repository's application, build, migrations, or
   tests; inspect files only. List untracked files with
   `git ls-files --others --exclude-standard`. If implementation evidence
   depends on an untracked file, stop and ask the user to stage or commit it;
   never change the index yourself. A `codeRef` can cite only a path already
   returned by `git ls-files`.
2. Determine the comparison base: an explicit user-provided branch or ref
   first; otherwise the merge base with the default branch (for example
   `git merge-base HEAD origin/main`); on a repository with no base to
   compare against, treat the whole model as planned.
3. Build the verification worklist, fresh on every run — the plan may have
   evolved while implementing, so never reuse an earlier report:
   - every authored model file added, modified, **or deleted** in
     `git diff <base>...HEAD -- .businesslens/`, plus uncommitted model edits;
     retain the base version of a deleted entity as the removal contract;
   - independently, every journey and scenario lacking `codeRefs`
     (on a new `coverage: draft` model, that is initially the entire model).
4. Verify every work item, not only extant scenarios:
   - for added or changed scenarios, treat Trigger, Steps, Outcome, and edge
     cases as the acceptance contract and trace the observable behavior;
   - for deleted entities, use the base version and its old evidence to prove
     the retired behavior, entry point, or surface is absent from the code;
   - for changed experiences, actors, domains, features, business rules,
     journeys, product metadata, or taxonomies, check each changed contract —
     especially access, entry points, capability boundaries, constraints,
     intent, and relationships — against direct repository evidence.
     Explicitly classify vocabulary, organization, configuration, or other
     product-only changes with no implementation contract as model-only; never
     use that classification for observable access, entry-point, capability,
     rule, relationship, decision, or behavior changes.
5. Record one verdict per work item:
   - **met** — direct implementation evidence proves the addition/change or
     proves the planned removal; attach `codeRefs` (prefer `path#symbol`) to
     extant scenarios and their journeys;
   - **gap** — the new behavior is missing, diverges, or the retired behavior
     is still implemented; state expected versus found and attach nothing;
   - **unverifiable** — cannot be established from source alone; never
     guess.
   - **model-only** — no implementation change is required; identify the exact
     product or organizational decision and why source evidence does not
     apply.
6. Where the implementation deliberately diverged and the user confirms it
   is intended, correct the entity prose to the implemented truth and note
   the correction in the report. Never silently rewrite the plan to match
   the code.
7. Repair `codeRefs` the implementation invalidated on modified entities.
8. On a draft model, update `coverage.md` honestly off `draft` (`partial` or
   `complete`) only after every planned journey and scenario has evidence and
   every implementation-bearing addition, change, and removal on the
   worklist is met, and every model-only item is explicitly classified.
   Refresh `method`, `sourceAreas`, `unmapped`, and `limitations`. Leave it
   `draft` while any gap or unverifiable verdict remains.
9. Resolve `<businesslens-verify-skill-dir>` to this installed skill
   directory, then run the bundled validator outside the untrusted target:

   ```bash
   node <businesslens-verify-skill-dir>/scripts/run-businesslens.mjs \
     --root "$PWD" validate --json
   ```

   A zero exit status alone is not completion because a draft model reports
   missing evidence as warnings. Verification is complete only when every
   implementation-bearing work item is met, every model-only item is
   classified, coverage is no longer `draft`, validation has no errors, and
   no missing-evidence warning remains.
10. Report in the conversation, grouped by journey and then other entity:
    met/gap/unverifiable/model-only per work item with the evidence cited,
    prose corrections made, coverage change, the validation result, and the
    next step — fix the gaps and re-run, or commit and open the pull request
    (the report pastes well into its description).

## Guardrails

- Never mark a scenario met without direct evidence; **unverifiable** is the
  honest verdict when proof is out of reach.
- Never delete or water down planned claims to force validation green; gaps
  stay reported even when draft validation exits zero. Prose corrections
  require the user's confirmation.
- Never modify implementation code.
- Never execute target repository code.
- Never submit or contribute the Product Model from this skill.
