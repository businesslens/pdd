# CLI reference

`npx businesslens@latest <command>` requires Node.js 20.12 or newer.

Exit codes are `0` for success, `1` for failure, and `2` for invalid usage.

## `install`

Install the five bundled BusinessLens skills:

```bash
npx businesslens@latest install
```

Interactive setup:

1. Shows detected AI harnesses and their paths.
2. Offers detected-only or custom provider selection.
3. Asks for project or global scope.
4. Installs `businesslens-init`, `businesslens-sync`,
   `businesslens-deep-dive`, `businesslens-validate`, and
   `businesslens-doctor`.
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
