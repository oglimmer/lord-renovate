<script setup lang="ts">
import { ref } from 'vue'
import UrlInput from '@/components/UrlInput.vue'
import RenovateEditor from '@/components/RenovateEditor.vue'
import type { RenovateConfig } from '@/types'

import { defaultConfig } from '@/defaults'

const renovateConfig = ref<RenovateConfig | null>(null)
const isLoading = ref(false)
const error = ref<string | null>(null)

const handleConfigLoaded = (config: RenovateConfig) => {
  renovateConfig.value = config
  error.value = null
}

const handleError = (errorMessage: string) => {
  error.value = errorMessage
  renovateConfig.value = null
}

const handleLoading = (loading: boolean) => {
  isLoading.value = loading
}

const handleNewConfig = () => {
  renovateConfig.value = JSON.parse(JSON.stringify(defaultConfig))
  error.value = null
}
</script>

<template>
  <div class="home-view">
    <header class="header">
      <h1>Renovate Config Editor</h1>
      <p class="subtitle">Load and edit your renovate.json configuration</p>
    </header>

    <main class="main-content">
      <div class="config-loader-section">
        <h3 class="section-title">Load Configuration</h3>
        <div class="loader-actions">
          <UrlInput
            @config-loaded="handleConfigLoaded"
            @error="handleError"
            @loading="handleLoading"
          />
          <button @click="handleNewConfig" class="new-config-button">New Config</button>
        </div>
      </div>

      <div v-if="error" class="error-message">
        {{ error }}
      </div>

      <div v-if="isLoading" class="loading">
        Loading configuration...
      </div>

      <RenovateEditor v-if="renovateConfig && !isLoading" :config="renovateConfig" />
    </main>
  </div>
</template>

<style scoped>
.home-view {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

.header {
  text-align: center;
  margin-bottom: 3rem;
}

.header h1 {
  color: #2c3e50;
  margin-bottom: 0.5rem;
}

.subtitle {
  color: #7f8c8d;
  font-size: 1.1rem;
}

.main-content {
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  padding: 2rem;
}

.config-loader-section {
  margin-bottom: 2rem;
}

.section-title {
  font-size: 1rem;
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 1rem;
}

.loader-actions {
  display: flex;
  gap: 1rem;
  align-items: flex-start;
}

.new-config-button {
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
}

.new-config-button:hover {
  background-color: #3aa876;
}

.error-message {
  background-color: #fee;
  border: 1px solid #fcc;
  color: #c33;
  padding: 1rem;
  border-radius: 4px;
  margin: 1rem 0;
}

.loading {
  text-align: center;
  padding: 2rem;
  color: #7f8c8d;
  font-size: 1.1rem;
}
</style>
