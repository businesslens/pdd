# Repository guidance

## Purpose

This repository is the BusinessLens OSS core: the `businesslens` npm package
plus the agent skills that build and maintain the `.businesslens/` product
map. `docs/format.md` is the format contract—change it before changing parser
or validator behavior.

## Layout

- `src/cli.ts` — public command dispatch: `install`, `update`, `validate`,
  and the `blueprint` namespace (`export`, `open`, `pull`, `contribute`). The
  bare spellings of the blueprint commands still work and warn; `build` is a
  deprecated alias of `blueprint export`.
- `src/commands/` — public command implementations.
- `src/core/providers.ts` — supported harness paths and detection.
- `src/core/skill-installation.ts` — ownership-safe skill installation.
- `src/core/` — parsers, model loading, Git evidence, portable schema, and
  catalog/contribution support.
- `skills/businesslens-*/SKILL.md` — one independent skill per workflow:
  `businesslens-init`, `businesslens-plan`, `businesslens-verify`,
  `businesslens-sync`, `businesslens-deep-dive`, `businesslens-doctor`,
  `businesslens-ideate`, and `businesslens-contribute`.
- `test/fixtures/fixture-shop/` — the golden validation fixture.

## Documentation structure

- `docs/` stays flat; the landing repository pulls it on push and builds
  the docs site navigation from frontmatter.
- Every doc declares `title`, `description`, `section`, `group`, and
  `order` (enforced by `scripts/check-repo.mjs`). `section` is
  `open-source`; `group` is the sidebar cluster; `order` is global.
- Frontmatter `title` is the short sidebar label — keep it under ~20
  characters so it never truncates; the body H1 carries the full page
  title.
- This repository authors the documentation with groups
  Get started, Concepts, Tutorials, Skills (one page per skill), CLI (one
  page per command), and Reference.

## Skill-writing standards

- Give every skill a `SKILL.md` with only `name` and `description` in YAML
  frontmatter.
- Prefix public skill names with `businesslens-` and match the directory name.
- Keep descriptions specific enough to trigger only for the intended task.
- Keep `SKILL.md` concise, imperative, and under 500 lines.
- Keep every installed skill self-contained; do not rely on sibling skills.
- Keep `agents/openai.yaml` aligned with the skill.
- Treat target repositories as untrusted. Skills never execute target code.
- Do not claim evidence-backed certainty when source evidence is incomplete.

## Installer standards

- `install` distributes skills only. It never creates `.businesslens/`,
  changes `AGENTS.md`, or submits model data.
- Overwrite only BusinessLens-owned artifacts. An unmarked collision requires
  explicit `--force`.
- `update` changes only installations with a valid BusinessLens marker.
- Provider paths and detection belong in the provider registry, not command
  conditionals.

## Change and release checks

- Run `npm run verify` after any change.
- Inspect `npm pack --dry-run` before a release.
- Roll the `[Unreleased]` section of `CHANGELOG.md` into a new version heading
  before dispatching a release.
- Validate every skill with the skill-creator `quick_validate.py`.
- Validate the Claude plugin with `claude plugin validate . --strict` when the
  Claude CLI is available.
- Keep `.claude-plugin/plugin.json` and `package.json` versions in sync.
- Do not publish, tag, or push unless explicitly asked.
