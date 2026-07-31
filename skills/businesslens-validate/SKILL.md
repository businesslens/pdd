---
name: businesslens-validate
description: Run the deterministic BusinessLens validator against an existing .businesslens/ product model and return a clear, read-only explanation of every error, warning, and entity count. Use when asked to validate or check a model, verify initialization or synchronization, or confirm readiness for review or CI; use businesslens-doctor instead for drift investigation or repairs.
---

# Validate the BusinessLens Product Model

Report whether the authored model satisfies the deterministic format contract.
Do not modify files.

## Workflow

1. Locate the Git repository root and check whether `.businesslens/` exists.
   If it is absent, report that initialization is required and direct the user
   to `businesslens-init`.
2. Run:

   ```bash
   npx businesslens validate --json
   ```

   Honor an explicit user-provided local CLI command instead when testing an
   unpublished BusinessLens version. Capture stdout, stderr, and the exit
   status; a nonzero validation exit is a result to explain, not a reason to
   abandon the report.
3. Parse the JSON output. Treat the CLI as the authority for structural
   validity. If output is not valid JSON, report the command, exit status, and
   stderr exactly, then stop rather than inferring a result.
4. Return:
   - **Result** — pass or fail;
   - **Errors** — every error, grouped by file when a path is available;
   - **Warnings** — every warning, clearly separated from errors;
   - **Counts** — actors, experiences, domains, features, journeys,
     scenarios, and business rules;
   - **Next action** — none for a clean result, `businesslens-init` for a
     missing model, or `businesslens-doctor` when diagnosis or repair is needed.
   `needs at least one codeRef` findings usually mean planned behavior whose
   implementation has not been verified yet — the next action there is
   `businesslens-verify` (they appear as warnings while `coverage.md` is
   `status: draft`, the planned-greenfield state).
5. When explaining a finding, read the referenced authored file if necessary
   to provide context. Do not broaden this into a semantic coverage or drift
   audit.
6. State explicitly that a green deterministic result proves format and
   relationship integrity, not complete or current product coverage.

## Guardrails

- Remain read-only even when validation fails.
- Never execute the target repository's application, tests, build, migrations,
  or package scripts.
- Never suppress, rewrite, or reinterpret validator findings.
- Never submit or contribute the Product Model from this skill;
  `businesslens-contribute` is the explicit public-catalog workflow.
- Do not repair the model; recommend `businesslens-doctor` for that workflow.
