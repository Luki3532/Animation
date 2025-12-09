<template>
  <div class="checkpoint-panel">
    <div class="panel-header">
      <h3>Checkpoints</h3>
      <div class="header-actions">
        <button 
          class="clear-all-btn" 
          @click="confirmClearAll" 
          :disabled="projectStore.checkpoints.length === 0"
          title="Delete all checkpoints"
        >
          <Trash2 :size="14" />
          Clear All
        </button>
        <button class="close-btn" @click="projectStore.toggleCheckpointPanel()">
          <X :size="16" />
        </button>
      </div>
    </div>
    
    <div class="panel-content">
      <div v-if="projectStore.checkpoints.length === 0" class="empty-state">
        <Clock :size="32" />
        <p>No checkpoints yet</p>
        <span>Press <kbd>Ctrl</kbd>+<kbd>Q</kbd> to create one</span>
      </div>
      
      <div v-else class="checkpoint-list">
        <div 
          v-for="checkpoint in sortedCheckpoints" 
          :key="checkpoint.id"
          class="checkpoint-item"
        >
          <div class="checkpoint-info">
            <span class="checkpoint-name">{{ checkpoint.name }}</span>
            <span class="checkpoint-meta">
              {{ formatDate(checkpoint.timestamp) }} · {{ checkpoint.frameIndices.length }} frames
            </span>
          </div>
          <div class="checkpoint-actions">
            <button 
              class="restore-btn" 
              @click="restoreCheckpoint(checkpoint.id)"
              title="Restore this checkpoint"
            >
              <RotateCcw :size="14" />
            </button>
            <button 
              class="delete-btn" 
              @click="deleteCheckpoint(checkpoint.id)"
              title="Delete this checkpoint"
            >
              <Trash2 :size="14" />
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useProjectStore } from '../stores/projectStore'
import { X, Trash2, RotateCcw, Clock } from 'lucide-vue-next'

const projectStore = useProjectStore()

// Sort checkpoints by timestamp (newest first)
const sortedCheckpoints = computed(() => {
  return [...projectStore.checkpoints].sort((a, b) => 
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  )
})

function formatDate(timestamp: string): string {
  const date = new Date(timestamp)
  const now = new Date()
  const isToday = date.toDateString() === now.toDateString()
  
  const time = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  
  if (isToday) {
    return time
  }
  
  return `${date.toLocaleDateString([], { month: 'short', day: 'numeric' })} ${time}`
}

function restoreCheckpoint(id: string) {
  if (confirm('Restore this checkpoint? Your current work will be replaced.')) {
    projectStore.restoreCheckpoint(id)
  }
}

function deleteCheckpoint(id: string) {
  projectStore.deleteCheckpoint(id)
}

function confirmClearAll() {
  if (confirm(`Delete all ${projectStore.checkpoints.length} checkpoints? This cannot be undone.`)) {
    projectStore.clearAllCheckpoints()
  }
}
</script>

<style scoped>
.checkpoint-panel {
  position: fixed;
  top: calc(42px * var(--ui-scale, 1));
  left: 50%;
  transform: translateX(-50%);
  width: min(400px, 90vw);
  max-height: 60vh;
  background: #1a1a1a;
  border: 1px solid #333;
  border-radius: 8px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
  z-index: 999;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: #222;
  border-bottom: 1px solid #333;
}

.panel-header h3 {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: #fff;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.clear-all-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  background: transparent;
  border: 1px solid #444;
  border-radius: 4px;
  color: #888;
  font-size: 11px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.clear-all-btn:hover:not(:disabled) {
  background: #3a2a2a;
  border-color: #633;
  color: #f88;
}

.clear-all-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.close-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4px;
  background: transparent;
  border: none;
  color: #888;
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.15s ease;
}

.close-btn:hover {
  background: #333;
  color: #fff;
}

.panel-content {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 32px 16px;
  color: #666;
  text-align: center;
}

.empty-state p {
  margin: 12px 0 4px;
  font-size: 13px;
  color: #888;
}

.empty-state span {
  font-size: 11px;
  color: #555;
}

.empty-state kbd {
  display: inline-block;
  padding: 2px 5px;
  background: #333;
  border: 1px solid #444;
  border-radius: 3px;
  font-family: monospace;
  font-size: 10px;
  color: #aaa;
}

.checkpoint-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.checkpoint-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  background: #252525;
  border-radius: 6px;
  transition: background 0.15s ease;
}

.checkpoint-item:hover {
  background: #2a2a2a;
}

.checkpoint-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
  flex: 1;
}

.checkpoint-name {
  font-size: 12px;
  font-weight: 500;
  color: #ddd;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.checkpoint-meta {
  font-size: 10px;
  color: #777;
}

.checkpoint-actions {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-left: 12px;
}

.restore-btn,
.delete-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 6px;
  background: transparent;
  border: 1px solid transparent;
  border-radius: 4px;
  color: #888;
  cursor: pointer;
  transition: all 0.15s ease;
}

.restore-btn:hover {
  background: #2a3a2a;
  border-color: #3a5a3a;
  color: #8f8;
}

.delete-btn:hover {
  background: #3a2a2a;
  border-color: #5a3a3a;
  color: #f88;
}
</style>
