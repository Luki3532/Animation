<template>
  <div 
    class="drawing-canvas-container" 
    ref="containerRef"
    :class="{
      'pan-tool': drawingStore.toolSettings.tool === 'pan',
      'panning': isPanningRef
    }"
    @wheel.prevent="handleWheel"
    @mousedown="handleContainerMouseDown"
    @mousemove="handleContainerMouseMove"
    @mouseup="handleContainerMouseUp"
    @mouseleave="handleContainerMouseUp"
    @touchstart.prevent="handleTouchStart"
    @touchmove.prevent="handleTouchMove"
    @touchend.prevent="handleTouchEnd"
    @touchcancel.prevent="handleTouchEnd"
  >
    <!-- Onion skin overlay (rendered below main canvas) -->
    <canvas ref="onionCanvasRef" class="onion-canvas" />
    <canvas ref="canvasRef" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { Canvas, PencilBrush, SprayBrush, Circle, Rect, Line, Polygon, Path, FabricObject } from 'fabric'
import { useDrawingStore } from '../stores/drawingStore'
import { useVideoStore } from '../stores/videoStore'
import { useSettingsStore } from '../stores/settingsStore'
import type { BrushType } from '../types/drawing'

const drawingStore = useDrawingStore()
const videoStore = useVideoStore()
const settingsStore = useSettingsStore()

// Helper function to create and configure a brush based on brush type
function createBrush(canvas: Canvas, color: string, width: number, brushType: BrushType): PencilBrush {
  const brush = new PencilBrush(canvas)
  // Eraser tool: use white color (we'll apply globalCompositeOperation on path:created)
  if (drawingStore.toolSettings.tool === 'eraser') {
    brush.color = 'rgba(0,0,0,1)'
    brush.width = width
  } else {
    brush.color = color
    brush.width = width
  }
  // Configure brush properties based on brush type
  switch (brushType) {
    case 'round':
      // Default round brush
      brush.strokeLineCap = 'round'
      brush.strokeLineJoin = 'round'
      break
      
    case 'square':
      // Square/pixel brush
      brush.strokeLineCap = 'square'
      brush.strokeLineJoin = 'miter'
      break
      
    case 'slash-right':
    case 'slash-left':
      // Angled brushes - use butt cap for sharper edges
      brush.strokeLineCap = 'butt'
      brush.strokeLineJoin = 'bevel'
      break
      
    case 'calligraphy':
      // Calligraphy - varies width, use round for smooth flow
      brush.strokeLineCap = 'round'
      brush.strokeLineJoin = 'round'
      // Slightly reduce width for calligraphy effect
      brush.width = width * 0.7
      break
      
    case 'oil':
      // Oil brush - soft edges
      brush.strokeLineCap = 'round'
      brush.strokeLineJoin = 'round'
      brush.width = width * 1.2
      break
      
    case 'crayon':
      // Crayon - rough edges simulated with round
      brush.strokeLineCap = 'round'
      brush.strokeLineJoin = 'round'
      break
      
    case 'marker':
      // Marker - square cap for marker feel
      brush.strokeLineCap = 'square'
      brush.strokeLineJoin = 'round'
      break
      
    case 'pencil-tip':
      // Pencil tip - small and precise
      brush.strokeLineCap = 'round'
      brush.strokeLineJoin = 'round'
      brush.width = width * 0.5
      break
      
    default:
      brush.strokeLineCap = 'round'
      brush.strokeLineJoin = 'round'
  }
  
  return brush
}

const containerRef = ref<HTMLDivElement | null>(null)
const canvasRef = ref<HTMLCanvasElement | null>(null)
const onionCanvasRef = ref<HTMLCanvasElement | null>(null)
let fabricCanvas: Canvas | null = null

// Shape drawing state
let isDrawingShape = false
let shapeStartX = 0
let shapeStartY = 0
let activeShape: FabricObject | null = null

// Curve/Polygon/Contour state
let polygonPoints: { x: number; y: number }[] = []
let curveControlPoint: { x: number; y: number } | null = null
let isDrawingCurve = false

// Lasso state
let lassoPoints: { x: number; y: number }[] = []
let isDrawingLasso = false
let resizeObserver: ResizeObserver | null = null

// Track last loaded frame to prevent redundant history clears
let lastLoadedFrame: number = -1

// Pan state (middle mouse or pan tool)
const isPanningRef = ref(false)
let isPanning = false
let panStartX = 0
let panStartY = 0
let panStartViewportX = 0
let panStartViewportY = 0

const emit = defineEmits<{
  drawingUpdated: []
}>()

onMounted(async () => {
  await nextTick()
  initCanvas()
  setupKeyboardShortcuts()
  
  // Watch for container resize - recalculate fit-to-width
  if (containerRef.value) {
    resizeObserver = new ResizeObserver(() => {
      // When container resizes, recalculate fit-to-width if user hasn't adjusted
      if (!drawingStore.userAdjustedViewport) {
        const zoom = calculateFitToWidthZoom()
        drawingStore.setViewportWithoutUserFlag(zoom, 0, 0)
      }
      // For video projects, use scaleCanvasToFit; for empty projects, apply viewport
      if (videoStore.hasVideo) {
        scaleCanvasToFit()
      } else {
        applyViewportTransform()
      }
    })
    resizeObserver.observe(containerRef.value)
  }
})

onUnmounted(() => {
  if (fabricCanvas) {
    fabricCanvas.dispose()
  }
  if (resizeObserver) {
    resizeObserver.disconnect()
  }
  window.removeEventListener('keydown', handleKeydown)
})

function initCanvas() {
  if (!canvasRef.value || !containerRef.value) return

  // Reset frame tracking to allow fresh load
  lastLoadedFrame = -1

  // Use video dimensions if available, otherwise use drawing canvas size
  const width = videoStore.state.width || drawingStore.canvasSize.width
  const height = videoStore.state.height || drawingStore.canvasSize.height

  fabricCanvas = new Canvas(canvasRef.value, {
    width,
    height,
    backgroundColor: 'transparent',
    isDrawingMode: true,
    selection: false, // Disable group selection
    renderOnAddRemove: true,
  })

  // Create custom brush that doesn't shift paths (using MS Paint brush type)
  const brush = createBrush(
    fabricCanvas, 
    drawingStore.toolSettings.color, 
    drawingStore.toolSettings.brushSize, 
    drawingStore.toolSettings.brushType
  )
  ;(brush as any).decimate = 0 // Prevent point reduction
  
  // Override the _finalizeAndAddPath to prevent path repositioning
  const originalFinalize = (brush as any)._finalizeAndAddPath.bind(brush)
  ;(brush as any)._finalizeAndAddPath = function() {
    // Store points before finalization (unused but kept for potential debugging)
    const _points = this._points ? [...this._points] : []
    void _points // Suppress unused variable warning
    
    // Call original but we'll fix the result
    originalFinalize()
    
    // The path was just added, get it and fix positioning
    const objects = fabricCanvas!.getObjects()
    const lastPath = objects[objects.length - 1]
    
    if (lastPath && lastPath.type === 'path') {
      // Keep path at origin - don't let Fabric move it
      lastPath.set({
        originX: 'left',
        originY: 'top',
        selectable: false,
        evented: false,
        hasControls: false,
        hasBorders: false,
      })
    }
  }
  
  fabricCanvas.freeDrawingBrush = brush

  // Listen for drawing events
  fabricCanvas.on('path:created', (e: any) => {
    if (e.path) {
      // Ensure selection is disabled
      e.path.set({
        selectable: false,
        evented: false,
        hasControls: false,
        hasBorders: false,
      })
      
      // Apply eraser mode - use globalCompositeOperation for true erasing
      if (drawingStore.toolSettings.tool === 'eraser') {
        e.path.set({
          globalCompositeOperation: 'destination-out'
        })
      }
      
      // Apply smoothing AFTER path is created (if enabled)
      if (settingsStore.smoothLineMode && settingsStore.smoothLineStrength > 0) {
        smoothPath(e.path)
      }
    }
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

  // Scale canvas to fit container (fit to width by default)
  fitToWidth()
}

// Calculate zoom level to fit canvas within container (fit to screen)
function calculateFitToWidthZoom(): number {
  if (!containerRef.value) return 1
  const container = containerRef.value
  const canvasWidth = videoStore.state.width || drawingStore.canvasSize.width
  const canvasHeight = videoStore.state.height || drawingStore.canvasSize.height
  
  // Add some padding (20px on each side)
  const availableWidth = container.clientWidth - 40
  const availableHeight = container.clientHeight - 40
  
  // Calculate zoom for both dimensions and use the smaller one
  const zoomToFitWidth = availableWidth / canvasWidth
  const zoomToFitHeight = availableHeight / canvasHeight
  
  return Math.min(zoomToFitWidth, zoomToFitHeight)
}

// Fit canvas to container width (default view)
function fitToWidth() {
  if (!drawingStore.userAdjustedViewport) {
    const zoom = calculateFitToWidthZoom()
    drawingStore.setViewportWithoutUserFlag(zoom, 0, 0)
  }
  applyViewportTransform()
}

// Force fit to screen (ignores userAdjustedViewport, callable from outside)
function fitToScreen() {
  // Reset the flag first via the store method
  drawingStore.resetViewport()
  // Then calculate and set the proper fit-to-width zoom
  const zoom = calculateFitToWidthZoom()
  drawingStore.setViewportWithoutUserFlag(zoom, 0, 0)
  applyViewportTransform()
}

// Apply current viewport transform to canvas elements
function applyViewportTransform() {
  if (!fabricCanvas || !containerRef.value) return

  const container = containerRef.value
  const canvasWidth = videoStore.state.width || drawingStore.canvasSize.width
  const canvasHeight = videoStore.state.height || drawingStore.canvasSize.height
  const onionCanvas = onionCanvasRef.value

  const zoom = drawingStore.viewport.zoom
  const panX = drawingStore.viewport.panX
  const panY = drawingStore.viewport.panY

  const scaledWidth = canvasWidth * zoom
  const scaledHeight = canvasHeight * zoom

  // Center horizontally, position vertically with pan
  const offsetX = (container.clientWidth - scaledWidth) / 2 + panX
  const offsetY = (container.clientHeight - scaledHeight) / 2 + panY

  const wrapper = fabricCanvas.getElement().parentElement
  if (wrapper) {
    wrapper.style.position = 'absolute'
    wrapper.style.left = `${offsetX}px`
    wrapper.style.top = `${offsetY}px`
    wrapper.style.transform = `scale(${zoom})`
    wrapper.style.transformOrigin = 'top left'
    wrapper.style.width = `${canvasWidth}px`
    wrapper.style.height = `${canvasHeight}px`
  }

  // Scale onion canvas to match
  if (onionCanvas) {
    onionCanvas.style.position = 'absolute'
    onionCanvas.style.left = `${offsetX}px`
    onionCanvas.style.top = `${offsetY}px`
    onionCanvas.style.transform = `scale(${zoom})`
    onionCanvas.style.transformOrigin = 'top left'
    onionCanvas.style.width = `${canvasWidth}px`
    onionCanvas.style.height = `${canvasHeight}px`
  }
}

function scaleCanvasToFit(retryCount = 0) {
  if (!fabricCanvas || !containerRef.value) return

  const container = containerRef.value
  const canvasWidth = videoStore.state.width || drawingStore.canvasSize.width
  const canvasHeight = videoStore.state.height || drawingStore.canvasSize.height
  const onionCanvas = onionCanvasRef.value

  // Try to find the video frame canvas to match its exact position
  const videoFrameCanvas = document.querySelector('.frame-canvas') as HTMLCanvasElement
  
  if (videoFrameCanvas && videoStore.hasVideo) {
    // Match the video canvas position exactly
    const videoRect = videoFrameCanvas.getBoundingClientRect()
    const containerRect = container.getBoundingClientRect()
    
    // Check if video canvas has valid dimensions (it may not be rendered yet)
    if (videoRect.width <= 0 || videoRect.height <= 0) {
      // Retry with exponential backoff, up to 10 attempts
      if (retryCount < 10) {
        const delay = Math.min(100 * Math.pow(1.5, retryCount), 500)
        setTimeout(() => scaleCanvasToFit(retryCount + 1), delay)
      }
      return
    }
    
    const offsetX = videoRect.left - containerRect.left
    const offsetY = videoRect.top - containerRect.top
    const scale = videoRect.width / canvasWidth
    
    const wrapper = fabricCanvas.getElement().parentElement
    if (wrapper) {
      wrapper.style.position = 'absolute'
      wrapper.style.left = `${offsetX}px`
      wrapper.style.top = `${offsetY}px`
      wrapper.style.transform = `scale(${scale})`
      wrapper.style.transformOrigin = 'top left'
      wrapper.style.width = `${canvasWidth}px`
      wrapper.style.height = `${canvasHeight}px`
    }
    
    // Scale onion canvas to match
    if (onionCanvas) {
      onionCanvas.style.position = 'absolute'
      onionCanvas.style.left = `${offsetX}px`
      onionCanvas.style.top = `${offsetY}px`
      onionCanvas.style.transform = `scale(${scale})`
      onionCanvas.style.transformOrigin = 'top left'
      onionCanvas.style.width = `${canvasWidth}px`
      onionCanvas.style.height = `${canvasHeight}px`
    }
  } else {
    // No video (empty project) - use viewport-based positioning with fit-to-width
    fitToWidth()
  }
}

// Handle mouse wheel for zoom (Ctrl+wheel)
function handleWheel(e: WheelEvent) {
  if (e.ctrlKey) {
    // Zoom with Ctrl+wheel centered on mouse position
    const zoomDelta = e.deltaY > 0 ? 0.9 : 1.1
    const oldZoom = drawingStore.viewport.zoom
    const newZoom = Math.max(0.1, Math.min(10, oldZoom * zoomDelta))
    
    if (newZoom !== oldZoom && containerRef.value) {
      // Get mouse position relative to container
      const rect = containerRef.value.getBoundingClientRect()
      const mouseX = e.clientX - rect.left
      const mouseY = e.clientY - rect.top
      
      // Calculate the point in canvas space under the mouse before zoom
      const canvasWidth = videoStore.state.width || drawingStore.canvasSize.width
      const canvasHeight = videoStore.state.height || drawingStore.canvasSize.height
      
      const scaledWidthBefore = canvasWidth * oldZoom
      const scaledHeightBefore = canvasHeight * oldZoom
      const offsetXBefore = (rect.width - scaledWidthBefore) / 2 + drawingStore.viewport.panX
      const offsetYBefore = (rect.height - scaledHeightBefore) / 2 + drawingStore.viewport.panY
      
      // Point on canvas under mouse (in canvas coordinates)
      const canvasX = (mouseX - offsetXBefore) / oldZoom
      const canvasY = (mouseY - offsetYBefore) / oldZoom
      
      // Calculate new offset to keep the same canvas point under the mouse
      const scaledWidthAfter = canvasWidth * newZoom
      const scaledHeightAfter = canvasHeight * newZoom
      const newCenterOffsetX = (rect.width - scaledWidthAfter) / 2
      const newCenterOffsetY = (rect.height - scaledHeightAfter) / 2
      
      // Where the canvas point would appear with new zoom (if pan was 0)
      const newPointX = newCenterOffsetX + canvasX * newZoom
      const newPointY = newCenterOffsetY + canvasY * newZoom
      
      // Adjust pan to keep the point under the mouse
      const newPanX = mouseX - newPointX
      const newPanY = mouseY - newPointY
      
      drawingStore.setZoom(newZoom)
      drawingStore.setPan(newPanX, newPanY)
      applyViewportTransform()
    }
  }
}

// Handle container mouse events for middle-mouse panning
function handleContainerMouseDown(e: MouseEvent) {
  // Middle mouse button (button 1) for panning
  if (e.button === 1) {
    e.preventDefault()
    isPanning = true
    isPanningRef.value = true
    panStartX = e.clientX
    panStartY = e.clientY
    panStartViewportX = drawingStore.viewport.panX
    panStartViewportY = drawingStore.viewport.panY
    return
  }
  
  // Pan tool with left click
  if (e.button === 0 && drawingStore.toolSettings.tool === 'pan') {
    isPanning = true
    isPanningRef.value = true
    panStartX = e.clientX
    panStartY = e.clientY
    panStartViewportX = drawingStore.viewport.panX
    panStartViewportY = drawingStore.viewport.panY
  }
}

function handleContainerMouseMove(e: MouseEvent) {
  if (isPanning) {
    const deltaX = e.clientX - panStartX
    const deltaY = e.clientY - panStartY
    drawingStore.setPan(panStartViewportX + deltaX, panStartViewportY + deltaY)
    applyViewportTransform()
  }
}

function handleContainerMouseUp(_e: MouseEvent) {
  if (isPanning) {
    isPanning = false
    isPanningRef.value = false
  }
}

// Touch event handling for mobile/tablet devices
let touchStartDistance = 0 // For pinch-to-zoom
let isTouchDrawing = false
let touchPinching = false

function handleTouchStart(e: TouchEvent) {
  if (!fabricCanvas) return
  
  if (e.touches.length === 2) {
    // Two fingers: start pinch-to-zoom
    touchPinching = true
    touchStartDistance = getTouchDistance(e.touches)
    panStartX = (e.touches[0].clientX + e.touches[1].clientX) / 2
    panStartY = (e.touches[0].clientY + e.touches[1].clientY) / 2
    panStartViewportX = drawingStore.viewport.panX
    panStartViewportY = drawingStore.viewport.panY
  } else if (e.touches.length === 1) {
    // Single finger: draw
    const touch = e.touches[0]
    const rect = containerRef.value?.getBoundingClientRect()
    if (!rect) return
    
    // If pan tool, handle panning
    if (drawingStore.toolSettings.tool === 'pan') {
      isPanning = true
      isPanningRef.value = true
      panStartX = touch.clientX
      panStartY = touch.clientY
      panStartViewportX = drawingStore.viewport.panX
      panStartViewportY = drawingStore.viewport.panY
    } else {
      // Trigger fabric canvas drawing - simulate mouse event directly on upper canvas
      isTouchDrawing = true
      const upperCanvas = fabricCanvas.upperCanvasEl
      const mouseEvent = new MouseEvent('mousedown', {
        clientX: touch.clientX,
        clientY: touch.clientY,
        button: 0,
        bubbles: true
      })
      upperCanvas.dispatchEvent(mouseEvent)
    }
  }
}

function handleTouchMove(e: TouchEvent) {
  if (!fabricCanvas) return
  
  if (touchPinching && e.touches.length === 2) {
    // Pinch-to-zoom
    const currentDistance = getTouchDistance(e.touches)
    const scale = currentDistance / touchStartDistance
    
    // Calculate center point
    const centerX = (e.touches[0].clientX + e.touches[1].clientX) / 2
    const centerY = (e.touches[0].clientY + e.touches[1].clientY) / 2
    
    // Apply zoom
    const newZoom = Math.max(0.1, Math.min(10, drawingStore.viewport.zoom * scale))
    drawingStore.setZoom(newZoom)
    
    // Pan to follow fingers
    const panDeltaX = centerX - panStartX
    const panDeltaY = centerY - panStartY
    drawingStore.setPan(panStartViewportX + panDeltaX, panStartViewportY + panDeltaY)
    
    applyViewportTransform()
    touchStartDistance = currentDistance
    panStartX = centerX
    panStartY = centerY
    panStartViewportX = drawingStore.viewport.panX
    panStartViewportY = drawingStore.viewport.panY
  } else if (isPanning && e.touches.length === 1) {
    // Panning with pan tool
    const touch = e.touches[0]
    const deltaX = touch.clientX - panStartX
    const deltaY = touch.clientY - panStartY
    drawingStore.setPan(panStartViewportX + deltaX, panStartViewportY + deltaY)
    applyViewportTransform()
  } else if (isTouchDrawing && e.touches.length === 1) {
    // Drawing - simulate mouse event directly on upper canvas
    const touch = e.touches[0]
    const upperCanvas = fabricCanvas.upperCanvasEl
    const mouseEvent = new MouseEvent('mousemove', {
      clientX: touch.clientX,
      clientY: touch.clientY,
      button: 0,
      bubbles: true
    })
    upperCanvas.dispatchEvent(mouseEvent)
  }
}

function handleTouchEnd(_e: TouchEvent) {
  if (!fabricCanvas) return
  
  if (touchPinching) {
    touchPinching = false
    touchStartDistance = 0
  }
  
  if (isTouchDrawing) {
    // Complete the drawing stroke - simulate mouse event directly on upper canvas
    const upperCanvas = fabricCanvas.upperCanvasEl
    const mouseEvent = new MouseEvent('mouseup', {
      clientX: 0,
      clientY: 0,
      button: 0,
      bubbles: true
    })
    upperCanvas.dispatchEvent(mouseEvent)
    isTouchDrawing = false
  }
  
  if (isPanning) {
    isPanning = false
    isPanningRef.value = false
  }
}

function getTouchDistance(touches: TouchList): number {
  const dx = touches[0].clientX - touches[1].clientX
  const dy = touches[0].clientY - touches[1].clientY
  return Math.sqrt(dx * dx + dy * dy)
}

function onMouseDown(opt: any) {
  const tool = drawingStore.toolSettings.tool
  if (!fabricCanvas) return
  
  // Pan tool is handled at container level, not fabric canvas
  if (tool === 'pan') {
    return
  }
  
  const pointer = fabricCanvas.getScenePoint(opt.e)
  const color = drawingStore.toolSettings.color
  const strokeWidth = drawingStore.toolSettings.brushSize

  // Eyedropper tool - pick color from canvas
  if (tool === 'eyedropper') {
    pickColor(opt.e)
    return
  }

  // Fill tool - flood fill area
  if (tool === 'fill') {
    // Simple fill - add a rectangle behind at click point
    // (True flood fill would require pixel manipulation)
    const fillRect = new Rect({
      left: 0,
      top: 0,
      width: fabricCanvas.width,
      height: fabricCanvas.height,
      fill: color,
      selectable: false,
    })
    fabricCanvas.insertAt(0, fillRect)
    saveCurrentState()
    return
  }

  // Polygon tool - click to add points, double-click to finish
  if (tool === 'polygon') {
    if (opt.e.detail === 2) {
      // Double-click: finish polygon
      finishPolygon()
    } else {
      polygonPoints.push({ x: pointer.x, y: pointer.y })
      renderPolygonPreview()
    }
    return
  }

  // Contour tool - freehand closed shape
  if (tool === 'contour') {
    isDrawingLasso = true
    lassoPoints = [{ x: pointer.x, y: pointer.y }]
    return
  }

  // Lasso selection tool
  if (tool === 'lasso') {
    isDrawingLasso = true
    lassoPoints = [{ x: pointer.x, y: pointer.y }]
    return
  }

  // Marquee selection tool
  if (tool === 'marquee') {
    isDrawingShape = true
    shapeStartX = pointer.x
    shapeStartY = pointer.y
    activeShape = new Rect({
      left: shapeStartX,
      top: shapeStartY,
      width: 0,
      height: 0,
      fill: 'rgba(0, 120, 255, 0.2)',
      stroke: '#0078ff',
      strokeWidth: 1,
      strokeDashArray: [5, 5],
      selectable: false,
    })
    fabricCanvas.add(activeShape)
    return
  }

  // Curve tool - start drawing curve
  if (tool === 'curve') {
    if (!isDrawingCurve) {
      isDrawingCurve = true
      shapeStartX = pointer.x
      shapeStartY = pointer.y
      activeShape = new Line([shapeStartX, shapeStartY, shapeStartX, shapeStartY], {
        stroke: color,
        strokeWidth,
        selectable: false,
        evented: false,
        hasControls: false,
        hasBorders: false,
      })
      fabricCanvas.add(activeShape)
    } else if (!curveControlPoint) {
      // Second click: set end point, wait for control point
      curveControlPoint = { x: pointer.x, y: pointer.y }
    } else {
      // Third click: add control point and create curve
      const path = new Path(
        `M ${shapeStartX} ${shapeStartY} Q ${pointer.x} ${pointer.y} ${curveControlPoint.x} ${curveControlPoint.y}`,
        {
          fill: 'transparent',
          stroke: color,
          strokeWidth,
          selectable: false,
          evented: false,
          hasControls: false,
          hasBorders: false,
        }
      )
      if (activeShape) {
        fabricCanvas.remove(activeShape)
      }
      fabricCanvas.add(path)
      isDrawingCurve = false
      curveControlPoint = null
      activeShape = null
      saveCurrentState()
    }
    return
  }

  // Shape tools
  if (!['rectangle', 'circle', 'line'].includes(tool)) return

  isDrawingShape = true
  shapeStartX = pointer.x
  shapeStartY = pointer.y

  if (tool === 'rectangle') {
    activeShape = new Rect({
      left: shapeStartX,
      top: shapeStartY,
      width: 0,
      height: 0,
      fill: 'transparent',
      stroke: color,
      strokeWidth,
      selectable: false,
      evented: false,
      hasControls: false,
      hasBorders: false,
    })
  } else if (tool === 'circle') {
    activeShape = new Circle({
      left: shapeStartX,
      top: shapeStartY,
      radius: 0,
      fill: 'transparent',
      stroke: color,
      strokeWidth,
      selectable: false,
      evented: false,
      hasControls: false,
      hasBorders: false,
    })
  } else if (tool === 'line') {
    activeShape = new Line([shapeStartX, shapeStartY, shapeStartX, shapeStartY], {
      stroke: color,
      strokeWidth,
      selectable: false,
      evented: false,
      hasControls: false,
      hasBorders: false,
    })
  }

  if (activeShape) {
    fabricCanvas.add(activeShape)
  }
}

function onMouseMove(opt: any) {
  if (!fabricCanvas) return
  
  const pointer = fabricCanvas.getScenePoint(opt.e)
  const tool = drawingStore.toolSettings.tool

  // Contour/Lasso - track points while drawing
  if (isDrawingLasso && (tool === 'contour' || tool === 'lasso')) {
    lassoPoints.push({ x: pointer.x, y: pointer.y })
    renderLassoPreview()
    return
  }

  if (!isDrawingShape || !activeShape) return

  if (tool === 'rectangle' || tool === 'marquee') {
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
  } else if (tool === 'line' || tool === 'curve') {
    const line = activeShape as Line
    line.set({
      x2: pointer.x,
      y2: pointer.y,
    })
  }

  fabricCanvas.renderAll()
}

function onMouseUp() {
  const tool = drawingStore.toolSettings.tool

  // Finish contour drawing (closed freehand shape)
  if (isDrawingLasso && tool === 'contour' && lassoPoints.length > 2) {
    finishContour()
    isDrawingLasso = false
    lassoPoints = []
    return
  }

  // Finish lasso selection
  if (isDrawingLasso && tool === 'lasso') {
    // For now, just draw the lasso outline
    // In a full implementation, this would create a selection
    isDrawingLasso = false
    lassoPoints = []
    return
  }

  // Marquee selection - for now just remove the preview
  if (isDrawingShape && tool === 'marquee' && activeShape) {
    fabricCanvas?.remove(activeShape)
    isDrawingShape = false
    activeShape = null
    return
  }

  if (isDrawingShape && activeShape) {
    saveCurrentState()
  }
  isDrawingShape = false
  activeShape = null
}

// Helper functions for advanced tools
function pickColor(e: MouseEvent) {
  if (!fabricCanvas) return
  
  const canvas = fabricCanvas.getElement() as HTMLCanvasElement
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const rect = canvas.getBoundingClientRect()
  const scaleX = canvas.width / rect.width
  const scaleY = canvas.height / rect.height
  
  const x = (e.clientX - rect.left) * scaleX
  const y = (e.clientY - rect.top) * scaleY
  
  const pixel = ctx.getImageData(Math.floor(x), Math.floor(y), 1, 1).data
  
  if (pixel[3] > 0) {
    const color = `#${pixel[0].toString(16).padStart(2, '0')}${pixel[1].toString(16).padStart(2, '0')}${pixel[2].toString(16).padStart(2, '0')}`
    drawingStore.setColor(color)
  }
}

function renderPolygonPreview() {
  if (!fabricCanvas || polygonPoints.length < 2) return
  
  // Remove existing preview
  const objects = fabricCanvas.getObjects()
  const preview = objects.find(o => (o as any)._isPolygonPreview)
  if (preview) {
    fabricCanvas.remove(preview)
  }

  // Draw preview lines
  const pathData = polygonPoints.map((p, i) => 
    `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`
  ).join(' ')
  
  const previewPath = new Path(pathData, {
    fill: 'transparent',
    stroke: drawingStore.toolSettings.color,
    strokeWidth: drawingStore.toolSettings.brushSize,
    strokeDashArray: [5, 5],
    selectable: false,
  })
  ;(previewPath as any)._isPolygonPreview = true
  
  fabricCanvas.add(previewPath)
  fabricCanvas.renderAll()
}

function finishPolygon() {
  if (!fabricCanvas || polygonPoints.length < 3) {
    polygonPoints = []
    return
  }

  // Remove preview
  const objects = fabricCanvas.getObjects()
  const preview = objects.find(o => (o as any)._isPolygonPreview)
  if (preview) {
    fabricCanvas.remove(preview)
  }

  const polygon = new Polygon(
    polygonPoints.map(p => ({ x: p.x, y: p.y })),
    {
      fill: 'transparent',
      stroke: drawingStore.toolSettings.color,
      strokeWidth: drawingStore.toolSettings.brushSize,
      selectable: false,
      evented: false,
      hasControls: false,
      hasBorders: false,
    }
  )
  
  fabricCanvas.add(polygon)
  polygonPoints = []
  saveCurrentState()
}

function renderLassoPreview() {
  if (!fabricCanvas || lassoPoints.length < 2) return
  
  // Remove existing preview
  const objects = fabricCanvas.getObjects()
  const preview = objects.find(o => (o as any)._isLassoPreview)
  if (preview) {
    fabricCanvas.remove(preview)
  }

  const pathData = lassoPoints.map((p, i) => 
    `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`
  ).join(' ')
  
  const previewPath = new Path(pathData, {
    fill: 'transparent',
    stroke: drawingStore.toolSettings.tool === 'contour' 
      ? drawingStore.toolSettings.color 
      : '#0078ff',
    strokeWidth: drawingStore.toolSettings.tool === 'contour' 
      ? drawingStore.toolSettings.brushSize 
      : 1,
    strokeDashArray: drawingStore.toolSettings.tool === 'lasso' ? [3, 3] : undefined,
    selectable: false,
  })
  ;(previewPath as any)._isLassoPreview = true
  
  fabricCanvas.add(previewPath)
  fabricCanvas.renderAll()
}

function finishContour() {
  if (!fabricCanvas || lassoPoints.length < 3) return

  // Remove preview
  const objects = fabricCanvas.getObjects()
  const preview = objects.find(o => (o as any)._isLassoPreview)
  if (preview) {
    fabricCanvas.remove(preview)
  }

  // Create closed path
  const pathData = lassoPoints.map((p, i) => 
    `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`
  ).join(' ') + ' Z'
  
  const contourPath = new Path(pathData, {
    fill: 'transparent',
    stroke: drawingStore.toolSettings.color,
    strokeWidth: drawingStore.toolSettings.brushSize,
    selectable: false,
    evented: false,
    hasControls: false,
    hasBorders: false,
  })
  
  fabricCanvas.add(contourPath)
  saveCurrentState()
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

async function loadFrameDrawing() {
  if (!fabricCanvas) return

  // Capture the frame change version to detect if frame changes during async operations
  const capturedVersion = videoStore.getFrameChangeVersion()
  const capturedFrame = videoStore.state.currentFrame

  // Skip if we already loaded this frame (prevents redundant history clears)
  if (lastLoadedFrame === capturedFrame) {
    return
  }

  // Wait for video seek to complete before loading the drawing
  await videoStore.waitForVideoSeek()

  // Check if frame changed while we were waiting
  if (videoStore.getFrameChangeVersion() !== capturedVersion) {
    return // Abort - a newer frame change is in progress
  }

  const frameDrawing = drawingStore.getFrameDrawing(capturedFrame)

  fabricCanvas.clear()

  if (frameDrawing) {
    await fabricCanvas.loadFromJSON(JSON.parse(frameDrawing.fabricJSON))
    
    // Verify frame hasn't changed during async load
    if (videoStore.getFrameChangeVersion() === capturedVersion) {
      fabricCanvas?.renderAll()
    }
  }
  
  // Clear history for new frame and push initial state for proper undo/redo
  if (videoStore.getFrameChangeVersion() === capturedVersion) {
    lastLoadedFrame = capturedFrame
    drawingStore.clearHistory()
    const json = JSON.stringify(fabricCanvas.toJSON())
    drawingStore.pushHistory(json)
  }
  
  // Only render onion skins if we're still on the same frame
  if (videoStore.getFrameChangeVersion() === capturedVersion) {
    renderOnionSkins()
  }
}

// Render onion skin overlays from adjacent frames
function renderOnionSkins() {
  const onionCanvas = onionCanvasRef.value
  if (!onionCanvas) return
  
  const ctx = onionCanvas.getContext('2d')
  if (!ctx) return
  
  // Set canvas size to match main canvas
  const width = videoStore.state.width || drawingStore.canvasSize.width
  const height = videoStore.state.height || drawingStore.canvasSize.height
  onionCanvas.width = width
  onionCanvas.height = height
  
  // Clear canvas
  ctx.clearRect(0, 0, width, height)
  
  // Exit if onion skin is disabled
  if (!settingsStore.onionSkinEnabled) return
  
  const currentFrame = videoStore.state.currentFrame
  const framesBefore = settingsStore.onionSkinFramesBefore
  const framesAfter = settingsStore.onionSkinFramesAfter
  const opacityBefore = settingsStore.onionSkinOpacityBefore
  const opacityAfter = settingsStore.onionSkinOpacityAfter
  const colorBefore = settingsStore.onionSkinColorBefore
  const colorAfter = settingsStore.onionSkinColorAfter
  const keyframesOnly = settingsStore.onionSkinKeyframesOnly
  
  // Get frames to render
  const framesToRender: Array<{ index: number; isBefore: boolean; distance: number }> = []
  
  if (keyframesOnly) {
    // Only show drawn keyframes
    const drawnFrames = drawingStore.drawnFrameIndices
    
    // Previous keyframes
    const beforeFrames = drawnFrames.filter(f => f < currentFrame).slice(-framesBefore)
    beforeFrames.forEach((f, i) => {
      framesToRender.push({ index: f, isBefore: true, distance: beforeFrames.length - i })
    })
    
    // Next keyframes
    const afterFrames = drawnFrames.filter(f => f > currentFrame).slice(0, framesAfter)
    afterFrames.forEach((f, i) => {
      framesToRender.push({ index: f, isBefore: false, distance: i + 1 })
    })
  } else {
    // Sequential frames - find frames WITH drawings, not just adjacent frames
    // Look backwards for frames with drawings
    let foundBefore = 0
    let distanceBefore = 1
    for (let i = currentFrame - 1; i >= 0 && foundBefore < framesBefore; i--) {
      if (drawingStore.getFrameDrawing(i)) {
        foundBefore++
        framesToRender.push({ index: i, isBefore: true, distance: distanceBefore })
        distanceBefore++
      }
    }
    // Look forwards for frames with drawings
    let foundAfter = 0
    let distanceAfter = 1
    for (let i = currentFrame + 1; i < videoStore.state.frameCount && foundAfter < framesAfter; i++) {
      if (drawingStore.getFrameDrawing(i)) {
        foundAfter++
        framesToRender.push({ index: i, isBefore: false, distance: distanceAfter })
        distanceAfter++
      }
    }
  }
  
  // Render each frame with appropriate color tint and opacity
  framesToRender.forEach(({ index, isBefore, distance }) => {
    const frameDrawing = drawingStore.getFrameDrawing(index)
    if (!frameDrawing?.thumbnail) return
    
    const baseOpacity = isBefore ? opacityBefore : opacityAfter
    const color = isBefore ? colorBefore : colorAfter
    // Fade opacity based on distance
    const opacity = baseOpacity / distance
    
    const img = new Image()
    img.onload = () => {
      // Create temporary canvas for color tinting
      const tempCanvas = document.createElement('canvas')
      tempCanvas.width = width
      tempCanvas.height = height
      const tempCtx = tempCanvas.getContext('2d')!
      
      // Draw original image
      tempCtx.drawImage(img, 0, 0, width, height)
      
      // Apply color tint using composite operations
      tempCtx.globalCompositeOperation = 'source-atop'
      tempCtx.fillStyle = color
      tempCtx.fillRect(0, 0, width, height)
      
      // Draw tinted image to main onion canvas with opacity
      ctx.globalAlpha = opacity
      ctx.drawImage(tempCanvas, 0, 0)
      ctx.globalAlpha = 1
    }
    img.src = frameDrawing.thumbnail
  })
}

// Watch for onion skin settings changes
watch(
  () => [
    settingsStore.onionSkinEnabled,
    settingsStore.onionSkinFramesBefore,
    settingsStore.onionSkinFramesAfter,
    settingsStore.onionSkinOpacityBefore,
    settingsStore.onionSkinOpacityAfter,
    settingsStore.onionSkinColorBefore,
    settingsStore.onionSkinColorAfter,
    settingsStore.onionSkinKeyframesOnly
  ],
  () => {
    renderOnionSkins()
  }
)

// Smoothing state for real-time line stabilization (reserved for future use)
// let smoothingBuffer: { x: number; y: number }[] = []

// Smooth a path after creation - preserves start/end points to prevent visual shifting
function smoothPath(path: Path) {
  if (!path.path || path.path.length < 4) return
  
  const strength = settingsStore.smoothLineStrength / 100
  const pathData = path.path as any[]
  
  // Keep first and last points fixed to prevent shifting
  const firstPoint = pathData[0]
  const lastPoint = pathData[pathData.length - 1]
  
  // Apply moving average smoothing to middle points only
  const windowSize = Math.max(2, Math.floor(strength * 5) + 1)
  
  for (let i = 1; i < pathData.length - 1; i++) {
    const cmd = pathData[i]
    if (cmd[0] === 'Q' || cmd[0] === 'L') {
      // Average with neighboring points
      let sumX = 0, sumY = 0, count = 0
      
      for (let j = Math.max(1, i - windowSize); j <= Math.min(pathData.length - 2, i + windowSize); j++) {
        const neighbor = pathData[j]
        if (neighbor[0] === 'Q') {
          sumX += neighbor[3] // end x
          sumY += neighbor[4] // end y
          count++
        } else if (neighbor[0] === 'L') {
          sumX += neighbor[1]
          sumY += neighbor[2]
          count++
        }
      }
      
      if (count > 0) {
        const avgX = sumX / count
        const avgY = sumY / count
        
        // Blend original with average based on strength
        if (cmd[0] === 'Q') {
          cmd[3] = cmd[3] * (1 - strength * 0.5) + avgX * strength * 0.5
          cmd[4] = cmd[4] * (1 - strength * 0.5) + avgY * strength * 0.5
        } else if (cmd[0] === 'L') {
          cmd[1] = cmd[1] * (1 - strength * 0.5) + avgX * strength * 0.5
          cmd[2] = cmd[2] * (1 - strength * 0.5) + avgY * strength * 0.5
        }
      }
    }
  }
  
  // Restore first and last points to prevent any shifting
  pathData[0] = firstPoint
  pathData[pathData.length - 1] = lastPoint
  
  path.set('path', pathData)
  fabricCanvas?.renderAll()
}

// Apply smooth line settings to brush - NO decimate to prevent line jumping
function applyBrushSmoothing(brush: PencilBrush) {
  // IMPORTANT: Set decimate to 0 to prevent line shifting on release
  ;(brush as any).decimate = 0
  ;(brush as any).strokeUniform = true
}

// Watch for tool changes
watch(
  () => drawingStore.toolSettings,
  (settings) => {
    if (!fabricCanvas) return

    // Pencil tool - basic pixel-art style pencil
    if (settings.tool === 'pen' || settings.tool === 'pencil') {
      fabricCanvas.isDrawingMode = true
      const brush = createBrush(fabricCanvas, settings.color, settings.brushSize, settings.brushType)
      applyBrushSmoothing(brush)
      fabricCanvas.freeDrawingBrush = brush
    }
    // Brush tool - smooth brush strokes
    else if (settings.tool === 'brush') {
      fabricCanvas.isDrawingMode = true
      const brush = createBrush(fabricCanvas, settings.color, settings.brushSize * 1.5, settings.brushType)
      applyBrushSmoothing(brush)
      fabricCanvas.freeDrawingBrush = brush
    }
    // Spray tool - airbrush effect
    else if (settings.tool === 'spray') {
      fabricCanvas.isDrawingMode = true
      const brush = new SprayBrush(fabricCanvas)
      brush.color = settings.color
      brush.width = settings.brushSize * 3
      ;(brush as any).density = 20
      fabricCanvas.freeDrawingBrush = brush
    }
    // Eraser
    else if (settings.tool === 'eraser') {
      fabricCanvas.isDrawingMode = true
      const brush = createBrush(fabricCanvas, '#ffffff', settings.brushSize * 2, settings.brushType)
      applyBrushSmoothing(brush)
      fabricCanvas.freeDrawingBrush = brush
    }
    // Selection/Move tool
    else if (settings.tool === 'select') {
      fabricCanvas.isDrawingMode = false
    }
    // Pan tool - disable drawing, let container handle it
    else if (settings.tool === 'pan') {
      fabricCanvas.isDrawingMode = false
    }
    // Tools that need canvas interaction (shapes, eyedropper, fill, etc.)
    else {
      fabricCanvas.isDrawingMode = false
    }
  },
  { deep: true, immediate: true }
)

// Watch for smooth line settings changes
watch(
  () => [settingsStore.smoothLineMode, settingsStore.smoothLineStrength],
  () => {
    if (!fabricCanvas || !fabricCanvas.freeDrawingBrush) return
    const brush = fabricCanvas.freeDrawingBrush
    if (brush instanceof PencilBrush) {
      applyBrushSmoothing(brush)
    }
  }
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
      // Reset frame tracking to force reload with new dimensions
      lastLoadedFrame = -1
      await nextTick()
      fabricCanvas.setDimensions({
        width: newWidth,
        height: newHeight,
      })
      // Wait for video to seek and render the first frame before scaling
      // This ensures .frame-canvas has valid dimensions
      await videoStore.waitForVideoSeek()
      await nextTick()
      scaleCanvasToFit()
      loadFrameDrawing()
    }
  }
)

// Watch for crop changes - need to rescale drawing canvas to match
watch(
  () => [
    videoStore.state.cropTop,
    videoStore.state.cropRight,
    videoStore.state.cropBottom,
    videoStore.state.cropLeft
  ],
  async () => {
    if (fabricCanvas && videoStore.hasVideo) {
      await nextTick()
      // Small delay to ensure CSS has been applied to frame-canvas
      setTimeout(() => scaleCanvasToFit(), 50)
    }
  }
)

// Watch for canvas size changes (only when no video loaded)
watch(
  () => drawingStore.canvasSize,
  async () => {
    if (!fabricCanvas) return
    
    // Only apply canvas size when no video is loaded
    if (videoStore.state.width && videoStore.state.height) {
      // Video is loaded - canvas matches video, size is for export only
      return
    }

    await nextTick()
    fabricCanvas.setDimensions({
      width: drawingStore.canvasSize.width,
      height: drawingStore.canvasSize.height,
    })
    
    // Reset viewport to fit new canvas size
    drawingStore.resetViewport()
    fitToWidth()
  }
)

// Watch for viewport changes
watch(
  () => [drawingStore.viewport.zoom, drawingStore.viewport.panX, drawingStore.viewport.panY],
  () => {
    if (!videoStore.hasVideo) {
      applyViewportTransform()
    }
  }
)

// Keyboard shortcuts
function setupKeyboardShortcuts() {
  window.addEventListener('keydown', handleKeydown)
}

function handleKeydown(e: KeyboardEvent) {
  // Ignore if typing in input
  if ((e.target as HTMLElement).tagName === 'INPUT') return

  // Note: Ctrl+Z/Y handled by App.vue global key handler to avoid double-undo
  if (e.key === 'p') {
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
  } else if (e.key === 'h' || e.key === 'H') {
    drawingStore.setTool('pan')
  } else if (e.key === '0' && (e.ctrlKey || e.metaKey)) {
    // Ctrl+0: Reset zoom to fit-to-width
    e.preventDefault()
    drawingStore.resetViewport()
    fitToWidth()
  }
}

// Public methods
function undo() {
  console.log('[DrawingCanvas] Undo called')
  const state = drawingStore.undo()
  console.log('[DrawingCanvas] Got state:', state ? 'yes' : 'null', 'fabricCanvas:', fabricCanvas ? 'yes' : 'null')
  if (state && fabricCanvas) {
    fabricCanvas.loadFromJSON(JSON.parse(state)).then(() => {
      fabricCanvas?.renderAll()
      saveWithoutHistory()
      console.log('[DrawingCanvas] Undo applied')
    })
  }
}

function redo() {
  console.log('[DrawingCanvas] Redo called')
  const state = drawingStore.redo()
  console.log('[DrawingCanvas] Got state:', state ? 'yes' : 'null', 'fabricCanvas:', fabricCanvas ? 'yes' : 'null')
  if (state && fabricCanvas) {
    fabricCanvas.loadFromJSON(JSON.parse(state)).then(() => {
      fabricCanvas?.renderAll()
      saveWithoutHistory()
      console.log('[DrawingCanvas] Redo applied')
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
  fitToScreen,
})
</script>

<style scoped>
.drawing-canvas-container {
  position: absolute;
  inset: 0;
  background: transparent;
  overflow: hidden;
  touch-action: none; /* Prevent browser handling of touch events */
  -webkit-touch-callout: none; /* Disable callout on iOS */
  -webkit-user-select: none;
  user-select: none;
}

.drawing-canvas-container canvas {
  image-rendering: -webkit-optimize-contrast;
  image-rendering: crisp-edges;
  image-rendering: pixelated;
}

/* Pan cursor when pan tool is active */
.drawing-canvas-container.pan-tool {
  cursor: grab;
}

.drawing-canvas-container.pan-tool:active,
.drawing-canvas-container.panning {
  cursor: grabbing;
}

.drawing-canvas-container canvas {
  image-rendering: pixelated;
}

.onion-canvas {
  position: absolute;
  top: 0;
  left: 0;
  pointer-events: none;
  z-index: 0;
}

/* Fabric canvas wrapper - allow transform scaling */
.drawing-canvas-container :deep(.canvas-container) {
  position: relative !important;
  z-index: 1;
}
</style>
