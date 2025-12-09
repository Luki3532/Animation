import type { FrameDrawing, ToolSettings, CanvasSize } from './drawing'

/**
 * Project file format version
 */
export const PROJECT_FORMAT_VERSION = '1.2.0'

/**
 * File extension for conservative project files (reference video by path)
 */
export const PROJECT_FILE_EXTENSION = '.lucas'

/**
 * File extension for full project files (video embedded)
 */
export const FULL_PROJECT_FILE_EXTENSION = '.fluf'

/**
 * Project format type
 */
export type ProjectFormatType = 'lucas' | 'fluf'

/**
 * Auto-save interval in milliseconds (30 seconds)
 */
export const AUTO_SAVE_INTERVAL = 30000

/**
 * Manifest stored in the project file
 */
export interface ProjectManifest {
  version: string
  app: string
  created: string
  modified: string
  name: string
}

/**
 * Video source reference (path to reconnect on load)
 */
export interface VideoSourceReference {
  /** Original filename of the video */
  filename: string
  /** Full file path (if available from File System Access API) */
  fullPath?: string
  /** File size in bytes for validation */
  fileSize: number
  /** Duration in seconds for validation */
  duration: number
  /** MIME type of the video */
  mimeType?: string
}

/**
 * Video reference settings (excludes actual file for security)
 */
export interface VideoSettings {
  fps: number
  frameCount: number
  width: number
  height: number
  cropTop: number
  cropRight: number
  cropBottom: number
  cropLeft: number
  isEmptyProject: boolean
  /** Video source reference for reconnection */
  videoSource?: VideoSourceReference
}

/**
 * Auto-save status
 */
export type AutoSaveStatus = 'idle' | 'saving' | 'saved' | 'error' | 'no-handle'

/**
 * Drawing state to serialize
 */
export interface DrawingSettings {
  canvasSize: CanvasSize
  toolSettings: ToolSettings
}

/**
 * Complete project data
 */
export interface ProjectData {
  manifest: ProjectManifest
  video: VideoSettings
  drawing: DrawingSettings
  currentFrame: number
}

/**
 * A checkpoint snapshot
 */
export interface ProjectCheckpoint {
  id: string
  timestamp: string
  name: string
  // Frames are stored separately in the ZIP
  frameIndices: number[]
}

/**
 * Checkpoint with full frame data (for in-memory use)
 */
export interface ProjectCheckpointFull extends ProjectCheckpoint {
  frames: Map<number, FrameDrawing>
}

/**
 * Serialized frame for JSON storage
 */
export interface SerializedFrame {
  frameIndex: number
  fabricJSON: string
  // thumbnail stored as separate PNG file
}

/**
 * Project file structure (conceptual)
 * 
 * project.lucas (ZIP archive)
 * ├── manifest.json        # ProjectManifest
 * ├── project.json         # ProjectData (without manifest)
 * ├── frames/
 * │   ├── 0.json          # SerializedFrame (fabricJSON)
 * │   ├── 0.png           # thumbnail image
 * │   ├── 5.json
 * │   ├── 5.png
 * │   └── ...
 * └── checkpoints/
 *     ├── index.json      # Array of ProjectCheckpoint (metadata only)
 *     ├── cp_abc123/
 *     │   ├── 0.json
 *     │   ├── 0.png
 *     │   └── ...
 *     ├── cp_def456/
 *     │   └── ...
 *     └── ...
 */
