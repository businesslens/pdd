import { buildBlueprintFeed } from '../../utils/blueprintRss'

/** The Blueprint feed, generated with the site from the repository's blueprints/. */
export default defineEventHandler(async (event) => {
  const xml = buildBlueprintFeed(await listBlueprintFeed())
  setHeader(event, 'content-type', 'application/rss+xml; charset=utf-8')
  return xml
})
