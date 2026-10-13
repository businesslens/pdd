<script setup lang="ts">
import LegalArticle from '~/components/landing/LegalArticle.vue'

useSiteSeo({
  title: 'Privacy Policy · pdd-kit',
  description: 'What this site and the pdd-kit CLI collect, and what your browser keeps.'
})
</script>

<template>
  <LegalArticle
    title="Privacy Policy"
    updated="October 13, 2026"
  >
    <section>
      <h2>The short version</h2>
      <p>
        This site is a set of static pages: there are no accounts, no sign-in, no mailing list and no analytics. Nothing tracks you, so there is nothing to consent to. Pulling a Blueprint downloads files from GitHub, not from this site. No data is sold.
      </p>
    </section>

    <section>
      <h2>What is collected</h2>
      <ul>
        <li><strong>Hosting logs</strong> — Cloudflare serves these pages and keeps the request logs it needs to deliver them and to protect against abuse, under its own privacy policy.</li>
        <li><strong>GitHub</strong> — the star count in the header is fetched by your browser from GitHub, and Blueprints are downloaded from GitHub Releases. GitHub handles those requests under its own privacy statement.</li>
      </ul>
      <p>
        Model authoring, validation, export, and opening a local report happen in your repository. Listing and pulling Blueprints download files from GitHub Releases, while contributing uses your authenticated GitHub CLI to open a public pull request. Running the package through <code>npx</code> may also contact the package registry.
      </p>
    </section>

    <section>
      <h2>What your browser keeps</h2>
      <p>
        This site sets no cookies. A Blueprint report remembers how you left it, in your browser only:
      </p>
      <ul>
        <li><strong>Local storage</strong> keeps display preferences under keys starting <code>pdd-kit:</code>: how many columns each collection's rows use, whether term tooltips are shown, and whether the resource panel is expanded.</li>
        <li><strong>Session storage</strong> keeps your reading position and which sections are expanded, under keys starting <code>pdd-kit:</code>, until you close the tab.</li>
        <li><strong>Local storage</strong> also keeps a copy of the documentation's search index, under keys starting <code>content_</code>, so documentation search opens without downloading it again.</li>
      </ul>
      <p>
        Nothing is sent anywhere, and none of it identifies you. Clearing your browser's site data resets it.
      </p>
    </section>

    <section>
      <h2>How long it is kept</h2>
      <p>
        Hosting logs are kept as long as Cloudflare needs them for delivery and security. Nothing else is kept.
      </p>
    </section>

    <section>
      <h2>Questions</h2>
      <p>
        Email <a href="mailto:itai.gendler@gmail.com">itai.gendler@gmail.com</a>.
      </p>
    </section>

    <section>
      <h2>Changes to this policy</h2>
      <p>
        When this policy changes, the date at the top of this page changes with it.
      </p>
    </section>
  </LegalArticle>
</template>
