import { defineStore } from 'pinia'
import { ref, reactive, watch } from 'vue'
import {
  saveSettingsData,
  loadSettingsData,
  saveKeyMappings,
  loadKeyMappings,
  saveOnionSkinSettings,
  loadOnionSkinSettings,
  debounce
} from '../services/persistenceService'

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
  
  // Resizable sidebars
  const resizableSidebars = ref(true)
  const leftSidebarWidth = ref(220) // Default larger baseline
  const rightSidebarWidth = ref(260) // Default larger baseline
  const minSidebarWidth = 150
  
  // UI Scale (affects text and UI elements)
  const uiScale = ref(1.0)
  const uiScaleOptions = [0.85, 1.0, 1.25, 1.5, 1.75, 2.0]
  
  // Onion skinning settings
  const onionSkinEnabled = ref(false)
  const onionSkinFramesBefore = ref(2)
  const onionSkinFramesAfter = ref(1)
  const onionSkinOpacityBefore = ref(0.3)
  const onionSkinOpacityAfter = ref(0.2)
  const onionSkinColorBefore = ref('#ff0000')
  const onionSkinColorAfter = ref('#0000ff')
  const onionSkinKeyframesOnly = ref(false)
  
  // Persistence state
  const isLoaded = ref(false)
  
  // Debounced save functions
  const debouncedSaveSettings = debounce(() => {
    if (!isLoaded.value) return
    saveSettingsData({
      artistControls: artistControls.value,
      smoothLineMode: smoothLineMode.value,
      smoothLineStrength: smoothLineStrength.value,
      resizableSidebars: resizableSidebars.value,
      leftSidebarWidth: leftSidebarWidth.value,
      rightSidebarWidth: rightSidebarWidth.value,
      uiScale: uiScale.value
    })
  }, 300)
  
  const debouncedSaveKeyMappings = debounce(() => {
    if (!isLoaded.value) return
    saveKeyMappings([...keyMappings])
  }, 300)
  
  const debouncedSaveOnionSkin = debounce(() => {
    if (!isLoaded.value) return
    saveOnionSkinSettings({
      enabled: onionSkinEnabled.value,
      framesBefore: onionSkinFramesBefore.value,
      framesAfter: onionSkinFramesAfter.value,
      opacityBefore: onionSkinOpacityBefore.value,
      opacityAfter: onionSkinOpacityAfter.value,
      colorBefore: onionSkinColorBefore.value,
      colorAfter: onionSkinColorAfter.value,
      keyframesOnly: onionSkinKeyframesOnly.value
    })
  }, 300)
  
  // Auto-save watchers for settings
  watch([artistControls, smoothLineMode, smoothLineStrength, resizableSidebars, 
         leftSidebarWidth, rightSidebarWidth, uiScale], debouncedSaveSettings)
  
  // Auto-save watchers for onion skin
  watch([onionSkinEnabled, onionSkinFramesBefore, onionSkinFramesAfter,
         onionSkinOpacityBefore, onionSkinOpacityAfter, onionSkinColorBefore,
         onionSkinColorAfter, onionSkinKeyframesOnly], debouncedSaveOnionSkin)
  
  // Initialize from storage
  async function initFromStorage() {
    const [savedSettings, savedKeyMappings, savedOnionSkin] = await Promise.all([
      loadSettingsData(),
      loadKeyMappings(),
      loadOnionSkinSettings()
    ])
    
    if (savedSettings) {
      artistControls.value = savedSettings.artistControls
      smoothLineMode.value = savedSettings.smoothLineMode
      smoothLineStrength.value = savedSettings.smoothLineStrength
      resizableSidebars.value = savedSettings.resizableSidebars
      leftSidebarWidth.value = savedSettings.leftSidebarWidth
      rightSidebarWidth.value = savedSettings.rightSidebarWidth
      uiScale.value = savedSettings.uiScale
    }
    
    if (savedKeyMappings && savedKeyMappings.length > 0) {
      savedKeyMappings.forEach((saved, index) => {
        if (keyMappings[index]) {
          keyMappings[index].key = saved.key
          keyMappings[index].mouseButton = saved.mouseButton
        }
      })
    }
    
    if (savedOnionSkin) {
      onionSkinEnabled.value = savedOnionSkin.enabled
      onionSkinFramesBefore.value = savedOnionSkin.framesBefore
      onionSkinFramesAfter.value = savedOnionSkin.framesAfter
      onionSkinOpacityBefore.value = savedOnionSkin.opacityBefore
      onionSkinOpacityAfter.value = savedOnionSkin.opacityAfter
      onionSkinColorBefore.value = savedOnionSkin.colorBefore
      onionSkinColorAfter.value = savedOnionSkin.colorAfter
      onionSkinKeyframesOnly.value = savedOnionSkin.keyframesOnly
    }
    
    isLoaded.value = true
  }
  
  function setArtistControls(enabled: boolean) {
    artistControls.value = enabled
  }
  
  function setSmoothLineMode(enabled: boolean) {
    smoothLineMode.value = enabled
  }
  
  function setSmoothLineStrength(strength: number) {
    smoothLineStrength.value = Math.max(0, Math.min(100, strength))
  }
  
  function setResizableSidebars(enabled: boolean) {
    resizableSidebars.value = enabled
  }
  
  function setLeftSidebarWidth(width: number) {
    leftSidebarWidth.value = Math.max(minSidebarWidth, width)
  }
  
  function setRightSidebarWidth(width: number) {
    rightSidebarWidth.value = Math.max(minSidebarWidth, width)
  }
  
  function setUiScale(scale: number) {
    uiScale.value = scale
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
  
  // Auto-save watcher for key mappings
  watch(keyMappings, debouncedSaveKeyMappings, { deep: true })
  
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
  
  // Onion skin setters
  function setOnionSkinEnabled(enabled: boolean) {
    onionSkinEnabled.value = enabled
  }
  
  function setOnionSkinFramesBefore(count: number) {
    onionSkinFramesBefore.value = Math.max(0, Math.min(5, count))
  }
  
  function setOnionSkinFramesAfter(count: number) {
    onionSkinFramesAfter.value = Math.max(0, Math.min(5, count))
  }
  
  function setOnionSkinOpacityBefore(opacity: number) {
    onionSkinOpacityBefore.value = Math.max(0, Math.min(1, opacity))
  }
  
  function setOnionSkinOpacityAfter(opacity: number) {
    onionSkinOpacityAfter.value = Math.max(0, Math.min(1, opacity))
  }
  
  function setOnionSkinColorBefore(color: string) {
    onionSkinColorBefore.value = color
  }
  
  function setOnionSkinColorAfter(color: string) {
    onionSkinColorAfter.value = color
  }
  
  function setOnionSkinKeyframesOnly(enabled: boolean) {
    onionSkinKeyframesOnly.value = enabled
  }
  
  return {
    remapMode,
    artistControls,
    smoothLineMode,
    smoothLineStrength,
    resizableSidebars,
    leftSidebarWidth,
    rightSidebarWidth,
    minSidebarWidth,
    uiScale,
    uiScaleOptions,
    keyMappings,
    remappingAction,
    // Onion skin
    onionSkinEnabled,
    onionSkinFramesBefore,
    onionSkinFramesAfter,
    onionSkinOpacityBefore,
    onionSkinOpacityAfter,
    onionSkinColorBefore,
    onionSkinColorAfter,
    onionSkinKeyframesOnly,
    // Persistence
    isLoaded,
    initFromStorage,
    // Actions
    setRemapMode,
    setArtistControls,
    setSmoothLineMode,
    setSmoothLineStrength,
    setResizableSidebars,
    setLeftSidebarWidth,
    setRightSidebarWidth,
    setUiScale,
    startRemapping,
    cancelRemapping,
    setKeyMapping,
    clearMapping,
    getActionForKey,
    getActionForMouseButton,
    resetToDefaults,
    // Onion skin setters
    setOnionSkinEnabled,
    setOnionSkinFramesBefore,
    setOnionSkinFramesAfter,
    setOnionSkinOpacityBefore,
    setOnionSkinOpacityAfter,
    setOnionSkinColorBefore,
    setOnionSkinColorAfter,
    setOnionSkinKeyframesOnly
  }
})
