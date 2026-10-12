/** The catalog index, generated once per build. */
export default defineEventHandler(async () => ({ blueprints: await listBlueprintCards() }))
