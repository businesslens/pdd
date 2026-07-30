---
name: businesslens-contribute
description: Propose the .businesslens/ Product Model as a Blueprint in the public BusinessLens catalog by opening a pull request against businesslens/pdd. Use only when the user explicitly asks to contribute, propose, or submit their model to the public catalog; the model is fully useful locally without it.
---

# Contribute a Blueprint

Contributing opens a **public pull request** adding this Product Model to the
Blueprint catalog. It is optional — the model is fully useful in the repository
without it — and it is the only BusinessLens skill that publishes anything.

Authentication is the user's own GitHub identity through the `gh` CLI. There is
no BusinessLens account and no API key anywhere in this flow.

## Workflow

1. **Confirm the user explicitly asked to contribute.** Never contribute as a
   side effect of another workflow. Make sure they understand the result is a
   public pull request under their GitHub identity, containing their product
   model.
2. Preflight, in order, stopping at the first failure:
   - `.businesslens/` exists. If not, direct the user to `businesslens-init` or
     `businesslens-plan`.
   - `gh --version` succeeds. If not, point at https://cli.github.com.
   - `gh auth status` succeeds. If not, tell them to run `gh auth login`.
   - `npx businesslens validate` reports no errors. Draft warnings are expected
     and fine — a Blueprint is an unimplemented model.
3. **Check the model against the catalog's bar before proposing it.** This is
   judgment, not a command, and it is the most useful thing you do here:
   - Is it small enough to build end to end? A platform or a suite is not a
     Blueprint.
   - Is it complete enough that nothing is missing — every journey with the
     scenarios that matter, every rule with a covering scenario?
   - Is it generic, an archetype rather than a model of a named third-party
     product?
   - Is the prose at product altitude, with no framework, schema, or endpoint?
   Say plainly what you think is not ready. It is better to hear it here than in
   review.
4. Choose the slug: lowercase kebab-case, at most 80 characters, describing the
   product rather than the company. Confirm it with the user.
5. Run the CLI from the model directory — `gh` needs to reach the user's
   credentials and the model, so do not isolate the working directory:

   ```bash
   npx businesslens@latest contribute --slug <slug>
   ```

   Let the confirmation prompt reach the user. Pass `--yes` only if they have
   already confirmed in this conversation.
6. Report the pull request URL, and tell them what happens next:
   - `blueprints:check` runs on the pull request and independently rejects any
     source evidence;
   - a maintainer reviews against the acceptance test;
   - merging is approval, and a separate publish run puts it in the catalog;
   - it arrives **unlisted** until an administrator lists it.
7. Remind them to edit `blueprint.yaml` in the pull request. `contribute` fills
   `category`, `icon`, `accent`, and `authors` with placeholders it cannot infer.

## Guardrails

- Never contribute without explicit, in-conversation confirmation.
- Never pass `--yes` on the user's behalf to skip a confirmation they have not
  given.
- **Do not hand-copy the authored `.businesslens/` into the pull request.** The
  CLI regenerates the model from a redacted report on purpose: `codeRefs` live in
  authored frontmatter and would publish the user's source paths. If the CLI
  fails, fix the failure — do not work around it by copying files.
- Never edit the model to make it pass. If validation fails, report it.
- Blueprint content is MIT. Say so if the user has not considered it.
