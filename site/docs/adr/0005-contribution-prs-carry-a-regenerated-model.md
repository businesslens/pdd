# Contribution pull requests carry a regenerated model, not the authored one

`codeRefs`, repository links and entry points live in the frontmatter of authored
`.businesslens/` files, while `redactSourceEvidence` operates only on a built Product Report.
Copying a contributor's authored model into a pull request would publish their internal file
paths and line numbers into public git history, where deleting them later does not remove them.

`businesslens publish` therefore builds the model, redacts the report, and regenerates
`.businesslens/` from the redacted report using the same expansion code path as `pull`.

## Consequences

- The model in `blueprints/<slug>/.businesslens/` is byte-identical to what
  `businesslens blueprint pull <slug>` produces, so reviewers see exactly what consumers receive.
- Authored prose formatting is not preserved. This is deliberate — do not "improve" `publish`
  by copying the authored files across.
- The CLI is a convenience, not the control. Anyone can open a pull request by hand.
  `blueprints:check` fails any Blueprint carrying a non-empty `codeRefs`, a repository link, or
  a repository entry point, and runs via `verify` on every pull request.
