---
title: CLI reference
description: Commands, options, and exit codes for the businesslens CLI.
order: 4
---

# CLI reference

`npx businesslens@latest <command>` requires Node.js 20.12 or newer.

Exit codes are `0` for success, `1` for failure, and `2` for invalid usage.
Pass `--cwd <path>` to run a command against a repository other than the
current directory.

## `install`

Install the six bundled BusinessLens skills:

```bash
npx businesslens@latest install
```

Interactive setup:

1. Shows detected AI harnesses and their paths.
2. Offers detected-only or custom provider selection.
3. Asks for project or global scope.
4. Installs `businesslens-init`, `businesslens-sync`,
   `businesslens-deep-dive`, `businesslens-validate`,
   `businesslens-doctor`, and `businesslens-publish`.
5. Records an ownership/version marker beside the installed skills.

The installer does not create `.businesslens/`, alter `AGENTS.md`, install
hooks, connect to the platform, or publish data.

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

Project paths:

| Provider | Skills directory |
| --- | --- |
| Claude Code | `.claude/skills/` |
| Codex | `.agents/skills/` |
| Cursor | `.cursor/skills/` |
| Gemini CLI | `.gemini/skills/` |
| GitHub Copilot | `.github/skills/` |

Global paths respect `CLAUDE_CONFIG_DIR` and `CODEX_HOME`; other providers use
their standard user directories.

## `update`

Refresh every managed BusinessLens installation found in the current project
and user scope:

```bash
npx businesslens@latest update
```

Use `--scope project|global`, its `--project`/`--global` shortcuts, or
`--providers <list>` to narrow the update. Update only replaces skills listed
in a valid `.businesslens-install.json` marker. It never changes product-map
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
- journey and scenario `codeRefs`;
- `codeRef` paths against `git ls-files`;
- dangling local links as warnings.

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

Compiles `.businesslens/` into the portable project document at
`.businesslens/build/project.json` without contacting the platform. Use it as
a local or CI dry run of exactly what `publish` would submit.

Building pins provenance to the current commit and refuses to run when:

- the tracked worktree has uncommitted changes;
- `.businesslens/` contains untracked or modified files;
- `HEAD` is detached instead of on a named branch;
- `origin` does not normalize to a credential-free HTTPS URL.

`.businesslens/build/` and `.businesslens/cache/` are CLI outputs and should
stay gitignored. The CLI refuses to write these outputs through symbolic
links.

## `publish`

```bash
export BUSINESSLENS_API_KEY=...   # workspace API key from the platform
npx businesslens@latest publish
npx businesslens@latest publish --yes
```

Runs `build`, then submits the compiled project to the platform configured in
`.businesslens/config.yaml` (`platform.url`, default
`https://app.businesslens.io`) as a snapshot pinned to the current commit.
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
- An interrupted publish resumes its active analysis from
  `.businesslens/cache/analysis.json`. Re-publishing the same commit replaces
  that commit's snapshot; new commits create new snapshots.

Failure responses:

| Status | Meaning |
| --- | --- |
| `401` | The platform rejected the API key; check `BUSINESSLENS_API_KEY` |
| `403` | The key cannot submit projects; create a workspace project key |
| `404` | The cached analysis went stale; re-run publish to start fresh |
| `409` | Submission conflicts with the project (for example a branch mismatch — the error names the tracked and submitted branches) |
| `400` | The payload was rejected; the error lists the map issues to fix |

The `businesslens-publish` agent skill wraps this command with preflight
checks and never runs without explicit user intent.
