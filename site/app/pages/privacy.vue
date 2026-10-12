<script setup lang="ts">
import AnalyticsConsentSettings from '~/components/landing/AnalyticsConsentSettings.vue'
import LegalArticle from '~/components/landing/LegalArticle.vue'

useSiteSeo({
  title: 'Privacy Policy · pdd-kit',
  description: 'What data pdd-kit collects, why, and the choices you have.'
})
</script>

<template>
  <LegalArticle
    headline="Legal"
    title="Privacy Policy"
    description="What we collect, why we collect it, and the choices you have."
    updated="October 12, 2026"
  >
    <section>
      <h2>The short version</h2>
      <p>
        This site is a set of static pages: there are no accounts, no sign-in and no mailing list. Website analytics starts without cookies while you choose whether to allow them. Pulling a Blueprint downloads files from GitHub, not from this site. We do not sell your data.
      </p>
    </section>

    <section>
      <h2>What we collect</h2>
      <ul>
        <li>
          <strong>Website analytics</strong> — we measure page visits, referring sites and campaign tags, clicks, heatmaps and successful command copies, through PostHog.
          <ul>
            <li>Before you choose an analytics preference, and if you reject analytics cookies, PostHog uses cookieless analytics without a browser identifier. Apart from the saved consent preference, this mode does not use analytics browser storage or session replay.</li>
            <li>If you allow analytics cookies, PostHog uses first-party browser storage and an anonymous browser identifier to connect activity between visits and may record a replay of visible site interactions. Values typed into any field are masked.</li>
          </ul>
        </li>
        <li><strong>Hosting logs</strong> — the host serving these pages keeps the request logs it needs to deliver them and to protect against abuse.</li>
        <li><strong>GitHub</strong> — the star count in the header is fetched by your browser from GitHub, and Blueprints are downloaded from GitHub Releases. GitHub handles those requests under its own privacy statement.</li>
      </ul>
      <p>
        Model authoring, validation, export, and opening a local report happen in your repository. Listing and pulling Blueprints download files from GitHub Releases, while contributing uses your authenticated GitHub CLI to open a public pull request. Running the package through <code>npx</code> may also contact the package registry.
      </p>
    </section>

    <section>
      <h2>How long we keep it</h2>
      <p>
        Website analytics is kept according to the retention configured in our PostHog project. Hosting logs are kept as long as the host needs them for delivery and security.
      </p>
    </section>

    <section>
      <h2>Your choices</h2>
      <p>
        You can change your analytics preference at any time below. You can also ask about the analytics we hold for your browser by emailing <a href="mailto:contact@pdd-kit.dev">contact@pdd-kit.dev</a>. Nothing on this site requires you to sign in or subscribe.
      </p>
      <AnalyticsConsentSettings />
    </section>

    <section>
      <h2>Changes to this policy</h2>
      <p>
        This policy is an early-access draft and will be finalized before general availability. When it changes materially we will update the date at the top of this page.
      </p>
    </section>
  </LegalArticle>
</template>
