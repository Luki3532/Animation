import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { FrameDrawing, ToolSettings, CanvasSize } from '../types/drawing'
import { CANVAS_SIZES } from '../types/drawing'

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
  
  // Computed
  const hasDrawings = computed(() => frameDrawings.value.size > 0)
  const drawnFrameIndices = computed(() => Array.from(frameDrawings.value.keys()).sort((a, b) => a - b))
  
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
