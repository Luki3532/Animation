<template>
  <Teleport to="body">
    <div v-if="projectStore.showVideoReconnectDialog" class="dialog-overlay">
      <div class="dialog">
        <div class="dialog-header">
          <h2>Link Video File</h2>
        </div>
        
        <div class="dialog-content">
          <!-- Expected video info -->
          <div class="expected-info" v-if="projectStore.videoSourceRef">
            <h3>Expected Video</h3>
            <div class="info-grid">
              <div class="info-row">
                <span class="label">Filename:</span>
                <span class="value filename">{{ projectStore.videoSourceRef.filename }}</span>
              </div>
              <div class="info-row" v-if="projectStore.videoSourceRef.expectedFrameCount">
                <span class="label">Frames:</span>
                <span class="value">{{ projectStore.videoSourceRef.expectedFrameCount }} frames</span>
              </div>
              <div class="info-row" v-if="projectStore.videoSourceRef.projectFps">
                <span class="label">Project FPS:</span>
                <span class="value">{{ projectStore.videoSourceRef.projectFps }} fps <span class="locked">(locked)</span></span>
              </div>
              <div class="info-row" v-if="projectStore.videoSourceRef.duration">
                <span class="label">Duration:</span>
                <span class="value">{{ formatDuration(projectStore.videoSourceRef.duration) }}</span>
              </div>
              <div class="info-row" v-if="projectStore.videoSourceRef.fileSize">
                <span class="label">File size:</span>
                <span class="value">{{ formatFileSize(projectStore.videoSourceRef.fileSize) }}</span>
              </div>
            </div>
          </div>
          
          <!-- Selected file validation -->
          <div class="selected-file" v-if="projectStore.pendingVideoFile">
            <h3>Selected Video</h3>
            <div class="info-grid">
              <div class="info-row">
                <span class="label">Filename:</span>
                <span class="value filename">{{ projectStore.pendingVideoFile.name }}</span>
              </div>
              <div class="info-row">
                <span class="label">File size:</span>
                <span class="value">{{ formatFileSize(projectStore.pendingVideoFile.size) }}</span>
              </div>
            </div>
            
            <!-- Validation warnings -->
            <div class="validation-result" v-if="projectStore.videoValidationResult">
              <div v-if="projectStore.videoValidationResult.isExactMatch" class="match-status success">
                ✓ Video matches expected file
              </div>
              <div v-else class="match-status warning">
                ⚠ Video differs from original
              </div>
              
              <div class="differences" v-if="projectStore.videoValidationResult.differences.length > 0">
                <div 
                  v-for="diff in projectStore.videoValidationResult.differences" 
                  :key="diff.field"
                  :class="['diff-item', diff.severity]"
                >
                  <span class="diff-field">{{ diff.field }}:</span>
                  <span class="diff-expected">Expected: {{ diff.expected }}</span>
                  <span class="diff-actual">Got: {{ diff.actual }}</span>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Actions -->
          <div class="actions-row">
            <button class="btn-browse" @click="handleBrowse">
              {{ projectStore.pendingVideoFile ? 'Choose Different File' : 'Locate Video File' }}
            </button>
            <button 
              class="btn-confirm" 
              @click="handleConfirm"
              v-if="projectStore.pendingVideoFile"
              :class="{ 'has-warnings': hasWarnings }"
            >
              {{ hasWarnings ? 'Use Anyway' : 'Confirm' }}
            </button>
          </div>
          
          <!-- Corrupt file option -->
          <div class="corrupt-section">
            <button class="btn-corrupt" @click="handleCorrupt">
              Corrupt File — View Drawings Without Video
            </button>
            <p class="corrupt-hint">Use this if you've lost the original video file</p>
          </div>
          
          <p class="hint">
            Tip: Use <code>.fluf</code> format to embed videos directly in the project file.
          </p>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useProjectStore } from '../stores/projectStore'

const projectStore = useProjectStore()

const hasWarnings = computed(() => {
  return projectStore.videoValidationResult && !projectStore.videoValidationResult.isExactMatch
})

async function handleBrowse() {
  await projectStore.browseForVideo()
}

async function handleConfirm() {
  await projectStore.confirmVideoSelection()
}

function handleCorrupt() {
  projectStore.viewDrawingsWithoutVideo()
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return 'Unknown'
  const mb = bytes / (1024 * 1024)
  return `${mb.toFixed(2)} MB`
}
</script>

<style scoped>
.dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
}

.dialog {
  background: #252525;
  border-radius: 8px;
  width: 420px;
  max-width: 95vw;
  border: 1px solid #444;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
}

.dialog-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 18px;
  border-bottom: 1px solid #333;
  background: #2a2a2a;
  border-radius: 8px 8px 0 0;
}

.dialog-header h2 {
  margin: 0;
  font-size: 15px;
  font-weight: 600;
  color: #eee;
}

.dialog-content {
  padding: 18px;
}

.expected-info, .selected-file {
  margin-bottom: 16px;
  padding: 12px;
  background: #1e1e1e;
  border-radius: 6px;
  border: 1px solid #333;
}

.expected-info h3, .selected-file h3 {
  margin: 0 0 10px 0;
  font-size: 12px;
  font-weight: 600;
  color: #888;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.info-grid {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.info-row {
  display: flex;
  gap: 8px;
  font-size: 13px;
}

.info-row .label {
  color: #888;
  min-width: 80px;
}

.info-row .value {
  color: #ddd;
}

.info-row .value.filename {
  color: #6bf;
  font-family: 'Consolas', 'Monaco', monospace;
  word-break: break-all;
}

.info-row .locked {
  color: #f90;
  font-size: 11px;
}

.validation-result {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #333;
}

.match-status {
  padding: 8px 12px;
  border-radius: 4px;
  font-size: 13px;
  font-weight: 500;
}

.match-status.success {
  background: rgba(40, 167, 69, 0.15);
  color: #5f5;
  border: 1px solid rgba(40, 167, 69, 0.3);
}

.match-status.warning {
  background: rgba(255, 193, 7, 0.15);
  color: #fc0;
  border: 1px solid rgba(255, 193, 7, 0.3);
}

.differences {
  margin-top: 10px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.diff-item {
  padding: 8px 10px;
  border-radius: 4px;
  font-size: 12px;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.diff-item.warning {
  background: rgba(255, 193, 7, 0.1);
  border-left: 3px solid #fc0;
}

.diff-item.error {
  background: rgba(220, 53, 69, 0.1);
  border-left: 3px solid #f44;
}

.diff-field {
  font-weight: 600;
  color: #ccc;
}

.diff-expected {
  color: #888;
}

.diff-actual {
  color: #f88;
}

.actions-row {
  display: flex;
  gap: 10px;
  margin-bottom: 14px;
}

.btn-browse {
  flex: 1;
  padding: 10px 16px;
  background: #3a3a3a;
  border: 1px solid #4a4a4a;
  border-radius: 5px;
  color: #ddd;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s;
}

.btn-browse:hover {
  background: #444;
  border-color: #555;
}

.btn-confirm {
  flex: 1;
  padding: 10px 16px;
  background: #2563eb;
  border: 1px solid #3b82f6;
  border-radius: 5px;
  color: #fff;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s;
}

.btn-confirm:hover {
  background: #3b82f6;
}

.btn-confirm.has-warnings {
  background: #b45309;
  border-color: #d97706;
}

.btn-confirm.has-warnings:hover {
  background: #d97706;
}

.corrupt-section {
  margin: 16px 0;
  padding-top: 16px;
  border-top: 1px solid #333;
  text-align: center;
}

.btn-corrupt {
  width: 100%;
  padding: 10px 16px;
  background: transparent;
  border: 1px dashed #555;
  border-radius: 5px;
  color: #888;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.15s;
}

.btn-corrupt:hover {
  background: rgba(220, 53, 69, 0.1);
  border-color: #666;
  color: #aaa;
}

.corrupt-hint {
  margin: 6px 0 0 0;
  font-size: 10px;
  color: #555;
}

.hint {
  margin: 0;
  font-size: 11px;
  color: #666;
  text-align: center;
}

.hint code {
  background: #333;
  padding: 2px 5px;
  border-radius: 3px;
  color: #6bf;
}
</style>