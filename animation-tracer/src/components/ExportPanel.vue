<template>
  <div class="export-panel">
    <!-- Animation Preview -->
    <div class="panel-section" v-if="drawingStore.hasDrawings">
      <h3>Animation Preview</h3>
      <div class="animation-preview">
        <div class="preview-canvas-container" :class="previewBgClass" :style="previewBgStyle">
          <img 
            v-if="displayFrameUrl" 
            :src="displayFrameUrl" 
            alt="Animation frame"
            class="preview-frame"
            :class="{ 'true-size': previewCropMode === 'true-size' }"
          />
          <div v-else class="no-preview">No frames yet</div>
        </div>
        <div class="preview-controls">
          <button @click="togglePlayback" class="play-button">
            <Pause v-if="isPlaying" :size="14" />
            <Play v-else :size="14" />
          </button>
          <label class="fps-label">
            FPS:
            <input 
              type="number" 
              v-model="previewFps" 
              min="1" 
              max="30"
              class="fps-input"
            />
          </label>
          <span class="frame-counter">
            {{ currentPreviewIndex + 1 }}/{{ drawingStore.drawnFrameIndices.length }}
          </span>
        </div>
        <!-- Crop Mode Toggle -->
        <div class="crop-mode-options">
          <button 
            :class="{ active: previewCropMode === 'autocrop' }"
            @click="previewCropMode = 'autocrop'"
            title="Autocrop - Trim transparent pixels"
          >
            <Crop :size="14" />
            <span>Autocrop</span>
          </button>
          <button 
            :class="{ active: previewCropMode === 'true-size' }"
            @click="previewCropMode = 'true-size'"
            title="True Size - Keep original canvas dimensions"
          >
            <Maximize :size="14" />
            <span>True Size</span>
          </button>
        </div>
        <div class="bg-options">
          <button 
            :class="{ active: previewBg === 'transparent' }"
            @click="previewBg = 'transparent'"
            title="Transparent"
          >
            <Grid3x3 :size="14" />
          </button>
          <button 
            :class="{ active: previewBg === 'white' }"
            @click="previewBg = 'white'"
            title="White"
          >
            <Square :size="14" />
          </button>
          <button 
            :class="{ active: previewBg === 'black' }"
            @click="previewBg = 'black'"
            title="Black"
            class="black-bg-btn"
          >
            <Square :size="14" fill="currentColor" />
          </button>
          <button 
            :class="{ active: previewBg === 'gray' }"
            @click="previewBg = 'gray'"
            title="Gray"
          >
            <CircleDot :size="14" />
          </button>
          <button 
            :class="{ active: previewBg === 'custom' }"
            @click="previewBg = 'custom'"
            title="Custom Color"
          >
            <Palette :size="14" />
          </button>
          <input 
            v-if="previewBg === 'custom'"
            type="color" 
            v-model="customBgColor" 
            class="bg-color-picker"
            title="Pick background color"
          />
        </div>
      </div>
    </div>

    <div class="panel-section">
      <h3>Export Size</h3>
      <p class="size-hint">Frames will be scaled to this size when exported</p>
      <div class="size-options">
        <button
          v-for="size in CANVAS_SIZES"
          :key="size.label"
          :class="{ active: drawingStore.canvasSize.label === size.label }"
          @click="drawingStore.setCanvasSize(size)"
        >
          {{ size.label }}
        </button>
      </div>
      <div class="custom-size">
        <label>
          Custom:
          <input
            type="number"
            v-model="customWidth"
            min="8"
            max="1024"
            placeholder="W"
          />
          ×
          <input
            type="number"
            v-model="customHeight"
            min="8"
            max="1024"
            placeholder="H"
          />
          <button @click="applyCustomSize">Apply</button>
        </label>
      </div>
    </div>

    <!-- Canvas Resize Controls -->
    <div class="panel-section">
      <h3>Canvas Resize</h3>
      <p class="size-hint">Manually adjust the working canvas dimensions</p>
      <div class="canvas-resize-controls">
        <div class="resize-inputs">
          <div class="resize-input-group">
            <label>Width</label>
            <div class="input-with-btns">
              <button 
                class="step-btn" 
                @mousedown="startHoldAdjust('width', -10)" 
                @mouseup="stopHoldAdjust" 
                @mouseleave="stopHoldAdjust"
                @touchstart.prevent="startHoldAdjust('width', -10)"
                @touchend="stopHoldAdjust"
                title="-10"
              >
                <Minus :size="10" />
              </button>
              <input
                type="number"
                v-model.number="resizeWidth"
                @input="onResizeWidthChange"
                min="8"
                max="4096"
              />
              <button 
                class="step-btn" 
                @mousedown="startHoldAdjust('width', 10)" 
                @mouseup="stopHoldAdjust" 
                @mouseleave="stopHoldAdjust"
                @touchstart.prevent="startHoldAdjust('width', 10)"
                @touchend="stopHoldAdjust"
                title="+10"
              >
                <Plus :size="10" />
              </button>
            </div>
          </div>
          <div class="resize-input-group">
            <label>Height</label>
            <div class="input-with-btns">
              <button 
                class="step-btn" 
                @mousedown="startHoldAdjust('height', -10)" 
                @mouseup="stopHoldAdjust" 
                @mouseleave="stopHoldAdjust"
                @touchstart.prevent="startHoldAdjust('height', -10)"
                @touchend="stopHoldAdjust"
                title="-10"
              >
                <Minus :size="10" />
              </button>
              <input
                type="number"
                v-model.number="resizeHeight"
                @input="onResizeHeightChange"
                min="8"
                max="4096"
              />
              <button 
                class="step-btn" 
                @mousedown="startHoldAdjust('height', 10)" 
                @mouseup="stopHoldAdjust" 
                @mouseleave="stopHoldAdjust"
                @touchstart.prevent="startHoldAdjust('height', 10)"
                @touchend="stopHoldAdjust"
                title="+10"
              >
                <Plus :size="10" />
              </button>
            </div>
          </div>
        </div>
        <div class="resize-options">
          <label class="checkbox-label" :class="{ disabled: !canEnableAspectLock }">
            <input 
              type="checkbox" 
              v-model="aspectLockEnabled" 
              :disabled="!canEnableAspectLock"
            />
            <Lock :size="14" v-if="aspectLockEnabled" />
            <Unlock :size="14" v-else />
            <span>Lock Aspect Ratio</span>
          </label>
          <span v-if="aspectLockEnabled" class="aspect-ratio-display">
            {{ aspectRatioDisplay }}
          </span>
        </div>
        <div class="resize-actions">
          <button class="resize-btn" @click="applyCanvasResize" :disabled="!hasCanvasChanges">
            <Check :size="14" />
            Apply Resize
          </button>
          <button class="reset-btn" @click="resetCanvasSize" :disabled="!hasCanvasChanges">
            <RotateCcw :size="14" />
            Reset
          </button>
        </div>
      </div>
    </div>

    <div class="panel-section">
      <h3>Export Options</h3>
      <div class="export-info">
        <p>Frames drawn: <strong>{{ drawingStore.drawnFrameIndices.length }}</strong></p>
        <p>Frame size: <strong>{{ drawingStore.canvasSize.label }}</strong></p>
      </div>

      <div class="export-settings">
        <label>
          Padding:
          <input type="number" v-model="padding" min="0" max="10" /> px
        </label>
      </div>

      <div class="export-buttons">
        <button
          @click="exportSpriteSheet"
          :disabled="!drawingStore.hasDrawings"
          class="primary"
        >
          <Package :size="14" /> Export Sprite Sheet
        </button>
        <button
          @click="openCustomExport"
          :disabled="!drawingStore.hasDrawings"
          class="primary custom-export-btn"
        >
          <Settings :size="14" /> Custom Export
        </button>
        <button
          @click="exportCurrentFrame"
          :disabled="!hasCurrentFrameDrawing"
        >
          <ImageIcon :size="14" /> Export Current Frame
        </button>
      </div>
    </div>

    <div class="panel-section" v-if="previewUrl">
      <h3>Preview</h3>
      <div class="preview-container">
        <img :src="previewUrl" alt="Sprite sheet preview" />
      </div>
    </div>

    <!-- Custom Export Dialog -->
    <CustomExportDialog
      :is-open="isCustomExportOpen"
      :total-frames="drawingStore.drawnFrameIndices.length"
      :base-width="drawingStore.canvasSize.width"
      :base-height="drawingStore.canvasSize.height"
      @close="isCustomExportOpen = false"
      @export="handleCustomExport"
    />

    <!-- Sprite Sheet Info Dialog -->
    <SpriteSheetInfoDialog
      :is-open="showSpriteSheetInfo"
      :metadata="spriteSheetMetadata"
      :padding="padding"
      :suggested-fps="previewFps"
      @close="showSpriteSheetInfo = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useDrawingStore } from '../stores/drawingStore'
import { useVideoStore } from '../stores/videoStore'
import { ExportService } from '../services/exportService'
import { CANVAS_SIZES } from '../types/drawing'
import type { PreviewBackground } from '../types/video'
import type { CustomExportOptions } from '../types/export'
import { 
  Play, 
  Pause, 
  Grid3x3, 
  Square, 
  CircleDot,
  Palette,
  Package,
  Image as ImageIcon,
  Settings,
  Crop,
  Maximize,
  Plus,
  Minus,
  Lock,
  Unlock,
  Check,
  RotateCcw
} from 'lucide-vue-next'
import CustomExportDialog from './CustomExportDialog.vue'
import SpriteSheetInfoDialog from './SpriteSheetInfoDialog.vue'
import { saveExportPrefs, loadExportPrefs } from '../services/persistenceService'
import type { SpriteSheetMetadata } from '../types/export'

const drawingStore = useDrawingStore()
const videoStore = useVideoStore()

const customWidth = ref(128)
const customHeight = ref(128)
const padding = ref(1)
const previewUrl = ref('')
const isCustomExportOpen = ref(false)
const showSpriteSheetInfo = ref(false)
const spriteSheetMetadata = ref<SpriteSheetMetadata>({
  frames: [],
  sheetWidth: 0,
  sheetHeight: 0,
  frameWidth: 0,
  frameHeight: 0
})

// Canvas resize state
const resizeWidth = ref(drawingStore.canvasSize.width)
const resizeHeight = ref(drawingStore.canvasSize.height)
const aspectLockEnabled = ref(false)
const aspectRatio = ref(1)

// Initialize resize values from current canvas size
watch(() => drawingStore.canvasSize, (newSize) => {
  resizeWidth.value = newSize.width
  resizeHeight.value = newSize.height
  if (aspectLockEnabled.value) {
    aspectRatio.value = newSize.width / newSize.height
  }
}, { immediate: true })

// Computed properties for canvas resize
const canEnableAspectLock = computed(() => {
  return resizeWidth.value > 0 && resizeHeight.value > 0
})

const hasCanvasChanges = computed(() => {
  return resizeWidth.value !== drawingStore.canvasSize.width ||
         resizeHeight.value !== drawingStore.canvasSize.height
})

const aspectRatioDisplay = computed(() => {
  // Show the locked aspect ratio (simplified)
  const gcd = (a: number, b: number): number => b === 0 ? a : gcd(b, a % b)
  // Use the stored aspect ratio to derive the display
  const ratio = aspectRatio.value
  if (ratio <= 0) return '1:1'
  // Find a nice representation
  // Multiply by common factor to get whole numbers
  let w = ratio
  let h = 1
  // Try to find simple integer representation
  for (const mult of [1, 2, 3, 4, 5, 6, 8, 9, 10, 12, 16]) {
    const testW = ratio * mult
    if (Math.abs(testW - Math.round(testW)) < 0.01) {
      w = Math.round(testW)
      h = mult
      break
    }
  }
  const divisor = gcd(Math.round(w), Math.round(h))
  return `${Math.round(w / divisor)}:${Math.round(h / divisor)}`
})

// Hold-to-adjust state
let holdInterval: number | null = null
let holdTimeout: number | null = null

function startHoldAdjust(dimension: 'width' | 'height', delta: number) {
  // Immediately apply once
  if (dimension === 'width') {
    adjustCanvasWidth(delta)
  } else {
    adjustCanvasHeight(delta)
  }
  
  // Start repeating after a short delay
  holdTimeout = window.setTimeout(() => {
    holdInterval = window.setInterval(() => {
      if (dimension === 'width') {
        adjustCanvasWidth(delta)
      } else {
        adjustCanvasHeight(delta)
      }
    }, 50) // Repeat every 50ms while held
  }, 300) // Initial delay before repeating
}

function stopHoldAdjust() {
  if (holdTimeout) {
    clearTimeout(holdTimeout)
    holdTimeout = null
  }
  if (holdInterval) {
    clearInterval(holdInterval)
    holdInterval = null
  }
}

// Canvas resize functions
function onResizeWidthChange() {
  if (aspectLockEnabled.value && aspectRatio.value > 0) {
    resizeHeight.value = Math.round(resizeWidth.value / aspectRatio.value)
  }
}

function onResizeHeightChange() {
  if (aspectLockEnabled.value && aspectRatio.value > 0) {
    resizeWidth.value = Math.round(resizeHeight.value * aspectRatio.value)
  }
}

function adjustCanvasWidth(delta: number) {
  resizeWidth.value = Math.max(8, Math.min(4096, resizeWidth.value + delta))
  if (aspectLockEnabled.value && aspectRatio.value > 0) {
    resizeHeight.value = Math.round(resizeWidth.value / aspectRatio.value)
  }
}

function adjustCanvasHeight(delta: number) {
  resizeHeight.value = Math.max(8, Math.min(4096, resizeHeight.value + delta))
  if (aspectLockEnabled.value && aspectRatio.value > 0) {
    resizeWidth.value = Math.round(resizeHeight.value * aspectRatio.value)
  }
}

function applyCanvasResize() {
  const w = Math.max(8, Math.min(4096, resizeWidth.value))
  const h = Math.max(8, Math.min(4096, resizeHeight.value))
  drawingStore.setCanvasSize({
    width: w,
    height: h,
    label: `${w}×${h}`
  })
  // Update aspect ratio when manually applying
  aspectRatio.value = w / h
  
  // For empty projects, also update video store dimensions
  if (videoStore.state.isEmptyProject) {
    videoStore.setProjectDimensions(w, h)
    // Reset viewport to fit new size
    drawingStore.resetViewport()
  }
}

function resetCanvasSize() {
  resizeWidth.value = drawingStore.canvasSize.width
  resizeHeight.value = drawingStore.canvasSize.height
  aspectRatio.value = drawingStore.canvasSize.width / drawingStore.canvasSize.height
}

// Watch for aspect lock changes to update ratio
watch(aspectLockEnabled, (enabled) => {
  if (enabled && resizeWidth.value > 0 && resizeHeight.value > 0) {
    aspectRatio.value = resizeWidth.value / resizeHeight.value
  }
})

// Animation preview state
const isPlaying = ref(true)
const previewFps = ref(8)
const currentPreviewIndex = ref(0)
const croppedFrameUrl = ref<string | null>(null)

// Preview crop mode
const previewCropMode = ref<'autocrop' | 'true-size'>('autocrop')
const previewBg = ref<PreviewBackground>('transparent')
let playbackInterval: number | null = null

// Custom background color
const customBgColor = ref('#808080')

const previewBgClass = computed(() => `bg-${previewBg.value}`)

// Get the actual background style
const previewBgStyle = computed(() => {
  if (previewBg.value === 'custom') {
    return { backgroundColor: customBgColor.value }
  }
  return {}
})

// Crop transparent pixels from image
async function getCroppedFrame(thumbnailUrl: string): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = img.width
      canvas.height = img.height
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(img, 0, 0)
      
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      const { data, width, height } = imageData
      
      // Find bounding box of non-transparent pixels
      let minX = width, minY = height, maxX = 0, maxY = 0
      let hasContent = false
      
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const alpha = data[(y * width + x) * 4 + 3]
          if (alpha > 0) {
            hasContent = true
            minX = Math.min(minX, x)
            minY = Math.min(minY, y)
            maxX = Math.max(maxX, x)
            maxY = Math.max(maxY, y)
          }
        }
      }
      
      if (!hasContent) {
        resolve(thumbnailUrl) // Return original if nothing drawn
        return
      }
      
      // Add small padding
      const pad = 2
      minX = Math.max(0, minX - pad)
      minY = Math.max(0, minY - pad)
      maxX = Math.min(width - 1, maxX + pad)
      maxY = Math.min(height - 1, maxY + pad)
      
      const cropWidth = maxX - minX + 1
      const cropHeight = maxY - minY + 1
      
      // Create cropped canvas
      const croppedCanvas = document.createElement('canvas')
      croppedCanvas.width = cropWidth
      croppedCanvas.height = cropHeight
      const croppedCtx = croppedCanvas.getContext('2d')!
      croppedCtx.drawImage(canvas, minX, minY, cropWidth, cropHeight, 0, 0, cropWidth, cropHeight)
      
      resolve(croppedCanvas.toDataURL('image/png'))
    }
    img.src = thumbnailUrl
  })
}

const currentPreviewFrame = computed(() => {
  const indices = drawingStore.drawnFrameIndices
  if (indices.length === 0) return null
  const frameIndex = indices[currentPreviewIndex.value]
  const drawing = drawingStore.getFrameDrawing(frameIndex)
  return drawing?.thumbnail || null
})

// Display URL based on crop mode
const displayFrameUrl = computed(() => {
  if (previewCropMode.value === 'true-size') {
    return currentPreviewFrame.value
  }
  return croppedFrameUrl.value
})

// Update cropped frame when current frame changes
watch(currentPreviewFrame, async (newFrame) => {
  if (newFrame) {
    croppedFrameUrl.value = await getCroppedFrame(newFrame)
  } else {
    croppedFrameUrl.value = null
  }
}, { immediate: true })

// Save export preferences when they change
watch([previewCropMode, previewBg, customBgColor, previewFps], () => {
  saveExportPrefs({
    previewCropMode: previewCropMode.value,
    previewBg: previewBg.value,
    customBgColor: customBgColor.value,
    previewFps: previewFps.value
  })
})

function togglePlayback() {
  isPlaying.value = !isPlaying.value
}

function startPlayback() {
  stopPlayback()
  if (drawingStore.drawnFrameIndices.length === 0) return
  
  playbackInterval = window.setInterval(() => {
    const indices = drawingStore.drawnFrameIndices
    if (indices.length === 0) return
    currentPreviewIndex.value = (currentPreviewIndex.value + 1) % indices.length
  }, 1000 / previewFps.value)
}

function stopPlayback() {
  if (playbackInterval !== null) {
    clearInterval(playbackInterval)
    playbackInterval = null
  }
}

// Watch for play/pause changes
watch(isPlaying, (playing) => {
  if (playing) {
    startPlayback()
  } else {
    stopPlayback()
  }
})

// Watch for FPS changes
watch(previewFps, () => {
  if (isPlaying.value) {
    startPlayback()
  }
})

// Watch for new frames being added
watch(
  () => drawingStore.drawnFrameIndices.length,
  (newLength) => {
    if (currentPreviewIndex.value >= newLength) {
      currentPreviewIndex.value = Math.max(0, newLength - 1)
    }
    if (newLength > 0 && isPlaying.value && !playbackInterval) {
      startPlayback()
    }
  }
)

onMounted(async () => {
  // Load saved export preferences
  const savedPrefs = await loadExportPrefs()
  if (savedPrefs) {
    previewCropMode.value = savedPrefs.previewCropMode
    previewBg.value = savedPrefs.previewBg as PreviewBackground
    customBgColor.value = savedPrefs.customBgColor
    previewFps.value = savedPrefs.previewFps
  }
  
  if (drawingStore.drawnFrameIndices.length > 0) {
    startPlayback()
  }
})

onUnmounted(() => {
  stopPlayback()
})

const hasCurrentFrameDrawing = computed(() => {
  return drawingStore.getFrameDrawing(videoStore.state.currentFrame) !== undefined
})

function applyCustomSize() {
  if (customWidth.value >= 8 && customHeight.value >= 8) {
    drawingStore.setCanvasSize({
      width: customWidth.value,
      height: customHeight.value,
      label: `${customWidth.value}×${customHeight.value}`
    })
  }
}

async function exportSpriteSheet() {
  try {
    const { imageBlob, metadata } = await ExportService.generateSpriteSheet(
      drawingStore.frameDrawings,
      drawingStore.canvasSize,
      { padding: padding.value }
    )

    // Show preview
    previewUrl.value = URL.createObjectURL(imageBlob)

    // Store metadata and show info dialog
    spriteSheetMetadata.value = metadata
    showSpriteSheetInfo.value = true

    // Download files
    const filename = videoStore.state.file?.name.replace(/\.[^/.]+$/, '') || 'animation'
    ExportService.downloadSpriteSheet(imageBlob, metadata, filename)
  } catch (error) {
    console.error('Export failed:', error)
    alert('Export failed: ' + (error as Error).message)
  }
}

async function exportCurrentFrame() {
  const frameDrawing = drawingStore.getFrameDrawing(videoStore.state.currentFrame)
  if (frameDrawing) {
    const filename = videoStore.state.file?.name.replace(/\.[^/.]+$/, '') || 'frame'
    await ExportService.exportSingleFrame(frameDrawing, filename)
  }
}

function openCustomExport() {
  isCustomExportOpen.value = true
}

async function handleCustomExport(options: CustomExportOptions) {
  try {
    await ExportService.customExport(
      drawingStore.frameDrawings,
      drawingStore.canvasSize,
      options
    )
    isCustomExportOpen.value = false
  } catch (error) {
    console.error('Custom export failed:', error)
    alert('Custom export failed: ' + (error as Error).message)
  }
}
</script>

<style scoped>
.export-panel {
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  overflow-y: auto;
  height: 100%;
}

.panel-section h3 {
  margin: 0 0 8px 0;
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: #555;
  font-weight: 500;
}

.size-hint {
  font-size: 10px;
  color: #666;
  margin: 0 0 8px 0;
}

.size-options {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 3px;
}

.size-options button {
  padding: 6px 8px;
  background: #252525;
  border-radius: 3px;
  font-size: 11px;
  color: #888;
}

.size-options button:hover {
  background: #333;
  color: #fff;
}

.size-options button.active {
  background: var(--accent);
  color: #fff;
}

.custom-size {
  margin-top: 8px;
}

.custom-size label {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  color: #666;
}

.custom-size input {
  width: 40px;
  padding: 4px;
  border-radius: 3px;
  text-align: center;
  font-size: 11px;
}

.custom-size button {
  padding: 4px 8px;
  background: var(--accent);
  color: white;
  border-radius: 3px;
  font-size: 10px;
  margin-left: 4px;
}

.export-info {
  font-size: 11px;
  color: #666;
  margin-bottom: 8px;
}

.export-info p {
  margin: 3px 0;
}

.export-info strong {
  color: #aaa;
}

.export-settings label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  color: #666;
}

.export-settings input {
  width: 40px;
  padding: 4px;
  border-radius: 3px;
  text-align: center;
}

.export-buttons {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-top: 8px;
}

.export-buttons button {
  padding: 8px 10px;
  background: #252525;
  border-radius: 4px;
  font-size: 11px;
  text-align: left;
  color: #888;
  display: flex;
  align-items: center;
  gap: 6px;
}

.export-buttons button:hover:not(:disabled) {
  background: #333;
  color: #fff;
}

.export-buttons button:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

.export-buttons button.primary {
  background: var(--accent);
  color: #fff;
}

.export-buttons button.primary:hover:not(:disabled) {
  background: #f06b1a;
}

.export-buttons button.custom-export-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  font-weight: 600;
}

.export-buttons button.custom-export-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, #5568d3 0%, #63408a 100%);
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(102, 126, 234, 0.3);
}

.preview-container {
  background: 
    linear-gradient(45deg, #222 25%, transparent 25%),
    linear-gradient(-45deg, #222 25%, transparent 25%),
    linear-gradient(45deg, transparent 75%, #222 75%),
    linear-gradient(-45deg, transparent 75%, #222 75%);
  background-size: 8px 8px;
  background-position: 0 0, 0 4px, 4px -4px, -4px 0px;
  background-color: #1a1a1a;
  border: 1px solid #333;
  border-radius: 4px;
  padding: 6px;
  max-height: 150px;
  overflow: auto;
}

.preview-container img {
  max-width: 100%;
  image-rendering: pixelated;
}

.animation-preview {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.preview-canvas-container {
  background: 
    linear-gradient(45deg, #222 25%, transparent 25%),
    linear-gradient(-45deg, #222 25%, transparent 25%),
    linear-gradient(45deg, transparent 75%, #222 75%),
    linear-gradient(-45deg, transparent 75%, #222 75%);
  background-size: 8px 8px;
  background-position: 0 0, 0 4px, 4px -4px, -4px 0px;
  background-color: #1a1a1a;
  border: 1px solid #333;
  border-radius: 4px;
  padding: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 80px;
  aspect-ratio: 1;
}

.preview-canvas-container.bg-white {
  background: #ffffff;
}

.preview-canvas-container.bg-black {
  background: #000000;
}

.preview-canvas-container.bg-gray {
  background: #808080;
}

.preview-canvas-container.bg-custom {
  background: none;
}

/* Crop Mode Options */
.crop-mode-options {
  display: flex;
  gap: 3px;
  margin-bottom: 6px;
}

.crop-mode-options button {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 5px 8px;
  background: #252525;
  border-radius: 3px;
  font-size: 10px;
  color: #888;
  transition: all 0.15s;
}

.crop-mode-options button:hover {
  background: #333;
  color: #ccc;
}

.crop-mode-options button.active {
  background: var(--accent);
  color: #fff;
}

.bg-options {
  display: flex;
  gap: 3px;
  align-items: center;
}

.bg-options button {
  width: 24px;
  height: 24px;
  background: #252525;
  border-radius: 3px;
  font-size: 11px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #888;
}

.bg-options button:hover {
  background: #333;
  color: #fff;
}

.bg-options button.active {
  background: var(--accent);
  color: #fff;
}

.bg-color-picker {
  width: 24px;
  height: 24px;
  padding: 0;
  border: 1px solid #333;
  border-radius: 3px;
  cursor: pointer;
  background: none;
}

.bg-color-picker::-webkit-color-swatch-wrapper {
  padding: 2px;
}

.bg-color-picker::-webkit-color-swatch {
  border-radius: 2px;
  border: none;
}

.preview-frame {
  max-width: 100%;
  max-height: 100%;
  image-rendering: pixelated;
}

.no-preview {
  color: #444;
  font-size: 11px;
}

.preview-controls {
  display: flex;
  align-items: center;
  gap: 6px;
}

.play-button {
  width: 26px;
  height: 26px;
  background: #252525;
  border-radius: 3px;
  font-size: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #888;
}

.play-button:hover {
  background: #333;
  color: #fff;
}

.fps-label {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 10px;
  color: #555;
}

.fps-input {
  width: 32px;
  padding: 3px;
  border-radius: 3px;
  font-size: 10px;
  text-align: center;
}

.frame-counter {
  font-size: 10px;
  color: #555;
  margin-left: auto;
  font-variant-numeric: tabular-nums;
}

/* Canvas Resize Controls */
.canvas-resize-controls {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.resize-inputs {
  display: flex;
  gap: 12px;
}

.resize-input-group {
  flex: 1;
}

.resize-input-group label {
  display: block;
  font-size: 10px;
  color: #666;
  margin-bottom: 4px;
}

.input-with-btns {
  display: flex;
  align-items: center;
  gap: 2px;
}

.input-with-btns input {
  flex: 1;
  width: 50px;
  padding: 4px 6px;
  border-radius: 3px;
  font-size: 11px;
  text-align: center;
}

.step-btn {
  width: 22px;
  height: 24px;
  padding: 0;
  background: #252525;
  border-radius: 3px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #888;
}

.step-btn:hover {
  background: #333;
  color: #fff;
}

.resize-options {
  display: flex;
  align-items: center;
  gap: 8px;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 11px;
  color: #888;
  cursor: pointer;
}

.checkbox-label:hover {
  color: #fff;
}

.checkbox-label.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.checkbox-label input[type="checkbox"] {
  width: 14px;
  height: 14px;
  margin: 0;
  cursor: pointer;
}

.checkbox-label.disabled input[type="checkbox"] {
  cursor: not-allowed;
}

.aspect-ratio-display {
  font-size: 10px;
  color: #555;
  background: #1a1a1a;
  padding: 2px 6px;
  border-radius: 3px;
}

.resize-actions {
  display: flex;
  gap: 8px;
}

.resize-btn,
.reset-btn {
  flex: 1;
  padding: 6px 10px;
  border-radius: 4px;
  font-size: 11px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
}

.resize-btn {
  background: #2a6;
  color: #fff;
}

.resize-btn:hover:not(:disabled) {
  background: #3b7;
}

.resize-btn:disabled {
  background: #333;
  color: #555;
  cursor: not-allowed;
}

.reset-btn {
  background: #333;
  color: #888;
}

.reset-btn:hover:not(:disabled) {
  background: #444;
  color: #fff;
}

.reset-btn:disabled {
  background: #252525;
  color: #444;
  cursor: not-allowed;
}
</style>
