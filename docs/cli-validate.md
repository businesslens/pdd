---
title: validate
description: Validate Product Model structure, relationships, taxonomy, and repository evidence.
section: open-source
group: CLI
order: 28
---

# `businesslens validate`

Run the deterministic validator against `.businesslens/`:

```bash
npx businesslens@latest validate
```

The command must run inside a Git repository that contains a
`.businesslens/` directory. It loads the model, compares repository evidence
with `git ls-files`, prints every finding, and exits without changing files.

Validation checks include:

- required top-level files and parseable, schema-conforming frontmatter;
- lowercase kebab-case IDs and globally unique scenario IDs;
- required titles, descriptions, scenario sections, and minimum relations;
- actor, experience, domain, feature, journey, business-rule, and taxonomy
  references;
- journey and scenario `codeRefs`;
- `codeRef` paths against Git-tracked files; and
- dangling local links, reported as warnings.

The complete finding catalog and fixes are in
[Validation rules](./validation-rules.md).

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
[`businesslens-verify`](./skill-businesslens-verify.md) skill checks the
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
  }
}
```

`ok` is true whenever `errors` is empty, even when warnings remain. This
format is suitable for CI and other automated consumers; see
[Validate in CI](./ci.md) for a complete workflow.
