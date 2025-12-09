<template>
  <div class="timeline" v-if="videoStore.hasProject">
    <div class="timeline-controls">
      <button @click="videoStore.previousFrame()" :disabled="videoStore.state.currentFrame === 0" title="Previous frame">
        <ChevronLeft :size="14" />
      </button>
      <span class="frame-info">
        Frame {{ videoStore.state.currentFrame + 1 }} / {{ videoStore.state.frameCount }}
      </span>
      <button @click="videoStore.nextFrame()" :disabled="videoStore.state.currentFrame >= videoStore.state.frameCount - 1" title="Next frame">
        <ChevronRight :size="14" />
      </button>
    </div>

    <div class="keyframe-nav" v-if="drawingStore.drawnFrameIndices.length > 0">
      <button @click="goToPrevKeyframe" :disabled="!hasPrevKeyframe" title="Previous keyframe">
        <ChevronsLeft :size="14" />
      </button>
      <span class="keyframe-count">{{ drawingStore.drawnFrameIndices.length }} keyframe{{ drawingStore.drawnFrameIndices.length !== 1 ? 's' : '' }}</span>
      <button @click="goToNextKeyframe" :disabled="!hasNextKeyframe" title="Next keyframe">
        <ChevronsRight :size="14" />
      </button>
    </div>

    <!-- Onion Skin Controls -->
    <div class="onion-skin-controls">
      <button 
        class="onion-toggle" 
        :class="{ active: settingsStore.onionSkinEnabled }"
        @click="settingsStore.setOnionSkinEnabled(!settingsStore.onionSkinEnabled)"
        title="Toggle onion skinning"
      >
        <Layers :size="14" />
        <span>Onion</span>
      </button>
      <div class="onion-counts" v-if="settingsStore.onionSkinEnabled">
        <div class="onion-count before">
          <button @click="settingsStore.setOnionSkinFramesBefore(settingsStore.onionSkinFramesBefore - 1)" :disabled="settingsStore.onionSkinFramesBefore <= 0">
            <Minus :size="10" />
          </button>
          <span class="count-value" :style="{ color: settingsStore.onionSkinColorBefore }">{{ settingsStore.onionSkinFramesBefore }}</span>
          <button @click="settingsStore.setOnionSkinFramesBefore(settingsStore.onionSkinFramesBefore + 1)" :disabled="settingsStore.onionSkinFramesBefore >= 5">
            <Plus :size="10" />
          </button>
        </div>
        <span class="onion-separator">|</span>
        <div class="onion-count after">
          <button @click="settingsStore.setOnionSkinFramesAfter(settingsStore.onionSkinFramesAfter - 1)" :disabled="settingsStore.onionSkinFramesAfter <= 0">
            <Minus :size="10" />
          </button>
          <span class="count-value" :style="{ color: settingsStore.onionSkinColorAfter }">{{ settingsStore.onionSkinFramesAfter }}</span>
          <button @click="settingsStore.setOnionSkinFramesAfter(settingsStore.onionSkinFramesAfter + 1)" :disabled="settingsStore.onionSkinFramesAfter >= 5">
            <Plus :size="10" />
          </button>
        </div>
      </div>
    </div>

    <div class="timeline-slider">
      <div class="slider-track">
        <input
          type="range"
          :min="0"
          :max="videoStore.state.frameCount - 1"
          :value="videoStore.state.currentFrame"
          @input="onSliderChange"
        />
        <!-- Keyframe markers on slider -->
        <div class="keyframe-markers">
          <div 
            v-for="frameIndex in drawingStore.drawnFrameIndices"
            :key="frameIndex"
            class="keyframe-marker"
            :class="{ active: frameIndex === videoStore.state.currentFrame }"
            :style="{ left: `${(frameIndex / (videoStore.state.frameCount - 1)) * 100}%` }"
            @click="videoStore.setCurrentFrame(frameIndex)"
            :title="`Keyframe ${frameIndex + 1}`"
          />
        </div>
      </div>
    </div>

    <div class="fps-control">
      <label>
        FPS:
        <input
          type="number"
          :value="videoStore.state.fps"
          @change="onFpsChange"
          min="1"
          max="60"
        />
      </label>
    </div>

    <!-- Frame Management Controls (Empty Projects Only) -->
    <div class="frame-management" v-if="videoStore.state.isEmptyProject">
      <button class="frame-btn add-btn" @click="showAddFramesDialog = true" title="Add frames at end">
        <PlusCircle :size="14" />
        <span>Add</span>
      </button>
      <button class="frame-btn insert-btn" @click="showInsertFramesDialog = true" title="Insert frames after current">
        <ArrowRightCircle :size="14" />
        <span>Insert Here</span>
      </button>
    </div>

    <!-- Add Frames Dialog -->
    <div class="mini-dialog" v-if="showAddFramesDialog">
      <div class="mini-dialog-backdrop" @click="showAddFramesDialog = false"></div>
      <div class="mini-dialog-content">
        <h4>Add Frames at End</h4>
        <div class="dialog-row">
          <label>Number of frames:</label>
          <input type="number" v-model.number="addFrameCount" min="1" max="500" />
        </div>
        <div class="dialog-buttons">
          <button class="cancel-btn" @click="showAddFramesDialog = false">Cancel</button>
          <button class="confirm-btn" @click="confirmAddFrames">Add</button>
        </div>
      </div>
    </div>

    <!-- Insert Frames Dialog -->
    <div class="mini-dialog" v-if="showInsertFramesDialog">
      <div class="mini-dialog-backdrop" @click="showInsertFramesDialog = false"></div>
      <div class="mini-dialog-content">
        <h4>Insert Frames After Frame {{ videoStore.state.currentFrame + 1 }}</h4>
        <div class="dialog-row">
          <label>Number of frames:</label>
          <input type="number" v-model.number="insertFrameCount" min="1" max="500" />
        </div>
        <p class="dialog-hint">Existing drawings will be shifted forward.</p>
        <div class="dialog-buttons">
          <button class="cancel-btn" @click="showInsertFramesDialog = false">Cancel</button>
          <button class="confirm-btn" @click="confirmInsertFrames">Insert</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Layers, Plus, Minus, PlusCircle, ArrowRightCircle } from 'lucide-vue-next'
import { useVideoStore } from '../stores/videoStore'
import { useDrawingStore } from '../stores/drawingStore'
import { useSettingsStore } from '../stores/settingsStore'

const videoStore = useVideoStore()
const drawingStore = useDrawingStore()
const settingsStore = useSettingsStore()

// Frame management dialogs state
const showAddFramesDialog = ref(false)
const showInsertFramesDialog = ref(false)
const addFrameCount = ref(12)
const insertFrameCount = ref(1)

// Keyframe navigation
const hasPrevKeyframe = computed(() => {
  const indices = drawingStore.drawnFrameIndices
  return indices.some(i => i < videoStore.state.currentFrame)
})

const hasNextKeyframe = computed(() => {
  const indices = drawingStore.drawnFrameIndices
  return indices.some(i => i > videoStore.state.currentFrame)
})

function goToPrevKeyframe() {
  const indices = drawingStore.drawnFrameIndices
  const prevFrames = indices.filter(i => i < videoStore.state.currentFrame)
  if (prevFrames.length > 0) {
    videoStore.setCurrentFrame(prevFrames[prevFrames.length - 1])
  }
}

function goToNextKeyframe() {
  const indices = drawingStore.drawnFrameIndices
  const nextFrame = indices.find(i => i > videoStore.state.currentFrame)
  if (nextFrame !== undefined) {
    videoStore.setCurrentFrame(nextFrame)
  }
}

function onSliderChange(e: Event) {
  const input = e.target as HTMLInputElement
  videoStore.setCurrentFrame(parseInt(input.value))
}

function onFpsChange(e: Event) {
  const input = e.target as HTMLInputElement
  const fps = parseInt(input.value)
  if (fps >= 1 && fps <= 60) {
    videoStore.setFps(fps)
  }
}

// Frame management functions
function confirmAddFrames() {
  if (addFrameCount.value > 0) {
    videoStore.addFrames(addFrameCount.value)
  }
  showAddFramesDialog.value = false
}

function confirmInsertFrames() {
  if (insertFrameCount.value > 0) {
    const insertAt = videoStore.state.currentFrame + 1
    // Shift existing drawings forward
    drawingStore.shiftFrameDrawings(insertAt, insertFrameCount.value)
    // Insert the frames in video store
    videoStore.insertFramesAfterCurrent(insertFrameCount.value)
  }
  showInsertFramesDialog.value = false
}
</script>

<style scoped>
.timeline {
  padding: 8px 12px;
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  font-size: 12px;
}

.timeline-controls {
  display: flex;
  align-items: center;
  gap: 4px;
}

.timeline-controls button {
  width: 28px;
  height: 28px;
  background: #252525;
  border-radius: 3px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #888;
}

.timeline-controls button:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.timeline-controls button:hover:not(:disabled) {
  background: #333;
  color: #fff;
}

.frame-info {
  min-width: 100px;
  text-align: center;
  color: #888;
  font-variant-numeric: tabular-nums;
}

.keyframe-nav {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 0 8px;
  border-left: 1px solid #333;
  border-right: 1px solid #333;
}

.keyframe-nav button {
  width: 24px;
  height: 24px;
  background: #252525;
  border-radius: 3px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--accent);
}

.keyframe-nav button:disabled {
  opacity: 0.3;
  cursor: not-allowed;
  color: #666;
}

.keyframe-nav button:hover:not(:disabled) {
  background: var(--accent);
  color: #fff;
}

.keyframe-count {
  color: var(--accent);
  font-size: 11px;
  min-width: 70px;
  text-align: center;
}

.timeline-slider {
  flex: 1;
  min-width: 150px;
}

.slider-track {
  position: relative;
  padding: 8px 0;
}

.slider-track input[type="range"] {
  width: 100%;
  height: 4px;
  position: relative;
  z-index: 2;
}

.keyframe-markers {
  position: absolute;
  left: 0;
  right: 0;
  top: 50%;
  transform: translateY(-50%);
  height: 16px;
  pointer-events: none;
  z-index: 1;
}

.keyframe-marker {
  position: absolute;
  width: 4px;
  height: 16px;
  background: var(--accent);
  border-radius: 2px;
  transform: translateX(-50%);
  cursor: pointer;
  pointer-events: auto;
  opacity: 0.7;
  transition: opacity 0.15s, height 0.15s;
}

.keyframe-marker:hover {
  opacity: 1;
  height: 20px;
}

.keyframe-marker.active {
  opacity: 1;
  background: #fff;
}

.fps-control label {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #666;
}

.fps-control input {
  width: 42px;
  padding: 4px 6px;
  border-radius: 3px;
  text-align: center;
}

/* Onion Skin Controls */
.onion-skin-controls {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 8px;
  border-left: 1px solid #333;
}

.onion-toggle {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  background: #252525;
  border-radius: 3px;
  color: #888;
  font-size: 11px;
  transition: all 0.15s;
}

.onion-toggle:hover {
  background: #333;
  color: #ccc;
}

.onion-toggle.active {
  background: rgba(232, 93, 4, 0.2);
  color: var(--accent);
}

.onion-counts {
  display: flex;
  align-items: center;
  gap: 4px;
}

.onion-count {
  display: flex;
  align-items: center;
  gap: 2px;
}

.onion-count button {
  width: 18px;
  height: 18px;
  background: #252525;
  border-radius: 2px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #888;
  font-size: 10px;
}

.onion-count button:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.onion-count button:hover:not(:disabled) {
  background: #333;
  color: #fff;
}

.count-value {
  min-width: 14px;
  text-align: center;
  font-size: 11px;
  font-weight: 600;
}

.onion-separator {
  color: #444;
  font-size: 10px;
}

/* Frame Management Controls */
.frame-management {
  display: flex;
  align-items: center;
  gap: 6px;
  padding-left: 8px;
  border-left: 1px solid #333;
}

.frame-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  border-radius: 3px;
  font-size: 11px;
  cursor: pointer;
  transition: all 0.15s;
}

.frame-btn span {
  display: none;
}

@media (min-width: 800px) {
  .frame-btn span {
    display: inline;
  }
}

.add-btn {
  background: #1a3a1a;
  color: #7c7;
  border: 1px solid #2a5a2a;
}

.add-btn:hover {
  background: #2a4a2a;
  border-color: #4a8a4a;
}

.insert-btn {
  background: #1a2a3a;
  color: #7ac;
  border: 1px solid #2a4a5a;
}

.insert-btn:hover {
  background: #2a3a4a;
  border-color: #4a6a8a;
}

/* Mini Dialog */
.mini-dialog {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
}

.mini-dialog-backdrop {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
}

.mini-dialog-content {
  position: relative;
  background: var(--vscode-editor-background, #1e1e1e);
  border: 1px solid var(--vscode-panel-border, #333);
  border-radius: 8px;
  padding: 16px;
  min-width: 280px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
}

.mini-dialog-content h4 {
  margin: 0 0 12px 0;
  font-size: 14px;
  font-weight: 600;
}

.dialog-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.dialog-row label {
  font-size: 12px;
  color: #888;
}

.dialog-row input {
  width: 80px;
  padding: 4px 8px;
  background: var(--vscode-input-background, #252525);
  border: 1px solid var(--vscode-input-border, #444);
  border-radius: 4px;
  color: var(--vscode-input-foreground, #fff);
  font-size: 12px;
}

.dialog-hint {
  font-size: 11px;
  color: #888;
  margin: 0 0 12px 0;
}

.dialog-buttons {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.cancel-btn,
.confirm-btn {
  padding: 6px 12px;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.15s;
}

.cancel-btn {
  background: var(--vscode-button-secondaryBackground, #333);
  border: 1px solid var(--vscode-button-border, #444);
  color: var(--vscode-button-secondaryForeground, #ccc);
}

.cancel-btn:hover {
  background: var(--vscode-button-secondaryHoverBackground, #444);
}

.confirm-btn {
  background: var(--vscode-button-background, var(--accent));
  border: none;
  color: var(--vscode-button-foreground, #fff);
}

.confirm-btn:hover {
  background: var(--vscode-button-hoverBackground, #f06b1a);
}
</style>
