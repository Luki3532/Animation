<template>
  <div class="settings-panel">
    <div class="panel-section">
      <h3>Tool Mode</h3>
      
      <label class="setting-toggle">
        <input type="checkbox" :checked="settingsStore.artistControls" @change="toggleArtistControls" />
        <span>Artist Controls</span>
      </label>
      <p class="setting-hint">
        Enable Aseprite-style tools: Pencil, Brush, Spray, Eyedropper, Paint Bucket, Curve, Contour, Polygon, Marquee, Lasso, and more.
      </p>
    </div>

    <div class="panel-section">
      <h3>Line Smoothing</h3>
      
      <label class="setting-toggle">
        <input type="checkbox" :checked="settingsStore.smoothLineMode" @change="toggleSmoothLine" />
        <span>Smooth Line Mode</span>
      </label>
      <p class="setting-hint">
        Smooths brush strokes after drawing. Reduces jagged edges and hand shake without shifting the line position.
      </p>
      
      <div class="slider-group" :class="{ disabled: !settingsStore.smoothLineMode }">
        <label class="slider-label">
          <span>Strength</span>
          <span class="slider-value">{{ settingsStore.smoothLineStrength }}%</span>
        </label>
        <input 
          type="range" 
          min="0" 
          max="100" 
          :value="settingsStore.smoothLineStrength" 
          @input="updateSmoothStrength"
          :disabled="!settingsStore.smoothLineMode"
        />
        <div class="slider-hints">
          <span>Responsive</span>
          <span>Smooth</span>
        </div>
      </div>
    </div>

    <div class="panel-section">
      <h3>Key Mapping</h3>
      
      <label class="setting-toggle">
        <input type="checkbox" :checked="settingsStore.remapMode" @change="toggleRemapMode" />
        <span>Remap Mode</span>
      </label>
      
      <p class="setting-hint" v-if="settingsStore.remapMode">
        Click any action below, then press a key or mouse/pen button to assign it.
      </p>
      
      <div class="mappings-list" :class="{ active: settingsStore.remapMode }">
        <div 
          v-for="mapping in settingsStore.keyMappings" 
          :key="mapping.action"
          class="mapping-row"
          :class="{ 
            remapping: settingsStore.remappingAction === mapping.action,
            disabled: !settingsStore.remapMode 
          }"
          @click="startRemap(mapping.action)"
        >
          <span class="mapping-label">{{ mapping.label }}</span>
          <span class="mapping-key" v-if="settingsStore.remappingAction === mapping.action">
            Press key or button...
          </span>
          <span class="mapping-key" v-else>
            {{ formatMapping(mapping) }}
          </span>
          <button 
            v-if="settingsStore.remapMode && (mapping.key || mapping.mouseButton !== null)"
            class="clear-btn"
            @click.stop="settingsStore.clearMapping(mapping.action)"
            title="Clear mapping"
          >
            ×
          </button>
        </div>
      </div>
      
      <button 
        v-if="settingsStore.remapMode" 
        class="reset-btn"
        @click="settingsStore.resetToDefaults()"
      >
        Reset to Defaults
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import { useSettingsStore } from '../stores/settingsStore'

const settingsStore = useSettingsStore()

function toggleArtistControls(e: Event) {
  const checked = (e.target as HTMLInputElement).checked
  settingsStore.setArtistControls(checked)
}

function toggleSmoothLine(e: Event) {
  const checked = (e.target as HTMLInputElement).checked
  settingsStore.setSmoothLineMode(checked)
}

function updateSmoothStrength(e: Event) {
  const value = parseInt((e.target as HTMLInputElement).value)
  settingsStore.setSmoothLineStrength(value)
}

function toggleRemapMode(e: Event) {
  const checked = (e.target as HTMLInputElement).checked
  settingsStore.setRemapMode(checked)
}

function startRemap(action: string) {
  if (settingsStore.remapMode) {
    settingsStore.startRemapping(action)
  }
}

function formatMapping(mapping: { key: string | null; mouseButton: number | null }): string {
  const parts: string[] = []
  
  if (mapping.key) {
    // Format special keys nicely
    const keyNames: Record<string, string> = {
      'ArrowLeft': '←',
      'ArrowRight': '→',
      'ArrowUp': '↑',
      'ArrowDown': '↓',
      ' ': 'Space',
      'Escape': 'Esc',
      'Control': 'Ctrl',
    }
    parts.push(keyNames[mapping.key] || mapping.key.toUpperCase())
  }
  
  if (mapping.mouseButton !== null) {
    const buttonNames: Record<number, string> = {
      0: 'Left Click',
      1: 'Middle Click',
      2: 'Right Click',
      3: 'Button 4',
      4: 'Button 5',
    }
    parts.push(buttonNames[mapping.mouseButton] || `Mouse ${mapping.mouseButton}`)
  }
  
  return parts.length > 0 ? parts.join(' / ') : '—'
}

function handleKeyDown(e: KeyboardEvent) {
  if (settingsStore.remappingAction) {
    e.preventDefault()
    e.stopPropagation()
    
    if (e.key === 'Escape') {
      settingsStore.cancelRemapping()
    } else {
      settingsStore.setKeyMapping(settingsStore.remappingAction, e.key, null)
    }
  }
}

function handleMouseDown(e: MouseEvent) {
  if (settingsStore.remappingAction) {
    e.preventDefault()
    e.stopPropagation()
    
    // Only capture non-left clicks or if explicitly remapping
    if (e.button !== 0) {
      settingsStore.setKeyMapping(settingsStore.remappingAction, null, e.button)
    }
  }
}

function handlePointerDown(e: PointerEvent) {
  if (settingsStore.remappingAction && e.pointerType === 'pen') {
    e.preventDefault()
    e.stopPropagation()
    
    // Map pen buttons (button property contains pressed button info)
    settingsStore.setKeyMapping(settingsStore.remappingAction, null, e.button)
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeyDown, true)
  window.addEventListener('mousedown', handleMouseDown, true)
  window.addEventListener('pointerdown', handlePointerDown, true)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown, true)
  window.removeEventListener('mousedown', handleMouseDown, true)
  window.removeEventListener('pointerdown', handlePointerDown, true)
})
</script>

<style scoped>
.settings-panel {
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  overflow-y: auto;
  height: 100%;
}

.panel-section h3 {
  margin: 0 0 10px 0;
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: #555;
  font-weight: 500;
}

.setting-toggle {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: #aaa;
  cursor: pointer;
  margin-bottom: 8px;
}

.setting-toggle input {
  accent-color: var(--accent, #e85d04);
}

.setting-hint {
  font-size: 10px;
  color: #666;
  margin: 0 0 10px 0;
  padding: 6px 8px;
  background: #252525;
  border-radius: 4px;
  border-left: 2px solid var(--accent, #e85d04);
}

.mappings-list {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.mapping-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 8px;
  background: #252525;
  border-radius: 4px;
  font-size: 11px;
}

.mapping-row.disabled {
  opacity: 0.6;
}

.mappings-list.active .mapping-row {
  cursor: pointer;
  opacity: 1;
}

.mappings-list.active .mapping-row:hover {
  background: #333;
}

.mapping-row.remapping {
  background: var(--accent, #e85d04);
}

.mapping-label {
  flex: 1;
  color: #aaa;
}

.mapping-row.remapping .mapping-label {
  color: #fff;
}

.mapping-key {
  font-size: 10px;
  padding: 2px 6px;
  background: #1a1a1a;
  border-radius: 3px;
  color: #666;
  min-width: 60px;
  text-align: center;
}

.mapping-row.remapping .mapping-key {
  background: rgba(0,0,0,0.3);
  color: #fff;
  animation: pulse 1s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
}

.clear-btn {
  width: 18px;
  height: 18px;
  background: #333;
  border-radius: 3px;
  font-size: 14px;
  line-height: 1;
  color: #666;
  display: flex;
  align-items: center;
  justify-content: center;
}

.clear-btn:hover {
  background: #e85d04;
  color: #fff;
}

.reset-btn {
  margin-top: 10px;
  padding: 6px 10px;
  background: #252525;
  border-radius: 4px;
  font-size: 11px;
  color: #888;
}

.reset-btn:hover {
  background: #333;
  color: #fff;
}

.slider-group {
  margin-top: 8px;
}

.slider-group.disabled {
  opacity: 0.5;
  pointer-events: none;
}

.slider-label {
  display: flex;
  justify-content: space-between;
  font-size: 11px;
  color: #888;
  margin-bottom: 4px;
}

.slider-value {
  color: var(--accent, #e85d04);
  font-weight: 500;
}

.slider-group input[type="range"] {
  width: 100%;
  height: 4px;
  -webkit-appearance: none;
  appearance: none;
  background: #333;
  border-radius: 2px;
  outline: none;
}

.slider-group input[type="range"]::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 14px;
  height: 14px;
  background: var(--accent, #e85d04);
  border-radius: 50%;
  cursor: pointer;
}

.slider-group input[type="range"]::-moz-range-thumb {
  width: 14px;
  height: 14px;
  background: var(--accent, #e85d04);
  border-radius: 50%;
  cursor: pointer;
  border: none;
}

.slider-hints {
  display: flex;
  justify-content: space-between;
  font-size: 9px;
  color: #555;
  margin-top: 2px;
}
</style>
