# Coverage review protocol

Use this protocol to account for a repository snapshot. The installed isolated
runner supports `coverage start`, `record`, `finish`, `cancel`, and `status`,
as well as `lint`. These run BusinessLens-owned code outside the target; never
execute target applications or scripts. Coverage commands keep pending work in BusinessLens-owned worktree Git metadata.
Completion writes the latest review to `.businesslens/coverage.json`, preserving
authored scope and gaps. These are the only review storage locations.

1. Read current context with the bundled runner:
   `node <skill-dir>/scripts/run-businesslens.mjs --root <repository> coverage status`.
   A missing baseline means unknown inspection history, not a missing Product
   Model or proof that the model is incomplete. Changes choose leads only.
2. For whole-repository accounting, capture a worklist with `coverage start`.
   Add `--include <path>` for ignored files or directories explicitly needed as
   inspection inputs; directory paths end in `/`. The policy includes tracked
   and nonignored untracked files, excludes Product Model directories and Git
   administration, and fingerprints the selected model separately at finish.
   Never silently cancel another pending review. Resume only when its
   captured inputs and work are understood; otherwise explain the conflict.
3. Keep its returned ID and exact file list. Read and account for every file,
   tracing supported Product behavior and dependencies. Related files can be
   assessed as a group. No directory reference, filename heuristic or content
   hash substitutes for inspection. Symlinks are assessed as links; their
   targets are not traversed. Submodules are explicit uncertain boundaries.
4. Resolve model scope with the user: Scope is intended model breadth,
   Exclusions are approved omissions, Unmapped is known missing behavior within
   scope. An oversight or postponed work is never automatically excluded.
   Obtain approval for model changes using this skill's normal workflow, then
   author them. Never persist transient verification findings in model prose.
5. Record only completed inspection in JSON packets, passed on stdin to
   `coverage record -`, or in a temporary file outside the target repository:

   ```json
   {
     "reviewId": "<ID returned by start>",
     "entries": [{
       "paths": ["src/checkout.ts", "test/checkout.test.ts"],
       "outcome": "reviewed",
       "summary": "Checkout behavior and failure cases are represented in its scenarios.",
       "resources": ["capabilities/checkout/capability.md"],
       "exclusions": [],
       "gaps": []
     }]
   }
   ```

   Every field is required. `resources` names actual resource Markdown paths
   relative to `.businesslens/`; Exclusions and gaps name exact descriptions
   currently authored in Coverage. `reviewed` can include supporting material
   with no separate resource, and can coexist with known gaps. `excluded`
   requires an approved exclusion, with no modeled-resource or gap claim.
   `uncertain` records what could not be established; unreadable files require
   it. Each path is exact and occurs once per packet. Recording again replaces
   conclusions for those files only. Never manufacture future reference targets.
6. After all captured files are accounted for, run structural lint, then
   `coverage finish <id>`. Finish binds the snapshot to the final model and writes
   `coverage.json.review`. Commit that document with the model to share completed
   inspection. Never hand-edit fingerprints or copy a prior review as current.
   If source files changed during inspection, preserve the prior completed
   baseline, cancel the pending work and recapture before completing. Revisit
   affected behavior; no old conclusion becomes current merely through copying.
   A named or branch-only review may leave a partial worklist pending; never
   account for uninspected files just to obtain completion.
7. Explain accounting, scope gaps and subsequent changes separately. All files
   accounted for does not imply all behavior modeled or semantic certainty.
   New reviews start with no copied conclusions. Previously unchanged files
   still need an impact decision: changes can affect dependencies and a changed
   model can invalidate conclusions about unchanged code. Completed reviews travel in Git commits and can guide a new clone. Pending
   work stays local; neither completed nor pending reviews travel in Blueprints.

Only the exact-input completed Coverage review and its local pending work may
persist inspection accounting. Current semantic findings are always re-derived. A report
refresh never creates a record or advances the completed baseline.
