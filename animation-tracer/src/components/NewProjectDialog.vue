<template>
  <div class="new-project-dialog" v-if="isOpen">
    <div class="dialog-backdrop" @click="close"></div>
    <div class="dialog-content">
      <div class="dialog-header">
        <h2>New Empty Project</h2>
        <button @click="close" class="close-btn">
          <X :size="18" />
        </button>
      </div>

      <div class="dialog-body">
        <div class="form-group">
          <label>Canvas Size</label>
          <div class="size-buttons">
            <button
              v-for="size in canvasSizes"
              :key="size.label"
              :class="{ active: selectedSize.label === size.label }"
              @click="selectedSize = size"
            >
              {{ size.label }}
            </button>
            <button
              :class="{ active: isCustomSize }"
              @click="enableCustomSize"
            >
              Custom
            </button>
          </div>
          <div v-if="isCustomSize" class="custom-size-inputs">
            <div class="size-input-group">
              <label>Width</label>
              <input 
                type="number" 
                v-model.number="customWidth" 
                min="1" 
                max="4096"
                class="number-input"
              />
            </div>
            <div class="size-input-group">
              <label>Height</label>
              <input 
                type="number" 
                v-model.number="customHeight" 
                min="1" 
                max="4096"
                class="number-input"
              />
            </div>
          </div>
          <div class="size-preview">
            {{ effectiveWidth }} × {{ effectiveHeight }} pixels
          </div>
        </div>

        <div class="form-group">
          <label>Frame Rate (FPS)</label>
          <div class="fps-buttons">
            <button
              v-for="f in fpsOptions"
              :key="f"
              :class="{ active: fps === f }"
              @click="fps = f"
            >
              {{ f }}
            </button>
          </div>
          <div class="custom-fps">
            <label>Custom FPS:</label>
            <input 
              type="number" 
              v-model.number="fps" 
              min="1" 
              max="120"
              class="number-input small"
            />
          </div>
        </div>

        <div class="form-group">
          <label>Initial Frame Count</label>
          <div class="frame-count-buttons">
            <button
              v-for="count in frameCountOptions"
              :key="count"
              :class="{ active: frameCount === count }"
              @click="frameCount = count"
            >
              {{ count }}
            </button>
          </div>
          <div class="custom-frame-count">
            <label>Custom count:</label>
            <input 
              type="number" 
              v-model.number="frameCount" 
              min="1" 
              max="9999"
              class="number-input small"
            />
          </div>
          <span class="hint">Duration: {{ (frameCount / fps).toFixed(2) }}s @ {{ fps }} FPS</span>
        </div>
      </div>

      <div class="dialog-footer">
        <div class="project-info">
          <span class="info-item">
            <Film :size="14" />
            {{ frameCount }} frames
          </span>
          <span class="info-item">
            <Clock :size="14" />
            {{ (frameCount / fps).toFixed(2) }}s
          </span>
        </div>
        <div class="button-group">
          <button class="secondary-btn" @click="close">Cancel</button>
          <button class="primary-btn" @click="createProject">
            <Plus :size="16" />
            Create Project
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { X, Plus, Film, Clock } from 'lucide-vue-next'
import { CANVAS_SIZES } from '../types/drawing'
import type { CanvasSize } from '../types/drawing'
import { useVideoStore } from '../stores/videoStore'
import { useDrawingStore } from '../stores/drawingStore'

const videoStore = useVideoStore()
const drawingStore = useDrawingStore()

defineProps<{
  isOpen: boolean
}>()

const emit = defineEmits<{
  close: []
  created: []
}>()

// Canvas sizes from drawing types
const canvasSizes = CANVAS_SIZES

// State
const selectedSize = ref<CanvasSize>(CANVAS_SIZES[2]) // Default 128x128
const isCustomSize = ref(false)
const customWidth = ref(256)
const customHeight = ref(256)
const fps = ref(24)
const frameCount = ref(24)

// Preset options
const fpsOptions = [12, 24, 30, 60]
const frameCountOptions = [12, 24, 48, 60, 120]

const effectiveWidth = computed(() => isCustomSize.value ? customWidth.value : selectedSize.value.width)
const effectiveHeight = computed(() => isCustomSize.value ? customHeight.value : selectedSize.value.height)

function enableCustomSize() {
  isCustomSize.value = true
  customWidth.value = selectedSize.value.width
  customHeight.value = selectedSize.value.height
}

function close() {
  emit('close')
}

function createProject() {
  // Clear any existing drawings when creating new project
  drawingStore.clearAllDrawings()
  
  // Create the empty project
  videoStore.createEmptyProject(
    effectiveWidth.value,
    effectiveHeight.value,
    fps.value,
    frameCount.value
  )
  
  // Update canvas size in drawing store for export purposes
  drawingStore.setCanvasSize({
    width: effectiveWidth.value,
    height: effectiveHeight.value,
    label: `${effectiveWidth.value}×${effectiveHeight.value}`
  })
  
  emit('created')
  close()
}
</script>

<style scoped>
.new-project-dialog {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
}

.dialog-backdrop {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.85);
}

.dialog-content {
  position: relative;
  background: var(--vscode-editor-background);
  border: 1px solid var(--vscode-panel-border);
  border-radius: 8px;
  width: 420px;
  max-width: 95vw;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
}

.dialog-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid var(--vscode-panel-border);
}

.dialog-header h2 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
}

.close-btn {
  background: transparent;
  border: none;
  color: var(--vscode-foreground);
  cursor: pointer;
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  opacity: 0.7;
}

.close-btn:hover {
  opacity: 1;
  background: var(--vscode-toolbar-hoverBackground);
}

.dialog-body {
  padding: 20px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-group > label {
  font-weight: 600;
  font-size: 13px;
}

.size-buttons,
.fps-buttons,
.frame-count-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.size-buttons button,
.fps-buttons button,
.frame-count-buttons button {
  padding: 6px 12px;
  background: var(--vscode-button-secondaryBackground);
  border: 2px solid transparent;
  border-radius: 4px;
  cursor: pointer;
  color: var(--vscode-foreground);
  font-size: 12px;
  transition: all 0.15s;
}

.size-buttons button:hover,
.fps-buttons button:hover,
.frame-count-buttons button:hover {
  background: var(--vscode-button-secondaryHoverBackground);
}

.size-buttons button.active,
.fps-buttons button.active,
.frame-count-buttons button.active {
  border-color: var(--vscode-button-background);
  background: var(--vscode-button-background);
  color: var(--vscode-button-foreground);
}

.custom-size-inputs {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-top: 8px;
}

.size-input-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.size-input-group label {
  font-size: 11px;
  opacity: 0.7;
}

.size-preview {
  padding: 10px;
  background: var(--vscode-editor-inactiveSelectionBackground);
  border-radius: 4px;
  text-align: center;
  font-size: 13px;
  font-weight: 600;
  color: var(--vscode-button-background);
}

.custom-fps,
.custom-frame-count {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
}

.number-input {
  padding: 6px 10px;
  background: var(--vscode-input-background);
  border: 1px solid var(--vscode-input-border);
  border-radius: 4px;
  color: var(--vscode-input-foreground);
  font-size: 13px;
  width: 100%;
}

.number-input.small {
  width: 70px;
}

.hint {
  font-size: 11px;
  opacity: 0.7;
}

.dialog-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-top: 1px solid var(--vscode-panel-border);
  gap: 12px;
}

.project-info {
  display: flex;
  gap: 16px;
  font-size: 12px;
  opacity: 0.8;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 4px;
}

.button-group {
  display: flex;
  gap: 8px;
}

.secondary-btn,
.primary-btn {
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.2s;
}

.secondary-btn {
  background: var(--vscode-button-secondaryBackground);
  border: 1px solid var(--vscode-button-border);
  color: var(--vscode-button-secondaryForeground);
}

.secondary-btn:hover {
  background: var(--vscode-button-secondaryHoverBackground);
}

.primary-btn {
  background: var(--vscode-button-background);
  border: none;
  color: var(--vscode-button-foreground);
}

.primary-btn:hover {
  background: var(--vscode-button-hoverBackground);
}
</style>
