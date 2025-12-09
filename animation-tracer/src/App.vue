<template>
  <div class="app" :style="{ '--ui-scale': settingsStore.uiScale }">
    <header class="app-header">
      <div class="logo">FrameForge</div>
      <nav class="header-nav" v-if="videoStore.hasProject">
        <template v-if="videoStore.hasVideo">
          <label class="toggle-ref">
            <input type="checkbox" v-model="showVideo" />
            <span>Reference</span>
          </label>
          <div class="opacity-slider" v-if="showVideo">
            <input type="range" min="10" max="90" v-model="videoOpacity" />
            <span>{{ videoOpacity }}%</span>
          </div>
          <button class="crop-btn" @click="showCropPanel = !showCropPanel" :class="{ active: showCropPanel }">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2v14a2 2 0 0 0 2 2h14"/><path d="M18 22V8a2 2 0 0 0-2-2H2"/></svg>
            Crop
          </button>
        </template>
        <span v-else class="project-type-badge">Empty Project</span>
        <button class="fit-view-btn" @click="fitToScreen" title="Fit canvas to screen (Ctrl+0)">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 3v18"/><path d="M15 3v18"/><path d="M3 9h18"/><path d="M3 15h18"/></svg>
          Fit
        </button>
        <button class="close-project-btn" @click="closeProject" title="Close project and return to start screen">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
          Close
        </button>
      </nav>
    </header>

    <!-- Crop Panel (collapsible) -->
    <div v-if="showCropPanel && videoStore.hasVideo" class="crop-panel">
      <div class="crop-controls">
        <div class="crop-input">
          <label>Top</label>
          <input type="range" min="0" max="49" :value="videoStore.state.cropTop" @input="updateCrop('top', $event)" />
          <span>{{ videoStore.state.cropTop }}%</span>
        </div>
        <div class="crop-input">
          <label>Bottom</label>
          <input type="range" min="0" max="49" :value="videoStore.state.cropBottom" @input="updateCrop('bottom', $event)" />
          <span>{{ videoStore.state.cropBottom }}%</span>
        </div>
        <div class="crop-input">
          <label>Left</label>
          <input type="range" min="0" max="49" :value="videoStore.state.cropLeft" @input="updateCrop('left', $event)" />
          <span>{{ videoStore.state.cropLeft }}%</span>
        </div>
        <div class="crop-input">
          <label>Right</label>
          <input type="range" min="0" max="49" :value="videoStore.state.cropRight" @input="updateCrop('right', $event)" />
          <span>{{ videoStore.state.cropRight }}%</span>
        </div>
        <button class="reset-crop" @click="videoStore.resetCrop()">Reset</button>
      </div>
    </div>

    <main class="app-main">
      <aside 
        class="sidebar-left" 
        :style="{ 
          width: `${settingsStore.leftSidebarWidth}px`,
          '--sidebar-scale': sidebarScale
        }"
      >
        <div class="sidebar-content">
          <ToolPalette
            @undo="drawingCanvas?.undo()"
            @redo="drawingCanvas?.redo()"
            @clear="drawingCanvas?.clearCanvas()"
          />
        </div>
        <div 
          v-if="settingsStore.resizableSidebars"
          class="resize-handle resize-handle-right"
          @mousedown="startResizeLeft"
        />
      </aside>

      <div class="workspace">
        <div class="canvas-area">
          <!-- Video project: show video layer and drawing layer -->
          <template v-if="videoStore.hasVideo">
            <div class="video-layer" :class="{ hidden: !showVideo }">
              <VideoPlayer ref="videoPlayer" />
            </div>
            <div class="drawing-layer">
              <DrawingCanvas ref="drawingCanvas" />
            </div>
          </template>
          
          <!-- Empty project: show empty canvas layer and drawing layer -->
          <template v-else-if="videoStore.state.isEmptyProject">
            <div class="empty-layer">
              <VideoPlayer ref="videoPlayer" />
            </div>
            <div class="drawing-layer">
              <DrawingCanvas ref="drawingCanvas" />
            </div>
          </template>
          
          <!-- No project: show upload zone -->
          <div v-else class="upload-layer">
            <VideoPlayer ref="videoPlayer" />
          </div>
          
          <!-- Status bar for tool hints -->
          <div class="status-bar" v-if="drawingStore.hoveredHint">
            {{ drawingStore.hoveredHint }}
          </div>
        </div>
      </div>

      <aside 
        class="sidebar-right"
        :style="{ 
          width: `${settingsStore.rightSidebarWidth}px`,
          '--sidebar-scale': sidebarScaleRight
        }"
      >
        <div 
          v-if="settingsStore.resizableSidebars"
          class="resize-handle resize-handle-left"
          @mousedown="startResizeRight"
        />
        <div class="sidebar-tabs">
          <button 
            :class="{ active: activeTab === 'export' }" 
            @click="activeTab = 'export'"
          >Export</button>
          <button 
            :class="{ active: activeTab === 'settings' }" 
            @click="activeTab = 'settings'"
          >Settings</button>
        </div>
        <div class="sidebar-content">
          <ExportPanel v-show="activeTab === 'export'" />
          <SettingsPanel v-show="activeTab === 'settings'" />
        </div>
      </aside>
    </main>

    <footer class="app-footer">
      <Timeline />
    </footer>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed, onMounted, onUnmounted } from 'vue'
import VideoPlayer from './components/VideoPlayer.vue'
import DrawingCanvas from './components/DrawingCanvas.vue'
import ToolPalette from './components/ToolPalette.vue'
import ExportPanel from './components/ExportPanel.vue'
import SettingsPanel from './components/SettingsPanel.vue'
import Timeline from './components/Timeline.vue'
import { useVideoStore } from './stores/videoStore'
import { useDrawingStore } from './stores/drawingStore'
import { useSettingsStore } from './stores/settingsStore'

const videoStore = useVideoStore()
const drawingStore = useDrawingStore()
const settingsStore = useSettingsStore()

const videoPlayer = ref<InstanceType<typeof VideoPlayer> | null>(null)
const drawingCanvas = ref<InstanceType<typeof DrawingCanvas> | null>(null)

const showVideo = ref(true)
const videoOpacity = ref(50)
const showCropPanel = ref(false)
const activeTab = ref<'export' | 'settings'>('export')

// Sidebar scale based on width, combined with UI scale
// Scale increases gradually as width increases (no max limit)
// Minimum scale of 0.9 ensures legibility
const sidebarScale = computed(() => {
  const baseWidth = 220 // Reference width for 1.0 scale
  const widthScale = settingsStore.leftSidebarWidth / baseWidth
  // Clamp between 0.9 and unlimited, then apply UI scale
  return Math.max(0.9, widthScale) * settingsStore.uiScale
})

const sidebarScaleRight = computed(() => {
  const baseWidth = 260 // Reference width for 1.0 scale
  const widthScale = settingsStore.rightSidebarWidth / baseWidth
  // Clamp between 0.9 and unlimited, then apply UI scale
  return Math.max(0.9, widthScale) * settingsStore.uiScale
})

// Sidebar resizing
let isResizingLeft = false
let isResizingRight = false
let resizeStartX = 0
let resizeStartWidth = 0

function startResizeLeft(e: MouseEvent) {
  if (!settingsStore.resizableSidebars) return
  isResizingLeft = true
  resizeStartX = e.clientX
  resizeStartWidth = settingsStore.leftSidebarWidth
  document.addEventListener('mousemove', handleResize)
  document.addEventListener('mouseup', stopResize)
  document.body.style.cursor = 'ew-resize'
  document.body.style.userSelect = 'none'
}

function startResizeRight(e: MouseEvent) {
  if (!settingsStore.resizableSidebars) return
  isResizingRight = true
  resizeStartX = e.clientX
  resizeStartWidth = settingsStore.rightSidebarWidth
  document.addEventListener('mousemove', handleResize)
  document.addEventListener('mouseup', stopResize)
  document.body.style.cursor = 'ew-resize'
  document.body.style.userSelect = 'none'
}

function handleResize(e: MouseEvent) {
  if (isResizingLeft) {
    const delta = e.clientX - resizeStartX
    settingsStore.setLeftSidebarWidth(resizeStartWidth + delta)
  } else if (isResizingRight) {
    const delta = resizeStartX - e.clientX
    settingsStore.setRightSidebarWidth(resizeStartWidth + delta)
  }
}

function stopResize() {
  isResizingLeft = false
  isResizingRight = false
  document.removeEventListener('mousemove', handleResize)
  document.removeEventListener('mouseup', stopResize)
  document.body.style.cursor = ''
  document.body.style.userSelect = ''
}

function updateCrop(side: 'top' | 'bottom' | 'left' | 'right', event: Event) {
  const value = parseInt((event.target as HTMLInputElement).value)
  const { cropTop, cropRight, cropBottom, cropLeft } = videoStore.state
  switch (side) {
    case 'top':
      videoStore.setCrop(value, cropRight, cropBottom, cropLeft)
      break
    case 'bottom':
      videoStore.setCrop(cropTop, cropRight, value, cropLeft)
      break
    case 'left':
      videoStore.setCrop(cropTop, cropRight, cropBottom, value)
      break
    case 'right':
      videoStore.setCrop(cropTop, value, cropBottom, cropLeft)
      break
  }
}

function closeProject() {
  // Clear video/project state
  videoStore.clearVideo()
  // Reset drawing state
  drawingStore.resetViewport()
  // Hide crop panel if open
  showCropPanel.value = false
}

function fitToScreen() {
  console.log('fitToScreen called, drawingCanvas:', drawingCanvas.value)
  if (drawingCanvas.value) {
    console.log('Calling fitToScreen on canvas')
    drawingCanvas.value.fitToScreen()
  } else {
    console.log('drawingCanvas ref is null!')
  }
}

// Apply video opacity as CSS variable
watch(videoOpacity, (newVal) => {
  document.documentElement.style.setProperty('--video-opacity', `${newVal / 100}`)
}, { immediate: true })

// Global keyboard shortcuts (respects custom mappings)
function handleGlobalKeydown(e: KeyboardEvent) {
  // Don't handle if in remap mode or typing in an input
  if (settingsStore.remapMode) return
  if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
  
  // Handle Ctrl+Z and Ctrl+Y directly for undo/redo
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
    e.preventDefault()
    drawingCanvas.value?.undo()
    return
  }
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
    e.preventDefault()
    drawingCanvas.value?.redo()
    return
  }
  
  const action = settingsStore.getActionForKey(e.key.toLowerCase()) || settingsStore.getActionForKey(e.key)
  if (!action) return
  
  e.preventDefault()
  executeAction(action, e.ctrlKey || e.metaKey)
}

function executeAction(action: string, withModifier: boolean = false) {
  switch (action) {
    case 'pen':
    case 'eraser':
    case 'line':
    case 'rectangle':
    case 'circle':
    case 'select':
      drawingStore.setTool(action as any)
      break
    case 'undo':
      if (withModifier) drawingCanvas.value?.undo()
      break
    case 'redo':
      if (withModifier) drawingCanvas.value?.redo()
      break
    case 'clear':
      drawingCanvas.value?.clearCanvas()
      break
    case 'prevFrame':
      if (videoStore.state.currentFrame > 0) {
        videoStore.setCurrentFrame(videoStore.state.currentFrame - 1)
      }
      break
    case 'nextFrame':
      if (videoStore.state.currentFrame < videoStore.state.frameCount - 1) {
        videoStore.setCurrentFrame(videoStore.state.currentFrame + 1)
      }
      break
  }
}

// Register global key handler
onMounted(async () => {
  // Initialize stores from IndexedDB
  await Promise.all([
    drawingStore.initFromStorage(),
    settingsStore.initFromStorage(),
    videoStore.initFromStorage()
  ])
  
  window.addEventListener('keydown', handleGlobalKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleGlobalKeydown)
})
</script>

<style scoped>
.app {
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
  background: #181818;
  font-size: max(11px, calc(14px * var(--ui-scale, 1)));
}

.app-header {
  padding: 0 calc(16px * var(--ui-scale, 1));
  height: calc(42px * var(--ui-scale, 1));
  background: #0d0d0d;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid #2a2a2a;
}

.logo {
  font-weight: 700;
  font-size: calc(15px * var(--ui-scale, 1));
  letter-spacing: -0.5px;
  color: #fff;
}

.header-nav {
  display: flex;
  align-items: center;
  gap: calc(16px * var(--ui-scale, 1));
}

.toggle-ref {
  display: flex;
  align-items: center;
  gap: calc(6px * var(--ui-scale, 1));
  font-size: calc(12px * var(--ui-scale, 1));
  color: #aaa;
  cursor: pointer;
}

.toggle-ref input {
  accent-color: var(--accent);
  transform: scale(var(--ui-scale, 1));
}

.opacity-slider {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  color: #666;
}

.opacity-slider input[type="range"] {
  width: 70px;
  height: 3px;
}

.app-main {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.sidebar-left {
  flex-shrink: 0;
  background: #1a1a1a;
  border-right: 1px solid #2a2a2a;
  overflow: hidden;
  position: relative;
  display: flex;
  flex-direction: column;
}

.sidebar-right {
  flex-shrink: 0;
  background: #1a1a1a;
  border-left: 1px solid #2a2a2a;
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: hidden;
}

.sidebar-content {
  flex: 1;
  min-height: 0; /* Critical for flex container scrolling */
  overflow-y: auto;
  overflow-x: hidden;
  transform: scale(var(--sidebar-scale, 1));
  transform-origin: top left;
  width: calc(100% / var(--sidebar-scale, 1));
  height: calc(100% / var(--sidebar-scale, 1));
}

.resize-handle {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 6px;
  cursor: ew-resize;
  z-index: 10;
  transition: background 0.15s;
}

.resize-handle:hover {
  background: var(--accent, #e85d04);
}

.resize-handle-right {
  right: -3px;
}

.resize-handle-left {
  left: -3px;
}

.sidebar-tabs {
  display: flex;
  border-bottom: 1px solid #2a2a2a;
  flex-shrink: 0;
  transform: scale(var(--sidebar-scale, 1));
  transform-origin: top left;
  width: calc(100% / var(--sidebar-scale, 1));
}

.sidebar-tabs button {
  flex: 1;
  padding: 8px 12px;
  background: transparent;
  font-size: 11px;
  color: #666;
  border-bottom: 2px solid transparent;
  margin-bottom: -1px;
}

.sidebar-tabs button:hover {
  color: #aaa;
}

.sidebar-tabs button.active {
  color: #fff;
  border-bottom-color: var(--accent, #e85d04);
}

.workspace {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.canvas-area {
  flex: 1;
  position: relative;
  overflow: hidden;
  background: 
    linear-gradient(45deg, #1e1e1e 25%, transparent 25%),
    linear-gradient(-45deg, #1e1e1e 25%, transparent 25%),
    linear-gradient(45deg, transparent 75%, #1e1e1e 75%),
    linear-gradient(-45deg, transparent 75%, #1e1e1e 75%);
  background-size: 16px 16px;
  background-position: 0 0, 0 8px, 8px -8px, -8px 0px;
  background-color: #161616;
}

.video-layer {
  position: absolute;
  inset: 0;
  opacity: var(--video-opacity, 0.5);
  pointer-events: none;
  z-index: 1;
}

.video-layer.hidden {
  display: none;
}

.drawing-layer {
  position: absolute;
  inset: 0;
  z-index: 2;
}

.upload-layer {
  position: absolute;
  inset: 0;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: center;
}

.empty-layer {
  position: absolute;
  inset: 0;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.project-type-badge {
  padding: 4px 10px;
  background: #1a3a1a;
  color: #7c7;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 500;
}

.status-bar {
  position: absolute;
  bottom: 8px;
  left: 8px;
  padding: 6px 12px;
  background: rgba(0, 0, 0, 0.8);
  color: #ccc;
  font-size: 11px;
  border-radius: 4px;
  z-index: 100;
  pointer-events: none;
  max-width: 300px;
}

.app-footer {
  flex-shrink: 0;
  background: #1a1a1a;
  border-top: 1px solid #2a2a2a;
}

.crop-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  background: #252525;
  border-radius: 4px;
  font-size: 11px;
  color: #888;
}

.crop-btn:hover {
  background: #333;
  color: #fff;
}

.crop-btn.active {
  background: var(--accent);
  color: #fff;
}

.fit-view-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  background: #252525;
  border-radius: 4px;
  font-size: 11px;
  color: #888;
}

.fit-view-btn:hover {
  background: #333;
  color: #fff;
}

.close-project-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  background: #252525;
  border-radius: 4px;
  font-size: 11px;
  color: #888;
  margin-left: auto;
}

.close-project-btn:hover {
  background: #4a2020;
  color: #ff6b6b;
}

.crop-panel {
  background: #0d0d0d;
  border-bottom: 1px solid #2a2a2a;
  padding: 10px 16px;
}

.crop-controls {
  display: flex;
  align-items: center;
  gap: 20px;
  flex-wrap: wrap;
}

.crop-input {
  display: flex;
  align-items: center;
  gap: 8px;
}

.crop-input label {
  font-size: 11px;
  color: #666;
  width: 45px;
}

.crop-input input[type="range"] {
  width: 80px;
  height: 3px;
}

.crop-input span {
  font-size: 10px;
  color: #555;
  width: 28px;
  text-align: right;
  font-variant-numeric: tabular-nums;
}

.reset-crop {
  padding: 4px 10px;
  background: #252525;
  border-radius: 3px;
  font-size: 10px;
  color: #888;
  margin-left: auto;
}

.reset-crop:hover {
  background: #333;
  color: #fff;
}
</style>
