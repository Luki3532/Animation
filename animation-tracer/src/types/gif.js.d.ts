declare module 'gif.js' {
  interface GIFOptions {
    workers?: number
    quality?: number
    width?: number
    height?: number
    workerScript?: string
    dither?: string | boolean
    transparent?: number | null
    repeat?: number
    background?: string
    debug?: boolean
  }

  interface GIFFrameOptions {
    delay?: number
    copy?: boolean
    dispose?: number
  }

  class GIF {
    constructor(options?: GIFOptions)
    
    addFrame(element: HTMLCanvasElement | CanvasRenderingContext2D | ImageData, options?: GIFFrameOptions): void
    
    on(event: 'finished', listener: (blob: Blob) => void): this
    on(event: 'progress', listener: (percent: number) => void): this
    on(event: 'start' | 'abort', listener: () => void): this
    
    render(): void
    abort(): void
    
    running: boolean
    frames: any[]
  }

  export = GIF
}
