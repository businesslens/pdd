import { fetchBlueprintIndex, resolveBlueprintRepository } from '../core/blueprint-release.js'
import { UsageError } from '../core/usage-error.js'

export interface ListDependencies {
  fetch: typeof globalThis.fetch
  env: NodeJS.ProcessEnv
}

/** Print every published Blueprint by the name `blueprint pull` takes. */
export async function runList(dependencies: Partial<ListDependencies> = {}): Promise<number> {
  let repository: string
  try {
    repository = resolveBlueprintRepository(dependencies.env ?? process.env)
  } catch (error) {
    console.error((error as Error).message)
    return error instanceof UsageError ? 2 : 1
  }

  let blueprints
  try {
    blueprints = (await fetchBlueprintIndex(dependencies.fetch ?? globalThis.fetch, repository)).blueprints
  } catch (error) {
    console.error((error as Error).message)
    return 1
  }

  if (!blueprints.length) {
    console.log('No Blueprints are published yet.')
    return 0
  }

  const sorted = [...blueprints].sort((left, right) => left.slug.localeCompare(right.slug))
  const width = Math.max(...sorted.map(entry => entry.slug.length))
  for (const entry of sorted) console.log(`${entry.slug.padEnd(width)}  ${entry.title}`)
  console.log('\nPull one with: businesslens blueprint pull <name>')
  return 0
}
