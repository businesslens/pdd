# Contributing

Keep contributions focused: the CLI stays dependency-light, and every skill
stays reusable, self-contained, and well-scoped.

1. Format changes start in `docs/format.md`, then flow into `src/core/` and
   `src/commands/validate.ts` with a failing-case test per new rule.
2. Keep `src/core/portable.ts` byte-compatible with the platform's portable
   schema; coordinate schema-version bumps across both repositories.
3. Update the golden fixture (`test/fixtures/fixture-shop/`) and its expected
   counts when the format gains required content.
4. For skills: update the matching `SKILL.md`, keep references self-contained,
   keep names prefixed with `businesslens-`, update `agents/openai.yaml`, and
   list new skills in `.claude-plugin/plugin.json`.
5. Run `npm run typecheck && npm test && npm run check` before opening a PR.
6. Do not add secrets, customer data, or private repository URLs.
