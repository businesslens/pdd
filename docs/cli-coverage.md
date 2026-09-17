---
title: coverage
description: Account for repository files against a specific Product Model and identify later changes.
section: open-source
group: CLI
order: 33
---

# Review repository coverage

A repository coverage records which exact files an agent considered, what it
concluded, and the Product Model those conclusions concern. It accounts for
inspection inputs; it does not certify that every behavior was understood.

The latest completed review is stored in the committed
[Coverage document](./product-model.md#coverage), `.businesslens/coverage.json`.
A clone or another worktree can compare current inputs with that shared review.
Unfinished work stays in worktree Git metadata, separately for each model.
Blueprints omit repository reviews. These commands never execute the target
repository. All output is JSON.

## Capture the worklist

```bash
businesslens coverage start
businesslens coverage start --include ignored-config/ --include local-settings.json
```

Start includes existing tracked files and untracked files allowed by Git ignore
rules. `--include` adds exact ignored files or directories; directories end in
`/`, and globs are not accepted. Keep the returned review ID and file list.
Every file in that list must receive a conclusion before completion. An existing
pending review must first be finished or cancelled.

Product Model directories and model backups are excluded from the source
inventory. The selected model, including its authored assets, is fingerprinted
separately; generated `build/` and `cache/` contents and the saved `review` block do not affect it. Authored Coverage fields still participate. Git
administration is excluded. Symlink targets are never followed. Submodule
contents require a separate review and remain explicitly uncertain here.
These are inventory rules, distinct from approved model Exclusions in Coverage.

Before first-time mapping, run from the directory where `.businesslens/` will
be authored. With an existing model, selection follows the normal
[model-root rules](./cli.md#choosing-the-product-model). Paths in the worklist
are always relative to the Git repository root.

## Inspect and record

Read the captured files, trace relevant behavior and dependencies, and obtain
approval for changes to the model's meaning. Then submit a JSON packet:

```json
{
  "reviewId": "<ID returned by start>",
  "entries": [
    {
      "paths": ["src/checkout.ts", "test/checkout.test.ts"],
      "outcome": "reviewed",
      "summary": "Checkout behavior and its failure cases are represented in the checkout scenarios.",
      "resources": ["capabilities/checkout/capability.md"],
      "exclusions": [],
      "gaps": []
    }
  ]
}
```

```bash
businesslens coverage record /tmp/review-entry.json
# Or pass the same packet on stdin:
businesslens coverage record -
```

Keep packet files outside the target repository so they do not enter its
inventory. Entries can group related files but must enumerate their exact
captured paths; directory conclusions never cover new descendants implicitly.
A new entry replaces the earlier conclusion for those exact files only.

- `reviewed`: explain what inspection established. Supporting material can
  have no separate resource. Known gaps may coexist with modeled behavior.
- `excluded`: cite at least one approved Coverage exclusion. An agent's skipped
  work is not an exclusion. Partly modeled behavior uses `reviewed` instead.
- `uncertain`: explain what could not be established. Unreadable files require
  this outcome; they never silently disappear from the worklist.

Every entry requires all six fields shown in the example. `resources` names
existing resource Markdown files relative to `.businesslens/`. `exclusions` and
`gaps` contain exact descriptions currently authored in Coverage. The command
checks these links and the captured file versions; the caller remains
responsible for truthful inspection and conclusions.

## Complete or cancel

```bash
businesslens coverage finish <id>
businesslens coverage cancel <id>
```

Finish requires every captured file to be accounted for, a structurally valid
Product Model, valid links, and the same source snapshot. It binds conclusions
to the final model contents and writes `coverage.json.review`, preserving every
authored Coverage field. It replaces the previous completed review and clears
the local pending work. Commit `coverage.json` to share it; Git retains history.
Model authoring during inspection is expected. Source additions, modifications
or deletions prevent completion: cancel and capture a new worklist. A gap or
uncertainty may be accounted for and remains visible as such.

Cancel removes only the identified pending work. It preserves the completed
baseline. Validation failures leave the baseline intact. If writing the shared
review succeeds but clearing local work is interrupted, retrying `finish` with
the same ID clears the pending record without changing the saved review.

## Compare later changes

```bash
businesslens coverage status
```

Status compares current content with the completed snapshot: added, modified,
deleted, unchanged or unreadable. It includes uncommitted and untracked changes.
A file still present but no longer selected by the inventory policy is
`outside-policy`, not deleted. Renames appear as an addition and a deletion.
Without a completed baseline files are `unreviewed`, never assumed newly added.
Model changes and changes during a pending review are reported separately.

A comparison is a review worklist. A change can affect unchanged dependencies;
a new helper file can preserve existing behavior. Neither file counts nor
content fingerprints establish semantic completeness. Follow affected behavior
and re-derive findings. A new coverage starts with an empty conclusion list;
prior conclusions can guide inspection but are never silently copied forward.

Reading status never writes review state. Completing a review is always an
explicit action. Invalid or unsupported saved records fail visibly rather than
pretending no review exists.
