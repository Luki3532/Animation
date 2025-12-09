<template>
  <Teleport to="body">
    <div v-if="projectStore.showVideoReconnectDialog" class="dialog-overlay" @click.self="handleDismiss">
      <div class="dialog">
        <div class="dialog-header">
          <span class="dialog-icon">🎬</span>
          <h2>Video Required</h2>
        </div>
        
        <div class="dialog-content">
          <p class="info-text">
            This project requires a video file to display your drawings correctly.
          </p>
          
          <div class="video-info" v-if="projectStore.videoSourceRef">
            <div class="info-row">
              <span class="label">Expected file:</span>
              <span class="value filename">{{ projectStore.videoSourceRef.filename }}</span>
            </div>
            <div class="info-row" v-if="projectStore.videoSourceRef.fileSize">
              <span class="label">Size:</span>
              <span class="value">{{ formatFileSize(projectStore.videoSourceRef.fileSize) }}</span>
            </div>
            <div class="info-row" v-if="projectStore.videoSourceRef.duration">
              <span class="label">Duration:</span>
              <span class="value">{{ formatDuration(projectStore.videoSourceRef.duration) }}</span>
            </div>
          </div>
          
          <p class="tip">
            💡 Tip: Save as <strong>.fluf</strong> format to embed the video directly in your project file.
          </p>
        </div>
        
        <div class="dialog-actions">
          <button class="btn btn-primary" @click="handleBrowse">
            <span class="btn-icon">📁</span>
            Browse for Video
          </button>
          <button class="btn btn-secondary" @click="handleDismiss">
            Continue Without Video
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { useProjectStore } from '../stores/projectStore'

const projectStore = useProjectStore()

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

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
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  backdrop-filter: blur(4px);
}

.dialog {
  background: #2d2d2d;
  border-radius: 12px;
  padding: 24px;
  width: 420px;
  max-width: 90vw;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
  border: 1px solid #404040;
}

.dialog-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
}

.dialog-icon {
  font-size: 28px;
}

.dialog-header h2 {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: #fff;
}

.dialog-content {
  margin-bottom: 24px;
}

.info-text {
  color: #ccc;
  margin: 0 0 16px 0;
  line-height: 1.5;
}

.video-info {
  background: #1a1a1a;
  border-radius: 8px;
  padding: 12px 16px;
  margin-bottom: 16px;
}

.info-row {
  display: flex;
  justify-content: space-between;
  padding: 4px 0;
}

.info-row .label {
  color: #888;
  font-size: 13px;
}

.info-row .value {
  color: #fff;
  font-size: 13px;
}

.info-row .filename {
  font-family: monospace;
  color: #4fc3f7;
  word-break: break-all;
  text-align: right;
  max-width: 200px;
}

.tip {
  color: #888;
  font-size: 12px;
  margin: 0;
  padding: 10px;
  background: rgba(255, 193, 7, 0.1);
  border-radius: 6px;
  border-left: 3px solid #ffc107;
}

.tip strong {
  color: #ffc107;
}

.dialog-actions {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.btn {
  padding: 12px 20px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: all 0.2s;
}

.btn-icon {
  font-size: 16px;
}

.btn-primary {
  background: #4caf50;
  color: white;
}

.btn-primary:hover {
  background: #43a047;
  transform: translateY(-1px);
}

.btn-secondary {
  background: transparent;
  color: #888;
  border: 1px solid #444;
}

.btn-secondary:hover {
  background: #333;
  color: #ccc;
}
</style>
