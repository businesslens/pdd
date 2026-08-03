# Write nothing outside `.businesslens/`

Supersedes the greenfield-block decision in
[adr/0001](./0001-drop-the-brownfield-agents-block.md). BusinessLens no longer
writes a managed block into a repository's root `AGENTS.md`. The orientation
text moves into `.businesslens/README.md`, written by `blueprint open` and
`blueprint pull`.

ADR 0001 dropped the brownfield block and kept the greenfield one, rejecting
"drop the block entirely" because it "breaks *pull it and hand it to your
agent* with nothing left to replace it." That rejection was conditional on
there being no replacement. There is one, and it was available the whole time.

## Why the reach argument does not hold

The block's one claimed irreplaceable property was **reach**: it is the only
thing that speaks to an agent not running a BusinessLens skill. ADR 0001 also
narrowed the block to the greenfield case — a Product Model with no
implementation.

Those two facts are in tension. In the greenfield case, `.businesslens/` is the
only thing in the repository. An agent asked to build something there has
nothing else to read. The discovery problem that root-level placement solves
does not exist in the one situation where the block was load-bearing, so the
reach argument is weakest exactly where it was doing the work.

What reach genuinely bought was the brownfield case — a repository with both
code and a model, where an agent might never look inside `.businesslens/`. ADR
0001 consciously gave that up. Nothing further is lost here.

## Consequences

- **One invariant: BusinessLens never writes a file the repository owns for its
  own purposes.** It writes `.businesslens/`, and — only when you pass
  `--force` — a timestamped `.businesslens.backup-<ts>/` copy of it. That
  backup is a sibling of the directory it copies, requested explicitly; it is
  not a shared file that other tools also manage. `AGENTS.md` is, which is the
  whole difference.
- `src/core/agent-block.ts` is deleted along with its begin/end marker
  insert-or-replace logic, the preserve-content-outside-the-markers handling,
  and their tests. `src/core/model-readme.ts` replaces it with an unconditional
  write, which is also what keeps a re-opened model byte-identical.
- **The greenfield/brownfield variant problem dissolves.** A file describing the
  directory it sits in is correct in both states; a block making claims about
  the whole repository had to pick one, and picking wrong is precisely the bug
  ADR 0001 recorded (`plan` handed new products the brownfield text).
- `businesslens-doctor` stops checking `AGENTS.md` for a well-formed block. It
  now reports any surviving block as stale and leaves removal to the user.
- `AGENTS.md` is contested territory — every tool wants to write there, and
  managed blocks get reordered by formatters, duplicated, and merge-conflicted.
  ADR 0001 retreated from it once under that pressure. Retreating fully ends it.
- The README does not travel inside a Product Report. `export` serializes parsed
  entities rather than the file tree, so `open` regenerates the README on
  expansion and boilerplate stays out of the schema.
- Repositories carrying a block written by an earlier version keep it. Nothing
  removes it. Its retired skill names may now be stale, but BusinessLens does
  not rewrite repository-owned instructions; users remove or revise the block
  explicitly.

## Considered options

- **Move the text into `product.md`.** It would travel through export and open
  for free, but `product.md` is validated model content under the format
  contract, and process instructions do not belong in an entity.
- **Bring back a briefing skill.** A skill's description would fire it on "build
  the product in `.businesslens/`", which is a sharper trigger than ambient
  instructions. Rejected as the primary mechanism because it only works once
  skills are installed, and `blueprint pull` is anonymous and needs no install.
  A file in the directory covers the zero-install case; a skill can be added
  later without conflicting.
- **Print the briefing at pull/open time instead of writing it.** Terminal
  output is gone by the time an agent runs, and users do not paste it.
