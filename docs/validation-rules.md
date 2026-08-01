---
title: Validation rules
description: Every businesslens validate error and warning — what it means and how to fix it.
section: open-source
group: Reference
order: 28
---

# Validation rules

`npx businesslens validate` is deterministic: the same model always produces
the same findings. This page lists every finding with its meaning and fix.
Exit codes: `0` when there are no errors (warnings may remain), `1` for
validation failure, and `2` for invalid usage.

One rule of thumb first: on a feature branch,
`needs at least one codeRef` errors on entities you just planned are **not
a problem** — they are the evidence checklist, and
[`businesslens-sync`](./skill-businesslens-sync.md) clears them by
attaching evidence.

## Loading errors

Reported when files cannot be read into the model at all.

- `.businesslens/ does not exist — invoke the businesslens-init skill first`
  — no model yet. Run `businesslens-init` (existing code) or
  `businesslens-ideate` (blank repository).
- `config.yaml is missing` / `product.md is missing` /
  `coverage.md is missing` / `taxonomies.yaml is missing` — a required
  top-level file is absent. Restore it from the
  [format contract](./format.md).
- `config.yaml failed to parse (…)` / `taxonomies.yaml failed to parse (…)`
  — invalid YAML; the parser's message pinpoints the line.
- `taxonomies.yaml must contain a scenarioKinds list` — the file exists but
  has no `scenarioKinds:` sequence.
- `journeys/<id>/ is missing journey.md` — a journey directory without its
  journey file. Add `journey.md` or delete the directory.
- `<file>: frontmatter is not terminated with ---` /
  `frontmatter must be a YAML mapping` /
  `frontmatter YAML failed to parse (…)` — malformed frontmatter block.
- `<file>: unknown frontmatter key "<key>"` — the schema is a strict
  allowlist; typos fail loudly. Check the entity's allowed keys in the
  [format contract](./format.md).
- `<file>: "<key>" must be a string` / `must be a list of strings` /
  `"entryPoints" must be a list` /
  `each entry point must be a single "type: path" map` /
  `"links" must be a list` / `each link needs "rel" and "href"` — a
  frontmatter value has the wrong shape.
- `<file>: link rel "<rel>" must be one of spec|proposal|doc|adr` — an
  unsupported link relation.
- `<file>: empty codeRef` / `codeRef "…" has no path` /
  `must be repository-relative` / `has an empty symbol` /
  `has an inverted line range` — the codeRef grammar is
  `path[#symbol][:start[-end]]` with repository-relative paths.

## Structure errors

- `product.md: missing id` / `id must be lowercase kebab-case` /
  `id must be at most 64 characters` — the product manifest needs a
  portable kebab-case `id`.
- `<collection>: id "<id>" must be lowercase kebab-case` — entity IDs are
  filename stems and must match `^[a-z0-9]+(?:-[a-z0-9]+)*$`.
- `<file>: missing H1 title` / `missing lead paragraph (description)` —
  every entity needs a `# Heading` and prose before the first `##`.
- `coverage.md: status "…" must be complete|partial|draft` — the only
  allowed coverage states.
- `<experience>: access "…" must be public|authenticated|restricted` — the
  only allowed access modes.
- `<scenario>: kind "…" is not defined in taxonomies.yaml` — add the kind
  to `taxonomies.yaml` or use an existing one.
- `<scenario>: missing "## Trigger" section` /
  `"## Steps" needs at least one ordered item` /
  `missing "## Outcome" section` — scenarios are structured: Trigger
  paragraph, ordered Steps list, Outcome paragraph.

## Relationship errors

- `references missing actor "…"` / `missing domain "…"` /
  `missing experience "…"` — a frontmatter relation points at an entity
  that does not exist. Create it or fix the ID.
- `needs at least one actor` / `must belong to at least one experience` /
  `needs at least one scenario` — journeys and experiences have minimum
  relations; empty ones are not product claims.
- `scenario id "…" already used in <journey> (ids are global)` — scenario
  IDs are unique across the whole model, so every scenario is addressable.
  Rename one of them.
- `experiences/: the model needs at least one experience` — an empty model is
  only valid transiently; build it with `businesslens-init` or plan it with
  `businesslens-ideate`.

## Evidence errors and the draft rule

- `<journey or scenario>: needs at least one codeRef` — a behavioral claim
  without evidence. On the default branch this is drift or an unverified
  merge; on a feature branch it is the planning evidence checklist —
  `businesslens-sync` attaches the evidence after implementation.
- `codeRef path "…" is not a tracked file` — every codeRef path must exist
  in `git ls-files`. Fix the path, commit the file, or remove the stale
  ref.
- While `coverage.md` has `status: draft` (a planned greenfield model),
  missing codeRefs appear as **warnings** instead —
  `needs at least one codeRef before coverage can leave draft` — and the
  model stays green. Draft models may build and be reported privately; the warning
  continues to distinguish planned knowledge from implementation evidence.

## Warnings

Warnings never fail validation.

- `link href "…" does not exist in the repository` — a local `links:`
  target is missing; fix the path or drop the link.
- `needs at least one codeRef before coverage can leave draft` — see the
  draft rule above.
