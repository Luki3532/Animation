import JSZip from 'jszip'
import type { FrameDrawing } from '../types/drawing'
import type {
  ProjectManifest,
  ProjectData,
  ProjectCheckpoint,
  ProjectCheckpointFull,
  VideoSettings,
  DrawingSettings,
  SerializedFrame
} from '../types/project'
import { PROJECT_FORMAT_VERSION } from '../types/project'

/**
 * Service for saving and loading .lucas project files
 */
export class ProjectService {
  /**
   * Generate a unique checkpoint ID
   */
  static generateCheckpointId(): string {
    return `cp_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`
  }

  /**
   * Format timestamp for checkpoint name
   */
  static formatCheckpointName(date: Date = new Date()): string {
    const hours = date.getHours().toString().padStart(2, '0')
    const minutes = date.getMinutes().toString().padStart(2, '0')
    const seconds = date.getSeconds().toString().padStart(2, '0')
    return `Checkpoint ${hours}:${minutes}:${seconds}`
  }

  /**
   * Convert base64 data URL to Blob
   */
  private static dataURLtoBlob(dataURL: string): Blob {
    const parts = dataURL.split(',')
    const mime = parts[0].match(/:(.*?);/)?.[1] || 'image/png'
    const bstr = atob(parts[1])
    const n = bstr.length
    const u8arr = new Uint8Array(n)
    for (let i = 0; i < n; i++) {
      u8arr[i] = bstr.charCodeAt(i)
    }
    return new Blob([u8arr], { type: mime })
  }

  /**
   * Convert Blob to base64 data URL
   */
  private static async blobToDataURL(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsDataURL(blob)
    })
  }

  /**
   * Save frames to a ZIP folder
   */
  private static async saveFramesToFolder(
    zip: JSZip,
    folderPath: string,
    frames: Map<number, FrameDrawing>
  ): Promise<void> {
    const folder = zip.folder(folderPath)
    if (!folder) return

    for (const [index, frame] of frames) {
      // Save fabricJSON as JSON file
      const frameData: SerializedFrame = {
        frameIndex: frame.frameIndex,
        fabricJSON: frame.fabricJSON
      }
      folder.file(`${index}.json`, JSON.stringify(frameData, null, 2))

      // Save thumbnail as PNG
      if (frame.thumbnail) {
        const blob = this.dataURLtoBlob(frame.thumbnail)
        folder.file(`${index}.png`, blob)
      }
    }
  }

  /**
   * Load frames from a ZIP folder
   */
  private static async loadFramesFromFolder(
    zip: JSZip,
    folderPath: string
  ): Promise<Map<number, FrameDrawing>> {
    const frames = new Map<number, FrameDrawing>()
    const folder = zip.folder(folderPath)
    if (!folder) return frames

    // Find all JSON files in the folder
    const jsonFiles: string[] = []
    folder.forEach((relativePath, _file) => {
      if (relativePath.endsWith('.json') && !relativePath.includes('/')) {
        jsonFiles.push(relativePath)
      }
    })

    for (const jsonFile of jsonFiles) {
      const frameIndex = parseInt(jsonFile.replace('.json', ''), 10)
      if (isNaN(frameIndex)) continue

      try {
        // Load JSON data
        const jsonContent = await folder.file(jsonFile)?.async('string')
        if (!jsonContent) continue
        
        const frameData: SerializedFrame = JSON.parse(jsonContent)

        // Load thumbnail PNG
        let thumbnail = ''
        const pngFile = folder.file(`${frameIndex}.png`)
        if (pngFile) {
          const pngBlob = await pngFile.async('blob')
          thumbnail = await this.blobToDataURL(pngBlob)
        }

        frames.set(frameIndex, {
          frameIndex: frameData.frameIndex,
          fabricJSON: frameData.fabricJSON,
          thumbnail
        })
      } catch (error) {
        console.error(`Failed to load frame ${frameIndex}:`, error)
      }
    }

    return frames
  }

  /**
   * Save project to a .lucas file
   */
  static async saveProject(
    projectName: string,
    videoSettings: VideoSettings,
    drawingSettings: DrawingSettings,
    currentFrame: number,
    frames: Map<number, FrameDrawing>,
    checkpoints: ProjectCheckpointFull[]
  ): Promise<Blob> {
    const zip = new JSZip()
    const now = new Date().toISOString()

    // Create manifest
    const manifest: ProjectManifest = {
      version: PROJECT_FORMAT_VERSION,
      app: 'FrameForge',
      created: now,
      modified: now,
      name: projectName
    }
    zip.file('manifest.json', JSON.stringify(manifest, null, 2))

    // Create project data (without manifest, stored separately)
    const projectData: Omit<ProjectData, 'manifest'> = {
      video: videoSettings,
      drawing: drawingSettings,
      currentFrame
    }
    zip.file('project.json', JSON.stringify(projectData, null, 2))

    // Save current frames
    await this.saveFramesToFolder(zip, 'frames', frames)

    // Save checkpoints
    const checkpointsFolder = zip.folder('checkpoints')
    if (checkpointsFolder) {
      // Save checkpoint index (metadata only)
      const checkpointIndex: ProjectCheckpoint[] = checkpoints.map(cp => ({
        id: cp.id,
        timestamp: cp.timestamp,
        name: cp.name,
        frameIndices: cp.frameIndices
      }))
      checkpointsFolder.file('index.json', JSON.stringify(checkpointIndex, null, 2))

      // Save each checkpoint's frames
      for (const checkpoint of checkpoints) {
        await this.saveFramesToFolder(zip, `checkpoints/${checkpoint.id}`, checkpoint.frames)
      }
    }

    // Generate ZIP blob
    return await zip.generateAsync({
      type: 'blob',
      compression: 'DEFLATE',
      compressionOptions: { level: 6 }
    })
  }

  /**
   * Load project from a .lucas file
   */
  static async loadProject(file: File): Promise<{
    manifest: ProjectManifest
    projectData: Omit<ProjectData, 'manifest'>
    frames: Map<number, FrameDrawing>
    checkpoints: ProjectCheckpointFull[]
  }> {
    const zip = await JSZip.loadAsync(file)

    // Load manifest
    const manifestContent = await zip.file('manifest.json')?.async('string')
    if (!manifestContent) {
      throw new Error('Invalid project file: missing manifest.json')
    }
    const manifest: ProjectManifest = JSON.parse(manifestContent)

    // Validate version
    if (!manifest.version) {
      throw new Error('Invalid project file: missing version')
    }

    // Load project data
    const projectContent = await zip.file('project.json')?.async('string')
    if (!projectContent) {
      throw new Error('Invalid project file: missing project.json')
    }
    const projectData: Omit<ProjectData, 'manifest'> = JSON.parse(projectContent)

    // Load frames
    const frames = await this.loadFramesFromFolder(zip, 'frames')

    // Load checkpoints
    const checkpoints: ProjectCheckpointFull[] = []
    const checkpointsFolder = zip.folder('checkpoints')
    
    if (checkpointsFolder) {
      const indexContent = await checkpointsFolder.file('index.json')?.async('string')
      if (indexContent) {
        const checkpointIndex: ProjectCheckpoint[] = JSON.parse(indexContent)
        
        for (const cpMeta of checkpointIndex) {
          const cpFrames = await this.loadFramesFromFolder(zip, `checkpoints/${cpMeta.id}`)
          checkpoints.push({
            ...cpMeta,
            frames: cpFrames
          })
        }
      }
    }

    return { manifest, projectData, frames, checkpoints }
  }

  /**
   * Download a blob as a file
   */
  static downloadBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    link.click()
    URL.revokeObjectURL(url)
  }

  /**
   * Open file picker and load project
   */
  static async openFilePicker(): Promise<File | null> {
    return new Promise((resolve) => {
      const input = document.createElement('input')
      input.type = 'file'
      input.accept = '.lucas'
      input.onchange = () => {
        const file = input.files?.[0] || null
        resolve(file)
      }
      input.oncancel = () => resolve(null)
      input.click()
    })
  }
}
