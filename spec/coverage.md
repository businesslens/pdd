# Coverage reviews

This engineering contract governs the `coverage` CLI namespace and local
repository context in the report. It is separate from the authored folder and
portable Product Report. An review accounts for a captured set of files;
it does not certify that an agent understood all behavior correctly.

## Ownership and persistence

Each model has one latest completed review in `.businesslens/coverage.json`'s
`review` field. It is committed and shared with the repository. A new clone can
compare current inputs with that saved review. Without a saved review, history
is unknown. This deliberately supersedes the former local-only assessment rule.

Each model in each Git worktree has at most one pending review beneath the
worktree-specific path returned by `git rev-parse --git-path businesslens/coverage`.
The model's repository-relative directory identifies this temporary record.
Pending work is never committed or exported and cannot replace the completed
review until completion succeeds. A record has `{ version: 1, pending }`.

Completed and pending reviews carry `id`, `startedAt`, `completedAt`,
`modelDigest`, `policy`, `files`, and `entries`. Pending timestamps and model
fingerprints are null until completion; the committed review requires both.
The model fingerprint uses all authored model files except generated build/cache
contents, and canonical Coverage JSON with `review` omitted. Coverage whitespace
or the review's own contents never makes that fingerprint stale.

Writes are atomic and serialized per model/worktree. Completion validates the
current model and snapshot, writes the completed review while preserving authored
Coverage fields, then clears pending work. Retrying after interruption recognizes
an already-published review by ID and only clears its pending record; it never
refreshes the saved snapshot. Malformed storage is an explicit error. Reads,
including report refreshes, never create a record or advance a baseline.

Review snapshots and recorded conclusions are workspace information: they never
enter a portable Product Report or Blueprint. Current semantic findings are
still re-derived. A matching fingerprint establishes content identity only.

## Inventory policy and snapshots

Policy `project-files-v1` includes existing tracked files and untracked files
not excluded by Git ignore rules, repository-relative. Explicit `includePaths`
may additionally select ignored files or directories (trailing slash). These
selectors are exact paths, never globs; included ignored files are listed by
Git too. Unmatched selectors are errors when starting a review. All
`.businesslens/` directories, Git administration and BusinessLens model backups
are outside this source inventory. The selected model is fingerprinted separately,
including authored assets, excluding `build/` and `cache/`.

An inventory policy defines inspection inputs, not Product or model exclusions.
The report explains this distinction. Its Include ignored files control changes
only the visible file list, never the review policy.

Snapshot files carry a path and SHA-256 content fingerprint including file type
and executable mode. Uncommitted and untracked contents count. Symbolic links
are fingerprinted by their link text; their targets and symlinked parents are
never followed. Git submodules are opaque inventory entries with an explicit
unreadable/unsupported reason; they require separate review. Unreadable or
unstable files retain their path and an error, never disappear or become
unchanged. A model fingerprint cannot be established from unreadable model
files. No target code runs. Hashes establish content identity, not understanding.

## Commands

- `coverage start [--include <path>...]`: capture the full inventory and create
  a pending review with a generated ID. A pending review must first be
  finished or explicitly cancelled. Existing conclusions are exposed by status
  as historical context; none is automatically copied into the new review.
  The command may run before a Product Model exists, using the current directory
  as the prospective model root. When a model exists normal model-root selection
  applies. Output includes the ID, policy and exact file worklist.
- `coverage record <input>`: read a JSON packet (or `-` for stdin) containing
  `reviewId` and non-empty `entries`. Each entry has non-empty unique `paths`,
  `outcome: reviewed|excluded|uncertain`, a non-empty `summary`, and explicit
  `resources`, `exclusions`, and `gaps` arrays. Resources name actual resource
  Markdown files relative to `.businesslens/`. Exclusions and gaps name exact
  descriptions currently authored in Coverage; they never invent scope.
  `excluded` requires an approved exclusion. `reviewed` may describe supporting
  material with no separate resource. A reviewed file may also have known gaps.
  `uncertain` records what could not be established. Each path must belong to
  the captured snapshot and still match it; unreadable paths require uncertainty.
  Each path occurs at most once per packet. New entries replace previous entries
  for those exact files only. Directories are expanded by the agent into captured
  paths, never inherited by present or future children. Recording conclusions
  is the caller's assertion that inspection occurred, not tool-verified evidence.
- `coverage finish <id>`: require an entry for every captured file, a
  structurally valid current model, valid model-resource and Coverage links,
  and an unchanged source snapshot. Bind the completed review to the final
  model fingerprint and replace the previous completed record atomically.
  A gap or uncertainty can be accounted for; it stays visible and is never
  converted into modeled behavior. Files added, changed or removed during
  inspection prevent completion; cancel and recapture the worklist. Model
  authoring during inspection is expected and is bound at finish.
- `coverage cancel <id>`: discard only the identified pending review.
- `coverage status`: compute the current comparison without writing anything.

All commands return JSON. Unknown commands, keys, duplicate paths, unresolved
references, stale review IDs and malformed packets fail explicitly.
Mutation output is the resulting pending or completed review. Status
includes both completed and pending reviews, plus current file comparisons.

## Comparison and presentation

With a completed baseline, compare the union of baseline and current policy
paths: `added`, `modified`, `deleted`, `unchanged`, or `unreadable`. Policy
membership lost while a file still exists is `outside-policy`, never a deletion.
With no baseline, current paths are `unreviewed`, never `added since review`.
Paths outside the policy are labeled separately in the live tree. Deleted and
historical policy paths stay selectable even without current files or References.

Model changes are a separate flag: unchanged source files do not establish
agreement with a changed model. A change anywhere can affect unchanged
dependencies; the agent follows those dependencies rather than treating the
changed-file list as a semantic boundary. An unfinished new review does not
replace or refresh the completed baseline. A report also exposes the pending
worklist and every recorded conclusion, including uncertainty and missing links
after model edits. No percentage is called mapped coverage.

The local repository endpoint returns `{ paths, coverage?, coverageError? }`.
`coverage` carries the policy, baseline and pending records, model-change
state and current file comparisons; it contains paths and conclusions, never
source contents. The renderer accepts this as optional host context. Hosts
without it still render every authored Coverage field. The page remains read-only. Hosts without live repository context can render the
saved review from the workspace report, but cannot claim current file or model
freshness. The viewer names this reading Review within Coverage and shows its
source, `.businesslens/coverage.json`, and completion date.

Workspace Product Reports carry `coverage.review`. Portable projection clears it,
validation rejects portable reviews, and Blueprint expansion writes `review: null`.
