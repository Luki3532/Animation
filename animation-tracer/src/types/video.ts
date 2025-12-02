export interface VideoState {
  file: File | null
  url: string
  duration: number
  fps: number
  frameCount: number
  currentFrame: number
  isLoaded: boolean
  width: number
  height: number
  // Crop settings (percentages 0-100)
  cropTop: number
  cropRight: number
  cropBottom: number
  cropLeft: number
}

export type PreviewBackground = 'transparent' | 'white' | 'black'
