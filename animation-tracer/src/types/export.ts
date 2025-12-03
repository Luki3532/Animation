export interface SpriteSheetOptions {
  padding: number
  maxWidth: number
  maxHeight: number
  format: 'png' | 'webp'
}

export interface SpriteSheetFrame {
  frameIndex: number
  x: number
  y: number
  width: number
  height: number
}

export interface SpriteSheetMetadata {
  frames: SpriteSheetFrame[]
  sheetWidth: number
  sheetHeight: number
  frameWidth: number
  frameHeight: number
}

export type ExportFormat = 'png' | 'jpg' | 'webp' | 'gif' | 'mp4' | 'webm' | 'apng' | 'zip'

export type ExportQuality = 'low' | 'medium' | 'high' | 'ultra'

export interface CustomExportOptions {
  // Format settings
  format: ExportFormat
  quality: ExportQuality
  
  // Animation settings (for video/gif formats)
  fps: number
  loop: boolean
  duration?: number // in seconds, optional
  
  // Frame settings
  frameRange: 'all' | 'current' | 'selection' | 'custom'
  startFrame?: number
  endFrame?: number
  selectedFrames?: number[]
  
  // Size settings
  scale: number // 0.25 to 4.0
  width?: number
  height?: number
  maintainAspectRatio: boolean
  
  // Background settings
  backgroundColor: string
  transparency: boolean
  
  // Video-specific settings (mp4, webm)
  codec?: 'h264' | 'vp8' | 'vp9' | 'av1'
  bitrate?: number // kbps
  
  // GIF-specific settings
  dithering?: boolean
  colorDepth?: 8 | 16 | 32 | 64 | 128 | 256
  
  // Image sequence settings (zip)
  imageSequenceFormat?: 'png' | 'jpg' | 'webp'
  
  // Compression
  compress: boolean
  compressionLevel?: number // 0-100
  
  // Metadata
  includeMetadata: boolean
  metadataFormat?: 'json' | 'xml' | 'txt'
  
  // Advanced
  antialiasing: boolean
  smoothing: boolean
}

export const DEFAULT_CUSTOM_EXPORT_OPTIONS: CustomExportOptions = {
  format: 'gif',
  quality: 'high',
  fps: 12,
  loop: true,
  frameRange: 'all',
  scale: 1.0,
  maintainAspectRatio: true,
  backgroundColor: '#ffffff',
  transparency: true,
  dithering: true,
  colorDepth: 256,
  compress: false,
  includeMetadata: false,
  antialiasing: true,
  smoothing: true
}
