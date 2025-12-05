import { get, set, del, clear } from 'idb-keyval'
import type { FrameDrawing, ToolSettings, CanvasSize } from '../types/drawing'

// Storage keys
const KEYS = {
  // Drawing store
  FRAME_DRAWINGS: 'frameforge_frameDrawings',
  TOOL_SETTINGS: 'frameforge_toolSettings',
  CANVAS_SIZE: 'frameforge_canvasSize',
  
  // Settings store
  SETTINGS: 'frameforge_settings',
  KEY_MAPPINGS: 'frameforge_keyMappings',
  ONION_SKIN: 'frameforge_onionSkin',
  
  // Video store
  VIDEO_METADATA: 'frameforge_videoMetadata',
  
  // Export preferences
  EXPORT_PREFS: 'frameforge_exportPrefs'
}

// Debounce helper
export function debounce<T extends (...args: unknown[]) => void>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null
  return (...args: Parameters<T>) => {
    if (timeoutId) clearTimeout(timeoutId)
    timeoutId = setTimeout(() => fn(...args), delay)
  }
}

// ============ Drawing Store Persistence ============

export interface SavedDrawingData {
  frameDrawings: Array<[number, FrameDrawing]>
  toolSettings: ToolSettings
  canvasSize: CanvasSize
}

export async function saveDrawingData(data: SavedDrawingData): Promise<void> {
  await Promise.all([
    set(KEYS.FRAME_DRAWINGS, data.frameDrawings),
    set(KEYS.TOOL_SETTINGS, data.toolSettings),
    set(KEYS.CANVAS_SIZE, data.canvasSize)
  ])
}

export async function loadDrawingData(): Promise<SavedDrawingData | null> {
  try {
    const [frameDrawings, toolSettings, canvasSize] = await Promise.all([
      get<Array<[number, FrameDrawing]>>(KEYS.FRAME_DRAWINGS),
      get<ToolSettings>(KEYS.TOOL_SETTINGS),
      get<CanvasSize>(KEYS.CANVAS_SIZE)
    ])
    
    if (!frameDrawings && !toolSettings && !canvasSize) {
      return null
    }
    
    return {
      frameDrawings: frameDrawings || [],
      toolSettings: toolSettings || { tool: 'pen', color: '#000000', brushSize: 5, opacity: 1 },
      canvasSize: canvasSize || { width: 128, height: 128, label: '128×128' }
    }
  } catch (error) {
    console.error('Failed to load drawing data:', error)
    return null
  }
}

// ============ Settings Store Persistence ============

export interface SavedSettingsData {
  artistControls: boolean
  smoothLineMode: boolean
  smoothLineStrength: number
  resizableSidebars: boolean
  leftSidebarWidth: number
  rightSidebarWidth: number
  uiScale: number
}

export interface SavedKeyMappings {
  action: string
  label: string
  key: string | null
  mouseButton: number | null
}[]

export interface SavedOnionSkinSettings {
  enabled: boolean
  framesBefore: number
  framesAfter: number
  opacityBefore: number
  opacityAfter: number
  colorBefore: string
  colorAfter: string
  keyframesOnly: boolean
}

export async function saveSettingsData(data: SavedSettingsData): Promise<void> {
  await set(KEYS.SETTINGS, data)
}

export async function loadSettingsData(): Promise<SavedSettingsData | null> {
  try {
    return await get<SavedSettingsData>(KEYS.SETTINGS) || null
  } catch (error) {
    console.error('Failed to load settings:', error)
    return null
  }
}

export async function saveKeyMappings(mappings: SavedKeyMappings): Promise<void> {
  await set(KEYS.KEY_MAPPINGS, mappings)
}

export async function loadKeyMappings(): Promise<SavedKeyMappings | null> {
  try {
    return await get<SavedKeyMappings>(KEYS.KEY_MAPPINGS) || null
  } catch (error) {
    console.error('Failed to load key mappings:', error)
    return null
  }
}

export async function saveOnionSkinSettings(settings: SavedOnionSkinSettings): Promise<void> {
  await set(KEYS.ONION_SKIN, settings)
}

export async function loadOnionSkinSettings(): Promise<SavedOnionSkinSettings | null> {
  try {
    return await get<SavedOnionSkinSettings>(KEYS.ONION_SKIN) || null
  } catch (error) {
    console.error('Failed to load onion skin settings:', error)
    return null
  }
}

// ============ Video Store Persistence ============

export interface SavedVideoMetadata {
  lastVideoName: string
  lastVideoPath: string
  fps: number
  cropTop: number
  cropRight: number
  cropBottom: number
  cropLeft: number
  currentFrame: number
}

export async function saveVideoMetadata(data: SavedVideoMetadata): Promise<void> {
  await set(KEYS.VIDEO_METADATA, data)
}

export async function loadVideoMetadata(): Promise<SavedVideoMetadata | null> {
  try {
    return await get<SavedVideoMetadata>(KEYS.VIDEO_METADATA) || null
  } catch (error) {
    console.error('Failed to load video metadata:', error)
    return null
  }
}

// ============ Export Preferences Persistence ============

export interface SavedExportPrefs {
  previewCropMode: 'autocrop' | 'true-size'
  previewBg: string
  customBgColor: string
  previewFps: number
}

export async function saveExportPrefs(data: SavedExportPrefs): Promise<void> {
  await set(KEYS.EXPORT_PREFS, data)
}

export async function loadExportPrefs(): Promise<SavedExportPrefs | null> {
  try {
    return await get<SavedExportPrefs>(KEYS.EXPORT_PREFS) || null
  } catch (error) {
    console.error('Failed to load export prefs:', error)
    return null
  }
}

// ============ Clear All Data ============

export async function clearAllSavedData(): Promise<void> {
  await clear()
}

// Clear specific store data
export async function clearDrawingData(): Promise<void> {
  await Promise.all([
    del(KEYS.FRAME_DRAWINGS),
    del(KEYS.TOOL_SETTINGS),
    del(KEYS.CANVAS_SIZE)
  ])
}

export async function clearVideoMetadata(): Promise<void> {
  await del(KEYS.VIDEO_METADATA)
}
