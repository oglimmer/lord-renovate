<script setup lang="ts">
import { ref, watch } from 'vue'
import type { RenovateConfig, PackageRule } from '@/types'

const props = defineProps<{
  config: RenovateConfig
}>()

const editableConfig = ref<RenovateConfig>(JSON.parse(JSON.stringify(props.config)))
const viewMode = ref<'visual' | 'json'>('visual')
const jsonText = ref('')

const updateJsonText = () => {
  jsonText.value = JSON.stringify(editableConfig.value, null, 2)
}

watch(
  () => props.config,
  (newConfig) => {
    editableConfig.value = JSON.parse(JSON.stringify(newConfig))

    // Normalize package rules to ensure all fields exist
    if (editableConfig.value.packageRules) {
      editableConfig.value.packageRules = editableConfig.value.packageRules.map((rule: PackageRule) => {
        return {
          groupName: rule.groupName || '',
          matchManagers: rule.matchManagers || [],
          matchDatasources: rule.matchDatasources || [],
          matchFileNames: rule.matchFileNames || [],
          matchUpdateTypes: rule.matchUpdateTypes || [],
          matchDepTypes: rule.matchDepTypes || [],
          matchCurrentVersion: rule.matchCurrentVersion || '',
          automerge: rule.automerge,
          automergeType: rule.automergeType || 'branch',
          ...rule // Preserve any other fields
        }
      })
    }

    updateJsonText()
  },
  { immediate: true }
)

const switchToJsonMode = () => {
  updateJsonText()
  viewMode.value = 'json'
}

const switchToVisualMode = () => {
  try {
    editableConfig.value = JSON.parse(jsonText.value)
    viewMode.value = 'visual'
  } catch {
    alert('Invalid JSON. Please fix the syntax errors.')
  }
}

// Clean up empty values before export
const cleanConfig = (config: RenovateConfig) => {
  const cleaned = JSON.parse(JSON.stringify(config))

  // Clean package rules
  if (cleaned.packageRules) {
    cleaned.packageRules = cleaned.packageRules.map((rule: PackageRule) => {
      const cleanedRule: PackageRule = {}

      // Only include non-empty fields
      if (rule.groupName) cleanedRule.groupName = rule.groupName

      // Clean arrays - filter out empty strings
      const cleanArray = (arr: (string | undefined | null)[]): string[] => arr.filter((v): v is string => v !== '' && v !== null && v !== undefined)

      const managers = cleanArray(rule.matchManagers || [])
      const datasources = cleanArray(rule.matchDatasources || [])
      const fileNames = cleanArray(rule.matchFileNames || [])
      const updateTypes = cleanArray(rule.matchUpdateTypes || [])
      const depTypes = cleanArray(rule.matchDepTypes || [])

      if (managers.length > 0) cleanedRule.matchManagers = managers
      if (datasources.length > 0) cleanedRule.matchDatasources = datasources
      if (fileNames.length > 0) cleanedRule.matchFileNames = fileNames
      if (updateTypes.length > 0) cleanedRule.matchUpdateTypes = updateTypes
      if (depTypes.length > 0) cleanedRule.matchDepTypes = depTypes
      if (rule.matchCurrentVersion) cleanedRule.matchCurrentVersion = rule.matchCurrentVersion

      // Include automerge if explicitly set (true or false)
      if (rule.automerge !== undefined) cleanedRule.automerge = rule.automerge

      // Include automergeType if automerge is enabled (regardless of value)
      if (rule.automerge === true && rule.automergeType) {
        cleanedRule.automergeType = rule.automergeType
      }

      // Preserve any other fields
      Object.keys(rule).forEach(key => {
        if (!['groupName', 'matchManagers', 'matchDatasources', 'matchFileNames',
              'matchUpdateTypes', 'matchDepTypes', 'matchCurrentVersion',
              'automerge', 'automergeType'].includes(key)) {
          cleanedRule[key] = rule[key]
        }
      })

      return cleanedRule
    })
  }

  return cleaned
}

const copyToClipboard = () => {
  const cleaned = cleanConfig(editableConfig.value)
  const text = JSON.stringify(cleaned, null, 2)
  navigator.clipboard.writeText(text).then(() => {
    alert('Configuration copied to clipboard!')
  })
}

const downloadConfig = () => {
  const cleaned = cleanConfig(editableConfig.value)
  const text = JSON.stringify(cleaned, null, 2)
  const blob = new Blob([text], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'renovate.json'
  a.click()
  URL.revokeObjectURL(url)
}

// Helper functions for arrays
const addToArray = (key: string) => {
  // Handle nested paths like 'lockFileMaintenance.schedule'
  if (key.includes('.')) {
    const parts = key.split('.')
    const parent = parts[0] as keyof RenovateConfig
    const child = parts[1]
    if (!parent || !child) return

    if (!editableConfig.value[parent]) {
      editableConfig.value[parent] = {}
    }
    const parentVal = editableConfig.value[parent]
    if (!parentVal[child]) {
      parentVal[child] = []
    }
    parentVal[child].push('')
  } else {
    const prop = editableConfig.value[key as keyof RenovateConfig]
    if (prop === undefined) {
      editableConfig.value[key as keyof RenovateConfig] = []
    }
    const arrayProp = editableConfig.value[key as keyof RenovateConfig]
    if (Array.isArray(arrayProp)) {
      arrayProp.push('')
    }
  }
}

const removeFromArray = (key: string, index: number) => {
  // Handle nested paths like 'lockFileMaintenance.schedule'
  if (key.includes('.')) {
    const parts = key.split('.')
    const parent = parts[0] as keyof RenovateConfig
    const child = parts[1]
    if (!parent || !child) return

    const parentVal = editableConfig.value[parent]
    if (parentVal && Array.isArray(parentVal[child])) {
      parentVal[child].splice(index, 1)
    }
  } else {
    const prop = editableConfig.value[key as keyof RenovateConfig]
    if (Array.isArray(prop)) {
      prop.splice(index, 1)
    }
  }
}

// Package Rules helpers
const addPackageRule = () => {
  if (!editableConfig.value.packageRules) {
    editableConfig.value.packageRules = []
  }
  // Create a new rule with all common fields initialized
  editableConfig.value.packageRules.push({
    groupName: '',
    matchManagers: [],
    matchDatasources: [],
    matchFileNames: [],
    matchUpdateTypes: [],
    matchDepTypes: [],
    matchCurrentVersion: '',
    automergeType: 'branch',
  })
}

const removePackageRule = (index: number) => {
  editableConfig.value.packageRules?.splice(index, 1)
}

const addToPackageRuleArray = (ruleIndex: number, key: keyof PackageRule) => {
  if (editableConfig.value.packageRules && editableConfig.value.packageRules[ruleIndex]) {
    const rule = editableConfig.value.packageRules[ruleIndex]
    if (!rule[key]) {
      rule[key] = []
    }
    const arrayProp = rule[key]
    if (Array.isArray(arrayProp)) {
      arrayProp.push('')
    }
  }
}

const removeFromPackageRuleArray = (ruleIndex: number, key: keyof PackageRule, itemIndex: number) => {
  if (editableConfig.value.packageRules && editableConfig.value.packageRules[ruleIndex]) {
    const rule = editableConfig.value.packageRules[ruleIndex]
    const arrayProp = rule[key]
    if (Array.isArray(arrayProp)) {
      arrayProp.splice(itemIndex, 1)
    }
  }
}

const newManager = ref('')

const addManagerConfiguration = () => {
  if (newManager.value && !editableConfig.value[newManager.value]) {
    editableConfig.value[newManager.value] = {
      managerFilePatterns: []
    }
    newManager.value = ''
  }
}

// Range strategy options
const rangeStrategyOptions = ['auto', 'pin', 'bump', 'replace', 'widen', 'update-lockfile']
const automergeTypeOptions = ['branch', 'pr']
const rebaseWhenOptions = ['auto', 'never', 'conflicted', 'behind-base-branch']

// Package manager and datasource options
const managerOptions = [
  'npm', 'maven', 'gradle', 'pip', 'poetry', 'pipenv', 'docker', 'dockerfile',
  'bundler', 'cargo', 'composer', 'gomod', 'helm', 'terraform', 'nvm',
  'github-actions', 'pre-commit', 'kubernetes'
]

const datasourceOptions = [
  'npm', 'maven', 'pypi', 'docker', 'github-tags', 'github-releases',
  'rubygems', 'packagist', 'hex', 'crate', 'go', 'helm', 'terraform-module'
]

const depTypeOptions = [
  'dependencies', 'devDependencies', 'peerDependencies', 'optionalDependencies',
  'engines', 'volta', 'packageManager'
]

// Common Renovate presets
const commonPresets = [
  { value: 'config:recommended', label: 'config:recommended', description: 'Recommended base configuration for most projects' },
  { value: 'config:base', label: 'config:base', description: 'Conservative base config (less opinionated than recommended)' },
  { value: ':dependencyDashboard', label: ':dependencyDashboard', description: 'Create a dashboard issue to track all updates' },
  { value: ':enableVulnerabilityAlerts', label: ':enableVulnerabilityAlerts', description: 'Enable security vulnerability alerts' },
  { value: ':semanticCommits', label: ':semanticCommits', description: 'Use semantic commit messages (e.g., chore(deps):)' },
  { value: ':semanticCommitTypeAll(chore)', label: ':semanticCommitTypeAll(chore)', description: 'Use "chore" for all dependency updates' },
  { value: ':automergeBranch', label: ':automergeBranch', description: 'Automerge by pushing directly to branch' },
  { value: ':automergeDigest', label: ':automergeDigest', description: 'Automerge Docker digest updates' },
  { value: ':automergeMinor', label: ':automergeMinor', description: 'Automerge minor and patch updates' },
  { value: ':automergePatch', label: ':automergePatch', description: 'Automerge patch updates only' },
  { value: ':preserveSemverRanges', label: ':preserveSemverRanges', description: 'Preserve existing semver ranges (e.g., ^1.0.0 stays ^)' },
  { value: ':pinAllExceptPeerDependencies', label: ':pinAllExceptPeerDependencies', description: 'Pin all dependencies except peer dependencies' },
  { value: ':ignoreModulesAndTests', label: ':ignoreModulesAndTests', description: 'Ignore node_modules and test directories' },
  { value: ':label(renovate)', label: ':label(renovate)', description: 'Add "renovate" label to all PRs' },
  { value: ':prHourlyLimitNone', label: ':prHourlyLimitNone', description: 'No limit on PRs per hour' },
  { value: ':prConcurrentLimitNone', label: ':prConcurrentLimitNone', description: 'No limit on concurrent PRs' },
  { value: 'group:allNonMajor', label: 'group:allNonMajor', description: 'Group all minor and patch updates together' },
  { value: 'group:recommended', label: 'group:recommended', description: 'Recommended grouping presets' },
  { value: 'schedule:weekly', label: 'schedule:weekly', description: 'Run updates weekly' },
  { value: 'schedule:monthly', label: 'schedule:monthly', description: 'Run updates monthly' },
  { value: 'schedule:earlyMondays', label: 'schedule:earlyMondays', description: 'Run updates early Monday mornings' },
  { value: 'schedule:weekends', label: 'schedule:weekends', description: 'Run updates on weekends' }
]
</script>

<template>
  <div class="renovate-editor">
    <div class="editor-header">
      <div class="mode-switch">
        <button
          :class="{ active: viewMode === 'visual' }"
          @click="viewMode = 'visual'"
          class="mode-button"
        >
          Visual Editor
        </button>
        <button :class="{ active: viewMode === 'json' }" @click="switchToJsonMode" class="mode-button">
          JSON Editor
        </button>
      </div>
      <div class="actions">
        <button @click="copyToClipboard" class="action-button">Copy to Clipboard</button>
        <button @click="downloadConfig" class="action-button primary">Download</button>
      </div>
    </div>

    <div v-if="viewMode === 'visual'" class="visual-editor">
      <!-- General Settings -->
      <section class="section">
        <h3>General Settings</h3>
        <p class="section-description">Enable or disable Renovate features for your repository.</p>
        <div class="field-group">
          <div v-if="'enabled' in editableConfig" class="field-with-help">
            <div class="field checkbox-field">
              <label>
                <input v-model="editableConfig.enabled" type="checkbox" />
                <span>Enabled</span>
              </label>
            </div>
            <p class="help-text">Enable or disable Renovate for this repository.</p>
          </div>
          <div v-if="'dependencyDashboard' in editableConfig" class="field-with-help">
            <div class="field checkbox-field">
              <label>
                <input v-model="editableConfig.dependencyDashboard" type="checkbox" />
                <span>Dependency Dashboard</span>
              </label>
            </div>
            <p class="help-text">Create a dashboard issue listing all pending updates.</p>
          </div>
          <div v-if="'pinDigests' in editableConfig" class="field-with-help">
            <div class="field checkbox-field">
              <label>
                <input v-model="editableConfig.pinDigests" type="checkbox" />
                <span>Pin Digests</span>
              </label>
            </div>
            <p class="help-text">Pin Docker image digests for better security and reproducibility.</p>
          </div>
          <div v-if="'vulnerabilityAlerts' in editableConfig" class="field-with-help">
            <div class="field">
              <label>Vulnerability Alerts</label>
              <select v-model="editableConfig.vulnerabilityAlerts" class="select-input">
                <option value="none">None</option>
                <option value="all">All</option>
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
                <option value="info">Info</option>
              </select>
            </div>
            <p class="help-text">Configure how Renovate handles security vulnerability alerts.</p>
          </div>
        </div>
      </section>

      <!-- Configuration -->
      <section class="section">
        <h3>Configuration</h3>
        <p class="section-description">Configure basic Renovate behavior and metadata.</p>
        <div class="field-group">
          <div v-if="'$schema' in editableConfig" class="field-with-help">
            <div class="field">
              <label>Schema</label>
              <input v-model="editableConfig.$schema" type="text" class="text-input" placeholder="https://docs.renovatebot.com/renovate-schema.json" />
            </div>
            <p class="help-text">JSON schema URL for validation and IDE support.</p>
          </div>
          <div v-if="'timezone' in editableConfig" class="field-with-help">
            <div class="field">
              <label>Timezone</label>
              <input v-model="editableConfig.timezone" type="text" class="text-input" placeholder="Europe/Berlin" />
            </div>
            <p class="help-text">Timezone for scheduling updates (e.g., "America/New_York", "UTC").</p>
          </div>
          <div v-if="'gitAuthor' in editableConfig" class="field-with-help">
            <div class="field">
              <label>Git Author</label>
              <input v-model="editableConfig.gitAuthor" type="text" class="text-input" placeholder="Renovate Bot <bot@renovateapp.com>" />
            </div>
            <p class="help-text">Git author name and email for commits.</p>
          </div>
          <div v-if="'semanticCommits' in editableConfig" class="field-with-help">
            <div class="field">
              <label>Semantic Commits</label>
              <select v-model="editableConfig.semanticCommits" class="select-input">
                <option value="auto">Auto</option>
                <option value="enabled">Enabled</option>
                <option value="disabled">Disabled</option>
              </select>
            </div>
            <p class="help-text">
              Use semantic commit messages (e.g., "chore(deps): update..."):<br>
              • <strong>auto</strong> - Detect from existing commits in the repo<br>
              • <strong>enabled</strong> - Always use semantic commits<br>
              • <strong>disabled</strong> - Never use semantic commits
            </p>
          </div>
        </div>
      </section>

      <!-- Scheduling & Limits -->
      <section class="section">
        <h3>Scheduling & Limits</h3>
        <p class="section-description">Control when and how many pull requests Renovate creates.</p>
        <div class="field-group">
          <div v-if="'prHourlyLimit' in editableConfig" class="field-with-help">
            <div class="field">
              <label>PR Hourly Limit</label>
              <input v-model.number="editableConfig.prHourlyLimit" type="number" class="text-input" min="0" />
            </div>
            <p class="help-text">Maximum number of PRs to create per hour (0 = unlimited).</p>
          </div>
          <div v-if="'prConcurrentLimit' in editableConfig" class="field-with-help">
            <div class="field">
              <label>PR Concurrent Limit</label>
              <input v-model.number="editableConfig.prConcurrentLimit" type="number" class="text-input" min="0" />
            </div>
            <p class="help-text">Maximum number of open PRs at any time (0 = unlimited).</p>
          </div>
          <div v-if="'rebaseWhen' in editableConfig" class="field-with-help">
            <div class="field">
              <label>Rebase When</label>
              <select v-model="editableConfig.rebaseWhen" class="select-input">
                <option v-for="option in rebaseWhenOptions" :key="option" :value="option">{{ option }}</option>
              </select>
            </div>
            <p class="help-text">
              When to rebase PRs:<br>
              • <strong>auto</strong> - Rebase when base branch is updated or PR is conflicted<br>
              • <strong>never</strong> - Never automatically rebase<br>
              • <strong>conflicted</strong> - Only rebase when the PR has conflicts<br>
              • <strong>behind-base-branch</strong> - Rebase whenever base branch has new commits
            </p>
          </div>
        </div>

        <div v-if="'schedule' in editableConfig" class="array-field">
          <div class="array-header">
            <label>Schedule</label>
            <button @click="addToArray('schedule')" class="add-button">+ Add</button>
          </div>
          <p class="help-text">When to create PRs (e.g., "before 5am on monday", "after 10pm every weekday").</p>
          <div v-if="editableConfig.schedule?.length" class="array-items">
            <div v-for="(item, index) in editableConfig.schedule" :key="index" class="array-item">
              <input v-model="editableConfig.schedule[index]" type="text" class="text-input" placeholder="before 5am on monday" />
              <button @click="removeFromArray('schedule', index)" class="remove-button">Remove</button>
            </div>
          </div>
          <div v-else class="empty-message">No schedule set. Click "Add" to add one.</div>
        </div>

                <div v-if="'automergeSchedule' in editableConfig" class="array-field">

                  <div class="array-header">

                    <label>Automerge Schedule</label>

                    <button @click="addToArray('automergeSchedule')" class="add-button">+ Add</button>

                  </div>

                  <p class="help-text">Limit automerge to these times of day or week.</p>

                  <div v-if="editableConfig.automergeSchedule?.length" class="array-items">

                    <div v-for="(item, index) in editableConfig.automergeSchedule" :key="index" class="array-item">

                      <input v-model="editableConfig.automergeSchedule[index]" type="text" class="text-input" placeholder="at any time" />

                      <button @click="removeFromArray('automergeSchedule', index)" class="remove-button">Remove</button>

                    </div>

                  </div>

                  <div v-else class="empty-message">No automerge schedule set. Click "Add" to add one.</div>

                </div>

              </section>

        

              <!-- Branching -->

              <section v-if="'baseBranchPatterns' in editableConfig || 'branchName' in editableConfig || 'branchTopic' in editableConfig" class="section">

                <h3>Branching</h3>

                <p class="section-description">Configure branch naming and patterns.</p>

                <div class="field-group">

                  <div v-if="'branchName' in editableConfig" class="field-with-help">

                    <div class="field">

                      <label>Branch Name Template</label>

                      <input v-model="editableConfig.branchName" type="text" class="text-input" placeholder="{{{branchPrefix}}}{{{additionalBranchPrefix}}}{{{branchTopic}}}" />

                    </div>

                    <p class="help-text">Template to use for new branch names.</p>

                  </div>

                  <div v-if="'branchTopic' in editableConfig" class="field-with-help">

                    <div class="field">

                      <label>Branch Topic Template</label>

                      <input v-model="editableConfig.branchTopic" type="text" class="text-input" placeholder="{{{depNameSanitized}}}-{{{newMajor}}}" />

                    </div>

                    <p class="help-text">Template to use for the branch topic within the branch name.</p>

                  </div>

                </div>

        

                <div v-if="'baseBranchPatterns' in editableConfig" class="array-field">

                  <div class="array-header">

                    <label>Base Branch Patterns</label>

                    <button @click="addToArray('baseBranchPatterns')" class="add-button">+ Add</button>

                  </div>

                  <p class="help-text">List of custom base branches defined as exact strings and/or regex expressions.</p>

                  <div v-if="editableConfig.baseBranchPatterns?.length" class="array-items">

                    <div v-for="(item, index) in editableConfig.baseBranchPatterns" :key="index" class="array-item">

                      <input v-model="editableConfig.baseBranchPatterns[index]" type="text" class="text-input" placeholder="^master$" />

                      <button @click="removeFromArray('baseBranchPatterns', index)" class="remove-button">Remove</button>

                    </div>

                  </div>

                  <div v-else class="empty-message">No base branch patterns set. Click "Add" to add one.</div>

                </div>

              </section>

      <!-- Merge Strategy -->
      <section class="section">
        <h3>Merge Strategy</h3>
        <p class="section-description">Configure how Renovate merges pull requests.</p>
        <div class="field-group">
          <div v-if="'automerge' in editableConfig" class="field-with-help">
            <div class="field checkbox-field">
              <label>
                <input v-model="editableConfig.automerge" type="checkbox" />
                <span>Automerge</span>
              </label>
            </div>
            <p class="help-text">Automatically merge PRs after all checks pass.</p>
          </div>
          <div v-if="'automergeType' in editableConfig" class="field-with-help">
            <div class="field">
              <label>Automerge Type</label>
              <select v-model="editableConfig.automergeType" class="select-input">
                <option v-for="option in automergeTypeOptions" :key="option" :value="option">{{ option }}</option>
              </select>
            </div>
            <p class="help-text">
              How to automerge PRs:<br>
              • <strong>branch</strong> - Push directly to branch (no PR merge commit)<br>
              • <strong>pr</strong> - Use platform's merge button (creates merge commit)
            </p>
          </div>
          <div v-if="'rangeStrategy' in editableConfig" class="field-with-help">
            <div class="field">
              <label>Range Strategy</label>
              <select v-model="editableConfig.rangeStrategy" class="select-input">
                <option v-for="option in rangeStrategyOptions" :key="option" :value="option">{{ option }}</option>
              </select>
            </div>
            <p class="help-text">
              How to update version ranges:<br>
              • <strong>auto</strong> - Let Renovate decide the best strategy<br>
              • <strong>pin</strong> - Pin to exact version (e.g., ^1.2.3 → 1.2.4)<br>
              • <strong>bump</strong> - Increase range (e.g., ^1.2.3 → ^1.2.4)<br>
              • <strong>replace</strong> - Replace range (e.g., ^1.2.3 → ^2.0.0)<br>
              • <strong>widen</strong> - Widen range (e.g., ^1.2.3 → ^1.2.3 || ^2.0.0)<br>
              • <strong>update-lockfile</strong> - Only update lock file, not package.json
            </p>
          </div>
        </div>
      </section>

      <!-- Filtering -->
      <section v-if="'ignoreDeps' in editableConfig || 'ignorePaths' in editableConfig" class="section">
        <h3>Filtering</h3>
        <p class="section-description">Configure dependencies and paths to ignore.</p>

        <div v-if="'ignoreDeps' in editableConfig" class="array-field">
          <div class="array-header">
            <label>Ignore Dependencies</label>
            <button @click="addToArray('ignoreDeps')" class="add-button">+ Add</button>
          </div>
          <p class="help-text">List of dependencies to ignore (e.g., "eslint", "react").</p>
          <div v-if="editableConfig.ignoreDeps?.length" class="array-items">
            <div v-for="(item, index) in editableConfig.ignoreDeps" :key="index" class="array-item">
              <input v-model="editableConfig.ignoreDeps[index]" type="text" class="text-input" placeholder="dependency-name" />
              <button @click="removeFromArray('ignoreDeps', index)" class="remove-button">Remove</button>
            </div>
          </div>
          <div v-else class="empty-message">No ignored dependencies. Click "Add" to add one.</div>
        </div>

        <div v-if="'ignorePaths' in editableConfig" class="array-field">
          <div class="array-header">
            <label>Ignore Paths</label>
            <button @click="addToArray('ignorePaths')" class="add-button">+ Add</button>
          </div>
          <p class="help-text">List of file paths to ignore (e.g., "package.json", "**/test/**").</p>
          <div v-if="editableConfig.ignorePaths?.length" class="array-items">
            <div v-for="(item, index) in editableConfig.ignorePaths" :key="index" class="array-item">
              <input v-model="editableConfig.ignorePaths[index]" type="text" class="text-input" placeholder="path/to/ignore" />
              <button @click="removeFromArray('ignorePaths', index)" class="remove-button">Remove</button>
            </div>
          </div>
          <div v-else class="empty-message">No ignored paths. Click "Add" to add one.</div>
        </div>
      </section>

      <!-- Update Types (major, minor, patch) -->
      <section v-if="'major' in editableConfig || 'minor' in editableConfig || 'patch' in editableConfig" class="section">
        <h3>Update Types</h3>
        <p class="section-description">Configure automerge behavior for different update types (major, minor, patch).</p>

        <div v-if="editableConfig.major" class="subsection">
          <h4>Major Updates</h4>
          <p class="help-text">Major updates (e.g., 1.x → 2.x) may include breaking changes.</p>
          <div class="field-group">
            <div class="field checkbox-field">
              <label>
                <input v-model="editableConfig.major.automerge" type="checkbox" />
                <span>Automerge Major Updates</span>
              </label>
            </div>
          </div>
        </div>

        <div v-if="editableConfig.minor" class="subsection">
          <h4>Minor Updates</h4>
          <p class="help-text">Minor updates (e.g., 1.1.x → 1.2.x) add new features without breaking changes.</p>
          <div class="field-group">
            <div class="field checkbox-field">
              <label>
                <input v-model="editableConfig.minor.automerge" type="checkbox" />
                <span>Automerge Minor Updates</span>
              </label>
            </div>
          </div>
        </div>

        <div v-if="editableConfig.patch" class="subsection">
          <h4>Patch Updates</h4>
          <p class="help-text">Patch updates (e.g., 1.1.1 → 1.1.2) are bug fixes only.</p>
          <div class="field-group">
            <div class="field checkbox-field">
              <label>
                <input v-model="editableConfig.patch.automerge" type="checkbox" />
                <span>Automerge Patch Updates</span>
              </label>
            </div>
          </div>
        </div>
      </section>

      <!-- Lock File Maintenance -->
      <section v-if="editableConfig.lockFileMaintenance" class="section">
        <h3>Lock File Maintenance</h3>
        <p class="section-description">
          Update lock files to keep sub-dependencies current without changing dependency manifests.<br>
          Works for all package managers: npm (package-lock.json), Yarn (yarn.lock), pnpm (pnpm-lock.yaml),
          Bundler (Gemfile.lock), Composer (composer.lock), Cargo (Cargo.lock), Go modules (go.sum),
          Poetry (poetry.lock), Pipenv (Pipfile.lock), and more.
        </p>
        <div class="field-group">
          <div class="field-with-help">
            <div class="field checkbox-field">
              <label>
                <input v-model="editableConfig.lockFileMaintenance.enabled" type="checkbox" />
                <span>Enabled</span>
              </label>
            </div>
            <p class="help-text">Enable periodic lock file updates to get latest patches for transitive dependencies.</p>
          </div>
          <div class="field-with-help">
            <div class="field checkbox-field">
              <label>
                <input v-model="editableConfig.lockFileMaintenance.automerge" type="checkbox" />
                <span>Automerge</span>
              </label>
            </div>
            <p class="help-text">Automatically merge lock file maintenance PRs after checks pass.</p>
          </div>
        </div>

        <div v-if="editableConfig.lockFileMaintenance.schedule" class="array-field">
          <div class="array-header">
            <label>Schedule</label>
            <button @click="addToArray('lockFileMaintenance.schedule')" class="add-button">+ Add</button>
          </div>
          <div v-if="editableConfig.lockFileMaintenance.schedule?.length" class="array-items">
            <div v-for="(item, index) in editableConfig.lockFileMaintenance.schedule" :key="index" class="array-item">
              <input v-model="editableConfig.lockFileMaintenance.schedule[index]" type="text" class="text-input" placeholder="before 5am on monday" />
              <button @click="removeFromArray('lockFileMaintenance.schedule', index)" class="remove-button">Remove</button>
            </div>
          </div>
        </div>
      </section>

      <!-- Extends -->
      <section v-if="'extends' in editableConfig" class="section">
        <h3>Extends</h3>
        <p class="section-description">Inherit configuration from preset configs to simplify your setup.</p>
        <div class="array-field">
          <div class="array-header">
            <label>Configuration Presets</label>
            <button @click="addToArray('extends')" class="add-button">+ Add</button>
          </div>
          <p class="help-text">Select from common presets or use the built-in Renovate configurations.</p>
          <div v-if="editableConfig.extends?.length" class="array-items">
            <div v-for="(item, index) in editableConfig.extends" :key="index" class="array-item-with-help">
              <div class="array-item">
                <select v-model="editableConfig.extends[index]" class="select-input">
                  <option value="">Select preset...</option>
                  <option v-for="preset in commonPresets" :key="preset.value" :value="preset.value">
                    {{ preset.label }}
                  </option>
                </select>
                <button @click="removeFromArray('extends', index)" class="remove-button">Remove</button>
              </div>
              <p v-if="editableConfig.extends[index]" class="preset-description">
                {{ commonPresets.find(p => p.value === editableConfig.extends![index])?.description }}
              </p>
            </div>
          </div>
          <div v-else class="empty-message">No presets. Click "Add" to add one.</div>
        </div>
      </section>

      <!-- Labels, Assignees, Reviewers -->
      <section v-if="'labels' in editableConfig || 'assignees' in editableConfig || 'reviewers' in editableConfig" class="section">
        <h3>Pull Request Settings</h3>
        <p class="section-description">Configure labels, assignees, and reviewers for Renovate PRs.</p>

        <div v-if="'labels' in editableConfig" class="array-field">
          <div class="array-header">
            <label>Labels</label>
            <button @click="addToArray('labels')" class="add-button">+ Add</button>
          </div>
          <p class="help-text">GitHub labels to apply to Renovate PRs.</p>
          <div v-if="editableConfig.labels?.length" class="array-items">
            <div v-for="(item, index) in editableConfig.labels" :key="index" class="array-item">
              <input v-model="editableConfig.labels[index]" type="text" class="text-input" placeholder="dependencies" />
              <button @click="removeFromArray('labels', index)" class="remove-button">Remove</button>
            </div>
          </div>
          <div v-else class="empty-message">No labels. Click "Add" to add one.</div>
        </div>

        <div v-if="'assignees' in editableConfig" class="array-field">
          <div class="array-header">
            <label>Assignees</label>
            <button @click="addToArray('assignees')" class="add-button">+ Add</button>
          </div>
          <p class="help-text">GitHub usernames to assign to Renovate PRs.</p>
          <div v-if="editableConfig.assignees?.length" class="array-items">
            <div v-for="(item, index) in editableConfig.assignees" :key="index" class="array-item">
              <input v-model="editableConfig.assignees[index]" type="text" class="text-input" placeholder="username" />
              <button @click="removeFromArray('assignees', index)" class="remove-button">Remove</button>
            </div>
          </div>
          <div v-else class="empty-message">No assignees. Click "Add" to add one.</div>
        </div>

        <div v-if="'reviewers' in editableConfig" class="array-field">
          <div class="array-header">
            <label>Reviewers</label>
            <button @click="addToArray('reviewers')" class="add-button">+ Add</button>.
.
.
            <div v-if="editableConfig.reviewers?.length" class="array-items">
              <div v-for="(item, index) in editableConfig.reviewers" :key="index" class="array-item">
                <input v-model="editableConfig.reviewers[index]" type="text" class="text-input" placeholder="username" />
                <button @click="removeFromArray('reviewers', index)" class="remove-button">Remove</button>
              </div>
            </div>
            <div v-else class="empty-message">No reviewers. Click "Add" to add one.</div>
          </div>
        </div>
      </section>

      <!-- Package Rules -->
      <section v-if="'packageRules' in editableConfig" class="section">
        <h3>Package Rules</h3>
        <p class="section-description">
          Create rules to control how Renovate handles different types of updates.<br>
          Pick from common templates or create custom rules.
        </p>

        <div class="package-rules-list">
          <div v-for="(rule, ruleIndex) in editableConfig.packageRules" :key="ruleIndex" class="package-rule-item">
            <div class="rule-header">
              <h4>Rule {{ ruleIndex + 1 }}</h4>
              <button @click="removePackageRule(ruleIndex)" class="remove-button">Remove Rule</button>
            </div>

            <div class="rule-content">
              <div class="custom-rule-details">
                <h5 class="subsection-title">Customize Your Rule</h5>

                <div class="simple-rule-builder">
                  <div class="rule-question">
                    <label>What should this rule do?</label>
                    <div class="field-group">
                      <div class="field">
                        <label>Group Name (optional)</label>
                        <input v-model="rule.groupName" type="text" class="text-input" placeholder="e.g., npm dependencies" />
                        <p class="help-text">Combine multiple updates into one PR</p>
                      </div>
                      <div class="field">
                        <label>Automerge</label>
                        <select v-model="rule.automerge" class="select-input">
                          <option :value="undefined">Not set (inherit)</option>
                          <option :value="true">Enabled</option>
                          <option :value="false">Disabled</option>
                        </select>
                        <p class="help-text">Merge automatically without review</p>
                      </div>
                      <div class="field">
                        <label>Automerge Type</label>
                        <select v-model="rule.automergeType" class="select-input">
                          <option value="branch">branch - Push directly to branch</option>
                          <option value="pr">pr - Use platform's merge button</option>
                        </select>
                        <p class="help-text">How to merge when automerge is enabled</p>
                      </div>
                    </div>
                  </div>

                  <div class="rule-question">
                    <label>Which packages should it apply to?</label>
                    <p class="help-text">Select one or more conditions (leave all empty to match everything):</p>

                    <div class="array-field">
                      <div class="array-header">
                        <label>Package Managers</label>
                        <button @click="addToPackageRuleArray(ruleIndex, 'matchManagers')" class="add-button small">+ Add</button>
                      </div>
                      <div v-if="rule.matchManagers?.length" class="array-items">
                        <div v-for="(item, idx) in rule.matchManagers" :key="idx" class="array-item">
                          <select v-model="rule.matchManagers[idx]" class="select-input">
                            <option value="">Select manager...</option>
                            <option v-for="option in managerOptions" :key="option" :value="option">{{ option }}</option>
                          </select>
                          <button @click="removeFromPackageRuleArray(ruleIndex, 'matchManagers', idx)" class="remove-button small">Remove</button>
                        </div>
                      </div>
                    </div>

                    <div class="array-field">
                      <div class="array-header">
                        <label>Datasources</label>
                        <button @click="addToPackageRuleArray(ruleIndex, 'matchDatasources')" class="add-button small">+ Add</button>
                      </div>
                      <div v-if="rule.matchDatasources?.length" class="array-items">
                        <div v-for="(item, idx) in rule.matchDatasources" :key="idx" class="array-item">
                          <select v-model="rule.matchDatasources[idx]" class="select-input">
                            <option value="">Select datasource...</option>
                            <option v-for="option in datasourceOptions" :key="option" :value="option">{{ option }}</option>
                          </select>
                          <button @click="removeFromPackageRuleArray(ruleIndex, 'matchDatasources', idx)" class="remove-button small">Remove</button>
                        </div>
                      </div>
                    </div>

                    <div class="array-field">
                      <div class="array-header">
                        <label>Update Types</label>
                        <button @click="addToPackageRuleArray(ruleIndex, 'matchUpdateTypes')" class="add-button small">+ Add</button>
                      </div>
                      <div v-if="rule.matchUpdateTypes?.length" class="array-items">
                        <div v-for="(item, idx) in rule.matchUpdateTypes" :key="idx" class="array-item">
                          <select v-model="rule.matchUpdateTypes[idx]" class="select-input">
                            <option value="">Select type...</option>
                            <option value="major">major</option>
                            <option value="minor">minor</option>
                            <option value="patch">patch</option>
                          </select>
                          <button @click="removeFromPackageRuleArray(ruleIndex, 'matchUpdateTypes', idx)" class="remove-button small">Remove</button>
                        </div>
                      </div>
                    </div>

                    <div class="array-field">
                      <div class="array-header">
                        <label>File Paths</label>
                        <button @click="addToPackageRuleArray(ruleIndex, 'matchFileNames')" class="add-button small">+ Add</button>
                      </div>
                      <p class="help-text">Use ** for any subdirectory (e.g., frontend/**, backend/**)</p>
                      <div v-if="rule.matchFileNames?.length" class="array-items">
                        <div v-for="(item, idx) in rule.matchFileNames" :key="idx" class="array-item">
                          <input v-model="rule.matchFileNames[idx]" type="text" class="text-input" placeholder="e.g., frontend/**" />
                          <button @click="removeFromPackageRuleArray(ruleIndex, 'matchFileNames', idx)" class="remove-button small">Remove</button>
                        </div>
                      </div>
                    </div>

                    <div class="array-field">
                      <div class="array-header">
                        <label>Dependency Types</label>
                        <button @click="addToPackageRuleArray(ruleIndex, 'matchDepTypes')" class="add-button small">+ Add</button>
                      </div>
                      <div v-if="rule.matchDepTypes?.length" class="array-items">
                        <div v-for="(item, idx) in rule.matchDepTypes" :key="idx" class="array-item">
                          <select v-model="rule.matchDepTypes[idx]" class="select-input">
                            <option value="">Select type...</option>
                            <option v-for="option in depTypeOptions" :key="option" :value="option">{{ option }}</option>
                          </select>
                          <button @click="removeFromPackageRuleArray(ruleIndex, 'matchDepTypes', idx)" class="remove-button small">Remove</button>
                        </div>
                      </div>
                    </div>

                    <div class="field">
                      <label>Match Current Version (regex pattern)</label>
                      <input v-model="rule.matchCurrentVersion" type="text" class="text-input" placeholder="e.g., /^0\./ or !/^0/" />
                      <p class="help-text">Regex pattern to match current version. Use /^0\./ for versions starting with 0, or !/^0/ for versions not starting with 0</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <button @click="addPackageRule" class="add-button large">+ Add Package Rule</button>
      </section>

      <!-- Manager-Specific Configuration -->
      <section v-if="true" class="section">
        <h3>Manager-Specific Configuration</h3>
        <p class="section-description">Configure file patterns for specific package managers.</p>

        <div class="add-manager-field">
          <select v-model="newManager" class="select-input">
            <option value="">Select manager to add...</option>
            <option v-for="option in managerOptions" :key="option" :value="option">{{ option }}</option>
          </select>
          <button @click="addManagerConfiguration" class="add-button">Add</button>
        </div>

        <div v-for="manager in Object.keys(editableConfig).filter(k => managerOptions.includes(k))" :key="manager" class="subsection">
          <div class="subsection-header">
            <h4>{{ manager }} Configuration</h4>
            <button @click="delete editableConfig[manager]" class="remove-button small">Remove</button>
          </div>
          <div class="array-field">
            <div class="array-header">
              <label>Manager File Patterns</label>
              <button @click="addToArray(`${manager}.managerFilePatterns`)" class="add-button small">+ Add</button>
            </div>
            <p class="help-text">Regex patterns to match {{ manager }} files (e.g., "^package\.json$", "^frontend/.*/package\.json$")</p>
            <div v-if="editableConfig[manager] && editableConfig[manager].managerFilePatterns?.length" class="array-items">
              <div v-for="(item, index) in editableConfig[manager].managerFilePatterns" :key="index" class="array-item">
                <input v-model="editableConfig[manager].managerFilePatterns[index]" type="text" class="text-input" placeholder="^.*$" />
                <button @click="removeFromArray(`${manager}.managerFilePatterns`, index)" class="remove-button small">Remove</button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>

    <div v-else class="json-editor">
      <textarea v-model="jsonText" class="json-textarea" spellcheck="false"></textarea>
      <button @click="switchToVisualMode" class="apply-button">Apply Changes</button>
    </div>
  </div>
</template>

<style scoped>
.renovate-editor {
  margin-top: 2rem;
}

.editor-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid #e0e0e0;
  flex-wrap: wrap;
  gap: 1rem;
}

.mode-switch {
  display: flex;
  gap: 0.5rem;
  background-color: #f5f5f5;
  padding: 4px;
  border-radius: 6px;
}

.mode-button {
  padding: 0.6rem 1.2rem;
  background-color: transparent;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 600;
  font-size: 0.9rem;
  transition: all 0.2s;
  color: #555;
}

.mode-button.active {
  background-color: #42b983;
  color: white;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.mode-button:hover:not(.active) {
  background-color: #e8e8e8;
}

.actions {
  display: flex;
  gap: 0.75rem;
  align-items: center;
}

.action-button {
  padding: 0.6rem 1.2rem;
  background-color: #fff;
  border: 2px solid #42b983;
  color: #42b983;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 600;
  font-size: 0.9rem;
  transition: all 0.2s;
  white-space: nowrap;
}

.action-button.primary {
  background-color: #42b983;
  color: white;
}

.action-button:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.action-button:active {
  transform: translateY(0);
}

.visual-editor {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.section {
  background-color: #fafafa;
  padding: 2rem;
  border-radius: 8px;
  border: 1px solid #e0e0e0;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.section h3 {
  margin-bottom: 0.5rem;
  color: #2c3e50;
  font-size: 1.2rem;
  font-weight: 700;
}

.section-description {
  color: #7f8c8d;
  margin-bottom: 1.5rem;
  font-size: 0.9rem;
  line-height: 1.6;
}

.subsection {
  margin-bottom: 1.5rem;
  padding-bottom: 1.5rem;
  border-bottom: 1px solid #e0e0e0;
}

.subsection:last-child {
  border-bottom: none;
  margin-bottom: 0;
  padding-bottom: 0;
}

.subsection h4 {
  color: #2c3e50;
  font-size: 1rem;
  margin-bottom: 0.75rem;
}

.add-manager-field {
  display: flex;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
  align-items: center;
}

.add-manager-field .select-input {
  flex: 1;
  min-width: 200px;
}

.subsection-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.subsection-title {
  color: #2c3e50;
  font-size: 0.95rem;
  font-weight: 600;
  margin: 1.5rem 0 0.75rem 0;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid #e0e0e0;
}

.template-selector {
  margin-bottom: 1.5rem;
}

.template-selector label {
  display: block;
  margin-bottom: 0.5rem;
  color: #2c3e50;
  font-size: 1rem;
}

.template-select {
  width: 100%;
  padding: 0.75rem;
  font-size: 1rem;
  border: 2px solid #42b983;
  border-radius: 4px;
  background-color: white;
  cursor: pointer;
  margin-bottom: 0.5rem;
}

.template-select:focus {
  outline: none;
  border-color: #3aa876;
}

.template-description {
  padding: 0.75rem;
  background-color: #f0f8ff;
  border-left: 4px solid #42b983;
  border-radius: 4px;
  margin: 0;
  font-style: italic;
  color: #2c3e50;
}

.custom-rule-details {
  margin-top: 1.5rem;
}

.simple-rule-builder {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.rule-question {
  background-color: #f8f9fa;
  padding: 1.5rem;
  border-radius: 6px;
  border: 1px solid #e0e0e0;
}

.rule-question > label {
  display: block;
  font-size: 1rem;
  font-weight: 700;
  color: #2c3e50;
  margin-bottom: 1rem;
}

.condition-group {
  margin-bottom: 1.5rem;
}

.condition-group:last-child {
  margin-bottom: 0;
}

.condition-group > label {
  display: block;
  font-weight: 600;
  font-size: 0.9rem;
  color: #555;
  margin-bottom: 0.5rem;
}

.rule-summary {
  margin-top: 1rem;
}

.summary-box {
  background-color: #e8f5e9;
  border: 2px solid #42b983;
  border-radius: 6px;
  padding: 1.5rem;
  text-align: center;
}

.summary-box strong {
  display: block;
  color: #2c3e50;
  font-size: 1.1rem;
  margin-bottom: 0.5rem;
}

.summary-box p {
  margin: 0.5rem 0 1rem 0;
  color: #555;
  font-size: 0.95rem;
}

.customize-button {
  padding: 0.5rem 1.5rem;
  background-color: white;
  border: 2px solid #42b983;
  color: #42b983;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
  font-size: 0.9rem;
  transition: all 0.2s;
}

.customize-button:hover {
  background-color: #42b983;
  color: white;
}

.field-group {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.field label {
  font-weight: 600;
  font-size: 0.9rem;
  color: #2c3e50;
}

.field-with-help {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.help-text {
  color: #7f8c8d;
  font-size: 0.8rem;
  line-height: 1.4;
  margin: 0;
  font-style: italic;
}

.checkbox-field {
  display: flex;
  flex-direction: row;
  align-items: center;
}

.checkbox-field label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
}

.checkbox-field input[type='checkbox'] {
  width: 18px;
  height: 18px;
  cursor: pointer;
}

.text-input,
.select-input {
  padding: 0.6rem 0.75rem;
  border: 2px solid #ddd;
  border-radius: 4px;
  font-size: 0.9rem;
  transition: border-color 0.2s, box-shadow 0.2s;
  background-color: white;
}

.text-input:focus,
.select-input:focus {
  outline: none;
  border-color: #42b983;
  box-shadow: 0 0 0 3px rgba(66, 185, 131, 0.1);
}

.select-input {
  cursor: pointer;
}

.array-field {
  margin-bottom: 1.5rem;
}

.array-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
}

.array-header label {
  font-weight: 600;
  font-size: 0.95rem;
  color: #2c3e50;
}

.add-button {
  padding: 0.5rem 1rem;
  background-color: #42b983;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.85rem;
  font-weight: 600;
  transition: all 0.2s;
  white-space: nowrap;
}

.add-button:hover {
  background-color: #3aa876;
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.add-button:active {
  transform: translateY(0);
}

.add-button.small {
  padding: 0.4rem 0.8rem;
  font-size: 0.8rem;
}

.add-button.large {
  padding: 0.75rem 1.5rem;
  font-size: 1rem;
  width: 100%;
  margin-top: 1rem;
}

.array-items {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.array-items:has(.array-item-with-help) {
  gap: 0;
}

.array-item {
  display: flex;
  gap: 0.75rem;
  align-items: center;
}

.array-item .text-input,
.array-item .select-input {
  flex: 1;
  min-width: 0;
}

.array-item-with-help {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  margin-bottom: 0.5rem;
}

.preset-description {
  color: #7f8c8d;
  font-size: 0.8rem;
  line-height: 1.4;
  margin: 0;
  font-style: italic;
  padding-left: 0.5rem;
}

.remove-button {
  padding: 0.5rem 1rem;
  background-color: #e74c3c;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.85rem;
  font-weight: 600;
  white-space: nowrap;
  transition: all 0.2s;
  flex-shrink: 0;
}

.remove-button:hover {
  background-color: #c0392b;
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.remove-button:active {
  transform: translateY(0);
}

.remove-button.small {
  padding: 0.4rem 0.8rem;
  font-size: 0.8rem;
}

.empty-message {
  color: #999;
  font-style: italic;
  padding: 1rem;
  text-align: center;
}

.package-rules-list {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  margin-bottom: 1rem;
}

.package-rule-item {
  background-color: #fff;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  padding: 2rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.rule-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid #e0e0e0;
}

.rule-header h4 {
  color: #2c3e50;
  font-size: 1.1rem;
  font-weight: 700;
  margin: 0;
}

.rule-content {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.json-preview {
  background-color: #2c3e50;
  color: #42b983;
  padding: 1rem;
  border-radius: 4px;
  overflow-x: auto;
  font-family: 'Monaco', 'Menlo', 'Courier New', monospace;
  font-size: 0.85rem;
  line-height: 1.5;
}

.note {
  margin-top: 0.5rem;
  color: #7f8c8d;
  font-size: 0.85rem;
  font-style: italic;
}

.json-editor {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.json-textarea {
  width: 100%;
  min-height: 500px;
  padding: 1rem;
  background-color: #2c3e50;
  color: #42b983;
  border: 2px solid #34495e;
  border-radius: 4px;
  font-family: 'Monaco', 'Menlo', 'Courier New', monospace;
  font-size: 0.9rem;
  line-height: 1.6;
  resize: vertical;
}

.json-textarea:focus {
  outline: none;
  border-color: #42b983;
}

.apply-button {
  align-self: flex-end;
  padding: 0.75rem 2rem;
  background-color: #42b983;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
  font-weight: 600;
}

.apply-button:hover {
  background-color: #3aa876;
}
</style>
