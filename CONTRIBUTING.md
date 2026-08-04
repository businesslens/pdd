# Contributing

Keep contributions focused: the CLI stays dependency-light, and every skill
stays reusable, self-contained, and well-scoped.

## Local development

Activate the current PDD worktree as the machine-wide development CLI and keep
all published package outputs current:

```bash
npm ci
npm run dev
```

The initial build must succeed before `~/.local/bin/bl` is atomically linked to
this worktree. The command then runs `tsdown --watch` in the foreground; stopping
the watcher leaves `bl` pointing at the last successful build. Run `npm run
dev` in another worktree to switch the link, `bl --dev-info` to inspect it, and
`npm run dev:unlink` from the active worktree to remove it.

From any target repository, `bl lint` and the other public commands use the
active checkout. Installed map, ideate, and verify skills recognize the same explicit
development launcher; without it they retain their release-pinned npm runner.

1. Format changes start in `spec/format.md`, then flow into `src/core/` and
   `src/commands/lint.ts` with a failing-case test per new structural rule, and into
   the matching entity page under `docs/`.
2. Keep `src/core/portable.ts` byte-compatible with the platform's portable
   schema; coordinate schema-version bumps across both repositories.
3. Update the golden fixture (`test/fixtures/fixture-shop/`) and its expected
   counts when the format gains required content.
4. For skills: update the matching `SKILL.md`, keep references self-contained,
   keep names prefixed with `businesslens-`, update `agents/openai.yaml`, and
   list new skills in `.claude-plugin/plugin.json`. BusinessLens analysis never
   executes target code; verify delegates implementation to a harness-supplied
   builder and then inspects again.
5. Run `npm run verify` before opening a PR.
6. Do not add secrets, customer data, or private repository URLs.
