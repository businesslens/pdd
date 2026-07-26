# BusinessLens

**Product-Driven Design for coding agents.** BusinessLens builds a
Git-tracked product map in `.businesslens/`: who the product serves, what they
accomplish, and where the code proves it.

The map is Markdown, reviewable in pull requests, and useful without a hosted
service.

```text
.businesslens/
├── product.md
├── actors/
├── experiences/
├── domains/
├── journeys/<id>/journey.md
│   └── scenarios/<id>.md
└── coverage.md
```

## Getting started

### 1. Install the skills

Run this in the repository you want to map:

```bash
npx businesslens@latest install
```

The installer detects supported AI harnesses, lets you customize the
selection, asks for project or global scope, and installs only the
BusinessLens skills.

For automated setup:

```bash
npx businesslens@latest install \
  --providers claude,codex,cursor \
  --scope project \
  --yes
```

### 2. Build the map in your AI harness

Invoke the initialization skill:

```text
/businesslens-init
```

Codex users can invoke the same skill as `$businesslens-init`. The skill
inspects the repository without executing its application, authors the full
map, installs the managed `AGENTS.md` guidance, and validates the result.

### 3. Review and commit

Review `.businesslens/`, then commit its authored files. Generated cache files
stay ignored.

## Terminal or agent?

BusinessLens has two deliberate surfaces:

| Where | Command | Purpose |
| --- | --- | --- |
| Terminal | `npx businesslens install` | Install the agent skills |
| Terminal | `npx businesslens update` | Refresh managed skill installations |
| Terminal | `npx businesslens validate` | Deterministically validate the map |
| AI harness | `businesslens-init` | Build the initial map |
| AI harness | `businesslens-sync` | Update the map after behavior changes |
| AI harness | `businesslens-deep-dive` | Expand one journey or experience |
| AI harness | `businesslens-validate` | Validate the map and explain every result |
| AI harness | `businesslens-doctor` | Diagnose validation, drift, and coverage |

The installer never creates `.businesslens/` or modifies `AGENTS.md`. Those
require repository analysis and belong to the initialization skill.

## Skills

| Skill | Use it when |
| --- | --- |
| `businesslens-init` | Adopting BusinessLens or rebuilding an incomplete map |
| `businesslens-sync` | Code changes affected product behavior |
| `businesslens-deep-dive` | One journey or experience needs exhaustive coverage |
| `businesslens-validate` | The map needs a read-only deterministic check |
| `businesslens-doctor` | The map fails validation, looks stale, or needs a health report |

Every skill is self-contained and follows the open Agent Skills folder format.
The CLI currently supports Claude Code, Codex, Cursor, Gemini CLI, and GitHub
Copilot installation paths.

`businesslens-validate` is the read-only agent interface to the deterministic
CLI validator. `businesslens-doctor` goes further: it investigates drift,
coverage, and hygiene, and can repair problems when explicitly requested.

Claude Code plugin users may alternatively install from this repository's
marketplace manifest. The standalone CLI remains the primary installation
experience.

## Keep the map current

1. Before changing behavior, read the relevant experiences, journeys, and
   scenarios.
2. Build against the repository's SDD change when one exists.
3. Invoke `businesslens-sync` after behavior changes.
4. Run `npx businesslens validate`.

PDD records what **is**. OpenSpec, spec-kit, and other SDD systems prescribe
what **will change**. BusinessLens links that intent without copying it. See
[PDD and SDD](./docs/pdd-and-sdd.md).

## Updating the skills

```bash
npx businesslens@latest update
```

Update discovers BusinessLens-managed installations through ownership markers
and refreshes only those skill directories. It does not touch `.businesslens/`
or `AGENTS.md`.

## Documentation

- [CLI reference](./docs/cli.md)
- [`.businesslens/` format](./docs/format.md)
- [PDD and SDD](./docs/pdd-and-sdd.md)
- [CI validation](./docs/ci.md)

## Safety

- Skills inspect target repositories statically; they do not run target code.
- Installation refuses to overwrite unowned `businesslens-*` directories
  unless `--force` is explicit.
- Updates replace only artifacts marked as BusinessLens-managed.
- No platform connection or publishing occurs during installation or mapping.

## License

MIT.
