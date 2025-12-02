import { defineStore } from 'pinia'
import { ref, reactive } from 'vue'

export interface KeyMapping {
  action: string
  label: string
  key: string | null
  mouseButton: number | null
}

export const useSettingsStore = defineStore('settings', () => {
  // Remap mode toggle
  const remapMode = ref(false)
  
  // Artist controls mode (Aseprite-style tools)
  const artistControls = ref(false)
  
  // Smooth line mode - line stabilization
  const smoothLineMode = ref(false)
  const smoothLineStrength = ref(50) // 0-100 range
  
  function setArtistControls(enabled: boolean) {
    artistControls.value = enabled
  }
  
  function setSmoothLineMode(enabled: boolean) {
    smoothLineMode.value = enabled
  }
  
  function setSmoothLineStrength(strength: number) {
    smoothLineStrength.value = Math.max(0, Math.min(100, strength))
  }
  
  // Key mappings for tools and actions
  const keyMappings = reactive<KeyMapping[]>([
    { action: 'pen', label: 'Pen Tool', key: 'p', mouseButton: null },
    { action: 'eraser', label: 'Eraser Tool', key: 'e', mouseButton: null },
    { action: 'line', label: 'Line Tool', key: 'l', mouseButton: null },
    { action: 'rectangle', label: 'Rectangle Tool', key: 'r', mouseButton: null },
    { action: 'circle', label: 'Circle Tool', key: 'c', mouseButton: null },
    { action: 'select', label: 'Select Tool', key: 'v', mouseButton: null },
    { action: 'undo', label: 'Undo', key: 'z', mouseButton: null },
    { action: 'redo', label: 'Redo', key: 'y', mouseButton: null },
    { action: 'clear', label: 'Clear Frame', key: null, mouseButton: null },
    { action: 'prevFrame', label: 'Previous Frame', key: 'ArrowLeft', mouseButton: null },
    { action: 'nextFrame', label: 'Next Frame', key: 'ArrowRight', mouseButton: null },
  ])
  
  // Currently remapping action (null if not remapping)
  const remappingAction = ref<string | null>(null)
  
  function setRemapMode(enabled: boolean) {
    remapMode.value = enabled
    if (!enabled) {
      remappingAction.value = null
    }
  }
  
  function startRemapping(action: string) {
    if (remapMode.value) {
      remappingAction.value = action
    }
  }
  
  function cancelRemapping() {
    remappingAction.value = null
  }
  
  function setKeyMapping(action: string, key: string | null, mouseButton: number | null) {
    const mapping = keyMappings.find(m => m.action === action)
    if (mapping) {
      // Clear any existing mapping with this key/button to avoid conflicts
      if (key) {
        keyMappings.forEach(m => {
          if (m.key === key && m.action !== action) {
            m.key = null
          }
        })
      }
      if (mouseButton !== null) {
        keyMappings.forEach(m => {
          if (m.mouseButton === mouseButton && m.action !== action) {
            m.mouseButton = null
          }
        })
      }
      
      mapping.key = key
      mapping.mouseButton = mouseButton
    }
    remappingAction.value = null
  }
  
  function clearMapping(action: string) {
    const mapping = keyMappings.find(m => m.action === action)
    if (mapping) {
      mapping.key = null
      mapping.mouseButton = null
    }
  }
  
  function getActionForKey(key: string): string | null {
    const mapping = keyMappings.find(m => m.key === key)
    return mapping?.action ?? null
  }
  
  function getActionForMouseButton(button: number): string | null {
    const mapping = keyMappings.find(m => m.mouseButton === button)
    return mapping?.action ?? null
  }
  
  function resetToDefaults() {
    keyMappings[0] = { action: 'pen', label: 'Pen Tool', key: 'p', mouseButton: null }
    keyMappings[1] = { action: 'eraser', label: 'Eraser Tool', key: 'e', mouseButton: null }
    keyMappings[2] = { action: 'line', label: 'Line Tool', key: 'l', mouseButton: null }
    keyMappings[3] = { action: 'rectangle', label: 'Rectangle Tool', key: 'r', mouseButton: null }
    keyMappings[4] = { action: 'circle', label: 'Circle Tool', key: 'c', mouseButton: null }
    keyMappings[5] = { action: 'select', label: 'Select Tool', key: 'v', mouseButton: null }
    keyMappings[6] = { action: 'undo', label: 'Undo', key: 'z', mouseButton: null }
    keyMappings[7] = { action: 'redo', label: 'Redo', key: 'y', mouseButton: null }
    keyMappings[8] = { action: 'clear', label: 'Clear Frame', key: null, mouseButton: null }
    keyMappings[9] = { action: 'prevFrame', label: 'Previous Frame', key: 'ArrowLeft', mouseButton: null }
    keyMappings[10] = { action: 'nextFrame', label: 'Next Frame', key: 'ArrowRight', mouseButton: null }
  }
  
  return {
    remapMode,
    artistControls,
    smoothLineMode,
    smoothLineStrength,
    keyMappings,
    remappingAction,
    setRemapMode,
    setArtistControls,
    setSmoothLineMode,
    setSmoothLineStrength,
    startRemapping,
    cancelRemapping,
    setKeyMapping,
    clearMapping,
    getActionForKey,
    getActionForMouseButton,
    resetToDefaults
  }
})
