---
title: validate
description: Validate Product Model structure, relationships, taxonomy, and repository evidence.
section: open-source
group: CLI
order: 31
---

# `businesslens validate`

Run the deterministic validator against `.businesslens/`:

```bash
npx businesslens@latest validate
```

The command must run inside a Git repository that contains a
`.businesslens/` directory. It loads the model, compares repository evidence
with `git ls-files`, prints every finding, and exits without changing files.

## When it runs itself

Most of the time you never type this. Validation is the shared authority, so
everything that touches the model defers to it:

| What | When | Why |
| --- | --- | --- |
| **Every skill** | on entry, and again until green | so no skill decides for itself what a valid model is |
| **`blueprint export`** | before compiling | an invalid model never becomes a Blueprint |
| **`blueprint contribute`** | before opening the pull request | an invalid model never reaches the catalog |
| **CI** | every pull request | the merge gate — see [Validate in CI](./ci.md) |

Setting up the CI workflow is a one-time job. After that, a model that stops
being sound fails the pull request whether or not anyone remembered to check.

## When you run it yourself

Four reasons, and only the first is routine:

1. **"Where do I stand?"** — the branch picture below. This is the main reason
   to type it: what moved, and what to do next.
2. **You edited `.businesslens/` by hand.** Skills validate their own work;
   nothing has checked yours.
3. **Before pushing**, when you would rather know now than wait for CI.
4. **Reproducing a CI failure** locally, with exactly the output CI saw.

If you only ever change the model through skills and let CI gate your pull
requests, you can go a long time without running it — and nothing will slip
through.

## What it checks

Validation covers:

- required top-level files and parseable, schema-conforming frontmatter;
- lowercase kebab-case IDs and globally unique scenario IDs;
- required titles, descriptions, scenario sections, and minimum relations;
- actor, experience, domain, feature, journey, business-rule, and taxonomy
  references;
- journey and scenario `codeRefs`;
- `codeRef` paths against Git-tracked files; and
- dangling local links, reported as warnings.

Every finding is documented on the page for the entity it constrains — see
[Actors](./actors.md), [Experiences](./experiences.md), [Domains](./domains.md),
[Features](./features.md), [Journeys](./journeys.md),
[Scenarios](./scenarios.md), [Business rules](./business-rules.md), and
[Evidence & coverage](./evidence.md).

## Where you stand

After the findings, `validate` reports which of the two things that can change
has changed on this branch, and what that means:

```text
Product Model is valid (2 actors, 2 experiences, 2 domains, …).

On feat/guest-checkout, against main:
  model  3 file(s) changed
  code   11 file(s) changed

You described a change and wrote code for it, but nothing has checked that
the code matches. /businesslens-sync checks every planned addition,
change, and removal, and attaches evidence.
```

The four combinations and what each one means are in
[Find your flow](./flows.md).

**This does not affect the exit code.** Whether the model is *sound* and where
you *stand* are different questions, and only the first gates a merge. A model
whose code moved out from under it still validates green — that drift is
semantic, and no rule can detect it — which is exactly why the second half is
worth printing.

Uncommitted and untracked files count, so this works mid-change rather than
only after a commit. It is skipped entirely when the answer cannot be trusted:
outside a repository, before the first commit, or in a shallow clone with no
merge base. See [Validate in CI](./ci.md) for the `fetch-depth` note.

`--json` output is unchanged.

## Options

| Option | Meaning |
| --- | --- |
| `--json` | Emit one structured JSON result instead of human-readable findings |

Warnings do not fail validation. Errors return exit code `1`.

## Draft models and evidence

Journeys and scenarios normally need at least one `codeRef`. While
`coverage.md` has `status: draft`, missing evidence is a warning rather than
an error so a planned, not-yet-implemented model can validate and build. The
warning remains until implementation evidence is attached and coverage leaves
draft.

On a feature branch with non-draft coverage, new missing-evidence errors are
the implementation checklist produced by planning. The
[`businesslens-sync`](./skill-businesslens-sync.md) skill checks the
implementation and attaches valid evidence.

## JSON output

```bash
npx businesslens@latest validate --json
```

The output shape is:

```json
{
  "ok": true,
  "errors": [],
  "warnings": [],
  "counts": {
    "actors": 2,
    "experiences": 2,
    "domains": 2,
    "features": 3,
    "journeys": 3,
    "scenarios": 8,
    "businessRules": 4
  },
  "branch": {
    "base": "main",
    "branch": "feat/guest-checkout",
    "modelFiles": 3,
    "codeFiles": 11,
    "situation": "implemented"
  }
}
```

`ok` is true whenever `errors` is empty, even when warnings remain. This
format is suitable for CI and other automated consumers; see
[Validate in CI](./ci.md) for a complete workflow.

`branch` is the machine-readable form of [where you
stand](#where-you-stand), and `situation` is one of `at-rest`, `planned`,
`implemented`, or `unplanned-code`. It is how
[`businesslens-sync`](./skill-businesslens-sync.md) works out what you did
without asking. The key is **absent** whenever the answer cannot be trusted, so
consumers should treat it as optional; `ok`, `errors`, `warnings`, and `counts`
are always present.
