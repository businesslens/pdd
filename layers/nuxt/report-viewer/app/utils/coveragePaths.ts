export const normalizeCoveragePath = (path: string) => path === './' ? '.' : path.replace(/^\.\//, '').replace(/\/$/, '')
