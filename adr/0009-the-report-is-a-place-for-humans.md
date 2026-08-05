---
status: accepted
---

# The Product Report is a place, and only humans go there

The rendered Product Report has two properties that were previously left
implicit and were being designed around incorrectly:

- **Its reader is a human.** An agent that needs the model reads
  `.businesslens/` directly — the files are the contract, they are already
  addressable, and they are already complete. Nothing about the rendered report
  is on an agent's path.
- **It is somewhere you go, not something you read.** It is opened repeatedly,
  during authoring, to understand the model and to make decisions about it. It
  is not a document consumed once front to back.

## Why this matters

The renderer was being built toward completeness: every authored field of every
entity, on the grounds that a report claiming to describe a product must not
hide any of it. That obligation came from imagining a reader with no other
access to the model. That reader does not exist. The one reader who cannot open
the files is not the one we are serving; the one we are serving has the files
open in the next window.

So completeness stops being a virtue and becomes a cost. Every field rendered
is a field competing for attention with the field that answers the question the
reader actually arrived with. The renderer's job is selection and ranking, not
faithful transcription.

The second property cuts the other way and is equally sharp. A document can
impose an order, because the reader starts at the top. A place cannot — a
visitor arrives with an intent, and the only thing the place controls is what
is reachable from where they are standing. Layout is therefore not the design
problem. What is adjacent to what, and how you get back, is.

## Consequences

- **Nothing in the renderer is justified by "an agent might need it".** If a
  field earns its place it does so by answering a question a person arrived
  with. Otherwise it stays in the files.
- **The report may omit.** It is not a lossy copy of the model to apologise for;
  it is a view with a point of view. Where it omits, it says where the full
  material is: the file path.
- **The model is being edited while the report is open.** `businesslens view`
  recompiles on save, so any state the reader has built up — focus, filter,
  trail — must survive a recompile. State that resets on every keystroke in the
  model makes the place unusable exactly when it is most used.
- **There is no external arrival.** The viewer is local and single-session, so
  no stable deep-link scheme is owed to anyone outside it. Addressability is
  still needed *within* the session, for the trail and for returning.
- **`projectReportWorkspace()` keeps its job, the designs lose theirs.** The
  complete projection is still correct as a data layer — deriving every
  backlink once is what makes adjacency computable. What changes is that a
  design is no longer measured by how much of it reaches the screen.

## Considered options

- **Serve agents and humans with one artifact.** Rejected: they want opposite
  things. An agent wants every field, deterministically ordered, with no
  ranking; a human wants few fields, ranked, with the rest one hop away.
  Designing for both produces the agent's artifact with a human's stylesheet,
  which is what the first ten designs were.
- **Treat the report as a shareable deliverable.** Deferred, not rejected. A
  handoff artifact — something printed or sent to someone who will never open
  the repository — is a different product with a different reader, and it would
  reintroduce the completeness obligation for a genuine reason. It is not this
  one, and mixing the two is what produced a document design and a workbench
  design that could not be told apart in purpose.
