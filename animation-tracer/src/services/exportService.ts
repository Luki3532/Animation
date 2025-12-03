import type { SpriteSheetMetadata, SpriteSheetOptions, CustomExportOptions } from '../types/export'
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

  /**
   * Custom export with highly configurable options
   */
  static async customExport(
    frameDrawings: Map<number, FrameDrawing>,
    canvasSize: CanvasSize,
    options: CustomExportOptions
  ): Promise<void> {
    const frames = this.getFramesForExport(frameDrawings, options)
    
    if (frames.length === 0) {
      throw new Error('No frames to export')
    }

    const filename = 'animation'
    
    switch (options.format) {
      case 'gif':
        await this.exportAsGIF(frames, canvasSize, options, filename)
        break
      case 'mp4':
      case 'webm':
        await this.exportAsVideo(frames, canvasSize, options, filename)
        break
      case 'apng':
        await this.exportAsAPNG(frames, canvasSize, options, filename)
        break
      case 'png':
      case 'jpg':
      case 'webp':
        await this.exportAsSingleImage(frames, canvasSize, options, filename)
        break
      case 'zip':
        await this.exportAsImageSequence(frames, canvasSize, options, filename)
        break
      default:
        throw new Error(`Unsupported format: ${options.format}`)
    }

    if (options.includeMetadata) {
      this.exportMetadata(frames, options, filename)
    }
  }

  /**
   * Get frames based on export options
   */
  private static getFramesForExport(
    frameDrawings: Map<number, FrameDrawing>,
    options: CustomExportOptions
  ): FrameDrawing[] {
    const allFrames = Array.from(frameDrawings.values()).sort(
      (a, b) => a.frameIndex - b.frameIndex
    )

    switch (options.frameRange) {
      case 'all':
        return allFrames
      case 'current':
        return allFrames.slice(0, 1)
      case 'custom':
        const start = options.startFrame || 0
        const end = options.endFrame || allFrames.length - 1
        return allFrames.filter(f => f.frameIndex >= start && f.frameIndex <= end)
      case 'selection':
        if (options.selectedFrames && options.selectedFrames.length > 0) {
          return allFrames.filter(f => options.selectedFrames!.includes(f.frameIndex))
        }
        return allFrames
      default:
        return allFrames
    }
  }

  /**
   * Calculate output dimensions
   */
  private static getOutputDimensions(
    canvasSize: CanvasSize,
    options: CustomExportOptions
  ): { width: number; height: number } {
    const width = Math.round((options.width || canvasSize.width) * options.scale)
    const height = Math.round((options.height || canvasSize.height) * options.scale)
    return { width, height }
  }

  /**
   * Export as GIF
   */
  private static async exportAsGIF(
    frames: FrameDrawing[],
    canvasSize: CanvasSize,
    options: CustomExportOptions,
    filename: string
  ): Promise<void> {
    const { width, height } = this.getOutputDimensions(canvasSize, options)
    
    // Note: Actual GIF encoding would require a library like gif.js
    // For now, we'll create a simulated implementation
    console.log('Exporting GIF with options:', {
      frames: frames.length,
      fps: options.fps,
      width,
      height,
      colorDepth: options.colorDepth,
      dithering: options.dithering
    })

    // Create canvas for rendering
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')!

    // For demonstration, export first frame as PNG
    // In production, integrate gif.js or similar library
    await this.renderFrame(ctx, frames[0], width, height, options)
    
    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (blob) => blob ? resolve(blob) : reject(new Error('Failed to create blob')),
        'image/png'
      )
    })

    this.downloadFile(blob, `${filename}.gif`)
    
    alert('GIF export requires additional library (gif.js). Currently exporting as PNG. Install gif.js for full GIF support.')
  }

  /**
   * Export as video (MP4/WEBM)
   */
  private static async exportAsVideo(
    frames: FrameDrawing[],
    canvasSize: CanvasSize,
    options: CustomExportOptions,
    filename: string
  ): Promise<void> {
    const { width, height } = this.getOutputDimensions(canvasSize, options)
    
    console.log('Exporting video with options:', {
      frames: frames.length,
      fps: options.fps,
      codec: options.codec,
      bitrate: options.bitrate,
      width,
      height
    })

    // Note: Video encoding requires MediaRecorder API or library like FFmpeg
    // For demonstration purposes
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height

    alert(`Video export (${options.format.toUpperCase()}) requires MediaRecorder API or FFmpeg.js. Feature in development.`)
  }

  /**
   * Export as APNG (Animated PNG)
   */
  private static async exportAsAPNG(
    frames: FrameDrawing[],
    canvasSize: CanvasSize,
    options: CustomExportOptions,
    filename: string
  ): Promise<void> {
    const { width, height } = this.getOutputDimensions(canvasSize, options)
    
    console.log('Exporting APNG with options:', {
      frames: frames.length,
      fps: options.fps,
      width,
      height
    })

    // Note: APNG encoding requires a specialized library
    alert('APNG export requires additional library (upng-js or apng-js). Feature in development.')
  }

  /**
   * Export as single image
   */
  private static async exportAsSingleImage(
    frames: FrameDrawing[],
    canvasSize: CanvasSize,
    options: CustomExportOptions,
    filename: string
  ): Promise<void> {
    const { width, height } = this.getOutputDimensions(canvasSize, options)
    
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')!

    // Render first frame
    await this.renderFrame(ctx, frames[0], width, height, options)

    const quality = this.getQualityValue(options.quality)
    const mimeType = this.getMimeType(options.format)
    
    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (blob) => blob ? resolve(blob) : reject(new Error('Failed to create blob')),
        mimeType,
        quality
      )
    })

    this.downloadFile(blob, `${filename}.${options.format}`)
  }

  /**
   * Export as image sequence (ZIP)
   */
  private static async exportAsImageSequence(
    frames: FrameDrawing[],
    canvasSize: CanvasSize,
    options: CustomExportOptions,
    filename: string
  ): Promise<void> {
    const { width, height } = this.getOutputDimensions(canvasSize, options)
    const format = options.imageSequenceFormat || 'png'
    
    console.log('Exporting image sequence with options:', {
      frames: frames.length,
      format,
      width,
      height
    })

    // Note: ZIP creation requires JSZip library
    alert('Image sequence export (ZIP) requires JSZip library. Feature in development. Consider exporting frames individually.')
  }

  /**
   * Render a frame to canvas
   */
  private static async renderFrame(
    ctx: CanvasRenderingContext2D,
    frame: FrameDrawing,
    width: number,
    height: number,
    options: CustomExportOptions
  ): Promise<void> {
    // Clear canvas
    ctx.clearRect(0, 0, width, height)

    // Set background
    if (!options.transparency) {
      ctx.fillStyle = options.backgroundColor
      ctx.fillRect(0, 0, width, height)
    }

    // Set rendering quality
    ctx.imageSmoothingEnabled = options.smoothing
    if (options.antialiasing) {
      ctx.imageSmoothingQuality = 'high'
    }

    // Load and draw frame
    const img = await this.loadImage(frame.thumbnail)
    ctx.drawImage(img, 0, 0, width, height)
  }

  /**
   * Get quality value from quality preset
   */
  private static getQualityValue(quality: string): number {
    const qualityMap: Record<string, number> = {
      low: 0.6,
      medium: 0.8,
      high: 0.9,
      ultra: 1.0
    }
    return qualityMap[quality] || 0.9
  }

  /**
   * Get MIME type from format
   */
  private static getMimeType(format: string): string {
    const mimeTypes: Record<string, string> = {
      png: 'image/png',
      jpg: 'image/jpeg',
      webp: 'image/webp'
    }
    return mimeTypes[format] || 'image/png'
  }

  /**
   * Download a file
   */
  private static downloadFile(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    link.click()
    URL.revokeObjectURL(url)
  }

  /**
   * Export metadata
   */
  private static exportMetadata(
    frames: FrameDrawing[],
    options: CustomExportOptions,
    filename: string
  ): void {
    const metadata = {
      exportDate: new Date().toISOString(),
      format: options.format,
      frameCount: frames.length,
      fps: options.fps,
      dimensions: {
        width: options.width,
        height: options.height,
        scale: options.scale
      },
      frames: frames.map(f => ({
        index: f.frameIndex
      }))
    }

    let content: string
    let extension: string

    switch (options.metadataFormat) {
      case 'json':
        content = JSON.stringify(metadata, null, 2)
        extension = 'json'
        break
      case 'xml':
        content = this.jsonToXML(metadata)
        extension = 'xml'
        break
      case 'txt':
        content = this.jsonToText(metadata)
        extension = 'txt'
        break
      default:
        content = JSON.stringify(metadata, null, 2)
        extension = 'json'
    }

    const blob = new Blob([content], { type: 'text/plain' })
    this.downloadFile(blob, `${filename}_metadata.${extension}`)
  }

  /**
   * Convert JSON to XML
   */
  private static jsonToXML(obj: any, rootName: string = 'metadata'): string {
    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<${rootName}>\n`
    
    for (const [key, value] of Object.entries(obj)) {
      if (Array.isArray(value)) {
        xml += `  <${key}>\n`
        value.forEach(item => {
          xml += `    <item>${typeof item === 'object' ? JSON.stringify(item) : item}</item>\n`
        })
        xml += `  </${key}>\n`
      } else if (typeof value === 'object') {
        xml += `  <${key}>${JSON.stringify(value)}</${key}>\n`
      } else {
        xml += `  <${key}>${value}</${key}>\n`
      }
    }
    
    xml += `</${rootName}>`
    return xml
  }

  /**
   * Convert JSON to readable text
   */
  private static jsonToText(obj: any): string {
    let text = 'Export Metadata\n'
    text += '='.repeat(50) + '\n\n'
    
    for (const [key, value] of Object.entries(obj)) {
      const label = key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')
      if (typeof value === 'object' && !Array.isArray(value)) {
        text += `${label}:\n`
        for (const [subKey, subValue] of Object.entries(value)) {
          text += `  ${subKey}: ${subValue}\n`
        }
      } else {
        text += `${label}: ${Array.isArray(value) ? value.length + ' items' : value}\n`
      }
    }
    
    return text
  }
}

