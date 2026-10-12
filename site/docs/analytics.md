# Website analytics

read_when: configuring, testing, building, or interpreting PostHog analytics.

PostHog measures the whole site. It automatically captures pageviews, page leaves,
referring sites, UTM campaigns, link and button clicks, form submissions, rage
clicks, and heatmaps.

Custom browser events mark the small number of interactions that form useful
funnels:

- `homepage_cta_clicked` records the CTA, destination, interaction, and its
  placement in the hero, hero overlay, or closing panel.
- `homepage_install_command_copied` records a successful copy of the homepage
  install command.
- `blueprint_pull_command_copied`, with the Blueprint slug, measures pull intent.

The site has no server, so it cannot see an actual pull: `pdd-kit blueprint pull`
downloads from the GitHub Release, not from the site. The copy event is intent
only.

## Configuration

The site is generated, so analytics is configured when it is built, not when it
is served. A build is measured only when it is generated with a key:

```dotenv
NUXT_PUBLIC_POSTHOG_KEY=phc_...
NUXT_PUBLIC_POSTHOG_HOST=https://eu.i.posthog.com   # the default
```

Without a `phc_` key and an `https://` host, the browser never loads the PostHog
client. The `phc_` project token is a public ingestion token, not a PostHog
personal API key, so it is safe to bake into the generated pages.

There are no accounts, so analytics is anonymous only: the site never calls
`posthog.identify` and creates no person profiles. It respects Do Not Track and
records session replays only after analytics cookies are accepted. Input/change
events, form field values, and arbitrary copied text are not captured; the
explicit command-copy events contain only the known public command or Blueprint
slug.

## Consent

The global Nuxt UI consent notice appears once PostHog is available and no
preference has been saved. PostHog's own consent state is the source of truth:

- Before a visitor chooses, PostHog captures cookieless events without a
  persistent browser identifier. This prevents the consent notice from hiding
  the first pageview while preserving the same privacy boundary as rejection.
- **Allow analytics cookies** opts into normal first-party PostHog persistence,
  so an anonymous browser can be recognized between visits.
- **Reject analytics cookies** opts out of analytics persistence and activates
  `cookieless_mode: 'on_reject'`. Events have no persistent browser identifier.

The consent preference itself is retained by PostHog so the notice does not
appear on every page. Visitors can change the preference under **Analytics
choices** on `/privacy`.

The PostHog project must have **Cookieless server hash mode** enabled or PostHog
will discard events from visitors who choose cookieless analytics. The server
hash is only stable for the same browser and IP address during one UTC day, so
it supports daily aggregate analysis but not cross-day visitor journeys.

## Campaign links

Use stable campaign parameters on every published link:

```text
https://pdd-kit.dev/blog/your-agent-is-guessing?utm_source=linkedin&utm_medium=organic_social&utm_campaign=prelaunch&utm_content=agent_guessing_01
```

Use source for the platform, medium for the distribution type, campaign for the
initiative, and content for the exact post or creative. Do not place personal or
confidential information in URLs.

In PostHog, start with Web analytics and Live events. Test both consent choices
in separate private browsing sessions. Build a homepage funnel
from `$pageview` to `homepage_cta_clicked` or
`homepage_install_command_copied`, and a Blueprint funnel from its `$pageview`
to `blueprint_pull_command_copied`. Break both down by UTM source, campaign, and
content.
