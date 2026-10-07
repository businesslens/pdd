# Security policy

## Reporting

Report vulnerabilities privately via GitHub private vulnerability reporting: open the repository's **Security** tab and choose **Report a vulnerability**. Reports go directly to the maintainers and stay private until a fix is released.

Never disclose a vulnerability in a public issue, and do not include credentials, private repository URLs, or exploit details in public reports.

## Supported versions

Only the latest published release receives security fixes.

## Trust boundaries

BusinessLens has three kinds of safeguard, and only the first is enforced by
code.

**Enforced by code**

- `businesslens lint` only reads: the `.businesslens/` files and which files
  Git tracks (`git ls-files`). It runs nothing from the repository.
- The skills' runner (`skills/*/scripts/run-businesslens.mjs`) runs only
  `lint`, from a temporary folder outside the target repository, with the CLI
  version the skills were installed from.

**Instructions the skills give the agent**

- During analysis, never run the repository's code, scripts or tests.
- Write product meaning only inside `.businesslens/`, and only after the user
  approves the complete change.
- When implementing, never edit `.businesslens/`; bring product questions back
  to the user.
- In report-only mode, change nothing. Never stage, commit or publish.

An agent usually follows these, with no guarantee. None of them is a security
boundary.

**Enforced by the agent's host**

What the agent can actually run, read, write or reach over the network is set
by its host — Claude Code, Codex, Cursor, Gemini CLI, GitHub Copilot — through
its permission prompts, sandbox and allow-lists. If running unreviewed code
matters, configure the host.

**Not enforced today**

- Nothing in code stops an agent from running repository code, or writing
  outside `.businesslens/`, during analysis.
- No check confirms that a `.businesslens/` change was approved, or that an
  implementing agent left the folder alone; the pull-request diff is where both
  show.
- `businesslens-verify` runs only when an agent runs it. Its findings are
  re-derived each run and never stored, so there is no recorded "verified"
  state to trust or to go stale.
