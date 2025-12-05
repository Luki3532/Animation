import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import type { FrameDrawing, ToolSettings, CanvasSize } from '../types/drawing'
import { CANVAS_SIZES } from '../types/drawing'
import { 
  saveDrawingData, 
  loadDrawingData, 
  debounce 
} from '../services/persistenceService'

export const useDrawingStore = defineStore('drawing', () => {
  // Frame drawings storage
  const frameDrawings = ref<Map<number, FrameDrawing>>(new Map())
  
  // Tool settings
  const toolSettings = ref<ToolSettings>({
    tool: 'pen',
    color: '#000000',
    brushSize: 5,
    opacity: 1
  })
  
  // Canvas size
  const canvasSize = ref<CanvasSize>(CANVAS_SIZES[2]) // Default 128x128
  
  // Hovered tool hint (for status bar)
  const hoveredHint = ref<string>('')
  
  // History for undo/redo
  const history = ref<string[]>([])
  const historyIndex = ref(-1)
  
  // Persistence state
  const isLoaded = ref(false)
  
  // Computed
  const hasDrawings = computed(() => frameDrawings.value.size > 0)
  const drawnFrameIndices = computed(() => Array.from(frameDrawings.value.keys()).sort((a, b) => a - b))
  
  // Debounced save function (300ms delay)
  const debouncedSave = debounce(() => {
    if (!isLoaded.value) return
    saveDrawingData({
      frameDrawings: Array.from(frameDrawings.value.entries()),
      toolSettings: toolSettings.value,
      canvasSize: canvasSize.value
    })
  }, 300)
  
  // Auto-save watchers
  watch(frameDrawings, debouncedSave, { deep: true })
  watch(toolSettings, debouncedSave, { deep: true })
  watch(canvasSize, debouncedSave, { deep: true })
  
  // Initialize from storage
  async function initFromStorage() {
    const saved = await loadDrawingData()
    if (saved) {
      frameDrawings.value = new Map(saved.frameDrawings)
      toolSettings.value = saved.toolSettings
      canvasSize.value = saved.canvasSize
    }
    isLoaded.value = true
  }
  
  // Actions
  function saveFrameDrawing(frameIndex: number, fabricJSON: string, thumbnail: string) {
    frameDrawings.value.set(frameIndex, {
      frameIndex,
      fabricJSON,
      thumbnail
    })
  }
  
  function getFrameDrawing(frameIndex: number): FrameDrawing | undefined {
    return frameDrawings.value.get(frameIndex)
  }
  
  function deleteFrameDrawing(frameIndex: number) {
    frameDrawings.value.delete(frameIndex)
  }
  
  function clearAllDrawings() {
    frameDrawings.value.clear()
  }
  
  function setTool(tool: ToolSettings['tool']) {
    toolSettings.value.tool = tool
  }
  
  function setColor(color: string) {
    toolSettings.value.color = color
  }
  
  function setBrushSize(size: number) {
    toolSettings.value.brushSize = size
  }
  
  function setOpacity(opacity: number) {
    toolSettings.value.opacity = opacity
  }
  
  function setCanvasSize(size: CanvasSize) {
    canvasSize.value = size
  }
  
  function setHoveredHint(hint: string) {
    hoveredHint.value = hint
  }
  
  function pushHistory(state: string) {
    // Remove any redo states
    history.value = history.value.slice(0, historyIndex.value + 1)
    history.value.push(state)
    historyIndex.value = history.value.length - 1
    
    // Limit history size
    if (history.value.length > 50) {
      history.value.shift()
      historyIndex.value--
    }
  }
  
  function undo(): string | null {
    if (historyIndex.value > 0) {
      historyIndex.value--
      return history.value[historyIndex.value]
    }
    return null
  }
  
  function redo(): string | null {
    if (historyIndex.value < history.value.length - 1) {
      historyIndex.value++
      return history.value[historyIndex.value]
    }
    return null
  }
  
  function clearHistory() {
    history.value = []
    historyIndex.value = -1
  }
  
  return {
    frameDrawings,
    toolSettings,
    canvasSize,
    hoveredHint,
    hasDrawings,
    drawnFrameIndices,
    isLoaded,
    initFromStorage,
    saveFrameDrawing,
    getFrameDrawing,
    deleteFrameDrawing,
    clearAllDrawings,
    setTool,
    setColor,
    setBrushSize,
    setOpacity,
    setCanvasSize,
    setHoveredHint,
    pushHistory,
    undo,
    redo,
    clearHistory
  }
})
