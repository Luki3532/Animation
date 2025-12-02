<template>
  <div class="drawing-canvas-container" ref="containerRef">
    <canvas ref="canvasRef" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { Canvas, PencilBrush, Circle, Rect, Line, FabricObject } from 'fabric'
import { useDrawingStore } from '../stores/drawingStore'
import { useVideoStore } from '../stores/videoStore'

const drawingStore = useDrawingStore()
const videoStore = useVideoStore()

const containerRef = ref<HTMLDivElement | null>(null)
const canvasRef = ref<HTMLCanvasElement | null>(null)
let fabricCanvas: Canvas | null = null

// Shape drawing state
let isDrawingShape = false
let shapeStartX = 0
let shapeStartY = 0
let activeShape: FabricObject | null = null

const emit = defineEmits<{
  drawingUpdated: []
}>()

onMounted(async () => {
  await nextTick()
  initCanvas()
  setupKeyboardShortcuts()
})

onUnmounted(() => {
  if (fabricCanvas) {
    fabricCanvas.dispose()
  }
  window.removeEventListener('keydown', handleKeydown)
})

function initCanvas() {
  if (!canvasRef.value || !containerRef.value) return

  // Use video dimensions if available, otherwise use drawing canvas size
  const width = videoStore.state.width || drawingStore.canvasSize.width
  const height = videoStore.state.height || drawingStore.canvasSize.height

  fabricCanvas = new Canvas(canvasRef.value, {
    width,
    height,
    backgroundColor: 'transparent',
    isDrawingMode: true,
  })

  // Set up the brush
  const brush = new PencilBrush(fabricCanvas)
  brush.color = drawingStore.toolSettings.color
  brush.width = drawingStore.toolSettings.brushSize
  fabricCanvas.freeDrawingBrush = brush

  // Listen for drawing events
  fabricCanvas.on('path:created', () => {
    saveCurrentState()
  })

  fabricCanvas.on('object:modified', () => {
    saveCurrentState()
  })

  // Shape drawing events
  fabricCanvas.on('mouse:down', onMouseDown)
  fabricCanvas.on('mouse:move', onMouseMove)
  fabricCanvas.on('mouse:up', onMouseUp)

  // Load existing drawing for current frame
  loadFrameDrawing()

  // Scale canvas to fit container
  scaleCanvasToFit()
}

function scaleCanvasToFit() {
  if (!fabricCanvas || !containerRef.value) return

  const container = containerRef.value
  const canvasWidth = videoStore.state.width || drawingStore.canvasSize.width
  const canvasHeight = videoStore.state.height || drawingStore.canvasSize.height

  // Match the video scaling
  const scaleX = container.clientWidth / canvasWidth
  const scaleY = container.clientHeight / canvasHeight
  const scale = Math.min(scaleX, scaleY)

  const canvasEl = fabricCanvas.getElement() as HTMLCanvasElement
  canvasEl.style.width = `${canvasWidth * scale}px`
  canvasEl.style.height = `${canvasHeight * scale}px`
}

function onMouseDown(opt: any) {
  const tool = drawingStore.toolSettings.tool
  if (!['rectangle', 'circle', 'line'].includes(tool)) return
  if (!fabricCanvas) return

  isDrawingShape = true
  const pointer = fabricCanvas.getScenePoint(opt.e)
  shapeStartX = pointer.x
  shapeStartY = pointer.y

  const color = drawingStore.toolSettings.color
  const strokeWidth = drawingStore.toolSettings.brushSize

  if (tool === 'rectangle') {
    activeShape = new Rect({
      left: shapeStartX,
      top: shapeStartY,
      width: 0,
      height: 0,
      fill: 'transparent',
      stroke: color,
      strokeWidth,
    })
  } else if (tool === 'circle') {
    activeShape = new Circle({
      left: shapeStartX,
      top: shapeStartY,
      radius: 0,
      fill: 'transparent',
      stroke: color,
      strokeWidth,
    })
  } else if (tool === 'line') {
    activeShape = new Line([shapeStartX, shapeStartY, shapeStartX, shapeStartY], {
      stroke: color,
      strokeWidth,
    })
  }

  if (activeShape) {
    fabricCanvas.add(activeShape)
  }
}

function onMouseMove(opt: any) {
  if (!isDrawingShape || !activeShape || !fabricCanvas) return

  const pointer = fabricCanvas.getScenePoint(opt.e)
  const tool = drawingStore.toolSettings.tool

  if (tool === 'rectangle') {
    const rect = activeShape as Rect
    const width = Math.abs(pointer.x - shapeStartX)
    const height = Math.abs(pointer.y - shapeStartY)
    rect.set({
      left: Math.min(shapeStartX, pointer.x),
      top: Math.min(shapeStartY, pointer.y),
      width,
      height,
    })
  } else if (tool === 'circle') {
    const circle = activeShape as Circle
    const radius = Math.sqrt(
      Math.pow(pointer.x - shapeStartX, 2) + Math.pow(pointer.y - shapeStartY, 2)
    ) / 2
    circle.set({
      left: (shapeStartX + pointer.x) / 2 - radius,
      top: (shapeStartY + pointer.y) / 2 - radius,
      radius,
    })
  } else if (tool === 'line') {
    const line = activeShape as Line
    line.set({
      x2: pointer.x,
      y2: pointer.y,
    })
  }

  fabricCanvas.renderAll()
}

function onMouseUp() {
  if (isDrawingShape && activeShape) {
    saveCurrentState()
  }
  isDrawingShape = false
  activeShape = null
}

function saveCurrentState() {
  if (!fabricCanvas) return

  const json = JSON.stringify(fabricCanvas.toJSON())
  const thumbnail = fabricCanvas.toDataURL({
    format: 'png',
    multiplier: 1,
  })

  drawingStore.saveFrameDrawing(videoStore.state.currentFrame, json, thumbnail)
  drawingStore.pushHistory(json)
  emit('drawingUpdated')
}

function loadFrameDrawing() {
  if (!fabricCanvas) return

  const frameDrawing = drawingStore.getFrameDrawing(videoStore.state.currentFrame)

  fabricCanvas.clear()

  if (frameDrawing) {
    fabricCanvas.loadFromJSON(JSON.parse(frameDrawing.fabricJSON)).then(() => {
      fabricCanvas?.renderAll()
    })
  }
}

// Watch for tool changes
watch(
  () => drawingStore.toolSettings,
  (settings) => {
    if (!fabricCanvas) return

    if (settings.tool === 'pen') {
      fabricCanvas.isDrawingMode = true
      const brush = fabricCanvas.freeDrawingBrush as PencilBrush
      if (brush) {
        brush.color = settings.color
        brush.width = settings.brushSize
      }
    } else if (settings.tool === 'eraser') {
      fabricCanvas.isDrawingMode = true
      const brush = fabricCanvas.freeDrawingBrush as PencilBrush
      if (brush) {
        brush.color = '#ffffff' // White eraser
        brush.width = settings.brushSize * 2
      }
    } else if (settings.tool === 'select') {
      fabricCanvas.isDrawingMode = false
    } else {
      // Shape tools
      fabricCanvas.isDrawingMode = false
    }
  },
  { deep: true, immediate: true }
)

// Watch for frame changes
watch(
  () => videoStore.state.currentFrame,
  () => {
    loadFrameDrawing()
  }
)

// Watch for video dimensions changes (reinitialize canvas)
watch(
  () => [videoStore.state.width, videoStore.state.height],
  async ([newWidth, newHeight]) => {
    if (newWidth && newHeight && fabricCanvas) {
      await nextTick()
      fabricCanvas.setDimensions({
        width: newWidth,
        height: newHeight,
      })
      scaleCanvasToFit()
      loadFrameDrawing()
    }
  }
)

// Watch for canvas size changes
watch(
  () => drawingStore.canvasSize,
  async () => {
    if (!fabricCanvas) return

    await nextTick()
    fabricCanvas.setDimensions({
      width: drawingStore.canvasSize.width,
      height: drawingStore.canvasSize.height,
    })
    scaleCanvasToFit()
  }
)

// Keyboard shortcuts
function setupKeyboardShortcuts() {
  window.addEventListener('keydown', handleKeydown)
}

function handleKeydown(e: KeyboardEvent) {
  // Ignore if typing in input
  if ((e.target as HTMLElement).tagName === 'INPUT') return

  if (e.ctrlKey && e.key === 'z') {
    e.preventDefault()
    undo()
  } else if (e.ctrlKey && e.key === 'y') {
    e.preventDefault()
    redo()
  } else if (e.key === 'p') {
    drawingStore.setTool('pen')
  } else if (e.key === 'e') {
    drawingStore.setTool('eraser')
  } else if (e.key === 'r') {
    drawingStore.setTool('rectangle')
  } else if (e.key === 'c') {
    drawingStore.setTool('circle')
  } else if (e.key === 'l') {
    drawingStore.setTool('line')
  } else if (e.key === 'v') {
    drawingStore.setTool('select')
  }
}

// Public methods
function undo() {
  const state = drawingStore.undo()
  if (state && fabricCanvas) {
    fabricCanvas.loadFromJSON(JSON.parse(state)).then(() => {
      fabricCanvas?.renderAll()
      saveWithoutHistory()
    })
  }
}

function redo() {
  const state = drawingStore.redo()
  if (state && fabricCanvas) {
    fabricCanvas.loadFromJSON(JSON.parse(state)).then(() => {
      fabricCanvas?.renderAll()
      saveWithoutHistory()
    })
  }
}

function saveWithoutHistory() {
  if (!fabricCanvas) return

  const json = JSON.stringify(fabricCanvas.toJSON())
  const thumbnail = fabricCanvas.toDataURL({
    format: 'png',
    multiplier: 1,
  })

  drawingStore.saveFrameDrawing(videoStore.state.currentFrame, json, thumbnail)
}

function clearCanvas() {
  if (!fabricCanvas) return

  fabricCanvas.clear()
  saveCurrentState()
}

defineExpose({
  undo,
  redo,
  clearCanvas,
})
</script>

<style scoped>
.drawing-canvas-container {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  overflow: hidden;
}

.drawing-canvas-container canvas {
  image-rendering: pixelated;
}
</style>
