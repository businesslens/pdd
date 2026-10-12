/** One Blueprint with its whole report, generated once per build. */
export default defineEventHandler(async (event) => {
  // Read from the path: the router names this file's parameter after the
  // whole `[slug].json` segment, so the slug is the last segment less `.json`.
  const slug = decodeURIComponent(event.path.split('?')[0]!.split('/').pop() ?? '').replace(/\.json$/, '')
  const blueprint = await getBlueprintRecord(slug)
  if (!blueprint) throw createError({ statusCode: 404, statusMessage: 'Blueprint not found' })
  return { blueprint }
})
