<template>
  <div class="mobile-timeline">
    <!-- Previous frame -->
    <button class="nav-btn" @click="prevFrame" :disabled="!canGoPrev">
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
    </button>
    
    <!-- Play/Pause -->
    <button class="play-btn" @click="togglePlay">
      <svg v-if="isPlaying" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="none"><rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/></svg>
      <svg v-else xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="none"><polygon points="5 3 19 12 5 21 5 3"/></svg>
    </button>
    
    <!-- Frame counter -->
    <div class="frame-counter">
      <span class="current">{{ currentFrame + 1 }}</span>
      <span class="separator">/</span>
      <span class="total">{{ totalFrames }}</span>
    </div>
    
    <!-- Next frame -->
    <button class="nav-btn" @click="nextFrame" :disabled="!canGoNext">
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
    </button>
    
    <!-- Add frame -->
    <button class="add-btn" @click="addFrame">
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onUnmounted } from 'vue'
import { useVideoStore } from '../../stores/videoStore'

const videoStore = useVideoStore()

const isPlaying = ref(false)
let playInterval: ReturnType<typeof setInterval> | null = null

const currentFrame = computed(() => videoStore.state.currentFrame)
const totalFrames = computed(() => videoStore.state.frameCount || 1)

const canGoPrev = computed(() => currentFrame.value > 0)
const canGoNext = computed(() => currentFrame.value < totalFrames.value - 1)

function prevFrame() {
  if (canGoPrev.value) {
    videoStore.setCurrentFrame(currentFrame.value - 1)
  }
}

function nextFrame() {
  if (canGoNext.value) {
    videoStore.setCurrentFrame(currentFrame.value + 1)
  }
}

function togglePlay() {
  if (isPlaying.value) {
    stopPlayback()
  } else {
    startPlayback()
  }
}

function startPlayback() {
  isPlaying.value = true
  const fps = videoStore.state.fps || 12
  const interval = 1000 / fps
  
  playInterval = setInterval(() => {
    if (currentFrame.value < totalFrames.value - 1) {
      videoStore.setCurrentFrame(currentFrame.value + 1)
    } else {
      // Loop back to start
      videoStore.setCurrentFrame(0)
    }
  }, interval)
}

function stopPlayback() {
  isPlaying.value = false
  if (playInterval) {
    clearInterval(playInterval)
    playInterval = null
  }
}

function addFrame() {
  // Insert a new frame after current using store method
  videoStore.insertFramesAfterCurrent(1)
}

onUnmounted(() => {
  stopPlayback()
})
</script>

<style scoped>
.mobile-timeline {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  height: 52px;
  padding: 0 12px;
  background: #151515;
  border-top: 1px solid #2a2a2a;
  user-select: none;
  -webkit-user-select: none;
}

.nav-btn,
.play-btn,
.add-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  background: #2a2a2a;
  border: none;
  border-radius: 8px;
  color: #ccc;
  cursor: pointer;
  transition: all 0.15s ease;
}

.nav-btn {
  width: 44px;
  height: 40px;
  font-size: 14px;
}

.nav-btn:disabled {
  opacity: 0.3;
  cursor: default;
}

.nav-btn:not(:disabled):active {
  background: #3a3a3a;
  transform: scale(0.95);
}

.play-btn {
  width: 52px;
  height: 40px;
  font-size: 18px;
  background: #4a9eff;
  color: #fff;
}

.play-btn:active {
  background: #3a8eef;
  transform: scale(0.95);
}

.frame-counter {
  display: flex;
  align-items: baseline;
  gap: 2px;
  min-width: 70px;
  justify-content: center;
  font-family: 'Consolas', 'Monaco', monospace;
}

.current {
  font-size: 18px;
  font-weight: 700;
  color: #eee;
}

.separator {
  font-size: 14px;
  color: #555;
  margin: 0 2px;
}

.total {
  font-size: 14px;
  color: #666;
}

.add-btn {
  width: 40px;
  height: 40px;
  font-size: 20px;
  font-weight: 600;
  color: #7c7;
}

.add-btn:active {
  background: #3a3a3a;
  transform: scale(0.95);
}
</style>
