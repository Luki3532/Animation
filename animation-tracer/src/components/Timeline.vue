<template>
  <div class="timeline" v-if="videoStore.hasVideo">
    <div class="timeline-controls">
      <button @click="videoStore.previousFrame()" :disabled="videoStore.state.currentFrame === 0">
        ◀
      </button>
      <span class="frame-info">
        Frame {{ videoStore.state.currentFrame + 1 }} / {{ videoStore.state.frameCount }}
      </span>
      <button @click="videoStore.nextFrame()" :disabled="videoStore.state.currentFrame >= videoStore.state.frameCount - 1">
        ▶
      </button>
    </div>

    <div class="timeline-slider">
      <input
        type="range"
        :min="0"
        :max="videoStore.state.frameCount - 1"
        :value="videoStore.state.currentFrame"
        @input="onSliderChange"
      />
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

    <div class="drawn-frames">
      <span class="drawn-label">Drawn frames:</span>
      <div class="frame-indicators">
        <span
          v-for="frameIndex in drawingStore.drawnFrameIndices"
          :key="frameIndex"
          class="frame-indicator"
          :class="{ active: frameIndex === videoStore.state.currentFrame }"
          @click="videoStore.setCurrentFrame(frameIndex)"
        >
          {{ frameIndex + 1 }}
        </span>
        <span v-if="drawingStore.drawnFrameIndices.length === 0" class="no-frames">
          None yet
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useVideoStore } from '../stores/videoStore'
import { useDrawingStore } from '../stores/drawingStore'

const videoStore = useVideoStore()
const drawingStore = useDrawingStore()

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
  font-size: 11px;
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
  min-width: 90px;
  text-align: center;
  color: #888;
  font-variant-numeric: tabular-nums;
}

.timeline-slider {
  flex: 1;
  min-width: 150px;
}

.timeline-slider input[type="range"] {
  width: 100%;
  height: 4px;
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

.drawn-frames {
  display: flex;
  align-items: center;
  gap: 6px;
}

.drawn-label {
  color: #555;
}

.frame-indicators {
  display: flex;
  gap: 3px;
  flex-wrap: wrap;
}

.frame-indicator {
  padding: 2px 5px;
  background: #2a2a2a;
  color: #888;
  border-radius: 3px;
  font-size: 10px;
  cursor: pointer;
  font-variant-numeric: tabular-nums;
}

.frame-indicator:hover {
  background: var(--accent);
  color: #fff;
}

.frame-indicator.active {
  background: var(--accent);
  color: #fff;
}

.no-frames {
  color: #444;
  font-style: italic;
}
</style>
