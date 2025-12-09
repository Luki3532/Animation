<template>
  <div class="custom-export-dialog" v-if="isOpen">
    <div class="dialog-backdrop" @click="close"></div>
    <div class="dialog-content">
      <div class="dialog-header">
        <div class="header-title">
          <Download :size="20" class="header-icon" />
          <h2>Custom Export</h2>
        </div>
        <button @click="close" class="close-btn">
          <X :size="18" />
        </button>
      </div>

      <div class="dialog-body">
        <div class="section-tabs">
          <button 
            v-for="tab in tabs" 
            :key="tab.id"
            :class="{ active: activeTab === tab.id }"
            @click="activeTab = tab.id"
          >
            <component :is="tab.icon" :size="14" />
            {{ tab.label }}
          </button>
        </div>

        <div class="tab-content">
          <!-- Format & Quality Tab -->
          <div v-if="activeTab === 'format'" class="tab-panel">
            <div class="form-group">
              <label>Export Format</label>
              <div class="format-grid">
                <button
                  v-for="fmt in formats"
                  :key="fmt.value"
                  :class="{ active: options.format === fmt.value }"
                  @click="options.format = fmt.value"
                  class="format-btn"
                >
                  <component :is="fmt.icon" :size="20" />
                  <span>{{ fmt.label }}</span>
                  <span class="format-desc">{{ fmt.description }}</span>
                </button>
              </div>
            </div>

            <div class="form-group">
              <label>Quality</label>
              <div class="quality-buttons">
                <button
                  v-for="q in qualities"
                  :key="q"
                  :class="{ active: options.quality === q }"
                  @click="options.quality = q"
                >
                  {{ q.charAt(0).toUpperCase() + q.slice(1) }}
                </button>
              </div>
            </div>

            <div class="form-group" v-if="supportsCompression">
              <label class="checkbox-label">
                <input type="checkbox" v-model="options.compress" />
                Enable compression
              </label>
              <div v-if="options.compress" class="slider-group">
                <label>Compression level: {{ options.compressionLevel }}%</label>
                <input 
                  type="range" 
                  v-model="options.compressionLevel" 
                  min="0" 
                  max="100"
                  class="slider"
                />
              </div>
            </div>
          </div>

          <!-- Animation Settings Tab -->
          <div v-if="activeTab === 'animation'" class="tab-panel">
            <div class="form-group">
              <label>Frame Rate (FPS)</label>
              <input 
                type="number" 
                v-model.number="options.fps" 
                min="1" 
                max="60"
                class="number-input"
              />
              <span class="hint">Higher FPS = smoother animation</span>
            </div>

            <div class="form-group">
              <label class="checkbox-label">
                <input type="checkbox" v-model="options.loop" />
                Loop animation
              </label>
            </div>

            <div class="form-group" v-if="supportsVideo">
              <label>Duration (seconds)</label>
              <input 
                type="number" 
                v-model.number="options.duration" 
                min="0.1" 
                step="0.1"
                placeholder="Auto"
                class="number-input"
              />
              <span class="hint">Leave empty for auto duration</span>
            </div>

            <div class="form-group" v-if="supportsVideo">
              <label>Video Codec</label>
              <select v-model="options.codec" class="select-input">
                <option value="h264">H.264 (Best compatibility)</option>
                <option value="vp8">VP8</option>
                <option value="vp9">VP9 (High quality)</option>
                <option value="av1">AV1 (Experimental)</option>
              </select>
            </div>

            <div class="form-group" v-if="supportsVideo">
              <label>Bitrate (kbps)</label>
              <input 
                type="number" 
                v-model.number="options.bitrate" 
                min="500" 
                max="50000"
                step="100"
                placeholder="Auto"
                class="number-input"
              />
            </div>

            <div class="form-group" v-if="options.format === 'gif'">
              <label class="checkbox-label">
                <input type="checkbox" v-model="options.dithering" />
                Enable dithering (smoother gradients)
              </label>
            </div>

            <div class="form-group" v-if="options.format === 'gif'">
              <label>Color Depth</label>
              <select v-model.number="options.colorDepth" class="select-input">
                <option :value="8">8 colors (smallest)</option>
                <option :value="16">16 colors</option>
                <option :value="32">32 colors</option>
                <option :value="64">64 colors</option>
                <option :value="128">128 colors</option>
                <option :value="256">256 colors (best quality)</option>
              </select>
            </div>
          </div>

          <!-- Frame Selection Tab -->
          <div v-if="activeTab === 'frames'" class="tab-panel">
            <div class="form-group">
              <label>Frame Range</label>
              <div class="radio-group">
                <label class="radio-label">
                  <input type="radio" v-model="options.frameRange" value="all" />
                  All frames ({{ totalFrames }})
                </label>
                <label class="radio-label">
                  <input type="radio" v-model="options.frameRange" value="current" />
                  Current frame only
                </label>
                <label class="radio-label">
                  <input type="radio" v-model="options.frameRange" value="custom" />
                  Custom range
                </label>
              </div>
            </div>

            <div v-if="options.frameRange === 'custom'" class="form-group">
              <div class="range-inputs">
                <div>
                  <label>Start Frame</label>
                  <input 
                    type="number" 
                    v-model.number="options.startFrame" 
                    :min="0"
                    :max="totalFrames - 1"
                    class="number-input"
                  />
                </div>
                <div>
                  <label>End Frame</label>
                  <input 
                    type="number" 
                    v-model.number="options.endFrame" 
                    :min="options.startFrame || 0"
                    :max="totalFrames - 1"
                    class="number-input"
                  />
                </div>
              </div>
            </div>

            <div class="form-group">
              <div class="frame-preview">
                <p>{{ selectedFrameCount }} frame(s) selected</p>
              </div>
            </div>
          </div>

          <!-- Size & Scale Tab -->
          <div v-if="activeTab === 'size'" class="tab-panel">
            <div class="form-group">
              <label>Scale</label>
              <input 
                type="range" 
                v-model.number="options.scale" 
                min="0.25" 
                max="4" 
                step="0.25"
                class="slider"
              />
              <div class="scale-display">{{ Math.round(options.scale * 100) }}%</div>
            </div>

            <div class="form-group">
              <label class="checkbox-label">
                <input type="checkbox" v-model="options.maintainAspectRatio" />
                Maintain aspect ratio
              </label>
            </div>

            <div class="form-group">
              <div class="size-inputs">
                <div>
                  <label>Width (px)</label>
                  <input 
                    type="number" 
                    v-model.number="customWidth" 
                    min="8"
                    max="4096"
                    class="number-input"
                    @input="onWidthChange"
                  />
                </div>
                <div>
                  <label>Height (px)</label>
                  <input 
                    type="number" 
                    v-model.number="customHeight" 
                    min="8"
                    max="4096"
                    class="number-input"
                    @input="onHeightChange"
                  />
                </div>
              </div>
              <div class="size-preview">
                Output: {{ outputWidth }}×{{ outputHeight }} px
              </div>
            </div>

            <div class="form-group">
              <label class="checkbox-label">
                <input type="checkbox" v-model="options.antialiasing" />
                Enable anti-aliasing
              </label>
            </div>

            <div class="form-group">
              <label class="checkbox-label">
                <input type="checkbox" v-model="options.smoothing" />
                Enable smoothing
              </label>
            </div>
          </div>

          <!-- Appearance Tab -->
          <div v-if="activeTab === 'appearance'" class="tab-panel">
            <div class="form-group">
              <label class="checkbox-label">
                <input type="checkbox" v-model="options.transparency" />
                Transparent background
              </label>
            </div>

            <div class="form-group" v-if="!options.transparency">
              <label>Background Color</label>
              <div class="color-picker-group">
                <input 
                  type="color" 
                  v-model="options.backgroundColor" 
                  class="color-input"
                />
                <input 
                  type="text" 
                  v-model="options.backgroundColor" 
                  class="color-text-input"
                  placeholder="#ffffff"
                />
              </div>
            </div>

            <div class="form-group">
              <label class="checkbox-label">
                <input type="checkbox" v-model="options.includeMetadata" />
                Include metadata file
              </label>
            </div>

            <div class="form-group" v-if="options.includeMetadata">
              <label>Metadata Format</label>
              <select v-model="options.metadataFormat" class="select-input">
                <option value="json">JSON</option>
                <option value="xml">XML</option>
                <option value="txt">Text</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div class="dialog-footer">
        <div class="footer-left">
          <div class="preset-section">
            <label>Preset:</label>
            <select v-model="selectedPreset" @change="applyPreset" class="select-input">
              <option value="">Custom</option>
              <option value="webOptimized">Web Optimized GIF</option>
              <option value="highQualityVideo">High Quality Video</option>
              <option value="smallGif">Small GIF</option>
              <option value="twitterGif">Twitter GIF</option>
              <option value="discordEmote">Discord Emote</option>
              <option value="spriteSheet">Sprite Sheet (PNG)</option>
              <option value="frameSequence">Frame Sequence (ZIP)</option>
            </select>
          </div>
          <div class="export-summary">
            <span>{{ selectedFrameCount }} frames</span>
            <span class="dot">•</span>
            <span>{{ outputWidth }}×{{ outputHeight }}</span>
            <span class="dot">•</span>
            <span class="format-badge">{{ options.format.toUpperCase() }}</span>
          </div>
        </div>
        <div class="button-group">
          <button @click="close" class="secondary-btn">Cancel</button>
          <button @click="exportWithOptions" class="export-btn">
            <Download :size="16" />
            Export
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { 
  X, 
  Download,
  FileImage,
  Film,
  Image as ImageIcon,
  Video,
  Sparkles,
  Settings,
  Layers,
  Maximize,
  Palette
} from 'lucide-vue-next'
import type { CustomExportOptions, ExportFormat, ExportQuality } from '../types/export'
import { DEFAULT_CUSTOM_EXPORT_OPTIONS } from '../types/export'

interface ExportDialogProps {
  isOpen: boolean
  totalFrames: number
  baseWidth: number
  baseHeight: number
}

const props = defineProps<ExportDialogProps>()
const emit = defineEmits<{
  close: []
  export: [options: CustomExportOptions]
}>()

const activeTab = ref('format')
const options = ref<CustomExportOptions>({ ...DEFAULT_CUSTOM_EXPORT_OPTIONS })
const customWidth = ref(props.baseWidth)
const customHeight = ref(props.baseHeight)
const selectedPreset = ref('')

const tabs = [
  { id: 'format', label: 'Format', icon: FileImage },
  { id: 'animation', label: 'Animation', icon: Film },
  { id: 'frames', label: 'Frames', icon: Layers },
  { id: 'size', label: 'Size', icon: Maximize },
  { id: 'appearance', label: 'Appearance', icon: Palette }
]

const formats = [
  { 
    value: 'gif' as ExportFormat, 
    label: 'GIF', 
    description: 'Animated, good compatibility',
    icon: Film 
  },
  { 
    value: 'mp4' as ExportFormat, 
    label: 'MP4', 
    description: 'Video, best quality',
    icon: Video 
  },
  { 
    value: 'webm' as ExportFormat, 
    label: 'WEBM', 
    description: 'Web video, small size',
    icon: Video 
  },
  { 
    value: 'apng' as ExportFormat, 
    label: 'APNG', 
    description: 'Animated PNG, transparency',
    icon: Sparkles 
  },
  { 
    value: 'png' as ExportFormat, 
    label: 'PNG', 
    description: 'Single frame, lossless',
    icon: ImageIcon 
  },
  { 
    value: 'jpg' as ExportFormat, 
    label: 'JPG', 
    description: 'Single frame, small size',
    icon: ImageIcon 
  },
  { 
    value: 'webp' as ExportFormat, 
    label: 'WEBP', 
    description: 'Modern format, efficient',
    icon: ImageIcon 
  },
  { 
    value: 'zip' as ExportFormat, 
    label: 'ZIP', 
    description: 'Image sequence archive',
    icon: Settings 
  }
]

const qualities: ExportQuality[] = ['low', 'medium', 'high', 'ultra']

const supportsVideo = computed(() => 
  options.value.format === 'mp4' || options.value.format === 'webm'
)

const supportsCompression = computed(() =>
  ['png', 'jpg', 'webp', 'gif'].includes(options.value.format)
)

const selectedFrameCount = computed(() => {
  if (options.value.frameRange === 'all') return props.totalFrames
  if (options.value.frameRange === 'current') return 1
  if (options.value.frameRange === 'custom') {
    const start = options.value.startFrame || 0
    const end = options.value.endFrame || props.totalFrames - 1
    return Math.max(0, end - start + 1)
  }
  return 0
})

const outputWidth = computed(() => 
  Math.round((customWidth.value || props.baseWidth) * options.value.scale)
)

const outputHeight = computed(() => 
  Math.round((customHeight.value || props.baseHeight) * options.value.scale)
)

function onWidthChange() {
  if (options.value.maintainAspectRatio && customWidth.value) {
    const aspectRatio = props.baseWidth / props.baseHeight
    customHeight.value = Math.round(customWidth.value / aspectRatio)
  }
}

function onHeightChange() {
  if (options.value.maintainAspectRatio && customHeight.value) {
    const aspectRatio = props.baseWidth / props.baseHeight
    customWidth.value = Math.round(customHeight.value * aspectRatio)
  }
}

watch(() => props.baseWidth, (newWidth) => {
  customWidth.value = newWidth
})

watch(() => props.baseHeight, (newHeight) => {
  customHeight.value = newHeight
})

function applyPreset() {
  const presets: Record<string, Partial<CustomExportOptions>> = {
    webOptimized: {
      format: 'gif',
      quality: 'medium',
      fps: 12,
      scale: 1.0,
      dithering: true,
      colorDepth: 128,
      compress: true,
      compressionLevel: 70
    },
    highQualityVideo: {
      format: 'mp4',
      quality: 'ultra',
      fps: 30,
      scale: 1.0,
      codec: 'h264',
      bitrate: 8000
    },
    smallGif: {
      format: 'gif',
      quality: 'low',
      fps: 8,
      scale: 0.5,
      colorDepth: 64,
      dithering: false,
      compress: true,
      compressionLevel: 85
    },
    twitterGif: {
      format: 'gif',
      quality: 'medium',
      fps: 15,
      scale: 1.0,
      colorDepth: 256,
      compress: true,
      compressionLevel: 75
    },
    discordEmote: {
      format: 'gif',
      quality: 'high',
      fps: 24,
      scale: 1.0,
      colorDepth: 256,
      loop: true
    },
    spriteSheet: {
      format: 'png',
      quality: 'ultra',
      frameRange: 'all',
      transparency: true,
      compress: false
    },
    frameSequence: {
      format: 'zip',
      quality: 'high',
      imageSequenceFormat: 'png',
      transparency: true
    }
  }

  if (selectedPreset.value && presets[selectedPreset.value]) {
    options.value = { ...options.value, ...presets[selectedPreset.value] }
  }
}

function close() {
  emit('close')
}

function exportWithOptions() {
  const exportOptions = {
    ...options.value,
    width: customWidth.value,
    height: customHeight.value
  }
  emit('export', exportOptions)
}

// Initialize compression level if not set
if (options.value.compressionLevel === undefined) {
  options.value.compressionLevel = 75
}
</script>

<style scoped>
.custom-export-dialog {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
}

.dialog-backdrop {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(4px);
}

.dialog-content {
  position: relative;
  background: var(--vscode-editor-background);
  border: 1px solid var(--vscode-panel-border);
  border-radius: 8px;
  width: 90%;
  max-width: 700px;
  max-height: 85vh;
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
  background: var(--vscode-sideBar-background);
}

.header-title {
  display: flex;
  align-items: center;
  gap: 10px;
}

.header-icon {
  color: var(--vscode-button-background);
}

.dialog-header h2 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
}

.close-btn {
  background: none;
  border: none;
  color: var(--vscode-foreground);
  cursor: pointer;
  padding: 4px;
  display: flex;
  align-items: center;
  border-radius: 4px;
}

.close-btn:hover {
  background: var(--vscode-toolbar-hoverBackground);
}

.dialog-body {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
}

.section-tabs {
  display: flex;
  gap: 4px;
  margin-bottom: 20px;
  border-bottom: 1px solid var(--vscode-panel-border);
}

.section-tabs button {
  background: none;
  border: none;
  color: var(--vscode-foreground);
  padding: 8px 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  border-bottom: 2px solid transparent;
  transition: all 0.2s;
}

.section-tabs button:hover {
  background: var(--vscode-toolbar-hoverBackground);
}

.section-tabs button.active {
  border-bottom-color: var(--vscode-button-background);
  color: var(--vscode-button-background);
}

.tab-content {
  min-height: 300px;
}

.tab-panel {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-group > label:first-child {
  font-size: 12px;
  font-weight: 600;
  color: var(--vscode-foreground);
}

.format-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 8px;
}

.format-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 12px;
  background: var(--vscode-button-secondaryBackground);
  border: 2px solid transparent;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
  color: var(--vscode-foreground);
}

.format-btn:hover {
  background: var(--vscode-button-secondaryHoverBackground);
}

.format-btn.active {
  border-color: var(--vscode-button-background);
  background: var(--vscode-button-background);
  color: var(--vscode-button-foreground);
}

.format-btn span:first-of-type {
  font-weight: 600;
  font-size: 13px;
}

.format-desc {
  font-size: 10px;
  opacity: 0.7;
  text-align: center;
}

.quality-buttons {
  display: flex;
  gap: 8px;
}

.quality-buttons button {
  flex: 1;
  padding: 8px;
  background: var(--vscode-button-secondaryBackground);
  border: 2px solid transparent;
  border-radius: 4px;
  cursor: pointer;
  color: var(--vscode-foreground);
  font-size: 12px;
}

.quality-buttons button:hover {
  background: var(--vscode-button-secondaryHoverBackground);
}

.quality-buttons button.active {
  border-color: var(--vscode-button-background);
  background: var(--vscode-button-background);
  color: var(--vscode-button-foreground);
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-size: 13px;
}

.checkbox-label input[type="checkbox"] {
  cursor: pointer;
}

.number-input,
.color-text-input,
.select-input {
  padding: 6px 10px;
  background: var(--vscode-input-background);
  border: 1px solid var(--vscode-input-border);
  border-radius: 4px;
  color: var(--vscode-input-foreground);
  font-size: 13px;
}

.slider {
  width: 100%;
  cursor: pointer;
}

.slider-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 8px;
}

.scale-display {
  text-align: center;
  font-size: 14px;
  font-weight: 600;
  color: var(--vscode-button-background);
}

.hint {
  font-size: 11px;
  opacity: 0.7;
}

.radio-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.radio-label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-size: 13px;
}

.range-inputs,
.size-inputs {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.frame-preview,
.size-preview {
  padding: 12px;
  background: var(--vscode-editor-inactiveSelectionBackground);
  border-radius: 4px;
  text-align: center;
  font-size: 12px;
  font-weight: 600;
}

.color-picker-group {
  display: flex;
  gap: 8px;
  align-items: center;
}

.color-input {
  width: 50px;
  height: 36px;
  border: 1px solid var(--vscode-input-border);
  border-radius: 4px;
  cursor: pointer;
}

.dialog-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 20px;
  border-top: 1px solid var(--vscode-panel-border);
  background: var(--vscode-sideBar-background);
  gap: 16px;
}

.footer-left {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.preset-section {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
}

.preset-section label {
  font-weight: 500;
  opacity: 0.8;
}

.preset-section .select-input {
  min-width: 160px;
}

.export-summary {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  color: var(--vscode-descriptionForeground);
}

.export-summary .dot {
  opacity: 0.4;
}

.export-summary .format-badge {
  background: var(--vscode-badge-background);
  color: var(--vscode-badge-foreground);
  padding: 1px 6px;
  border-radius: 3px;
  font-weight: 600;
  font-size: 10px;
}

.button-group {
  display: flex;
  gap: 8px;
}

.secondary-btn {
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.2s;
  background: var(--vscode-button-secondaryBackground);
  border: 1px solid var(--vscode-button-border);
  color: var(--vscode-button-secondaryForeground);
}

.secondary-btn:hover {
  background: var(--vscode-button-secondaryHoverBackground);
}

.export-btn {
  padding: 10px 24px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.2s;
  background: #22c55e;
  border: none;
  color: white;
  box-shadow: 0 2px 8px rgba(34, 197, 94, 0.3);
}

.export-btn:hover {
  background: #16a34a;
  box-shadow: 0 4px 12px rgba(34, 197, 94, 0.4);
  transform: translateY(-1px);
}

.export-btn:active {
  transform: translateY(0);
}
</style>
