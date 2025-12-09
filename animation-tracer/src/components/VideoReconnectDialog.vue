<template>
  <Teleport to="body">
    <div v-if="projectStore.showVideoReconnectDialog" class="dialog-overlay" @click.self="handleDismiss">
      <div class="dialog">
        <div class="dialog-header">
          <h2>Missing Video</h2>
          <button class="close-btn" @click="handleDismiss">×</button>
        </div>
        
        <div class="dialog-content">
          <div class="filename-display" v-if="projectStore.videoSourceRef">
            <code>{{ projectStore.videoSourceRef.filename }}</code>
          </div>
          
          <div class="actions-row">
            <button class="btn-browse" @click="handleBrowse">
              Locate File
            </button>
            <button class="btn-skip" @click="handleDismiss">
              Skip
            </button>
          </div>
          
          <p class="hint">
            Use <code>.fluf</code> format to embed videos in your project.
          </p>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { useProjectStore } from '../stores/projectStore'

const projectStore = useProjectStore()

async function handleBrowse() {
  await projectStore.browseForVideo()
}

function handleDismiss() {
  projectStore.dismissVideoReconnect()
}
</script>

<style scoped>
.dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
}

.dialog {
  background: #252525;
  border-radius: 6px;
  width: 320px;
  max-width: 90vw;
  border: 1px solid #333;
}

.dialog-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid #333;
}

.dialog-header h2 {
  margin: 0;
  font-size: 14px;
  font-weight: 500;
  color: #ccc;
}

.close-btn {
  background: none;
  border: none;
  color: #666;
  font-size: 18px;
  cursor: pointer;
  padding: 0;
  line-height: 1;
}

.close-btn:hover {
  color: #999;
}

.dialog-content {
  padding: 16px;
}

.filename-display {
  margin-bottom: 16px;
}

.filename-display code {
  display: block;
  background: #1a1a1a;
  padding: 10px 12px;
  border-radius: 4px;
  font-size: 12px;
  color: #6bf;
  word-break: break-all;
  font-family: 'Consolas', 'Monaco', monospace;
}

.actions-row {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}

.btn-browse {
  flex: 1;
  padding: 8px 16px;
  background: #3a3a3a;
  border: 1px solid #4a4a4a;
  border-radius: 4px;
  color: #ddd;
  font-size: 13px;
  cursor: pointer;
}

.btn-browse:hover {
  background: #444;
  border-color: #555;
}

.btn-skip {
  padding: 8px 16px;
  background: none;
  border: 1px solid #3a3a3a;
  border-radius: 4px;
  color: #777;
  font-size: 13px;
  cursor: pointer;
}

.btn-skip:hover {
  border-color: #4a4a4a;
  color: #999;
}

.hint {
  margin: 0;
  font-size: 11px;
  color: #555;
}

.hint code {
  color: #5a5;
  background: none;
  padding: 0;
}
</style>
