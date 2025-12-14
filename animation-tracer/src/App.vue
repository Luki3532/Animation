<template>
  <!-- Mobile Mode -->
  <MobileApp v-if="settingsStore.isMobileMode" />
  
  <!-- Desktop Mode -->
  <div v-else class="app" :style="{ '--ui-scale': settingsStore.uiScale }">
    <header class="app-header">
      <div class="logo">FrameForge</div>
      
      <!-- File/Project controls (always visible) -->
      <div class="file-controls">
        <button class="file-btn" @click="projectStore.loadProject()" title="Open Project (Ctrl+O)">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
          Open
        </button>
        <button class="file-btn" @click="projectStore.saveProject()" :disabled="!videoStore.hasProject" title="Save Project (Ctrl+S)">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
          Save
        </button>
        <button 
          class="file-btn checkpoint-btn" 
          @click="projectStore.createCheckpoint()" 
          :disabled="!videoStore.hasProject" 
          title="Create Checkpoint (Ctrl+Q)"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v4"/><path d="m16.24 7.76-2.83 2.83"/><path d="M22 12h-4"/><path d="m16.24 16.24-2.83-2.83"/><path d="M12 22v-4"/><path d="m7.76 16.24 2.83-2.83"/><path d="M2 12h4"/><path d="m7.76 7.76 2.83 2.83"/></svg>
          <span v-if="projectStore.checkpointCount > 0" class="checkpoint-badge">{{ projectStore.checkpointCount }}</span>
        </button>
        <button 
          class="file-btn history-btn" 
          @click="projectStore.toggleCheckpointPanel()" 
          :disabled="!projectStore.hasCheckpoints"
          :class="{ active: projectStore.showCheckpointPanel }"
          title="View Checkpoints"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
        </button>
        
        <!-- Auto-save status indicator -->
        <span 
          v-if="videoStore.hasProject" 
          class="auto-save-status"
          :class="projectStore.autoSaveStatus"
          :title="projectStore.hasFileHandle ? `Auto-saving to ${projectStore.projectPath}` : 'Click Save to enable auto-save'"
        >
          <svg v-if="projectStore.autoSaveStatus === 'saving'" class="spin" xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
          <svg v-else-if="projectStore.autoSaveStatus === 'saved'" xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
          <svg v-else-if="projectStore.autoSaveStatus === 'error'" xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          {{ projectStore.autoSaveStatusText }}
        </span>
        
        <!-- Format selector with help tooltip -->
        <div 
          v-if="videoStore.hasProject && videoStore.hasVideo"
          class="format-selector-group"
        >
          <select 
            class="format-select"
            :value="projectStore.currentFormat"
            @change="handleFormatChange"
          >
            <option value="lucas">.lucas (smaller)</option>
            <option value="fluf">.fluf ★</option>
          </select>
          <div class="format-help">
            <span class="format-help-icon">?</span>
            <div class="format-tooltip">
              <div class="format-tooltip-item">
                <strong>.lucas</strong>
                <p>Smaller file size, references video by filename. Best when you'll always have the video file available on this computer.</p>
              </div>
              <div class="format-tooltip-item recommended">
                <strong><svg class="rec-icon" xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg> .fluf — Recommended</strong>
                <p>Embeds video in project file. Larger but completely portable - perfect for sharing or archiving your work.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
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
    
    <!-- Toast notification -->
    <Transition name="toast">
      <div v-if="projectStore.showToast" class="toast-notification">
        {{ projectStore.lastToastMessage }}
      </div>
    </Transition>
    
    <!-- Checkpoint Panel -->
    <CheckpointPanel v-if="projectStore.showCheckpointPanel" />
    
    <!-- Video Reconnect Dialog -->
    <VideoReconnectDialog />

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
        <div class="canvas-area" :style="{ '--canvas-bg': settingsStore.canvasBackgroundColor }">
          <!-- Video project: show video layer and drawing layer -->
          <template v-if="videoStore.hasVideo">
            <div class="video-layer" :class="{ hidden: !showVideo }">
              <VideoPlayer ref="videoPlayer" @video-loaded="onVideoLoaded" />
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
  
  <!-- Mobile Mode Detection Dialog -->
  <MobileModeDialog />
</template>

<script setup lang="ts">
import { ref, watch, computed, onMounted, onUnmounted, nextTick } from 'vue'
import VideoPlayer from './components/VideoPlayer.vue'
import DrawingCanvas from './components/DrawingCanvas.vue'
import ToolPalette from './components/ToolPalette.vue'
import ExportPanel from './components/ExportPanel.vue'
import SettingsPanel from './components/SettingsPanel.vue'
import Timeline from './components/Timeline.vue'
import CheckpointPanel from './components/CheckpointPanel.vue'
import VideoReconnectDialog from './components/VideoReconnectDialog.vue'
import MobileApp from './components/mobile/MobileApp.vue'
import MobileModeDialog from './components/MobileModeDialog.vue'
import { useVideoStore } from './stores/videoStore'
import { useDrawingStore } from './stores/drawingStore'
import { useSettingsStore } from './stores/settingsStore'
import { useProjectStore } from './stores/projectStore'

const videoStore = useVideoStore()
const drawingStore = useDrawingStore()
const settingsStore = useSettingsStore()
const projectStore = useProjectStore()

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
  drawingCanvas.value?.fitToScreen()
}

// Called when video finishes loading - auto fit to screen
function onVideoLoaded() {
  // Use nextTick to ensure DOM is ready
  nextTick(() => {
    fitToScreen()
  })
}

// Handle format change from dropdown
function handleFormatChange(e: Event) {
  const value = (e.target as HTMLSelectElement).value as 'lucas' | 'fluf'
  projectStore.setFormat(value)
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
  
  // Handle Ctrl+Q for checkpoint
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'q') {
    e.preventDefault()
    if (videoStore.hasProject) {
      projectStore.createCheckpoint()
    }
    return
  }
  
  // Handle Ctrl+S for save project
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
    e.preventDefault()
    if (videoStore.hasProject) {
      projectStore.saveProject()
    }
    return
  }
  
  // Handle Ctrl+O for open project
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'o') {
    e.preventDefault()
    projectStore.loadProject()
    return
  }
  
  // Handle Ctrl+Z for undo, Ctrl+Shift+Z and Ctrl+Y for redo
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
    e.preventDefault()
    if (e.shiftKey) {
      drawingCanvas.value?.redo()
    } else {
      drawingCanvas.value?.undo()
    }
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
  
  // Mobile detection
  detectMobileDevice()
  checkMobileViewport()
  window.addEventListener('resize', checkMobileViewport)
  
  window.addEventListener('keydown', handleGlobalKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleGlobalKeydown)
  window.removeEventListener('resize', checkMobileViewport)
})

// Mobile detection functions
function detectMobileDevice() {
  // Check for touch-primary device using media query
  const isTouchDevice = window.matchMedia('(pointer: coarse)').matches
  // Also check user agent for mobile devices
  const isMobileUA = /Android|iPhone|iPad|iPod|webOS|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
  settingsStore.setMobileDevice(isTouchDevice || isMobileUA)
}

function checkMobileViewport() {
  const isMobileWidth = window.innerWidth <= 768
  settingsStore.setMobileViewport(isMobileWidth)
}
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
  gap: calc(16px * var(--ui-scale, 1));
}

.logo {
  font-weight: 700;
  font-size: calc(15px * var(--ui-scale, 1));
  letter-spacing: -0.5px;
  color: #fff;
}

/* File/Project controls */
.file-controls {
  display: flex;
  align-items: center;
  gap: calc(4px * var(--ui-scale, 1));
  margin-left: calc(16px * var(--ui-scale, 1));
}

.file-btn {
  display: flex;
  align-items: center;
  gap: calc(4px * var(--ui-scale, 1));
  padding: calc(5px * var(--ui-scale, 1)) calc(8px * var(--ui-scale, 1));
  background: #252525;
  border: 1px solid #333;
  border-radius: calc(4px * var(--ui-scale, 1));
  color: #aaa;
  font-size: calc(11px * var(--ui-scale, 1));
  cursor: pointer;
  transition: all 0.15s ease;
}

.file-btn:hover:not(:disabled) {
  background: #333;
  color: #fff;
  border-color: #444;
}

.file-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.file-btn.active {
  background: var(--accent);
  color: #fff;
  border-color: var(--accent);
}

.checkpoint-btn {
  position: relative;
  background: #2a3a2a;
  border-color: #3a4a3a;
}

.checkpoint-btn:hover:not(:disabled) {
  background: #3a5a3a;
  border-color: #4a6a4a;
}

.checkpoint-badge {
  position: absolute;
  top: calc(-4px * var(--ui-scale, 1));
  right: calc(-4px * var(--ui-scale, 1));
  background: var(--accent);
  color: #fff;
  font-size: calc(9px * var(--ui-scale, 1));
  min-width: calc(14px * var(--ui-scale, 1));
  height: calc(14px * var(--ui-scale, 1));
  border-radius: calc(7px * var(--ui-scale, 1));
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
}

.history-btn {
  padding: calc(5px * var(--ui-scale, 1));
}

/* Auto-save status indicator */
.auto-save-status {
  display: flex;
  align-items: center;
  gap: calc(4px * var(--ui-scale, 1));
  font-size: calc(11px * var(--ui-scale, 1));
  color: #888;
  padding: calc(4px * var(--ui-scale, 1)) calc(8px * var(--ui-scale, 1));
  border-radius: calc(4px * var(--ui-scale, 1));
  background: rgba(255, 255, 255, 0.05);
  white-space: nowrap;
}

.auto-save-status.saving {
  color: #ffa500;
}

.auto-save-status.saved {
  color: #4ade80;
}

.auto-save-status.error {
  color: #f87171;
}

.auto-save-status.idle {
  color: #888;
}

.auto-save-status.no-handle {
  color: #666;
}

.auto-save-status svg {
  flex-shrink: 0;
}

.auto-save-status .spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* Format selector dropdown */
.format-select {
  background: #333;
  color: #888;
  border: 1px solid #444;
  border-radius: calc(4px * var(--ui-scale, 1));
  padding: calc(2px * var(--ui-scale, 1)) calc(6px * var(--ui-scale, 1));
  font-size: calc(11px * var(--ui-scale, 1));
  cursor: pointer;
  margin-left: calc(8px * var(--ui-scale, 1));
}

.format-select:hover {
  background: #3a3a3a;
  color: #aaa;
}

.format-select:focus {
  outline: none;
  border-color: #555;
}

/* Format selector group with help tooltip */
.format-selector-group {
  display: flex;
  align-items: center;
  gap: calc(4px * var(--ui-scale, 1));
  margin-left: calc(8px * var(--ui-scale, 1));
}

.format-selector-group .format-select {
  margin-left: 0;
}

.format-help {
  position: relative;
  display: flex;
  align-items: center;
}

.format-help-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: calc(16px * var(--ui-scale, 1));
  height: calc(16px * var(--ui-scale, 1));
  background: #444;
  color: #888;
  border-radius: 50%;
  font-size: calc(10px * var(--ui-scale, 1));
  font-weight: bold;
  cursor: help;
  transition: all 0.2s;
}

.format-help:hover .format-help-icon {
  background: #555;
  color: #bbb;
}

.format-tooltip {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  width: calc(280px * var(--ui-scale, 1));
  background: #2a2a2a;
  border: 1px solid #444;
  border-radius: calc(6px * var(--ui-scale, 1));
  padding: calc(12px * var(--ui-scale, 1));
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);
  z-index: 1000;
  opacity: 0;
  visibility: hidden;
  transform: translateY(-4px);
  transition: all 0.2s;
}

.format-help:hover .format-tooltip {
  opacity: 1;
  visibility: visible;
  transform: translateY(0);
}

.format-tooltip::before {
  content: '';
  position: absolute;
  top: -6px;
  right: calc(4px * var(--ui-scale, 1));
  width: 10px;
  height: 10px;
  background: #2a2a2a;
  border-left: 1px solid #444;
  border-top: 1px solid #444;
  transform: rotate(45deg);
}

.format-tooltip-item {
  margin-bottom: calc(10px * var(--ui-scale, 1));
}

.format-tooltip-item:last-child {
  margin-bottom: 0;
}

.format-tooltip-item strong {
  display: block;
  color: #ddd;
  font-size: calc(12px * var(--ui-scale, 1));
  margin-bottom: calc(4px * var(--ui-scale, 1));
}

.format-tooltip-item p {
  color: #999;
  font-size: calc(11px * var(--ui-scale, 1));
  line-height: 1.4;
  margin: 0;
}

.format-tooltip-item.recommended strong {
  color: #4ade80;
  display: flex;
  align-items: center;
  gap: 4px;
}

.format-tooltip-item.recommended .rec-icon {
  color: #4ade80;
  flex-shrink: 0;
}

/* Toast notification */
.toast-notification {
  position: fixed;
  top: calc(52px * var(--ui-scale, 1));
  left: 50%;
  transform: translateX(-50%);
  background: #2a3a2a;
  color: #8f8;
  padding: calc(8px * var(--ui-scale, 1)) calc(16px * var(--ui-scale, 1));
  border-radius: calc(4px * var(--ui-scale, 1));
  font-size: calc(12px * var(--ui-scale, 1));
  font-weight: 500;
  z-index: 1000;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
  border: 1px solid #3a5a3a;
}

.toast-enter-active,
.toast-leave-active {
  transition: all 0.2s ease;
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(-10px);
}

.header-nav {
  display: flex;
  align-items: center;
  gap: calc(16px * var(--ui-scale, 1));
  margin-left: auto;
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
  background-color: var(--canvas-bg, #1a1a1a);
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
