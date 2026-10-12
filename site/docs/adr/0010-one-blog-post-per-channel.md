# One blog post per channel, and LinkedIn is not one of them

The historical redirect requirement below is superseded by
[ADR-0017](./0017-current-contract-only-before-launch.md).

Three published posts explained PDD between them and each restated the other two.
`the-missing-standard-for-product-knowledge` and `product-driven-development`
listed the same six gains in nearly the same words, and both opened by summarising
the other; `introducing-businesslens` re-ran the whole problem statement before
reaching what it ships. Merging them is obvious. What was not obvious is how many
posts should exist afterwards, and the answer does not come from the topics.

**Nobody browses `/blog`.** Every post is read because something linked to it, so
the post count is decided by the channels, not the subject matter. Three posts,
each written for one:

| Post | Written for |
| --- | --- |
| `your-agent-is-guessing` | The blog's own front door; newsletters and dev.to |
| `introducing-businesslens` | Nowhere — the canonical explainer linked from the README, the docs, and comments |
| `pdd-and-spec-driven-development` | Reddit and Hacker News, where the audience already argues about spec-kit and Kiro |

**LinkedIn is served natively by the home page and links to no post.** The home
page is already the problem and the product at the length that audience tolerates
— which is what it was built for. That decision is what lets the blog stop
optimising for a cold feed: Reddit and Hacker News punish the register that
LinkedIn rewards, and a post trying to satisfy both satisfies neither.

So the registers are assigned by surface rather than negotiated per post. **The
home page is catchy. The blog is specific. The docs are reference.**

## Consequences

- **`introducing-businesslens` no longer has to travel.** It is the artifact
  someone finds when they search the product name. Accurate and findable is the
  whole bar; it gets no channel of its own.
- **The PDD reference material is documentation, not a dated post.**
  `product-driven-development.md` carried the loop, the evidence mechanics, and
  the SDD borderline. All three already exist in `businesslens/pdd` as
  `the-loop.md`, `code-refs-and-coverage.md` and `with-sdd.md`. Reference
  material should not carry a publication date it will outlive, so the post was
  deleted rather than moved.
- **The SDD comparison lives in three places with three jobs**, and they must
  agree the way `CONTEXT.md` and the owning Product Model pages must: `/faq` is the
  one-paragraph deflection for a visitor mid-evaluation,
  `pdd-and-spec-driven-development` is the argument for someone who has never
  heard of PDD, and `/docs/with-sdd` is the integration guide for someone already
  running an SDD workflow.
- **`/faq` linked to `/docs/pdd-and-sdd`, which does not exist.** The docs page is
  `with-sdd.md`, so the route is `/docs/with-sdd`; the FAQ was shipping a 404. It
  now links to the blog argument, which is the better destination from an
  evaluation surface and ends at the docs page anyway.
- **The Blueprint "build this" run stays inside `introducing-businesslens`.** It
  was briefly its own post — 59 files, 197 passing tests, one file per journey,
  and a contradiction the build surfaced that reading never had. As a post it
  needed a paragraph of setup explaining what a Blueprint is, which the launch
  post had already spent; as a section it lands where the reader has just been
  told the catalog exists and is wondering whether the models in it are real.
- **Three slugs redirect to one.** `product-driven-design`,
  `product-driven-development` and `the-missing-standard-for-product-knowledge`
  all 301 to `your-agent-is-guessing`. The first was already redirecting via the
  second per [ADR-0007](./0007-pdd-names-the-practice.md); it now resolves in one
  hop rather than through a slug that has itself been retired.
- **The thesis post's title is the home page h1.** `your-agent-is-guessing` is the
  long form of the home page's two sections, so the two must agree — the post is
  where the argument is made at length, the page is where it is made quickly.

## Considered and rejected

**One merged post.** It was the first plan, and it broke on length: the problem,
the artifact, the practice and the three doors do not fit in something a stranger
will finish. The doors went to the home page, where they are already buttons.

**A fourth post, on the Blueprint build run.** Four posts is the beginning of a
swamp, so one of the two technical posts had to go. The SDD comparison won the
slot because it is oriented against something the audience already argues about —
spec-kit, Kiro, OpenSpec — and a post that starts from a practice they hold an
opinion on travels further than one that starts from a noun they have never met.
The build run survives as a section of the launch post, where its setup is already
paid for. If a fourth post is ever proposed, it replaces one rather than joining
them.
