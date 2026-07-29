---
title: Map existing code
description: Build an evidence-backed product model of what your product does today.
section: open-source
group: Tutorials
order: 8
---

# Map an existing product

**Goal:** an evidence-backed `.businesslens/` Product Model of what your product does
today, so agents and reviewers start from product context instead of
repository archaeology.

**Prerequisites:** a Git repository with the product's code, Node.js
20.12+, and an AI harness (Claude Code, Codex, Cursor, Gemini CLI, or
GitHub Copilot).

## Steps

1. Install the skills in the repository:

   ```bash
   npx businesslens@latest install
   ```

2. Build the model in your harness:

   ```text
   /businesslens-init
   ```

   (Codex: `$businesslens-init`.) The skill inspects the code without
   executing it, authors actors, experiences, domains, features, journeys,
   scenarios, business rules, and decision points with direct evidence, and
   installs the managed `AGENTS.md` block.
   Answer only the questions the code cannot — the skill drafts everything
   it can from evidence.

3. Review the diff like any pull request. Every behavioral claim carries a
   `codeRef` you can open. Check `coverage.md` for honest gaps.

4. Validate and commit:

   ```bash
   npx businesslens@latest validate
   git add .businesslens AGENTS.md
   git commit -m "docs: add BusinessLens product model"
   ```

5. Optional: deepen the highest-value area.

   ```text
   /businesslens-deep-dive <journey-id>
   ```

6. Add the validator to CI so the model cannot rot — see
   [Validate in CI](./ci.md).

## Outcome

`npx businesslens validate` is green; the model describes today's product
with evidence. From here, plan every new feature with
[the feature loop](./tutorial-ship-a-feature.md).
