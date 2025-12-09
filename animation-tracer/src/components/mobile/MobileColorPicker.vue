<template>
  <Teleport to="body">
    <div class="color-picker-overlay" @click="emit('close')">
      <div class="color-picker-panel" @click.stop>
        <div class="panel-header">
          <span>Pick Color</span>
          <button class="close-btn" @click="emit('close')">×</button>
        </div>
        
        <div class="panel-content">
          <!-- Current color preview -->
          <div class="current-color">
            <div class="color-box" :style="{ background: selectedColor }"></div>
            <span class="color-hex">{{ selectedColor.toUpperCase() }}</span>
          </div>
          
          <!-- Color swatches -->
          <div class="swatches-grid">
            <button
              v-for="color in colorSwatches"
              :key="color"
              class="swatch"
              :class="{ active: selectedColor === color }"
              :style="{ background: color }"
              @click="selectColor(color)"
            ></button>
          </div>
          
          <!-- Brightness slider -->
          <div class="brightness-section">
            <label>Brightness</label>
            <input 
              type="range" 
              min="0" 
              max="100" 
              :value="brightness"
              @input="adjustBrightness"
              class="brightness-slider"
            />
          </div>
          
          <!-- Custom color input -->
          <div class="custom-section">
            <label>Custom</label>
            <input 
              type="color" 
              :value="selectedColor"
              @input="handleCustomColor"
              class="custom-input"
            />
          </div>
        </div>
        
        <div class="panel-footer">
          <button class="btn-cancel" @click="emit('close')">Cancel</button>
          <button class="btn-select" @click="confirmSelection">Select</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const props = defineProps<{
  currentColor: string
}>()

const emit = defineEmits<{
  (e: 'select', color: string): void
  (e: 'close'): void
}>()

const selectedColor = ref(props.currentColor)
const brightness = ref(50)

// Pre-defined color swatches - optimized for common animation colors
const colorSwatches = [
  // Row 1 - Basic colors
  '#000000', '#333333', '#666666', '#999999', '#CCCCCC', '#FFFFFF',
  // Row 2 - Primary/Secondary
  '#FF0000', '#FF8800', '#FFFF00', '#00FF00', '#00FFFF', '#0000FF',
  // Row 3 - Extended palette
  '#FF00FF', '#880088', '#FF4444', '#FF8844', '#88FF44', '#4488FF',
  // Row 4 - Skin tones and earth tones
  '#FFE4C4', '#DEB887', '#CD853F', '#8B4513', '#654321', '#3D2914',
  // Row 5 - Pastels
  '#FFB3BA', '#FFDFBA', '#FFFFBA', '#BAFFC9', '#BAE1FF', '#E8BAFF'
]

function selectColor(color: string) {
  selectedColor.value = color
}

function handleCustomColor(event: Event) {
  const input = event.target as HTMLInputElement
  selectedColor.value = input.value
}

function adjustBrightness(event: Event) {
  const input = event.target as HTMLInputElement
  brightness.value = parseInt(input.value)
  
  // Adjust selected color brightness
  const hex = selectedColor.value.replace('#', '')
  let r = parseInt(hex.substr(0, 2), 16)
  let g = parseInt(hex.substr(2, 2), 16)
  let b = parseInt(hex.substr(4, 2), 16)
  
  const factor = brightness.value / 50
  r = Math.min(255, Math.round(r * factor))
  g = Math.min(255, Math.round(g * factor))
  b = Math.min(255, Math.round(b * factor))
  
  selectedColor.value = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
}

function confirmSelection() {
  emit('select', selectedColor.value)
}
</script>

<style scoped>
.color-picker-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10002;
  user-select: none;
  -webkit-user-select: none;
}

.color-picker-panel {
  background: #1e1e1e;
  border-radius: 16px;
  width: 320px;
  max-width: 90vw;
  max-height: 90vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.panel-header {
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

.panel-content {
  flex: 1;
  padding: 16px;
  overflow-y: auto;
}

.current-color {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
  padding: 12px;
  background: #252525;
  border-radius: 10px;
}

.color-box {
  width: 48px;
  height: 48px;
  border-radius: 8px;
  border: 2px solid rgba(255, 255, 255, 0.1);
}

.color-hex {
  font-family: 'Consolas', 'Monaco', monospace;
  font-size: 16px;
  color: #aaa;
}

.swatches-grid {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 8px;
  margin-bottom: 20px;
}

.swatch {
  aspect-ratio: 1;
  min-height: 40px;
  border: 2px solid transparent;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.swatch:active {
  transform: scale(0.9);
}

.swatch.active {
  border-color: #fff;
  box-shadow: 0 0 0 2px #4a9eff;
}

.brightness-section,
.custom-section {
  margin-bottom: 16px;
}

.brightness-section label,
.custom-section label {
  display: block;
  font-size: 13px;
  color: #888;
  margin-bottom: 8px;
}

.brightness-slider {
  width: 100%;
  height: 8px;
  -webkit-appearance: none;
  appearance: none;
  background: linear-gradient(to right, #000, #fff);
  border-radius: 4px;
  outline: none;
}

.brightness-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 24px;
  height: 24px;
  background: #fff;
  border-radius: 50%;
  cursor: pointer;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
}

.custom-input {
  width: 100%;
  height: 44px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  background: transparent;
}

.custom-input::-webkit-color-swatch-wrapper {
  padding: 0;
}

.custom-input::-webkit-color-swatch {
  border: 2px solid #333;
  border-radius: 8px;
}

.panel-footer {
  display: flex;
  gap: 12px;
  padding: 16px;
  border-top: 1px solid #333;
}

.btn-cancel,
.btn-select {
  flex: 1;
  padding: 14px;
  border-radius: 10px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;
}

.btn-cancel {
  background: #333;
  border: none;
  color: #aaa;
}

.btn-cancel:active {
  background: #3a3a3a;
}

.btn-select {
  background: #4a9eff;
  border: none;
  color: #fff;
}

.btn-select:active {
  background: #3a8eef;
}
</style>
