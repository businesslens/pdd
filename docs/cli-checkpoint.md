---
title: checkpoint
description: Mark a round of Product Model work so the local report can show what changed since.
section: open-source
group: CLI
order: 28
---

# `businesslens checkpoint`

```bash
npx businesslens checkpoint ["<label>"]
```

`checkpoint` seals the current Product Model as it stands. The local report
opened by [`view`](./cli-view.md) lists every checkpoint as a baseline and
draws what has changed since it: resources added, removed, or changed, and the
fields that differ.

A checkpoint marks a round of work, and only the one doing the work knows where
a round ends. The agent skills run it once per approved delta they write, with
a label saying what the round did, so a long mapping session reads as a series
of named states rather than one undifferentiated diff against the last commit.
Run it yourself before trying something you may want to read back against.

The model must pass structural lint; a checkpoint is a valid state, never a
broken one. Every run writes a checkpoint, even when the model is unchanged:
you asked for a boundary here, and an empty comparison against it is a true
statement about the round.

Checkpoints are written to `.businesslens/cache/checkpoints/`, which is
generated and never committed. Each includes a snapshot of local Reference
files for later content comparisons. The newest fifty are kept. They are a
convenience for the local report, not part of the model: a clone of the
repository has none, and deleting the directory loses nothing the model says.

[`lint`](./cli-lint.md) seals nothing. A pass lints in a loop while fixing
errors, and none of those runs is a boundary. **Pin this state** in the report
is the same operation from the page.

## Options

| Option | Effect |
| --- | --- |
| `-c, --cwd <path>` | Start model lookup from another directory |

Exit code `0` means the checkpoint was sealed, `1` means the model does not
lint or could not be read, and `2` means invalid usage.
