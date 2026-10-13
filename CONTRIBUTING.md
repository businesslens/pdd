# Contributing

Keep contributions focused: the CLI stays dependency-light, and every skill
stays reusable, self-contained, and well-scoped.

## Local development

The repository is a pnpm workspace: the package itself plus the private local
viewer in `viewer/app`. `package.json` pins the pnpm version in
`packageManager`; with Corepack (`corepack enable`) or pnpm 9.7 or later, that
exact version runs. It needs Node.js 22.13 or later, newer than the published
package's own floor: consumers still install `pdd-kit` on Node.js 20.12
or later, with any package manager.

Activate the current PDD worktree as the machine-wide development CLI and keep
all published package outputs current:

```bash
pnpm install --frozen-lockfile
pnpm dev
```

The initial build must succeed before `~/.local/bin/pdd-kit-dev` is atomically
linked to this worktree. The command then runs `tsdown --watch` in the
foreground; stopping the watcher leaves `pdd-kit-dev` pointing at the last
successful build. Run `pnpm dev` in another worktree to switch the link,
`pdd-kit-dev --dev-info` to inspect it, and `pnpm dev:unlink` from the active
worktree to remove it.

From any target repository, `pdd-kit-dev lint` and the other public commands
use the active checkout. Installed map, ideate, and verify skills recognize the
same explicit development launcher; without it they retain their release-pinned
npm runner.

1. Format changes start in `spec/format.md`, then flow into `src/core/` and
   `src/commands/lint.ts` with a failing-case test per new structural rule, and into
   the matching resource-type page under `docs/`. Changes to the serialized report
   start in `spec/report.md` instead.
2. Keep `src/core/portable.ts` in step with `spec/report.md`. The site
   (`site/`) reads the same schema from this checkout, so a schema-version bump
   updates it in the same pull request.
3. Update the golden fixture (`test/fixtures/fixture-shop/`) and its expected
   counts when the format gains required content.
4. For skills: update the matching `SKILL.md`, keep references self-contained,
   keep names prefixed with `pdd-`, update `agents/openai.yaml`, and
   list new skills in `.claude-plugin/plugin.json`. pdd-kit analysis never
   executes target code; verify delegates implementation to a harness-supplied
   builder and then inspects again.
5. Run `pnpm verify` before opening a PR. Change dependencies with `pnpm add` or
   `pnpm remove` and commit the updated `pnpm-lock.yaml`; CI installs with
   `--frozen-lockfile` and fails when it drifts.
6. Do not add secrets, customer data, or private repository URLs.

## Demo GIF

`.github/demo.gif` tours this repository's own Product Model in the local
report, opened with `npx @itai-gendler/pdd-kit view itai-gendler/pdd-kit` as the README
invites readers to. That command reads the default branch on GitHub, so
re-record after a model or report change has merged:
`pnpm build && pnpm demo:record`. It needs Git access to GitHub,
Playwright's Chromium and `ffmpeg`, and fails if the GIF exceeds 5 MB.
