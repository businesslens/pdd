# Drop the brownfield `AGENTS.md` block

BusinessLens wrote a managed block into a repository's root `AGENTS.md` in two
variants — brownfield (written by `businesslens-init` and `businesslens-plan`)
and greenfield (written by `businesslens pull`). We keep only the greenfield
variant, and only the CLI writes it. Skills stop touching `AGENTS.md`
altogether.

The block's one irreplaceable property is reach: it is the only thing that
speaks to an agent which is *not* running a BusinessLens skill — a spec-driven
toolchain, a freestyle session, a coding agent that has never heard of this
project. That reach is worth very different amounts in the two cases.

In a **brownfield** repository the block is advisory nudging: read the model
before changing behavior, update it after. Losing it means unrecorded changes
accumulate silently — and the deterministic validator cannot catch them, because
a model whose code changed underneath it stays internally consistent and its
`codeRefs` still resolve. But that situation is already a designed, named row of
the flow table, and `businesslens-sync` owns it. The loss is a slower feedback
loop, not a missing capability.

In a **greenfield** repository the block is the specification's cover letter:
this is a plan, the scenarios are the definition of done, nothing here
prescribes a stack. Without it, `businesslens pull` hands someone a directory of
Markdown with no instruction anywhere about what it is for — and since
`businesslens-implement` was removed in the same change, there is no skill left
to carry that content either. Removing it would break the Blueprint story
outright.

The dividing line that falls out: **you need the instruction when the model
arrives from somewhere else.** If you authored it with `init` or `plan`, you
already know what it is and you are driving. If you pulled it, you may hand the
repository to an agent cold.

## Considered options

- **Keep both variants behind a new `businesslens agents` command.** One
  definition, correct variant detection, and a repair path — but a fourth
  top-level verb, added during a deliberate effort to shrink the CLI, to serve a
  block we now believe is only load-bearing in one of its two forms.
- **Keep both, single-source the text, and assert the copies match in
  `scripts/check-repo.mjs`.** Protects the skills we ship but not the block
  already sitting in a customer's repository, and leaves both variants to
  maintain.
- **Drop the block entirely.** Cleanest, and closest to the stated preference
  for not touching `AGENTS.md` at all — rejected because it breaks
  "pull it and hand it to your agent" with nothing left to replace it.

## Consequences

- The two-variant model disappears, and with it a bug: `businesslens-plan`
  step 4 handled *new products* and inserted the **brownfield** block, telling
  agents to read `codeRefs` for current behavior in a repository that had
  neither code nor `codeRefs`.
- The block has exactly one definition (`src/core/agent-block.ts`) and one
  writer (the CLI). It previously had two variants spread across three files
  that could drift apart independently.
- `businesslens-init` and `businesslens-plan` no longer modify `AGENTS.md`.
  This is the invasive case — repositories the user already owns — and it now
  never happens without an explicit CLI invocation.
- `businesslens-doctor` stops checking for a brownfield block. Its `AGENTS.md`
  check applies only to repositories holding an unimplemented model.
- Brownfield routing moves from advisory prose to computation: `validate` gains
  the branch picture (did the model change, did the code change), and each skill
  runs it on entry so a mis-invoked skill redirects to the right one. This is a
  stronger guarantee than an instruction that has to be followed, but it only
  fires when a skill is invoked at all — which is the reach we are consciously
  giving up.
