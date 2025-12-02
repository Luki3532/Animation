import type { SpriteSheetMetadata, SpriteSheetOptions } from '../types/export'
import type { FrameDrawing, CanvasSize } from '../types/drawing'

export class ExportService {
  /**
   * Generate a sprite sheet from frame drawings
   */
  static async generateSpriteSheet(
    frameDrawings: Map<number, FrameDrawing>,
    canvasSize: CanvasSize,
    options: Partial<SpriteSheetOptions> = {}
  ): Promise<{ imageBlob: Blob; metadata: SpriteSheetMetadata }> {
    const { padding = 1, maxWidth = 4096, format = 'png' } = options

    const frames = Array.from(frameDrawings.values()).sort(
      (a, b) => a.frameIndex - b.frameIndex
    )

    if (frames.length === 0) {
      throw new Error('No frames to export')
    }

    const frameWidth = canvasSize.width
    const frameHeight = canvasSize.height

    // Calculate optimal grid layout
    const { cols, rows } = this.calculateOptimalGrid(
      frames.length,
      frameWidth,
      frameHeight,
      padding,
      maxWidth
    )

    const sheetWidth = cols * (frameWidth + padding) - padding
    const sheetHeight = rows * (frameHeight + padding) - padding

    // Create the sprite sheet canvas
    const canvas = document.createElement('canvas')
    canvas.width = sheetWidth
    canvas.height = sheetHeight
    const ctx = canvas.getContext('2d')!

    // Make background transparent
    ctx.clearRect(0, 0, sheetWidth, sheetHeight)

    const spriteFrames: SpriteSheetMetadata['frames'] = []

    // Render each frame (scaled to target canvas size)
    for (let i = 0; i < frames.length; i++) {
      const frame = frames[i]
      const col = i % cols
      const row = Math.floor(i / cols)
      const x = col * (frameWidth + padding)
      const y = row * (frameHeight + padding)

      // Load frame image from thumbnail and scale to target size
      const img = await this.loadImage(frame.thumbnail)
      
      // Draw scaled to target frame size (handles video frames at different resolution)
      ctx.drawImage(img, 0, 0, img.width, img.height, x, y, frameWidth, frameHeight)

      spriteFrames.push({
        frameIndex: frame.frameIndex,
        x,
        y,
        width: frameWidth,
        height: frameHeight
      })
    }

    // Convert to blob
    const mimeType = format === 'webp' ? 'image/webp' : 'image/png'
    const imageBlob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob)
          else reject(new Error('Failed to create blob'))
        },
        mimeType,
        1.0
      )
    })

    const metadata: SpriteSheetMetadata = {
      frames: spriteFrames,
      sheetWidth,
      sheetHeight,
      frameWidth,
      frameHeight
    }

    return { imageBlob, metadata }
  }

  /**
   * Calculate optimal grid layout for sprite sheet
   */
  private static calculateOptimalGrid(
    frameCount: number,
    frameWidth: number,
    _frameHeight: number,
    padding: number,
    maxWidth: number
  ): { cols: number; rows: number } {
    const maxCols = Math.floor((maxWidth + padding) / (frameWidth + padding))
    const cols = Math.min(frameCount, maxCols)
    const rows = Math.ceil(frameCount / cols)
    return { cols, rows }
  }

  /**
   * Load an image from a data URL
   */
  private static loadImage(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.onload = () => resolve(img)
      img.onerror = reject
      img.src = src
    })
  }

  /**
   * Download the sprite sheet
   */
  static downloadSpriteSheet(
    imageBlob: Blob,
    metadata: SpriteSheetMetadata,
    filename: string = 'spritesheet'
  ) {
    // Download image
    const imageUrl = URL.createObjectURL(imageBlob)
    const imageLink = document.createElement('a')
    imageLink.href = imageUrl
    imageLink.download = `${filename}.png`
    imageLink.click()
    URL.revokeObjectURL(imageUrl)

    // Download metadata JSON
    const metadataBlob = new Blob([JSON.stringify(metadata, null, 2)], {
      type: 'application/json'
    })
    const metadataUrl = URL.createObjectURL(metadataBlob)
    const metadataLink = document.createElement('a')
    metadataLink.href = metadataUrl
    metadataLink.download = `${filename}.json`
    metadataLink.click()
    URL.revokeObjectURL(metadataUrl)
  }

  /**
   * Export a single frame as PNG
   */
  static async exportSingleFrame(
    frameDrawing: FrameDrawing,
    filename: string = 'frame'
  ) {
    const response = await fetch(frameDrawing.thumbnail)
    const blob = await response.blob()

    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${filename}_${frameDrawing.frameIndex}.png`
    link.click()
    URL.revokeObjectURL(url)
  }
}
