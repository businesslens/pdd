---
name: businesslens-publish
description: Publish the .businesslens/ product map to the BusinessLens platform as a commit-pinned snapshot by running the businesslens CLI. Use only when the user explicitly asks to publish, push, or submit the map to the platform; the map is fully useful locally without publishing.
---

# Publish the BusinessLens map

Publishing compiles `.businesslens/` into a portable snapshot pinned to the
current commit and submits it to the BusinessLens platform. It is optional —
the map is fully useful in the repository without it. This is the only
BusinessLens skill that contacts the platform.

## Workflow

1. Confirm the user explicitly asked to publish. Never publish as a side
   effect of another workflow.
2. Preflight, in order, and stop at the first failure:
   - Locate the Git repository root and check that `.businesslens/` exists.
     If it is absent, direct the user to `businesslens-init`.
   - Run `npx businesslens validate --json` and stop on errors. Recommend
     `businesslens-doctor` for repairs; do not edit map files yourself.
   - Verify publishing provenance the same way the CLI will: the tracked
     worktree is clean, `.businesslens/` is fully committed, HEAD is on a
     named branch (not detached), and `origin` normalizes to an HTTPS URL.
     Explain any failure and how to resolve it (commit or stash changes,
     check out a branch, fix the remote) instead of working around it.
3. Verify the API key exists without revealing it, for example
   `test -n "$BUSINESSLENS_API_KEY" && echo present || echo missing`.
   If it is missing, tell the user to create a workspace API key on the
   platform (Workspace Settings → API keys) and export it as
   `BUSINESSLENS_API_KEY`. Never ask them to paste the key into the chat.
4. Run:

   ```bash
   npx businesslens publish --yes
   ```

   Agent sessions are non-interactive; without `--yes` the CLI refuses with
   exit code 2. Honor an explicit user-provided local CLI command instead
   when testing an unpublished BusinessLens version.
5. Interpret failures using the CLI's error messages:
   - 401 — the key is wrong or revoked; re-export `BUSINESSLENS_API_KEY` and
     retry.
   - 403 — the key cannot submit projects; create a workspace project key.
   - 409 branch conflict — the message names the branch the project tracks
     versus the branch submitted. Explain that one project tracks one branch
     and snapshots follow commits.
   - 400 with issues — fix the listed map problems (or route the user to
     `businesslens-doctor`) and re-run.
   - 404 — a cached analysis went stale; re-run publish to start fresh.
   - Build refusals (dirty worktree, untracked map files, detached HEAD,
     non-HTTPS origin) — resolve the repository state from step 2.
6. Report the returned snapshot line (`Created`/`Updated snapshot
   <versionKey>: <href>`) and the URL. Explain resume semantics: an
   interrupted publish resumes its active analysis from
   `.businesslens/cache/analysis.json`; re-publishing the same commit
   replaces that commit's snapshot; new commits create new snapshots.

## CI

For automatic publishing on merge, point the user at the recipe in
`docs/ci.md` of the businesslens package: a PR job running `validate` and a
main-branch job running `publish --yes` with the key stored as a secret.

## Guardrails

- Never print, echo, log, or write `BUSINESSLENS_API_KEY` anywhere; check
  only for its presence.
- Never publish without explicit user intent, and never retry a publish that
  failed validation by editing map files to force it green.
- Never execute the target repository's application, tests, build,
  migrations, or package scripts.
- The only writes are the CLI's own gitignored outputs under
  `.businesslens/build/` and `.businesslens/cache/`.
