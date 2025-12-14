import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import type { FrameDrawing, ToolSettings, CanvasSize, ViewportState } from '../types/drawing'
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
    opacity: 1,
    brushType: 'round'
  })
  
  // Canvas size
  const canvasSize = ref<CanvasSize>(CANVAS_SIZES[2]) // Default 128x128
  
  // Viewport state (zoom and pan)
  const viewport = ref<ViewportState>({
    zoom: 1, // Will be set to fit-to-width on init
    panX: 0,
    panY: 0
  })
  
  // Track if user has manually adjusted zoom/pan
  const userAdjustedViewport = ref(false)
  
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
  
  function setBrushType(brushType: ToolSettings['brushType']) {
    toolSettings.value.brushType = brushType
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
    console.log(`[History] Push: index=${historyIndex.value}, length=${history.value.length}`)
    
    // Limit history size
    if (history.value.length > 50) {
      history.value.shift()
      historyIndex.value--
    }
  }
  
  function undo(): string | null {
    console.log(`[History] Undo called: index=${historyIndex.value}, length=${history.value.length}`)
    if (historyIndex.value > 0) {
      historyIndex.value--
      console.log(`[History] Undo success: returning state at index=${historyIndex.value}`)
      return history.value[historyIndex.value]
    }
    console.log(`[History] Undo failed: cannot go below 0`)
    return null
  }
  
  function redo(): string | null {
    console.log(`[History] Redo called: index=${historyIndex.value}, length=${history.value.length}`)
    if (historyIndex.value < history.value.length - 1) {
      historyIndex.value++
      console.log(`[History] Redo success: returning state at index=${historyIndex.value}`)
      return history.value[historyIndex.value]
    }
    console.log(`[History] Redo failed: at end of history`)
    return null
  }
  
  function clearHistory() {
    history.value = []
    historyIndex.value = -1
    console.log(`[History] Cleared`)
  }

  // Shift all frame drawings at or after fromIndex by shiftAmount positions
  // Used when inserting frames to preserve existing drawings at correct positions
  function shiftFrameDrawings(fromIndex: number, shiftAmount: number) {
    if (shiftAmount === 0) return
    
    // Get all entries that need to be shifted (indices >= fromIndex)
    const entriesToShift: Array<[number, FrameDrawing]> = []
    frameDrawings.value.forEach((drawing, index) => {
      if (index >= fromIndex) {
        entriesToShift.push([index, drawing])
      }
    })
    
    // Sort by index descending to avoid overwriting when shifting forward
    entriesToShift.sort((a, b) => b[0] - a[0])
    
    // Remove old entries and add at new positions
    for (const [oldIndex, drawing] of entriesToShift) {
      frameDrawings.value.delete(oldIndex)
      const newIndex = oldIndex + shiftAmount
      if (newIndex >= 0) {
        frameDrawings.value.set(newIndex, {
          ...drawing,
          frameIndex: newIndex
        })
      }
    }
  }
  
  // Viewport controls
  function setZoom(zoom: number) {
    viewport.value.zoom = Math.max(0.1, Math.min(10, zoom))
    userAdjustedViewport.value = true
  }
  
  function setPan(x: number, y: number) {
    viewport.value.panX = x
    viewport.value.panY = y
    userAdjustedViewport.value = true
  }
  
  function adjustPan(deltaX: number, deltaY: number) {
    viewport.value.panX += deltaX
    viewport.value.panY += deltaY
    userAdjustedViewport.value = true
  }
  
  function resetViewport() {
    viewport.value.zoom = 1
    viewport.value.panX = 0
    viewport.value.panY = 0
    userAdjustedViewport.value = false
  }
  
  function setViewportWithoutUserFlag(zoom: number, panX: number, panY: number) {
    viewport.value.zoom = zoom
    viewport.value.panX = panX
    viewport.value.panY = panY
  }
  
  return {
    frameDrawings,
    toolSettings,
    canvasSize,
    viewport,
    userAdjustedViewport,
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
    setBrushType,
    setCanvasSize,
    setHoveredHint,
    pushHistory,
    undo,
    redo,
    clearHistory,
    shiftFrameDrawings,
    setZoom,
    setPan,
    adjustPan,
    resetViewport,
    setViewportWithoutUserFlag
  }
})
