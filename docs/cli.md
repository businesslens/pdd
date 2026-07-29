---
title: CLI reference
description: Commands, options, and exit codes for the businesslens CLI.
section: open-source
group: Reference
order: 22
---

# CLI reference

`npx businesslens@latest <command>` requires Node.js 20.12 or newer.

Exit codes are `0` for success, `1` for failure, and `2` for invalid usage.
Pass `--cwd <path>` to run a command against a repository other than the
current directory.

## `install`

Install the eight bundled BusinessLens skills:

```bash
npx businesslens@latest install
```

The interactive flow detects harnesses, lets you customize the selection,
asks for project or global scope, installs the eight `businesslens-*`
skills, and records an ownership/version marker beside them. Supported
providers, their paths, and scope guidance live in
[Installation](./installation.md). The installer does not create
`.businesslens/`, alter `AGENTS.md`, install hooks, connect to the
platform, or publish data.

Options:

| Option | Meaning |
| --- | --- |
| `--providers <list>` | Comma-separated `claude,codex,cursor,gemini,github` |
| `--scope project\|global` | Choose the installation scope |
| `--project` | Shortcut for project scope |
| `--global`, `--user` | Shortcut for global scope |
| `--yes` | Accept detected providers and default to project scope |
| `--force` | Replace an unmarked colliding `businesslens-*` directory |

Example:

```bash
npx businesslens@latest install \
  --providers claude,codex \
  --scope project \
  --yes
```

## `update`

Refresh every managed BusinessLens installation found in the current project
and user scope:

```bash
npx businesslens@latest update
```

Use `--scope project|global`, its `--project`/`--global` shortcuts, or
`--providers <list>` to narrow the update. Update only replaces skills listed
in a valid `.businesslens-install.json` marker. It never changes product-model
files or repository instructions.

## `validate`

```bash
npx businesslens@latest validate
npx businesslens@latest validate --json
```

Validation checks:

- required top-level files and parseable frontmatter;
- lowercase kebab-case IDs;
- actor, experience, domain, journey, and taxonomy relations;
- at least one experience;
- at least one scenario per journey;
- globally unique scenario IDs;
- required scenario sections;
- journey and scenario `codeRefs` — while `coverage.md` is `status: draft`
  (a planned, not-yet-implemented model) missing codeRefs are warnings
  instead of errors;
- `codeRef` paths against `git ls-files`;
- dangling local links as warnings.

On a feature branch, `needs at least one codeRef` errors on freshly planned
entities are expected — they list the behavior the implementation still has
to evidence (see [How BusinessLens works](./guide.md)).

JSON output is:

```json
{
  "ok": true,
  "errors": [],
  "warnings": [],
  "counts": {
    "actors": 2,
    "experiences": 2,
    "domains": 2,
    "journeys": 3,
    "scenarios": 8
  }
}
```

The `businesslens-validate` agent skill runs this command and explains the
result without changing files. Use `businesslens-doctor` for deeper drift or
coverage investigation and explicitly requested repairs.

## `build`

```bash
npx businesslens@latest build
```

Compiles `.businesslens/` into the source-free Product Report at
`.businesslens/build/report.json` without contacting the platform. Draft,
partial, and complete models may all build. Repository URL, branch, and commit
are deliberately absent from the report so it can be delivered as a reusable
Product Model artifact or selected by the Platform as a Blueprint revision.

Build validates the local model but does not require a clean worktree or
remote and may run at detached HEAD. `publish` adds clean Git provenance and
the checkout requirements of its selected branch, tag, or PR target.

`.businesslens/build/` and `.businesslens/cache/` are CLI outputs and should
stay gitignored. The CLI refuses to write these outputs through symbolic
links.

## `publish`

```bash
export BUSINESSLENS_API_KEY=...   # workspace API key from the platform
npx businesslens@latest publish
npx businesslens@latest publish --yes
npx businesslens@latest publish --tag v1.2.0 --yes
npx businesslens@latest publish --pull-request 42 --base-branch main --yes
```

Runs `build`, then submits the report to the platform configured in
`.businesslens/config.yaml` (`platform.url`, default
`https://app.businesslens.io`). The submission envelope carries the target and
Git provenance separately from the report.
Agent sessions should invoke `businesslens-publish`, whose bundled runner
isolates the npm package from target-local binaries and configuration.

For credential safety, `platform.url` accepts only the official origin or a
literal loopback development host. Local development can use HTTP and any
port:

```yaml
platform:
  url: http://localhost:3000
```

`127.x.x.x` and `::1` are also accepted. Remote custom origins, URL paths,
query strings, fragments, and embedded credentials are rejected before any
network request.

- The key is read only from the `BUSINESSLENS_API_KEY` environment variable.
- Without `--yes` the CLI asks for confirmation; in a non-interactive session
  it refuses with exit code `2`, so agents and CI must pass `--yes`.
- Publishing is a single submission call. With no ref option, it reports into
  the current branch Track. `--tag <name>` reports HEAD into that tag Track and
  verifies that the tag exists and points at HEAD; this also supports a
  detached checkout of that exact tag. `--pull-request <number>` reports into
  a PR Track and requires `--base-branch <name>`; optional `--pr-title` and
  `--pr-url` preserve review metadata. Every publish creates a new immutable
  Version in the selected Track, versions are never replaced, and a failed
  publish is safe to re-run.

Failure responses:

| Status | Meaning |
| --- | --- |
| `401` | The platform rejected the API key; check `BUSINESSLENS_API_KEY` |
| `403` | The key cannot submit projects; create a workspace project key |
| `409` | Submission conflicts with the project (for example the declared repository or branch does not match — the error lists the conflicts) |
| `400` | The payload was rejected; the error lists the model issues to fix |

The `businesslens-publish` agent skill wraps this command with preflight
checks and never runs without explicit user intent.

## `open`

```bash
npx businesslens@latest open ./report.json
npx businesslens@latest --cwd ./new-product open \
  https://app.businesslens.io/api/v1/hub/blueprints/example/report.json
```

Validates a Product Report v4 and expands it into canonical `.businesslens/`
Markdown and YAML. Local reports work offline. Remote reports are accepted
only from the official BusinessLens Hub report path or a loopback development
host. Query strings, fragments, credentials, and redirects are refused. The
response stream is stopped as soon as it exceeds 8 MiB, and the advertised
report digest is verified before any files are written.

Repository evidence is deliberately not transplanted. `open` removes source
repository `codeRefs`, writes `coverage.md` with `status: draft`, and records
that the imported model needs evidence from its new repository. Product
behavior, relationships, intent, and supporting content remain intact, so the
draft validates and builds while missing local evidence is reported as
warnings.

`open` refuses a non-empty `.businesslens/` target. `--force` first moves the
existing directory to a timestamped backup; it never overwrites linked SDD
files. Opening a report does not install skills, execute target code, connect
an account, or publish anything.
