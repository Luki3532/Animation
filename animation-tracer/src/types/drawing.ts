export interface FrameDrawing {
  frameIndex: number
  fabricJSON: string
  thumbnail: string
}

export interface ToolSettings {
  tool: 'pen' | 'eraser' | 'rectangle' | 'circle' | 'line' | 'select' | 'pencil' | 'brush' | 'spray' | 'fill' | 'eyedropper' | 'marquee' | 'lasso' | 'contour' | 'polygon' | 'curve' | 'pan'
  color: string
  brushSize: number
  opacity: number
}

export interface ViewportState {
  zoom: number
  panX: number
  panY: number
}

export interface CanvasSize {
  width: number
  height: number
  label: string
}

export const CANVAS_SIZES: CanvasSize[] = [
  { width: 32, height: 32, label: '32×32' },
  { width: 64, height: 64, label: '64×64' },
  { width: 128, height: 128, label: '128×128' },
  { width: 256, height: 256, label: '256×256' },
  { width: 512, height: 512, label: '512×512' },
]
