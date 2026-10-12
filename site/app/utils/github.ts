const compactCountFormat = new Intl.NumberFormat('en', {
  notation: 'compact',
  maximumFractionDigits: 1
})

export function formatStarCount(stars: number): string | null {
  if (!Number.isFinite(stars) || stars < 0) return null
  return compactCountFormat.format(stars).toLowerCase()
}

/** The repository the header links and counts stars for. */
export const GITHUB_REPOSITORY = 'itai-gendler/pdd-kit'

/** The repository's star count from GitHub's public API, or null when it does not answer. */
export async function fetchGithubStars(fetchImpl: typeof fetch = fetch): Promise<number | null> {
  try {
    const response = await fetchImpl(`https://api.github.com/repos/${GITHUB_REPOSITORY}`, {
      headers: { accept: 'application/vnd.github+json' },
      signal: AbortSignal.timeout(3000)
    })
    if (!response.ok) return null
    const repo: unknown = await response.json()
    const count = repo && typeof repo === 'object' && 'stargazers_count' in repo ? repo.stargazers_count : null
    return typeof count === 'number' && Number.isInteger(count) && count >= 0 ? count : null
  } catch {
    return null
  }
}
