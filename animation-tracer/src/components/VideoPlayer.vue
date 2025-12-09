<template>
  <div class="video-player">
    <!-- Upload zone - shown only when no project is active -->
    <div
      v-if="!videoStore.hasProject"
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
        
        <!-- Reopen Last Video Button -->
        <div v-if="videoStore.hasSavedVideo" class="reopen-section">
          <p class="reopen-hint">Previous session detected</p>
          <button class="reopen-button" @click="reopenLastVideo">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
              <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
              <path d="M3 3v5h5"/>
            </svg>
            Reopen "{{ videoStore.lastVideoName }}"
          </button>
        </div>

        <!-- New Empty Project Button -->
        <div class="new-project-section">
          <p class="new-hint">Or start fresh</p>
          <button class="new-project-button" @click="showNewProjectDialog = true">
            <Plus :size="16" />
            New Empty Project
          </button>
        </div>
      </div>
    </div>

    <!-- Video container - shown when video is loaded -->
    <div v-else-if="videoStore.hasVideo" class="video-container" ref="videoContainerRef">
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
        :style="frameCanvasStyle"
      />
    </div>

    <!-- Empty project canvas - checkerboard background -->
    <div v-else-if="videoStore.state.isEmptyProject" class="empty-project-container" ref="emptyContainerRef">
      <canvas 
        ref="emptyCanvas" 
        class="empty-canvas"
        :width="videoStore.state.width"
        :height="videoStore.state.height"
        :style="emptyCanvasStyle"
      />
    </div>

    <!-- New Project Dialog -->
    <NewProjectDialog 
      :isOpen="showNewProjectDialog" 
      @close="showNewProjectDialog = false"
      @created="onProjectCreated"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { Plus } from 'lucide-vue-next'
import { useVideoStore } from '../stores/videoStore'
import { useDrawingStore } from '../stores/drawingStore'
import { useProjectStore } from '../stores/projectStore'
import NewProjectDialog from './NewProjectDialog.vue'

const videoStore = useVideoStore()
const drawingStore = useDrawingStore()
const projectStore = useProjectStore()

const videoElement = ref<HTMLVideoElement | null>(null)
const frameCanvas = ref<HTMLCanvasElement | null>(null)
const emptyCanvas = ref<HTMLCanvasElement | null>(null)
const emptyContainerRef = ref<HTMLDivElement | null>(null)
const videoContainerRef = ref<HTMLDivElement | null>(null)
const isDragging = ref(false)
const showNewProjectDialog = ref(false)

const emit = defineEmits<{
  frameReady: [imageData: ImageData]
}>()

// Computed style for empty canvas that uses viewport transform
const emptyCanvasStyle = computed(() => {
  if (!emptyContainerRef.value) return {}
  
  const container = emptyContainerRef.value
  const canvasWidth = videoStore.state.width
  const canvasHeight = videoStore.state.height
  const zoom = drawingStore.viewport.zoom
  const panX = drawingStore.viewport.panX
  const panY = drawingStore.viewport.panY
  
  const scaledWidth = canvasWidth * zoom
  const scaledHeight = canvasHeight * zoom
  
  // Center horizontally, position vertically with pan
  const offsetX = (container.clientWidth - scaledWidth) / 2 + panX
  const offsetY = (container.clientHeight - scaledHeight) / 2 + panY
  
  return {
    left: `${offsetX}px`,
    top: `${offsetY}px`,
    transform: `scale(${zoom})`,
  }
})

// Computed style for video frame canvas that uses viewport transform + crop
const frameCanvasStyle = computed(() => {
  if (!videoContainerRef.value) return {}
  
  const container = videoContainerRef.value
  const canvasWidth = videoStore.state.width
  const canvasHeight = videoStore.state.height
  const zoom = drawingStore.viewport.zoom
  const panX = drawingStore.viewport.panX
  const panY = drawingStore.viewport.panY
  
  const scaledWidth = canvasWidth * zoom
  const scaledHeight = canvasHeight * zoom
  
  // Center horizontally, position vertically with pan
  const offsetX = (container.clientWidth - scaledWidth) / 2 + panX
  const offsetY = (container.clientHeight - scaledHeight) / 2 + panY
  
  // Start with viewport transform
  const style: Record<string, string> = {
    position: 'absolute',
    left: `${offsetX}px`,
    top: `${offsetY}px`,
    transform: `scale(${zoom})`,
    transformOrigin: 'top left',
    width: `${canvasWidth}px`,
    height: `${canvasHeight}px`,
  }
  
  // Add crop if needed
  const { cropTop, cropRight, cropBottom, cropLeft } = videoStore.state
  if (cropTop !== 0 || cropRight !== 0 || cropBottom !== 0 || cropLeft !== 0) {
    style.clipPath = `inset(${cropTop}% ${cropRight}% ${cropBottom}% ${cropLeft}%)`
  }
  
  return style
})

function handleDrop(e: DragEvent) {
  isDragging.value = false
  const files = e.dataTransfer?.files
  if (files && files.length > 0) {
    const file = files[0]
    if (file.type.startsWith('video/')) {
      // Reset project and load video
      projectStore.resetProject()
      drawingStore.clearAllDrawings()
      videoStore.loadVideo(file)
      
      // Prompt for save location after video loads
      promptSaveLocationForVideo(file.name)
    }
  }
}

function handleFileSelect(e: Event) {
  const input = e.target as HTMLInputElement
  if (input.files && input.files.length > 0) {
    const file = input.files[0]
    // Reset project and load video
    projectStore.resetProject()
    drawingStore.clearAllDrawings()
    videoStore.loadVideo(file)
    
    // Prompt for save location after video loads
    promptSaveLocationForVideo(file.name)
  }
}

// Helper to prompt save location with video filename as suggestion
function promptSaveLocationForVideo(videoFilename: string) {
  // Extract name without extension
  const suggestedName = videoFilename.replace(/\.[^.]+$/, '')
  
  // Wait for video to fully load then prompt
  setTimeout(async () => {
    await projectStore.pickSaveLocation(suggestedName)
  }, 500)
}

// Reopen last video - opens file picker for user to select the file
async function reopenLastVideo() {
  // Create a hidden file input and trigger it
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = 'video/*'
  input.onchange = (e) => {
    const target = e.target as HTMLInputElement
    if (target.files && target.files.length > 0) {
      videoStore.loadVideo(target.files[0])
    }
  }
  input.click()
}

function onVideoLoaded() {
  const video = videoElement.value
  if (!video) return

  videoStore.setVideoMetadata(video.duration, video.videoWidth, video.videoHeight)
  
  // Apply saved frame position if available
  videoStore.applySavedSettings()
  
  seekToFrame(videoStore.state.currentFrame)
}

function onSeeked() {
  renderCurrentFrame()
  // Notify the store that video seek is complete - this allows drawings to load
  videoStore.notifyVideoSeeked()
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
    if (videoStore.hasVideo) {
      seekToFrame(newFrame)
    }
  }
)

// Render empty project canvas with checkerboard pattern
function renderEmptyCanvas() {
  const canvas = emptyCanvas.value
  if (!canvas) return

  const ctx = canvas.getContext('2d')
  if (!ctx) return

  // Draw checkerboard pattern
  const tileSize = 8
  const lightColor = '#3a3a3a'
  const darkColor = '#2a2a2a'

  for (let y = 0; y < canvas.height; y += tileSize) {
    for (let x = 0; x < canvas.width; x += tileSize) {
      const isLight = ((x / tileSize) + (y / tileSize)) % 2 === 0
      ctx.fillStyle = isLight ? lightColor : darkColor
      ctx.fillRect(x, y, tileSize, tileSize)
    }
  }
}

// Watch for empty project state
watch(
  () => videoStore.state.isEmptyProject,
  async (isEmptyProject) => {
    if (isEmptyProject) {
      await nextTick()
      renderEmptyCanvas()
      // Notify that no video seek is needed for empty projects
      videoStore.notifyVideoSeeked()
    }
  },
  { immediate: true }
)

// Watch for dimension changes in empty projects
watch(
  () => [videoStore.state.width, videoStore.state.height],
  async () => {
    if (videoStore.state.isEmptyProject) {
      await nextTick()
      renderEmptyCanvas()
    }
  }
)

// Called when new project is created
function onProjectCreated() {
  nextTick(() => {
    renderEmptyCanvas()
  })
}

// Keyboard navigation
function handleKeydown(e: KeyboardEvent) {
  if (!videoStore.hasProject) return

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

.reopen-section {
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid #333;
}

.reopen-hint {
  font-size: 11px;
  color: #888;
  margin-bottom: 8px;
}

.reopen-button {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background: #2a2a2a;
  color: #ccc;
  border: 1px solid #444;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.15s;
}

.reopen-button:hover {
  background: #333;
  border-color: var(--accent);
  color: #fff;
}

.reopen-button svg {
  opacity: 0.7;
}

.new-project-section {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #333;
}

.new-hint {
  font-size: 11px;
  color: #888;
  margin-bottom: 8px;
}

.new-project-button {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background: #1a3a1a;
  color: #7c7;
  border: 1px solid #2a5a2a;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.15s;
}

.new-project-button:hover {
  background: #2a4a2a;
  border-color: #4a8a4a;
  color: #9d9;
}

.video-container {
  position: absolute;
  inset: 0;
  overflow: hidden;
}

.video-container video {
  display: none;
}

.frame-canvas {
  position: absolute;
  transform-origin: top left;
  image-rendering: -webkit-optimize-contrast;
  image-rendering: crisp-edges;
  image-rendering: pixelated;
}

.empty-project-container {
  position: absolute;
  inset: 0;
  overflow: hidden;
}

.empty-canvas {
  position: absolute;
  transform-origin: top left;
  border: 1px solid #333;
  image-rendering: -webkit-optimize-contrast;
  image-rendering: crisp-edges;
  image-rendering: pixelated;
}
</style>
