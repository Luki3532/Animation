<template>
  <div class="tool-palette">
    <!-- Tools Section -->
    <div class="tool-section tools-section">
      <div class="section-header">
        <span class="section-title">Tools</span>
        <span class="tool-hint" v-if="currentToolHotkey">{{ currentToolHotkey }}</span>
      </div>
      <div class="tools-grid">
        <button
          v-for="tool in tools"
          :key="tool.id"
          :class="{ active: drawingStore.toolSettings.tool === tool.id }"
          @click="drawingStore.setTool(tool.id)"
          @mouseenter="drawingStore.setHoveredHint(getTooltip(tool))"
          @mouseleave="drawingStore.setHoveredHint('')"
          :title="getTooltip(tool)"
        >
          <span v-html="tool.icon"></span>
        </button>
      </div>
    </div>

    <!-- Color Section -->
    <div class="tool-section color-section">
      <div class="section-header">
        <span class="section-title">Color</span>
        <span class="color-value">{{ drawingStore.toolSettings.color }}</span>
      </div>
      <div class="color-main">
        <input
          type="color"
          :value="drawingStore.toolSettings.color"
          @input="onColorChange"
          class="color-picker"
        />
        <div class="color-presets">
          <button
            v-for="color in colorPresets"
            :key="color"
            :style="{ background: color }"
            :class="{ active: drawingStore.toolSettings.color === color }"
            class="color-preset"
            @click="drawingStore.setColor(color)"
          />
        </div>
      </div>
      <div class="bg-color-row">
        <span class="bg-label">Canvas BG</span>
        <input
          type="color"
          :value="settingsStore.canvasBackgroundColor"
          @input="onBgColorChange"
          class="bg-color-picker"
        />
      </div>
    </div>

    <!-- Brush Settings Section -->
    <div class="tool-section brush-section">
      <div class="section-header">
        <span class="section-title">Brush</span>
      </div>
      
      <div class="brush-controls">
        <div class="control-row">
          <label>Size</label>
          <div class="slider-with-value">
            <input
              type="range"
              min="1"
              max="50"
              :value="drawingStore.toolSettings.brushSize"
              @input="onBrushSizeChange"
            />
            <span class="value-display">{{ drawingStore.toolSettings.brushSize }}</span>
          </div>
        </div>
        
        <div class="control-row">
          <label>Opacity</label>
          <div class="slider-with-value">
            <input
              type="range"
              min="0"
              max="100"
              :value="drawingStore.toolSettings.opacity * 100"
              @input="onOpacityChange"
            />
            <span class="value-display">{{ Math.round(drawingStore.toolSettings.opacity * 100) }}%</span>
          </div>
        </div>
      </div>

      <!-- Brush Type (Collapsible) -->
      <div class="brush-type-toggle" @click="brushPaletteCollapsed = !brushPaletteCollapsed">
        <span>{{ currentBrushName }}</span>
        <ChevronDown :size="12" :class="{ rotated: brushPaletteCollapsed }" />
      </div>
      <div class="brush-palette" v-show="!brushPaletteCollapsed">
        <button
          v-for="brush in brushTypes"
          :key="brush.id"
          :class="{ active: drawingStore.toolSettings.brushType === brush.id }"
          @click="drawingStore.setBrushType(brush.id)"
          @mouseenter="drawingStore.setHoveredHint(brush.name)"
          @mouseleave="drawingStore.setHoveredHint('')"
          class="brush-preview"
          :title="brush.name"
        >
          <div class="brush-shape" :class="brush.id"></div>
        </button>
      </div>
    </div>

    <!-- Actions Section -->
    <div class="tool-section actions-section">
      <div class="section-header">
        <span class="section-title">Actions</span>
      </div>
      <div class="action-buttons">
        <button 
          @click="emit('undo')" 
          @mouseenter="drawingStore.setHoveredHint('Undo (Ctrl+Z)')"
          @mouseleave="drawingStore.setHoveredHint('')"
          class="action-btn"
        >
          <Undo2 :size="14" />
          <span>Undo</span>
        </button>
        <button 
          @click="emit('redo')" 
          @mouseenter="drawingStore.setHoveredHint('Redo (Ctrl+Y)')"
          @mouseleave="drawingStore.setHoveredHint('')"
          class="action-btn"
        >
          <Redo2 :size="14" />
          <span>Redo</span>
        </button>
        <button 
          @click="emit('clear')" 
          class="action-btn danger"
          @mouseenter="drawingStore.setHoveredHint('Clear frame')"
          @mouseleave="drawingStore.setHoveredHint('')"
        >
          <Trash2 :size="14" />
          <span>Clear</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { Undo2, Redo2, Trash2, ChevronDown } from 'lucide-vue-next'
import { useDrawingStore } from '../stores/drawingStore'
import { useSettingsStore } from '../stores/settingsStore'
import type { ToolSettings, BrushType } from '../types/drawing'

const drawingStore = useDrawingStore()
const settingsStore = useSettingsStore()

// Collapsible state for brush palette (starts collapsed/minimized)
const brushPaletteCollapsed = ref(true)

const emit = defineEmits<{
  undo: []
  redo: []
  clear: []
}>()

interface Tool {
  id: ToolSettings['tool']
  name: string
  hotkey: string
  icon: string
}

interface BrushTypeItem {
  id: BrushType
  name: string
}

// MS Paint-style brush types
const brushTypes: BrushTypeItem[] = [
  { id: 'round', name: 'Round Brush' },
  { id: 'square', name: 'Square Brush' },
  { id: 'slash-right', name: 'Forward Slash (/)' },
  { id: 'slash-left', name: 'Back Slash (\\)' },
  { id: 'calligraphy', name: 'Calligraphy' },
  { id: 'oil', name: 'Oil Brush' },
  { id: 'crayon', name: 'Crayon' },
  { id: 'marker', name: 'Marker' },
  { id: 'pencil-tip', name: 'Pencil Tip' },
]

// Basic tools (default mode) - using Lucide icons (https://lucide.dev)
const basicTools: Tool[] = [
  { id: 'pen', name: 'Pen', hotkey: 'B', icon: '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>' },
  { id: 'eraser', name: 'Eraser', hotkey: 'E', icon: '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m7 21-4.3-4.3c-1-1-1-2.5 0-3.4l9.6-9.6c1-1 2.5-1 3.4 0l5.6 5.6c1 1 1 2.5 0 3.4L13 21"/><path d="M22 21H7"/><path d="m5 11 9 9"/></svg>' },
  { id: 'line', name: 'Line', hotkey: 'L', icon: '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 19L19 5"/></svg>' },
  { id: 'rectangle', name: 'Rectangle', hotkey: 'U', icon: '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/></svg>' },
  { id: 'circle', name: 'Ellipse', hotkey: 'Shift+U', icon: '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/></svg>' },
  { id: 'select', name: 'Move', hotkey: 'V', icon: '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m5 9-3 3 3 3"/><path d="m9 5 3-3 3 3"/><path d="m15 19-3 3-3-3"/><path d="m19 9 3 3-3 3"/><line x1="2" x2="22" y1="12" y2="12"/><line x1="12" x2="12" y1="2" y2="22"/></svg>' },
  { id: 'pan', name: 'Pan', hotkey: 'H', icon: '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 11V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v0"/><path d="M14 10V4a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v2"/><path d="M10 10.5V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v8"/><path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15"/></svg>' },
]

// Aseprite-style artist tools - using Lucide icons (https://lucide.dev)
const artistTools: Tool[] = [
  // Drawing tools
  { id: 'pencil', name: 'Pencil', hotkey: 'B', icon: '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>' },
  { id: 'brush', name: 'Brush', hotkey: 'B', icon: '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9.06 11.9 8.07-8.06a2.85 2.85 0 1 1 4.03 4.03l-8.06 8.08"/><path d="M7.07 14.94c-1.66 0-3 1.35-3 3.02 0 1.33-2.5 1.52-2 2.02 1.08 1.1 2.49 2.02 4 2.02 2.2 0 4-1.8 4-4.04a3.01 3.01 0 0 0-3-3.02z"/></svg>' },
  { id: 'spray', name: 'Spray', hotkey: 'Shift+B', icon: '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4.9 19.1C1 15.2 1 8.8 4.9 4.9"/><path d="M7.8 16.2c-2.3-2.3-2.3-6.1 0-8.5"/><circle cx="12" cy="12" r="2"/><path d="M16.2 7.8c2.3 2.3 2.3 6.1 0 8.5"/><path d="M19.1 4.9C23 8.8 23 15.1 19.1 19"/></svg>' },
  { id: 'eraser', name: 'Eraser', hotkey: 'E', icon: '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m7 21-4.3-4.3c-1-1-1-2.5 0-3.4l9.6-9.6c1-1 2.5-1 3.4 0l5.6 5.6c1 1 1 2.5 0 3.4L13 21"/><path d="M22 21H7"/><path d="m5 11 9 9"/></svg>' },
  { id: 'eyedropper', name: 'Eyedropper', hotkey: 'I', icon: '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m2 22 1-1h3l9-9"/><path d="M3 21v-3l9-9"/><path d="m15 6 3.4-3.4a2.1 2.1 0 1 1 3 3L18 9l.4.4a2.1 2.1 0 1 1-3 3l-3.8-3.8a2.1 2.1 0 1 1 3-3l.4.4Z"/></svg>' },
  { id: 'fill', name: 'Paint Bucket', hotkey: 'G', icon: '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m19 11-8-8-8.6 8.6a2 2 0 0 0 0 2.8l5.2 5.2c.8.8 2 .8 2.8 0L19 11Z"/><path d="m5 2 5 5"/><path d="M2 13h15"/><path d="M22 20a2 2 0 1 1-4 0c0-1.6 1.7-2.4 2-4 .3 1.6 2 2.4 2 4Z"/></svg>' },
  // Shape tools
  { id: 'line', name: 'Line', hotkey: 'L', icon: '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 19L19 5"/></svg>' },
  { id: 'curve', name: 'Curve', hotkey: 'Shift+L', icon: '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12c0-4 3.33-8 10-8s10 4 10 8-3.33 8-10 8-10-4-10-8Z"/><path d="M12 12v.01"/></svg>' },
  { id: 'rectangle', name: 'Rectangle', hotkey: 'U', icon: '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/></svg>' },
  { id: 'circle', name: 'Ellipse', hotkey: 'Shift+U', icon: '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/></svg>' },
  { id: 'contour', name: 'Contour', hotkey: 'D', icon: '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22c-4.97 0-9-2.24-9-5v-4"/><path d="M12 14c-4.97 0-9-2.24-9-5s4.03-5 9-5 9 2.24 9 5"/><path d="M21 9v4c0 2.76-4.03 5-9 5"/><path d="M12 9v.01"/></svg>' },
  { id: 'polygon', name: 'Polygon', hotkey: 'Shift+D', icon: '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2l9.5 5.5v9L12 22l-9.5-5.5v-9L12 2Z"/></svg>' },
  // Selection tools
  { id: 'marquee', name: 'Marquee', hotkey: 'M', icon: '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="0" stroke-dasharray="4 2"/></svg>' },
  { id: 'lasso', name: 'Lasso', hotkey: 'Q', icon: '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 22a5 5 0 0 1-2-4"/><path d="M3.3 14A6.8 6.8 0 0 1 2 10c0-4.4 4.5-8 10-8s10 3.6 10 8-4.5 8-10 8a12 12 0 0 1-3.2-.5"/><path d="M12 10a3 3 0 1 0 0 6"/></svg>' },
  { id: 'select', name: 'Move', hotkey: 'V', icon: '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m5 9-3 3 3 3"/><path d="m9 5 3-3 3 3"/><path d="m15 19-3 3-3-3"/><path d="m19 9 3 3-3 3"/><line x1="2" x2="22" y1="12" y2="12"/><line x1="12" x2="12" y1="2" y2="22"/></svg>' },
  { id: 'pan', name: 'Pan', hotkey: 'H', icon: '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 11V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v0"/><path d="M14 10V4a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v2"/><path d="M10 10.5V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v8"/><path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15"/></svg>' },
]

// Use either basic or artist tools based on setting
const tools = computed(() => settingsStore.artistControls ? artistTools : basicTools)

// Get current tool hotkey for display
const currentToolHotkey = computed(() => {
  const currentTool = tools.value.find(t => t.id === drawingStore.toolSettings.tool)
  return currentTool?.hotkey || ''
})

// Get current brush name
const currentBrushName = computed(() => {
  const brush = brushTypes.find(b => b.id === drawingStore.toolSettings.brushType)
  return brush?.name || 'Round Brush'
})

// Format tooltip text
function getTooltip(tool: Tool): string {
  if (tool.id === 'pan') {
    return `${tool.name} (${tool.hotkey}) - Also: Middle mouse to pan, Ctrl+Wheel to zoom, Ctrl+0 to reset`
  }
  return `${tool.name} (${tool.hotkey})`
}

const colorPresets = [
  '#000000', '#ffffff', '#ff0000', '#00ff00', '#0000ff',
  '#ffff00', '#ff00ff', '#00ffff', '#ff8800', '#8800ff',
]

function onColorChange(e: Event) {
  const input = e.target as HTMLInputElement
  drawingStore.setColor(input.value)
}

function onBrushSizeChange(e: Event) {
  const input = e.target as HTMLInputElement
  drawingStore.setBrushSize(parseInt(input.value))
}

function onOpacityChange(e: Event) {
  const input = e.target as HTMLInputElement
  drawingStore.setOpacity(parseInt(input.value) / 100)
}

function onBgColorChange(e: Event) {
  const input = e.target as HTMLInputElement
  settingsStore.setCanvasBackgroundColor(input.value)
}
</script>

<style scoped>
.tool-palette {
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 2px;
  overflow-y: auto;
  overflow-x: hidden;
  height: 100%;
  background: #1a1a1a;
}

/* Section Styles */
.tool-section {
  background: #222;
  border-radius: 6px;
  padding: 10px;
  border: 1px solid #2a2a2a;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.section-title {
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.8px;
  color: #666;
  font-weight: 600;
}

.tool-hint {
  font-size: 9px;
  color: #555;
  background: #1a1a1a;
  padding: 2px 5px;
  border-radius: 3px;
  font-family: monospace;
}

/* Tools Grid */
.tools-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 2px;
}

.tools-grid button {
  aspect-ratio: 1;
  background: #2a2a2a;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #777;
  transition: all 0.15s ease;
  border: 1px solid transparent;
}

.tools-grid button svg {
  width: 16px;
  height: 16px;
}

.tools-grid button:hover {
  background: #333;
  color: #bbb;
  border-color: #444;
}

.tools-grid button.active {
  background: var(--accent, #e85d04);
  color: #fff;
  border-color: var(--accent, #e85d04);
  box-shadow: 0 0 8px rgba(232, 93, 4, 0.3);
}

/* Color Section */
.color-value {
  font-size: 9px;
  color: #555;
  font-family: monospace;
  text-transform: uppercase;
}

.color-main {
  display: flex;
  gap: 8px;
  align-items: flex-start;
}

.color-picker {
  width: 36px;
  height: 36px;
  border-radius: 6px;
  cursor: pointer;
  padding: 0;
  border: 2px solid #333;
  flex-shrink: 0;
}

.color-picker::-webkit-color-swatch-wrapper {
  padding: 2px;
}

.color-picker::-webkit-color-swatch {
  border-radius: 3px;
  border: none;
}

.color-presets {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 2px;
  flex: 1;
}

.color-preset {
  aspect-ratio: 1;
  border: 1px solid #333;
  border-radius: 3px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.color-preset:hover {
  transform: scale(1.1);
  z-index: 1;
  border-color: #555;
}

.color-preset.active {
  border-color: #fff;
  box-shadow: 0 0 0 1px #fff;
}

.bg-color-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px solid #333;
}

.bg-label {
  font-size: 10px;
  color: #888;
  flex: 1;
}

.bg-color-picker {
  width: 28px;
  height: 28px;
  border-radius: 4px;
  cursor: pointer;
  padding: 0;
  border: 2px solid #333;
  flex-shrink: 0;
}

.bg-color-picker::-webkit-color-swatch-wrapper {
  padding: 2px;
}

.bg-color-picker::-webkit-color-swatch {
  border-radius: 2px;
  border: none;
}

/* Brush Controls */
.brush-controls {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 8px;
}

.control-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.control-row label {
  font-size: 10px;
  color: #666;
  width: 45px;
  flex-shrink: 0;
}

.slider-with-value {
  display: flex;
  align-items: center;
  gap: 6px;
  flex: 1;
}

.slider-with-value input[type="range"] {
  flex: 1;
  height: 4px;
  -webkit-appearance: none;
  background: #333;
  border-radius: 2px;
  outline: none;
}

.slider-with-value input[type="range"]::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 12px;
  height: 12px;
  background: var(--accent, #e85d04);
  border-radius: 50%;
  cursor: pointer;
  transition: transform 0.1s;
}

.slider-with-value input[type="range"]::-webkit-slider-thumb:hover {
  transform: scale(1.2);
}

.value-display {
  font-size: 10px;
  color: #888;
  min-width: 28px;
  text-align: right;
  font-family: monospace;
}

/* Brush Type Toggle */
.brush-type-toggle {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 8px;
  background: #1a1a1a;
  border-radius: 4px;
  cursor: pointer;
  font-size: 11px;
  color: #888;
  transition: all 0.15s ease;
  border: 1px solid #2a2a2a;
}

.brush-type-toggle:hover {
  background: #252525;
  color: #aaa;
}

.brush-type-toggle svg {
  transition: transform 0.2s ease;
  color: #555;
}

.brush-type-toggle svg.rotated {
  transform: rotate(-90deg);
}

/* Brush Palette */
.brush-palette {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 2px;
  margin-top: 6px;
  padding: 4px;
  background: #1a1a1a;
  border-radius: 4px;
  border: 1px solid #2a2a2a;
}

.brush-preview {
  aspect-ratio: 1;
  background: #252525;
  border-radius: 3px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.15s ease;
  border: 1px solid transparent;
}

.brush-preview:hover {
  background: #333;
  border-color: #444;
}

.brush-preview.active {
  background: var(--accent, #e85d04);
  border-color: var(--accent, #e85d04);
}

.brush-shape {
  width: 14px;
  height: 14px;
  background: currentColor;
  color: #666;
}

.brush-preview:hover .brush-shape,
.brush-preview.active .brush-shape {
  color: #fff;
}

/* Brush shape variants */
.brush-shape.round { border-radius: 50%; }
.brush-shape.square { border-radius: 0; }
.brush-shape.slash-right { width: 3px; height: 16px; transform: rotate(-45deg); border-radius: 1px; }
.brush-shape.slash-left { width: 3px; height: 16px; transform: rotate(45deg); border-radius: 1px; }
.brush-shape.calligraphy { width: 5px; height: 16px; border-radius: 2px; transform: rotate(-30deg); }
.brush-shape.oil { border-radius: 50%; box-shadow: 0 0 3px currentColor; opacity: 0.9; }
.brush-shape.crayon { border-radius: 2px; background: linear-gradient(135deg, currentColor 0%, transparent 20%, currentColor 25%, transparent 40%, currentColor 45%, transparent 60%, currentColor 65%, transparent 80%, currentColor 100%); }
.brush-shape.marker { border-radius: 3px; width: 10px; height: 16px; opacity: 0.7; }
.brush-shape.pencil-tip { width: 7px; height: 7px; transform: rotate(45deg); border-radius: 1px; }

/* Action Buttons */
.action-buttons {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 4px;
}

.action-btn {
  padding: 6px 8px;
  background: #2a2a2a;
  border-radius: 4px;
  font-size: 11px;
  color: #888;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  transition: all 0.15s ease;
  border: 1px solid transparent;
}

.action-btn:hover {
  background: #333;
  color: #bbb;
  border-color: #444;
}

.action-btn.danger {
  grid-column: span 2;
  color: #c44;
}

.action-btn.danger:hover {
  background: #e85d04;
  color: #fff;
  border-color: #e85d04;
}

.action-btn svg {
  flex-shrink: 0;
}
</style>
