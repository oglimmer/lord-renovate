export interface PackageRule {
  groupName?: string
  matchManagers?: string[]
  matchDatasources?: string[]
  matchFileNames?: string[]
  matchUpdateTypes?: string[]
  matchDepTypes?: string[]
  matchCurrentVersion?: string
  automerge?: boolean
  automergeType?: 'branch' | 'pr'
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any // Allow other properties
}

export interface RenovateConfig {
  $schema?: string
  extends?: string[]
  enabled?: boolean
  dependencyDashboard?: boolean
  pinDigests?: boolean
  timezone?: string
  gitAuthor?: string
  semanticCommits?: 'auto' | 'enabled' | 'disabled'
  prHourlyLimit?: number
  prConcurrentLimit?: number
  rebaseWhen?: 'auto' | 'never' | 'conflicted' | 'behind-base-branch'
  schedule?: string[]
  automerge?: boolean
  automergeType?: 'branch' | 'pr'
  rangeStrategy?: 'auto' | 'pin' | 'bump' | 'replace' | 'widen' | 'update-lockfile'
  major?: { automerge?: boolean }
  minor?: { automerge?: boolean }
  patch?: { automerge?: boolean }
  lockFileMaintenance?: {
    enabled?: boolean
    automerge?: boolean
    schedule?: string[]
  }
  labels?: string[]
  assignees?: string[]
  reviewers?: string[]
  packageRules?: PackageRule[]
  maven?: { managerFilePatterns?: string[] }
  npm?: { managerFilePatterns?: string[] }
  automergeSchedule?: string[]
  baseBranchPatterns?: string[]
  branchName?: string
  branchTopic?: string
  group?: Record<string, any>
  vulnerabilityAlerts?: 'none' | 'all' | 'critical' | 'high' | 'medium' | 'low' | 'info'
  ignoreDeps?: string[]
  ignorePaths?: string[]
  allowedVersions?: Record<string, string>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any // Allow other properties
}
