/** One spelling per authored location: `src/` and `./src` both read as `src`. */
export const normalizeCoveragePath = (path: string) => path.replace(/^\.\//, '').replace(/\/$/, '')
