<script setup lang="ts">
import { ref } from 'vue'
import JSON5 from 'json5'
import type { RenovateConfig } from '@/types'

const emit = defineEmits<{
  'config-loaded': [config: RenovateConfig]
  error: [message: string]
  loading: [isLoading: boolean]
}>()

const url = ref('')
const isLoading = ref(false)

// Common locations for Renovate config files
const RENOVATE_CONFIG_PATHS = [
  'renovate.json',
  '.github/renovate.json',
  '.renovaterc.json',
  '.renovaterc'
]

// Convert GitHub repo URL to raw content URLs
const getGitHubRawUrls = (repoUrl: string): string[] => {
  // Match github.com URLs
  const githubMatch = repoUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/)
  if (!githubMatch) return []

  const [, owner, repo] = githubMatch
  const cleanRepo = repo.replace(/\.git$/, '')

  // Try main and master branches
  const branches = ['main', 'master']
  const urls: string[] = []

  for (const branch of branches) {
    for (const path of RENOVATE_CONFIG_PATHS) {
      urls.push(`https://raw.githubusercontent.com/${owner}/${cleanRepo}/${branch}/${path}`)
    }
  }

  return urls
}

// Try fetching from a URL
const tryFetch = async (url: string): Promise<{ success: boolean; data?: any; error?: string }> => {
  try {
    const response = await fetch(url)
    if (!response.ok) {
      return { success: false, error: `HTTP ${response.status}` }
    }
    const textContent = await response.text()
    const config = JSON5.parse(textContent)
    return { success: true, data: config }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Failed to fetch' }
  }
}

const loadConfig = async () => {
  if (!url.value.trim()) {
    emit('error', 'Please enter a URL')
    return
  }

  try {
    isLoading.value = true
    emit('loading', true)
    emit('error', '')

    let urlsToTry: string[] = []

    // Check if it's a GitHub URL (repo or blob)
    if (url.value.includes('github.com')) {
      // If it's already a raw.githubusercontent.com URL, use it directly
      if (url.value.includes('raw.githubusercontent.com')) {
        urlsToTry = [url.value]
      }
      // If it's a github.com/user/repo/blob/... URL, convert to raw
      else if (url.value.match(/github\.com\/[^\/]+\/[^\/]+\/blob\//)) {
        const rawUrl = url.value
          .replace('github.com', 'raw.githubusercontent.com')
          .replace('/blob/', '/')
        urlsToTry = [rawUrl]
      }
      // If it's a simple github.com/user/repo URL, try common config paths
      else {
        urlsToTry = getGitHubRawUrls(url.value)
      }
    } else {
      // Not a GitHub URL, try it directly
      urlsToTry = [url.value]
    }

    // Try each URL until one works
    let config = null
    let lastError = ''

    for (const tryUrl of urlsToTry) {
      const result = await tryFetch(tryUrl)
      if (result.success && result.data) {
        config = result.data
        break
      }
      lastError = result.error || 'Unknown error'
    }

    if (config) {
      emit('config-loaded', config)
    } else {
      throw new Error(
        urlsToTry.length > 1
          ? `Could not find renovate config in repository. Tried: ${RENOVATE_CONFIG_PATHS.join(', ')}`
          : `Failed to load config: ${lastError}`
      )
    }
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Failed to load configuration'
    emit('error', `Error loading config: ${errorMessage}`)
  } finally {
    isLoading.value = false
    emit('loading', false)
  }
}

const handleSubmit = (e: Event) => {
  e.preventDefault()
  loadConfig()
}
</script>

<template>
  <div class="url-input">
    <form @submit="handleSubmit">
      <div class="input-row">
        <input
          id="url-field"
          v-model="url"
          type="url"
          placeholder="https://github.com/user/repo or direct URL to renovate.json"
          :disabled="isLoading"
          class="url-field"
        />
        <button type="submit" :disabled="isLoading" class="load-button">
          {{ isLoading ? 'Loading...' : 'Load' }}
        </button>
      </div>
    </form>
  </div>
</template>

<style scoped>
.url-input {
  flex: 1;
  min-width: 0;
}

.input-row {
  display: flex;
  gap: 0.5rem;
  align-items: stretch;
}

.url-field {
  flex: 1;
  min-width: 0;
  padding: 0.75rem 1rem;
  border: 2px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
  transition: border-color 0.2s;
  height: 46px;
  box-sizing: border-box;
}

.url-field:focus {
  outline: none;
  border-color: #42b983;
}

.url-field:disabled {
  background-color: #f5f5f5;
  cursor: not-allowed;
}

.load-button {
  padding: 0.75rem 2rem;
  background-color: #42b983;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s;
  white-space: nowrap;
  flex-shrink: 0;
  height: 46px;
  box-sizing: border-box;
}

.load-button:hover:not(:disabled) {
  background-color: #3aa876;
}

.load-button:disabled {
  background-color: #95a5a6;
  cursor: not-allowed;
}
</style>
