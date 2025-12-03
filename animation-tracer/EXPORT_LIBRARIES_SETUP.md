# Installing Export Libraries (Optional)

This guide helps you install optional libraries to enable full Custom Export functionality.

## Quick Install (All Libraries)

```bash
npm install gif.js jszip
```

For TypeScript support:
```bash
npm install --save-dev @types/gif.js
```

## Individual Libraries

### GIF.js - For GIF Export
Enables animated GIF export with dithering and color depth control.

```bash
npm install gif.js
```

**Usage in exportService.ts:**
```typescript
import GIF from 'gif.js'

// In exportAsGIF method:
const gif = new GIF({
  workers: 2,
  quality: options.dithering ? 10 : 1,
  width: width,
  height: height,
  workerScript: '/node_modules/gif.js/dist/gif.worker.js'
})

for (const frame of frames) {
  const canvas = await this.frameToCanvas(frame, width, height, options)
  gif.addFrame(canvas, { delay: 1000 / options.fps })
}

gif.on('finished', (blob) => {
  this.downloadFile(blob, `${filename}.gif`)
})

gif.render()
```

### JSZip - For ZIP Export
Enables exporting frame sequences as ZIP archives.

```bash
npm install jszip
```

**Usage in exportService.ts:**
```typescript
import JSZip from 'jszip'

// In exportAsImageSequence method:
const zip = new JSZip()

for (let i = 0; i < frames.length; i++) {
  const frame = frames[i]
  const canvas = await this.frameToCanvas(frame, width, height, options)
  const blob = await new Promise<Blob>((resolve) => {
    canvas.toBlob((b) => resolve(b!), mimeType, quality)
  })
  
  const frameNumber = String(i + 1).padStart(4, '0')
  zip.file(`frame_${frameNumber}.${format}`, blob)
}

const zipBlob = await zip.generateAsync({ type: 'blob' })
this.downloadFile(zipBlob, `${filename}.zip`)
```

### UPNG.js - For APNG Export
Enables animated PNG export with full transparency.

```bash
npm install upng-js
```

**Usage in exportService.ts:**
```typescript
import UPNG from 'upng-js'

// In exportAsAPNG method:
const canvases = []
for (const frame of frames) {
  const canvas = await this.frameToCanvas(frame, width, height, options)
  const ctx = canvas.getContext('2d')!
  const imageData = ctx.getImageData(0, 0, width, height)
  canvases.push(imageData.data.buffer)
}

const delays = frames.map(() => Math.round(1000 / options.fps))
const apng = UPNG.encode(canvases, width, height, 0, delays)
const blob = new Blob([apng], { type: 'image/png' })

this.downloadFile(blob, `${filename}.png`)
```

## Video Export (MediaRecorder API)

Video export (MP4/WEBM) uses the browser's built-in MediaRecorder API. No installation needed!

**Update exportAsVideo method:**
```typescript
private static async exportAsVideo(
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

  const stream = canvas.captureStream(options.fps)
  const mimeType = options.format === 'mp4' 
    ? 'video/mp4; codecs=avc1' 
    : 'video/webm; codecs=vp9'
  
  const mediaRecorder = new MediaRecorder(stream, {
    mimeType: mimeType,
    videoBitsPerSecond: options.bitrate ? options.bitrate * 1000 : undefined
  })

  const chunks: Blob[] = []
  mediaRecorder.ondataavailable = (e) => chunks.push(e.data)
  
  mediaRecorder.onstop = () => {
    const blob = new Blob(chunks, { type: mimeType })
    this.downloadFile(blob, `${filename}.${options.format}`)
  }

  mediaRecorder.start()

  // Render frames
  const frameDuration = 1000 / options.fps
  for (const frame of frames) {
    await this.renderFrame(ctx, frame, width, height, options)
    await new Promise(resolve => setTimeout(resolve, frameDuration))
  }

  mediaRecorder.stop()
}
```

## Verification

After installing, verify the libraries are working:

1. Open your project
2. Run `npm list` to see installed packages
3. Try exporting in each format from the Custom Export dialog

## Troubleshooting

### gif.js worker script not found
Update the workerScript path in your implementation:
```typescript
workerScript: '/node_modules/gif.js/dist/gif.worker.js'
```

Or copy the worker to your public folder and reference it there.

### Type errors with TypeScript
Install type definitions:
```bash
npm install --save-dev @types/gif.js @types/jszip
```

If types don't exist, create a `types.d.ts` file:
```typescript
declare module 'gif.js' {
  export default class GIF {
    constructor(options: any)
    addFrame(canvas: HTMLCanvasElement, options?: any): void
    on(event: string, callback: (blob: Blob) => void): void
    render(): void
  }
}

declare module 'upng-js' {
  export function encode(
    frames: ArrayBuffer[],
    width: number,
    height: number,
    cnum: number,
    delays: number[]
  ): ArrayBuffer
}
```

### MediaRecorder not supported
Check browser compatibility:
```typescript
if (!MediaRecorder.isTypeSupported('video/webm')) {
  alert('Video export not supported in this browser')
  return
}
```

## Alternative Approaches

### FFmpeg.js (Advanced)
For more control over video encoding:
```bash
npm install @ffmpeg/ffmpeg @ffmpeg/core
```

Pros:
- More codec options
- Better quality control
- Frame-by-frame precision

Cons:
- Larger bundle size
- More complex setup
- Slower encoding

### Server-side Export
For heavy processing, consider server-side export:
- Send frames to backend API
- Process with FFmpeg/ImageMagick
- Return download link

## Performance Tips

1. **GIF Export**: Use workers (built into gif.js)
2. **Video Export**: Use lower FPS for faster encoding
3. **ZIP Export**: Compress at lower quality for faster archiving
4. **All Formats**: Show progress indicator during export

## Bundle Size Impact

| Library | Size (minified) | Size (gzipped) |
|---------|-----------------|----------------|
| gif.js  | ~25KB          | ~8KB           |
| jszip   | ~96KB          | ~28KB          |
| upng-js | ~15KB          | ~6KB           |
| **Total** | **~136KB** | **~42KB**     |

## Lazy Loading (Recommended)

To reduce initial bundle size, lazy load these libraries:

```typescript
async exportAsGIF(...) {
  const { default: GIF } = await import('gif.js')
  // Use GIF
}

async exportAsImageSequence(...) {
  const { default: JSZip } = await import('jszip')
  // Use JSZip
}
```

This loads libraries only when needed!

## Complete Implementation Example

See the `exportService.enhanced.ts` example file for a complete implementation with all libraries integrated.

## Resources

- [gif.js Documentation](https://github.com/jnordberg/gif.js)
- [JSZip Documentation](https://stuk.github.io/jszip/)
- [UPNG.js Documentation](https://github.com/photopea/UPNG.js)
- [MediaRecorder API](https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder)
