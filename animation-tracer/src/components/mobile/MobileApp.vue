<template>
  <div class="mobile-app">
    <!-- Header with menu -->
    <MobileHeader 
      @export="showExportPanel = true"
      @quick-export="handleQuickExport"
      @new-project="showNewProject = true"
    />
    
    <!-- Canvas area -->
    <div class="canvas-wrapper" :style="{ background: settingsStore.canvasBackgroundColor }">
      <!-- Video overlay (optional) -->
      <VideoPlayer 
        v-if="settingsStore.showMobileVideoOverlay && videoStore.hasProject"
        class="video-overlay"
      />
      
      <!-- Drawing canvas -->
      <DrawingCanvas 
        ref="canvasRef"
        class="drawing-canvas"
      />
    </div>
    
    <!-- Toolbar -->
    <MobileToolbar 
      @undo="handleUndo"
      @redo="handleRedo"
    />
    
    <!-- Timeline -->
    <MobileTimeline />
    
    <!-- New Project Dialog -->
    <NewProjectDialog 
      :isOpen="showNewProject" 
      @close="showNewProject = false"
    />
    
    <!-- Export Panel Modal -->
    <Teleport to="body">
      <div v-if="showExportPanel" class="export-modal-overlay" @click="showExportPanel = false">
        <div class="export-modal" @click.stop>
          <div class="export-modal-header">
            <span>Export</span>
            <button class="close-btn" @click="showExportPanel = false">×</button>
          </div>
          <ExportPanel class="export-panel-content" />
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useSettingsStore } from '../../stores/settingsStore'
import { useVideoStore } from '../../stores/videoStore'
import { useDrawingStore } from '../../stores/drawingStore'
import MobileHeader from './MobileHeader.vue'
import MobileToolbar from './MobileToolbar.vue'
import MobileTimeline from './MobileTimeline.vue'
import DrawingCanvas from '../DrawingCanvas.vue'
import VideoPlayer from '../VideoPlayer.vue'
import NewProjectDialog from '../NewProjectDialog.vue'
import ExportPanel from '../ExportPanel.vue'

const settingsStore = useSettingsStore()
const videoStore = useVideoStore()
const drawingStore = useDrawingStore()

const showNewProject = ref(false)
const showExportPanel = ref(false)

function handleUndo() {
  drawingStore.undo()
}

function handleRedo() {
  drawingStore.redo()
}

function handleQuickExport() {
  // Open export panel for quick access
  showExportPanel.value = true
}
</script>

<style scoped>
.mobile-app {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  background: #0a0a0a;
  user-select: none;
  -webkit-user-select: none;
  -webkit-touch-callout: none;
  touch-action: none;
  overflow: hidden;
}

.canvas-wrapper {
  flex: 1;
  position: relative;
  overflow: hidden;
  background: #111;
}

.video-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  opacity: 0.3;
  pointer-events: none;
  z-index: 1;
}

.drawing-canvas {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 2;
}

/* Export Modal */
.export-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: flex-end;
  justify-content: center;
  z-index: 10000;
  user-select: none;
  -webkit-user-select: none;
}

.export-modal {
  width: 100%;
  max-height: 80vh;
  background: #1e1e1e;
  border-radius: 16px 16px 0 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.export-modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  border-bottom: 1px solid #333;
  font-size: 16px;
  font-weight: 600;
  color: #eee;
}

.close-btn {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: none;
  color: #666;
  font-size: 24px;
  cursor: pointer;
}

.export-panel-content {
  flex: 1;
  overflow-y: auto;
  max-height: 70vh;
}
</style>
