# Security policy

## Reporting

Report vulnerabilities privately via GitHub private vulnerability reporting: open the repository's **Security** tab and choose **Report a vulnerability**. Reports go directly to the maintainers and stay private until a fix is released.

Never disclose a vulnerability in a public issue, and do not include credentials, private repository URLs, or exploit details in public reports.

## Supported versions

Only the latest published release receives security fixes.

## Scope

In scope: the `businesslens` CLI, or the lint runner the skills use, running code from a repository it reads, or writing a file that repository owns (such as `AGENTS.md`, `CLAUDE.md` or the README), or overwriting a file BusinessLens does not own without `--force`.

Out of scope: an AI agent not following a skill's instructions. The skills only instruct the agent, and nothing technically enforces those instructions. What an agent can actually run or change is controlled by the tool it runs in, such as Claude Code's permission prompts.
