# Repository guidance

## Purpose

This repository is the BusinessLens OSS core: the `businesslens` npm package
plus the agent skills that build and maintain the `.businesslens/` product
map. `docs/format.md` is the format contract—change it before changing parser
or validator behavior.

## Layout

- `src/cli.ts` — public command dispatch: `install`, `update`, and `validate`.
- `src/commands/` — public command implementations plus internal compilation
  and publishing work retained for a later release.
- `src/core/providers.ts` — supported harness paths and detection.
- `src/core/skill-installation.ts` — ownership-safe skill installation.
- `src/core/` — parsers, model loading, Git evidence, portable schema, and the
  platform client.
- `skills/businesslens-*/SKILL.md` — one independent skill per workflow:
  `businesslens-init`, `businesslens-sync`, `businesslens-deep-dive`,
  `businesslens-validate`, and `businesslens-doctor`.
- `test/fixtures/fixture-shop/` — the golden validation fixture.

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
  changes `AGENTS.md`, connects to the platform, or publishes.
- Overwrite only BusinessLens-owned artifacts. An unmarked collision requires
  explicit `--force`.
- `update` changes only installations with a valid BusinessLens marker.
- Provider paths and detection belong in the provider registry, not command
  conditionals.

## Change and release checks

- Run `npm run typecheck && npm test && npm run check` after any change.
- Run `npm run build` and inspect `npm pack --dry-run`.
- Validate every skill with the skill-creator `quick_validate.py`.
- Validate the Claude plugin with `claude plugin validate . --strict` when the
  Claude CLI is available.
- Keep `.claude-plugin/plugin.json` and `package.json` versions in sync.
- Do not publish, tag, or push unless explicitly asked.
