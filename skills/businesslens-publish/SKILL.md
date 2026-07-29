---
name: businesslens-publish
description: Report the .businesslens/ product model to the BusinessLens Platform as an immutable Product Model Version by running the businesslens CLI. Use only when the user explicitly asks to publish, push, or submit the model to the Platform; the model is fully useful locally without publishing.
---

# Report the BusinessLens Product Model

Publishing compiles `.businesslens/` into a source-free Product Report, adds
separate provenance for the current commit, and submits it as an immutable
Product Model Version. It does not create a Blueprint or make anything public.
It is optional —
the model is fully useful in the repository without it. This is the only
BusinessLens skill that contacts the platform.

## Workflow

1. Confirm the user explicitly asked to publish. Never publish as a side
   effect of another workflow. Determine the target Git ref:
   - no ref requested → current branch;
   - a release tag requested → pass `--tag <name>`;
   - a pull request requested → pass `--pull-request <number>` and
     `--base-branch <name>`; include `--pr-title`/`--pr-url` only when known.
2. Preflight, in order, and stop at the first failure:
   - Locate the Git repository root and check that `.businesslens/` exists.
     If it is absent, direct the user to `businesslens-init`.
   - Resolve `<businesslens-publish-skill-dir>` to this installed skill
     directory, then run the bundled isolated CLI runner:

     ```bash
     node <businesslens-publish-skill-dir>/scripts/run-businesslens.mjs \
       --root "$PWD" validate --json
     ```

     Stop on errors. Recommend `businesslens-doctor` for repairs; do not edit
     model files yourself. The runner removes `BUSINESSLENS_API_KEY` while
     validating.
   - Verify publishing provenance the same way the CLI will: the tracked
     worktree is clean, `.businesslens/` is fully committed, and `origin`
     normalizes to an HTTPS URL. Branch and pull-request publishing require a
     named source branch. Tag publishing may use a detached checkout only when
     the named tag exists and points at HEAD. Explain any failure and how to
     resolve it instead of working around it.
3. Verify the API key exists without revealing it, for example
   `test -n "$BUSINESSLENS_API_KEY" && echo present || echo missing`.
   If it is missing, tell the user to create a workspace API key on the
   platform (Workspace Settings → API keys) and export it as
   `BUSINESSLENS_API_KEY`. Never ask them to paste the key into the chat.
4. Run:

   ```bash
   node <businesslens-publish-skill-dir>/scripts/run-businesslens.mjs \
     --root "$PWD" publish --yes [ref options from step 1]
   ```

   The runner installs `businesslens@latest` in an isolated temporary
   directory so a target-local binary or `.npmrc` cannot intercept the API
   key. Agent sessions are non-interactive; without `--yes` the CLI refuses
   with exit code 2. Honor an explicit user-provided local CLI command instead
   when testing an unpublished BusinessLens version.
5. Interpret failures using the CLI's error messages:
   - 401 — the key is wrong or revoked; re-export `BUSINESSLENS_API_KEY` and
     retry.
   - 403 — the key cannot submit projects; create a workspace project key.
   - 409 source/ref conflict — explain the exact repository or target-ref
     mismatch reported by the Platform. Projects can contain separate branch,
     tag, and pull-request Tracks.
   - 400 with issues — fix the listed model problems (or route the user to
     `businesslens-doctor`) and re-run.
   - Publish preflight refusals (dirty worktree, untracked model files,
     unsupported detached HEAD, tag not at HEAD, non-HTTPS origin) — resolve
     the repository state from step 2.
6. Report the returned version line (`Published version <versionKey>:
   <href>`) and the URL. State whether the selected Track is a branch, tag, or
   pull request. Every publish reports a new immutable Version into that
   Track; Versions are never replaced, and a failed publish is safe to re-run.

Blueprint creation, adding a Blueprint revision, and selecting a public
revision are Platform workflows. Never describe this skill as creating or
publishing a Blueprint.

## CI

For automatic publishing on merge, point the user at the recipe in
`docs/ci.md` of the businesslens package: a PR job running `validate` and a
main-branch job running `publish --yes` with the key stored as a secret.

## Guardrails

- Never print, echo, log, or write `BUSINESSLENS_API_KEY` anywhere; check
  only for its presence.
- Never publish without explicit user intent, and never retry a publish that
  failed validation by editing model files to force it green.
- Never execute the target repository's application, tests, build,
  migrations, or package scripts.
- In the target repository, the only writes are the CLI's own gitignored
  outputs under `.businesslens/build/` and `.businesslens/cache/`. The
  isolated runner removes its temporary directory when the command ends.
