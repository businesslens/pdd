# Blog and Changelog Screens

read_when: changing the blog collection, a post layout, or the changelog.

Two surfaces that look adjacent and are sourced differently. The blog is Nuxt
Content in this repository, under `content/blog/`. The changelog is the
`changelog` collection: the repository's root `CHANGELOG.md`, read from the same
checkout as the docs and rendered as-is — a record of what shipped, not a feed, authored once.

Neither has section tabs. They had them when there was a Platform changelog to
switch to; there is one changelog now.

## WRT-01 — Blog index

Route: `/blog`

Posts newest first from the `blog` collection, each with the `date`, `image`,
and optional `authors` its frontmatter schema requires. `date` and `image` are
required precisely so a post cannot ship without a card that renders.

**The date sits in the byline at the foot of the card, not above the title.** A
card is scanned title first, and a publication date at the top asks to be read
before the reader knows whether they care.

**The hero's title is the page name, "Blog", in the brass accent
(`text-primary`), centered, with an icon-only RSS link beside the heading and no
subtitle.** The link sits outside the `h1`, so the heading's name stays "Blog";
its accessible name and tooltip are "Follow via RSS".
The feed lives on the one page that is about the posts rather than in the
shared footer. The link is rendered `external` even though `/blog/rss.xml` is
same-origin — the target is a generated XML file, and a client-side navigation
would hand it to the Vue router as a page. Every blog page also carries a
`<link rel="alternate" type="application/rss+xml">` with the absolute URL, which
is what a browser extension or a reader's "find the feed" button looks for.

**A card carries two links, and neither contains the other.** The author goes to
their GitHub profile and everything else goes to the post, so `UBlogPost`'s `to`
prop is not used: it lays an `absolute inset-0` link over the whole card, and the
author link would then be a link inside a link — `nested-interactive`, which the
axe scan fails on. The title link spreads the overlay itself, through an
`after:absolute after:inset-0` pseudo-element against the card's `relative` root.
The author is lifted over it with `z-10` on that element alone; lifting the whole
byline row would punch a dead strip through the card where the date is. What `to`
would have styled — the hover ground, the image zoom, the focus ring — is
restored through `ui`.

| State | Shows |
| --- | --- |
| `WRT-01.default` | the post list |

## WRT-02 — Blog post

Route: `/blog/:slug`

The article, its authors, and the prose components. `app/components/content/`
holds the overrides that make Markdown match the brand — most notably `ProseA`.

One arrangement, in `app/components/landing/blog/ArticleLayout.vue`. Posts used to
take part in a five-arrangement comparison run from a Layout row in the preview
bar; that finished here first, and the four that lost were deleted. The FAQ has
since settled the same way, and the row is gone.

**The masthead runs title → description → cover → byline.** Attribution last means
the brass rule under it opens the prose rather than separating two pieces of page
furniture, and a reader who has already decided never scrolls past a date to reach
the first paragraph. The byline carries the author's avatar, name, and handle,
linked to their GitHub profile; under it the date and a reading estimate derived
from the rendered tree by `readingMinutes` in `app/utils/blogContent.ts` — counted
from what a reader sees, so frontmatter and link hrefs stay out of it.

**Share is X, LinkedIn, and copy-link.** Copy-link replaces the third social
network these rows usually carry: a link on the clipboard is what actually gets
pasted into a team channel. The circles stay neutral rather than taking each
network's brand colour, which against parchment would read as borrowed.

Headings track in a right rail rather than a floating panel, so the measure keeps
its lane whether or not a post has enough headings to fill one.

| State | Shows |
| --- | --- |
| `WRT-02.default` | a full post |

## WRT-03 — Changelog

Route: `/changelog`

The hero — the page name, "Changelog", in the brass accent, with no caps label
and no subtitle — then one timeline card per `##` release of the root `CHANGELOG.md`, in
file order: its date, the version linked where GitHub links its heading (the
file's compare URL), and the release's entries rendered as written, each with
the pull request and commit that shipped it. Every release announces the CLI,
so no badge labels it as one.
Each `###` section (Added, Changed, Fixed, Removed, Contributors) leads with a
mark. A Versions menu beside the timeline holds one anchor per card
(`#v0-24-0`) and marks the cards on screen; on phones it folds into a bar above
the timeline. The file's own title and preamble give way to the hero. Only a
dated version is a card: `[Unreleased]` is merged but not shipped, so it never
reaches the page, and neither does a release with no entries. The version
link sits in the title rather than on the card, because a card link overlays
the entries and their own links.

Entries describe what that release actually shipped, including concepts later
retired — they are a record and are not rewritten when the vocabulary moves on.
A missing file fails the prerender. Bullets are drawn in the primary brass
rather than Nuxt UI's faint border colour.

| State | Shows |
| --- | --- |
| `WRT-03.default` | the release list |

