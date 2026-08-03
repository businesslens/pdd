# Documentation naming changes

Status: approved and applied on 2026-08-03.

Last reviewed: 2026-08-03

This worksheet records only the documentation fields selected for change.
Pages and fields that stayed as they were have been omitted.

Every remaining `Suggested` value was approved and implemented. The blank
`Final decision` cells are retained as part of the original review worksheet.
No Markdown files or documentation URLs were renamed.

## Group changes

| Field | Current | Suggested | Reason | Final decision |
| --- | --- | --- | --- | --- |
| Product Model group | `Product model` | `Product Model` | Match the capitalization of the defined BusinessLens artifact. | |
| Integration group | `Integration` | `Integrations` | The group contains several integrations and workflows. Use `Workflows` instead if the section will expand beyond tool integrations into general team-process guidance. | |

## Opening pages

| File | Field | Current | Suggested | Reason | Final decision |
| --- | --- | --- | --- | --- | --- |
| `docs/index.md` | H1 | `Product context that survives the session` | `BusinessLens: Product-Driven Development for coding agents` | The entry page should identify the product and category immediately. The current H1 works better as marketing copy than as the main documentation identifier. | |
| `docs/index.md` | Description | `BusinessLens keeps intended product behavior durable, gives every repository three starting doors, and verifies changes through one automatic loop.` | `BusinessLens brings Product-Driven Development to coding agents through a Git-tracked Product Model and an automatic verification loop.` | Gives search and link-preview readers the product category before introducing the workflow. | |
| `docs/the-loop.md` | Title | `The loop` | `Development loop` | Gives the sidebar label enough context outside the page. | |

## Product Model overview

| File | Field | Current | Suggested | Reason | Final decision |
| --- | --- | --- | --- | --- | --- |
| `docs/product-model.md` | Title | `Overview` | `Model overview` | Replaces a generic browser/search title while staying short in the sidebar. | |

## Integration pages

| File | Field | Current | Suggested | Reason | Final decision |
| --- | --- | --- | --- | --- | --- |
| `docs/with-plan-mode.md` | Title | `With plan mode` | `Plan mode` | Removes a fragment from the navigation. | |
| `docs/with-plan-mode.md` | H1 | `With Claude Code or Codex plan mode` | `Use BusinessLens with Claude Code or Codex plan mode` | Makes the heading an explicit action. | |
| `docs/with-sdd.md` | Title | `With SDD tools` | `SDD tools` | Avoids presenting the unexplained SDD acronym before the page is opened. | |
| `docs/with-sdd.md` | H1 | `With a spec-driven framework` | `Use BusinessLens with spec-driven development tools` | Makes the heading explicit and consistent with the sidebar label. | |
| `docs/ci.md` | Title | `Lint in CI` | `CI/CD` | better naming. | |

## Skill pages

| File | Field | Current | Suggested | Reason | Final decision |
| --- | --- | --- | --- | --- | --- |
| `docs/skills.md` | H1 | `BusinessLens skills` | `BusinessLens agent skills` | Names the specific kind of skill documented by the section. | |
