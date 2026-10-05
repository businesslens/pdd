import { refreshLatestVersion } from './core/cli-update.js'

// Run detached by the CLI so no command waits on the registry.
await refreshLatestVersion()
