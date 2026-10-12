<script setup lang="ts">
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
    updated="October 13, 2026"
  >
    <section>
      <h2>The short version</h2>
      <p>
        This site is a set of static pages: there are no accounts, no sign-in, no mailing list and no analytics. Nothing tracks you, so there is nothing to consent to. Pulling a Blueprint downloads files from GitHub, not from this site. We do not sell your data.
      </p>
    </section>

    <section>
      <h2>What we collect</h2>
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
        A Blueprint report remembers how you left it: its column layout, whether term tooltips show, and which panels are open. Those choices are kept in your browser, as a few small cookies and session storage, so the report looks the same when you come back. They identify no one and we do not read them; clearing your browser's site data resets them.
      </p>
    </section>

    <section>
      <h2>How long we keep it</h2>
      <p>
        Hosting logs are kept as long as Cloudflare needs them for delivery and security. Nothing else is kept.
      </p>
    </section>

    <section>
      <h2>Questions</h2>
      <p>
        Email <a href="mailto:itai.gendler@gmail.com">itai.gendler@gmail.com</a>. Nothing on this site requires you to sign in or subscribe.
      </p>
    </section>

    <section>
      <h2>Changes to this policy</h2>
      <p>
        This policy is an early-access draft and will be finalized before general availability. When it changes materially we will update the date at the top of this page.
      </p>
    </section>
  </LegalArticle>
</template>
