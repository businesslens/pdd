import type { Page } from '@playwright/test'
import type { BlueprintCard } from '../../shared/blueprints'

/**
 * Deterministic catalogs for the index states the generated catalog cannot show.
 *
 * The real catalog is the fifteen Blueprints in the repository, so it never
 * holds one Blueprint, or none, or a Blueprint without a cover. These cards are
 * answered to the browser instead — see `openCatalogWith` — and never touch the
 * generated files.
 */
const SHELF: Array<Pick<BlueprintCard, 'slug' | 'title' | 'summary' | 'category' | 'tags'>> = [
  { slug: 'shelf-task-board', title: 'Task Board', summary: 'Capture work, assign an owner, and close it on a shared board.', category: 'productivity', tags: ['tasks', 'kanban'] },
  { slug: 'shelf-habit-log', title: 'Habit Log', summary: 'Track a daily practice and see the streak it builds.', category: 'productivity', tags: ['habits'] },
  { slug: 'shelf-team-wiki', title: 'Team Wiki', summary: 'Write down how the team works and keep it findable.', category: 'collaboration', tags: ['docs', 'knowledge'] }
]

/** Real generated logos, so a fixture card's artwork loads like a real one. */
const LOGOS = ['kanban-board', 'habit-tracker', 'team-wiki']

function catalogCard(entry: (typeof SHELF)[number], index: number): BlueprintCard {
  return {
    ...entry,
    logo: `/_blueprints/${LOGOS[index]}.logo.svg`,
    cover: null,
    stats: { entities: 3 + index, capabilities: 4 + index, journeys: 2 + index, scenarios: 10 + index, rules: 3 + index },
    publishedAt: '2026-10-01T00:00:00.000Z'
  }
}

/** The first `count` cards of a three-card catalog spanning two categories. */
export function catalogOf(count: number): BlueprintCard[] {
  if (count > SHELF.length) throw new Error(`The test shelf holds ${SHELF.length} cards, not ${count}.`)
  return SHELF.slice(0, count).map(catalogCard)
}

/**
 * Open `/blueprints` through client navigation with the listing answered here.
 *
 * The generated page carries its listing in its prerendered payload. With that
 * payload blocked, client navigation falls back to fetching the prerendered
 * `/_data/blueprints.json`, so that request is the one place a test can answer
 * the listing — with cards, an empty shelf, or a failure status. Client
 * navigation, because a full load renders the listing inlined in the HTML.
 */
export async function openCatalogWith(
  page: Page,
  listing: { blueprints: BlueprintCard[] } | { status: number }
) {
  await page.route('**/blueprints/_payload.json*', route => route.abort())
  await page.route('**/_data/blueprints.json', route => 'status' in listing
    ? route.fulfill({ status: listing.status, contentType: 'text/html', body: 'Not Found' })
    : route.fulfill({ json: listing }))
  await page.goto('/')
  await page.waitForLoadState('networkidle')
  if ((page.viewportSize()?.width ?? 0) < 1024) await page.getByRole('button', { name: 'Open menu' }).click()
  await page.locator('a[href="/blueprints"]:visible').first().click()
  await page.waitForURL(/\/blueprints$/)
  await page.locator('[data-catalog-state="listing"], [data-catalog-state="empty"], [data-catalog-unavailable]').first().waitFor()
}
