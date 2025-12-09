<template>
  <div class="mobile-toolbar">
    <!-- Tool buttons -->
    <div class="tool-group">
      <button 
        class="tool-btn"
        :class="{ active: drawingStore.toolSettings.tool === 'pen' }"
        @click="drawingStore.setTool('pen')"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19l7-7 3 3-7 7-3-3z"/><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/><path d="M2 2l7.586 7.586"/><circle cx="11" cy="11" r="2"/></svg>
      </button>
      
      <button 
        class="tool-btn"
        :class="{ active: drawingStore.toolSettings.tool === 'eraser' }"
        @click="drawingStore.setTool('eraser')"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m7 21-4.3-4.3c-1-1-1-2.5 0-3.4l9.6-9.6c1-1 2.5-1 3.4 0l5.6 5.6c1 1 1 2.5 0 3.4L13 21"/><path d="M22 21H7"/><path d="m5 11 9 9"/></svg>
      </button>
    </div>
    
    <!-- Color picker -->
    <button class="color-btn" @click="showColorPicker = true">
      <span class="color-preview" :style="{ background: drawingStore.toolSettings.color }"></span>
    </button>
    
    <!-- Brush size -->
    <div class="size-control">
      <button class="size-btn" @click="decreaseSize">−</button>
      <span class="size-value">{{ drawingStore.toolSettings.brushSize }}</span>
      <button class="size-btn" @click="increaseSize">+</button>
    </div>
    
    <!-- Undo/Redo -->
    <div class="action-group">
      <button class="action-btn" @click="emit('undo')" title="Undo">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7v6h6"/><path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13"/></svg>
      </button>
      <button class="action-btn" @click="emit('redo')" title="Redo">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 7v6h-6"/><path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3l3 2.7"/></svg>
      </button>
    </div>
    
    <!-- Color picker modal -->
    <MobileColorPicker 
      v-if="showColorPicker"
      :currentColor="drawingStore.toolSettings.color"
      @select="handleColorSelect"
      @close="showColorPicker = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useDrawingStore } from '../../stores/drawingStore'
import MobileColorPicker from './MobileColorPicker.vue'

const drawingStore = useDrawingStore()
const showColorPicker = ref(false)

const emit = defineEmits<{
  (e: 'undo'): void
  (e: 'redo'): void
}>()

function handleColorSelect(color: string) {
  drawingStore.setColor(color)
  showColorPicker.value = false
}

function decreaseSize() {
  const newSize = Math.max(1, drawingStore.toolSettings.brushSize - 2)
  drawingStore.setBrushSize(newSize)
}

function increaseSize() {
  const newSize = Math.min(50, drawingStore.toolSettings.brushSize + 2)
  drawingStore.setBrushSize(newSize)
}
</script>

<style scoped>
.mobile-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-around;
  height: 56px;
  padding: 0 8px;
  background: #1a1a1a;
  border-top: 1px solid #333;
  user-select: none;
  -webkit-user-select: none;
}

.tool-group,
.action-group {
  display: flex;
  gap: 4px;
}

.tool-btn {
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #2a2a2a;
  border: 2px solid transparent;
  border-radius: 10px;
  color: #ccc;
  font-size: 20px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.tool-btn.active {
  background: #3a3a3a;
  border-color: #4a9eff;
}

.tool-btn:active {
  transform: scale(0.95);
}

.color-btn {
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #2a2a2a;
  border: 2px solid #3a3a3a;
  border-radius: 10px;
  cursor: pointer;
  padding: 6px;
}

.color-btn:active {
  transform: scale(0.95);
}

.color-preview {
  width: 100%;
  height: 100%;
  border-radius: 6px;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.size-control {
  display: flex;
  align-items: center;
  gap: 4px;
  background: #2a2a2a;
  border-radius: 10px;
  padding: 4px;
}

.size-btn {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #3a3a3a;
  border: none;
  border-radius: 6px;
  color: #ccc;
  font-size: 18px;
  font-weight: bold;
  cursor: pointer;
}

.size-btn:active {
  background: #4a4a4a;
}

.size-value {
  min-width: 28px;
  text-align: center;
  font-size: 13px;
  font-weight: 600;
  color: #aaa;
}

.action-btn {
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #2a2a2a;
  border: none;
  border-radius: 10px;
  font-size: 18px;
  cursor: pointer;
}

.action-btn:active {
  background: #3a3a3a;
  transform: scale(0.95);
}

.tool-icon {
  font-size: 20px;
}
</style>
