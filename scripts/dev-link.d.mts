export interface DevelopmentLinkEnvironment extends NodeJS.ProcessEnv {
  BUSINESSLENS_DEV_BIN_DIR?: string
}

export function developmentBinDirectory(env?: DevelopmentLinkEnvironment): string

export function activateDevelopmentLink(
  root: string,
  env?: DevelopmentLinkEnvironment
): { link: string, launcher: string }

export function removeDevelopmentLink(
  root: string,
  env?: DevelopmentLinkEnvironment
): { link: string, removed: boolean }
