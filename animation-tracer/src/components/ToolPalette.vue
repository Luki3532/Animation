<template>
  <div class="tool-palette">
    <div class="tool-section">
      <h3>Tools</h3>
      <div class="tools-grid">
        <button
          v-for="tool in tools"
          :key="tool.id"
          :class="{ active: drawingStore.toolSettings.tool === tool.id }"
          @click="drawingStore.setTool(tool.id)"
          @mouseenter="drawingStore.setHoveredHint(getTooltip(tool))"
          @mouseleave="drawingStore.setHoveredHint('')"
        >
          <span v-html="tool.icon"></span>
        </button>
      </div>
    </div>

    <div class="tool-section">
      <h3>Color</h3>
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
          class="color-preset"
          @click="drawingStore.setColor(color)"
        />
      </div>
    </div>

    <div class="tool-section">
      <h3>Brush Size</h3>
      <input
        type="range"
        min="1"
        max="50"
        :value="drawingStore.toolSettings.brushSize"
        @input="onBrushSizeChange"
      />
      <span class="size-value">{{ drawingStore.toolSettings.brushSize }}px</span>
    </div>

    <div class="tool-section">
      <h3>Opacity</h3>
      <input
        type="range"
        min="0"
        max="100"
        :value="drawingStore.toolSettings.opacity * 100"
        @input="onOpacityChange"
      />
      <span class="size-value">{{ Math.round(drawingStore.toolSettings.opacity * 100) }}%</span>
    </div>

    <div class="tool-section">
      <h3>Actions</h3>
      <div class="action-buttons">
        <button 
          @click="emit('undo')" 
          @mouseenter="drawingStore.setHoveredHint('Undo last action (Ctrl+Z)')"
          @mouseleave="drawingStore.setHoveredHint('')"
        ><Undo2 :size="14" /> Undo</button>
        <button 
          @click="emit('redo')" 
          @mouseenter="drawingStore.setHoveredHint('Redo last undone action (Ctrl+Y)')"
          @mouseleave="drawingStore.setHoveredHint('')"
        ><Redo2 :size="14" /> Redo</button>
        <button 
          @click="emit('clear')" 
          class="danger"
          @mouseenter="drawingStore.setHoveredHint('Clear all drawings on current frame')"
          @mouseleave="drawingStore.setHoveredHint('')"
        ><Trash2 :size="14" /> Clear</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Undo2, Redo2, Trash2 } from 'lucide-vue-next'
import { useDrawingStore } from '../stores/drawingStore'
import { useSettingsStore } from '../stores/settingsStore'
import type { ToolSettings } from '../types/drawing'

const drawingStore = useDrawingStore()
const settingsStore = useSettingsStore()

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

// Basic tools (default mode) - using Lucide icons (https://lucide.dev)
const basicTools: Tool[] = [
  { id: 'pen', name: 'Pen', hotkey: 'B', icon: '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>' },
  { id: 'eraser', name: 'Eraser', hotkey: 'E', icon: '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m7 21-4.3-4.3c-1-1-1-2.5 0-3.4l9.6-9.6c1-1 2.5-1 3.4 0l5.6 5.6c1 1 1 2.5 0 3.4L13 21"/><path d="M22 21H7"/><path d="m5 11 9 9"/></svg>' },
  { id: 'line', name: 'Line', hotkey: 'L', icon: '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 19L19 5"/></svg>' },
  { id: 'rectangle', name: 'Rectangle', hotkey: 'U', icon: '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/></svg>' },
  { id: 'circle', name: 'Ellipse', hotkey: 'Shift+U', icon: '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/></svg>' },
  { id: 'select', name: 'Move', hotkey: 'V', icon: '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m5 9-3 3 3 3"/><path d="m9 5 3-3 3 3"/><path d="m15 19-3 3-3-3"/><path d="m19 9 3 3-3 3"/><line x1="2" x2="22" y1="12" y2="12"/><line x1="12" x2="12" y1="2" y2="22"/></svg>' },
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
]

// Use either basic or artist tools based on setting
const tools = computed(() => settingsStore.artistControls ? artistTools : basicTools)

// Format tooltip text
function getTooltip(tool: Tool): string {
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
</script>

<style scoped>
.tool-palette {
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  overflow-y: auto;
  overflow-x: hidden;
  height: 100%;
}

.tool-section h3 {
  margin: 0 0 8px 0;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: #666;
  font-weight: 600;
  line-height: 1.2;
}

.tools-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 3px;
  overflow: visible;
}

.tools-grid button {
  height: 36px;
  background: #252525;
  border-radius: 4px;
  font-size: 15px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #888;
  position: relative;
}

.tools-grid button svg {
  width: 18px;
  height: 18px;
}

.tools-grid button:hover {
  background: #333;
  color: #fff;
}

.tools-grid button.active {
  background: var(--accent, #e85d04);
  color: #fff;
}

.color-picker {
  width: 100%;
  height: 32px;
  border-radius: 4px;
  cursor: pointer;
  padding: 0;
  border: 1px solid #333;
}

.color-presets {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 3px;
  margin-top: 6px;
}

.color-preset {
  aspect-ratio: 1;
  border: 1px solid #333;
  border-radius: 3px;
  cursor: pointer;
  transition: transform 0.1s;
}

.color-preset:hover {
  transform: scale(1.15);
  z-index: 1;
}

input[type="range"] {
  width: 100%;
  height: 4px;
}

.size-value {
  font-size: 11px;
  color: #666;
  display: block;
  margin-top: 4px;
}

.action-buttons {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.action-buttons button {
  padding: 7px 10px;
  background: #252525;
  border-radius: 4px;
  text-align: left;
  font-size: 12px;
  color: #aaa;
  display: flex;
  align-items: center;
  gap: 6px;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  min-width: 0;
}

.action-buttons button svg {
  flex-shrink: 0;
}

.action-buttons button:hover {
  background: #333;
  color: #fff;
}

.action-buttons button.danger {
  color: #e85d04;
}

.action-buttons button.danger:hover {
  background: #e85d04;
  color: #fff;
}
</style>
