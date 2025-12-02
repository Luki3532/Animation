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
