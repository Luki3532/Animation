<template>
  <div class="video-player">
    <div
      v-if="!videoStore.hasVideo"
      class="upload-zone"
      @drop.prevent="handleDrop"
      @dragover.prevent="isDragging = true"
      @dragleave="isDragging = false"
      :class="{ dragging: isDragging }"
    >
      <div class="upload-content">
        <svg class="upload-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="17,8 12,3 7,8" />
          <line x1="12" y1="3" x2="12" y2="15" />
        </svg>
        <p>Drag & drop a video file here</p>
        <p class="or-text">or</p>
        <label class="file-button">
          Choose File
          <input type="file" accept="video/*" @change="handleFileSelect" hidden />
        </label>
      </div>
    </div>

    <div v-else class="video-container">
      <video
        ref="videoElement"
        :src="videoStore.state.url"
        @loadedmetadata="onVideoLoaded"
        @seeked="onSeeked"
        muted
        playsinline
      />
      <canvas 
        ref="frameCanvas" 
        class="frame-canvas"
        :style="cropStyle"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed, onMounted, onUnmounted } from 'vue'
import { useVideoStore } from '../stores/videoStore'

const videoStore = useVideoStore()

const videoElement = ref<HTMLVideoElement | null>(null)
const frameCanvas = ref<HTMLCanvasElement | null>(null)
const isDragging = ref(false)

const emit = defineEmits<{
  frameReady: [imageData: ImageData]
}>()

// Crop style using CSS clip-path (instant, no processing)
const cropStyle = computed(() => {
  const { cropTop, cropRight, cropBottom, cropLeft } = videoStore.state
  if (cropTop === 0 && cropRight === 0 && cropBottom === 0 && cropLeft === 0) {
    return {}
  }
  return {
    clipPath: `inset(${cropTop}% ${cropRight}% ${cropBottom}% ${cropLeft}%)`
  }
})
function handleDrop(e: DragEvent) {
  isDragging.value = false
  const files = e.dataTransfer?.files
  if (files && files.length > 0) {
    const file = files[0]
    if (file.type.startsWith('video/')) {
      videoStore.loadVideo(file)
    }
  }
}

function handleFileSelect(e: Event) {
  const input = e.target as HTMLInputElement
  if (input.files && input.files.length > 0) {
    videoStore.loadVideo(input.files[0])
  }
}

function onVideoLoaded() {
  const video = videoElement.value
  if (!video) return

  videoStore.setVideoMetadata(video.duration, video.videoWidth, video.videoHeight)
  seekToFrame(0)
}

function onSeeked() {
  renderCurrentFrame()
}

function seekToFrame(frame: number) {
  const video = videoElement.value
  if (!video) return

  const time = frame / videoStore.state.fps
  video.currentTime = time
}

function renderCurrentFrame() {
  const video = videoElement.value
  const canvas = frameCanvas.value
  if (!video || !canvas) return

  const ctx = canvas.getContext('2d')
  if (!ctx) return

  // Set canvas size to match video
  canvas.width = video.videoWidth
  canvas.height = video.videoHeight

  // Draw video frame
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

  // Emit frame data for drawing overlay
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
  emit('frameReady', imageData)
}

// Watch for frame changes
watch(
  () => videoStore.state.currentFrame,
  (newFrame) => {
    seekToFrame(newFrame)
  }
)

// Keyboard navigation
function handleKeydown(e: KeyboardEvent) {
  if (!videoStore.hasVideo) return

  if (e.key === 'ArrowRight') {
    e.preventDefault()
    videoStore.nextFrame()
  } else if (e.key === 'ArrowLeft') {
    e.preventDefault()
    videoStore.previousFrame()
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
})

// Expose methods for parent component
defineExpose({
  seekToFrame,
  renderCurrentFrame
})
</script>

<style scoped>
.video-player {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.upload-zone {
  width: 90%;
  max-width: 400px;
  padding: 48px 32px;
  border: 2px dashed #333;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s;
  background: rgba(30, 30, 30, 0.5);
}

.upload-zone.dragging {
  border-color: var(--accent);
  background: rgba(232, 93, 4, 0.1);
}

.upload-content {
  text-align: center;
  color: #666;
}

.upload-content p {
  margin: 0;
}

.upload-icon {
  width: 48px;
  height: 48px;
  margin-bottom: 12px;
  opacity: 0.4;
  color: #555;
}

.or-text {
  margin: 10px 0;
  font-size: 12px;
  color: #444;
}

.file-button {
  display: inline-block;
  padding: 10px 20px;
  background: var(--accent);
  color: white;
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
  transition: background 0.15s;
}

.file-button:hover {
  background: #f06b1a;
}

.video-container {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.video-container video {
  display: none;
}

.frame-canvas {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}
</style>
