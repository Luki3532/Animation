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
          :title="tool.label"
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
        <button @click="emit('undo')" title="Undo (Ctrl+Z)"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7v6h6"/><path d="M3 13a9 9 0 1 0 3-7.7L3 7"/></svg> Undo</button>
        <button @click="emit('redo')" title="Redo (Ctrl+Y)"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 7v6h-6"/><path d="M21 13a9 9 0 1 1-3-7.7L21 7"/></svg> Redo</button>
        <button @click="emit('clear')" class="danger" title="Clear Frame"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg> Clear</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useDrawingStore } from '../stores/drawingStore'
import type { ToolSettings } from '../types/drawing'

const drawingStore = useDrawingStore()

const emit = defineEmits<{
  undo: []
  redo: []
  clear: []
}>()

interface Tool {
  id: ToolSettings['tool']
  label: string
  icon: string
}

const tools: Tool[] = [
  { id: 'pen', label: 'Pen (P)', icon: '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19l7-7 3 3-7 7-3-3z"/><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/><path d="M2 2l7.586 7.586"/><circle cx="11" cy="11" r="2"/></svg>' },
  { id: 'eraser', label: 'Eraser (E)', icon: '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 21h10"/><path d="M5.828 14.828L15.314 5.343a2 2 0 012.828 0l.707.707a2 2 0 010 2.828L9.364 18.364a2 2 0 01-2.828 0l-.707-.707a2 2 0 010-2.829z"/></svg>' },
  { id: 'line', label: 'Line (L)', icon: '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="19" x2="19" y2="5"/></svg>' },
  { id: 'rectangle', label: 'Rectangle (R)', icon: '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/></svg>' },
  { id: 'circle', label: 'Circle (C)', icon: '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/></svg>' },
  { id: 'select', label: 'Select (V)', icon: '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z"/><path d="M13 13l6 6"/></svg>' },
]

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
  height: 100%;
}

.tool-section h3 {
  margin: 0 0 6px 0;
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: #555;
  font-weight: 500;
}

.tools-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 3px;
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
