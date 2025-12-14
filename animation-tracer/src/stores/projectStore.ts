import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import type { FrameDrawing } from '../types/drawing'
import type { 
  ProjectCheckpoint, 
  ProjectCheckpointFull,
  AutoSaveStatus,
  VideoSourceReference,
  VideoSettings,
  DrawingSettings,
  ProjectFormatType
} from '../types/project'
import { ProjectService } from '../services/projectService'
import { 
  saveVideoFileHandle, 
  loadVideoFileHandle, 
  clearVideoFileHandle,
  saveUnsavedSession,
  loadUnsavedSession,
  clearUnsavedSession
} from '../services/persistenceService'
import { useDrawingStore } from './drawingStore'
import { useVideoStore } from './videoStore'
import { useSettingsStore } from './settingsStore'

export const useProjectStore = defineStore('project', () => {
  // Current project state
  const projectName = ref<string>('Untitled')
  const projectPath = ref<string>('') // Empty if not saved yet
  const projectFormat = ref<ProjectFormatType>('lucas') // Current format type
  const isDirty = ref<boolean>(false) // Has unsaved changes
  
  // Checkpoints
  const checkpoints = ref<ProjectCheckpointFull[]>([])
  
  // UI state
  const isSaving = ref<boolean>(false)
  const isLoading = ref<boolean>(false)
  const showCheckpointPanel = ref<boolean>(false)
  const lastToastMessage = ref<string>('')
  const showToast = ref<boolean>(false)
  
  // Auto-save state
  const autoSaveStatus = ref<AutoSaveStatus>('no-handle')
  const lastAutoSave = ref<Date | null>(null)
  const autoSaveTimer = ref<number | null>(null)
  const hasFileHandle = ref<boolean>(false)
  
  // Timer tick for updating "saved X ago" text (increments every 10 seconds)
  const saveTimerTick = ref<number>(0)
  let saveTimerInterval: number | null = null
  
  // Start the save timer tick (updates the "saved X ago" text)
  function startSaveTimerTick() {
    if (saveTimerInterval) return
    saveTimerInterval = window.setInterval(() => {
      saveTimerTick.value++
    }, 10000) // Update every 10 seconds
  }
  
  // Stop the save timer tick - currently unused but kept for future use
  // @ts-ignore - Function reserved for future use
  function stopSaveTimerTick() {
    if (saveTimerInterval) {
      clearInterval(saveTimerInterval)
      saveTimerInterval = null
    }
  }
  
  // Start the timer immediately
  startSaveTimerTick()
  
  // Video reconnection state
  const needsVideoReconnect = ref<boolean>(false)
  const videoSourceRef = ref<VideoSourceReference | null>(null)
  const showVideoReconnectDialog = ref<boolean>(false)
  
  // Video validation state (for reconnect dialog)
  const pendingVideoFile = ref<File | null>(null)
  const pendingVideoHandle = ref<unknown | null>(null)
  const videoValidationResult = ref<VideoValidationResult | null>(null)
  
  // Video validation result type
  interface VideoValidationResult {
    isExactMatch: boolean
    differences: Array<{
      field: string
      expected: string
      actual: string
      severity: 'warning' | 'error'
    }>
  }
  
  // Get settings store for autosave settings (needed for computed properties)
  const settingsStore = useSettingsStore()
  
  // Computed
  const hasCheckpoints = computed(() => checkpoints.value.length > 0)
  const checkpointCount = computed(() => checkpoints.value.length)
  const hasUnsavedChanges = computed(() => isDirty.value)
  const isProjectSaved = computed(() => projectPath.value !== '')
  const supportsAutoSave = computed(() => ProjectService.supportsFileSystemAccess())
  const currentFormat = computed(() => projectFormat.value)
  const autoSaveStatusText = computed(() => {
    // Include saveTimerTick to force re-evaluation every 10 seconds
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    // const _tick = saveTimerTick.value // Unused
    
    // DEBUG logging
    console.log('[AutoSave Debug] Status:', autoSaveStatus.value, 'hasFileHandle:', hasFileHandle.value, 'autosaveEnabled:', settingsStore.autosaveEnabled, 'supportsAPI:', ProjectService.supportsFileSystemAccess())
    
    // Check if File System Access API is supported
    if (!ProjectService.supportsFileSystemAccess()) {
      return 'Manual save only'
    }
    
    switch (autoSaveStatus.value) {
      case 'saving': return 'Saving...'
      case 'saved': return lastAutoSave.value 
        ? `Saved ${formatTimeAgo(lastAutoSave.value)}` 
        : 'Saved'
      case 'error': return 'Save failed'
      case 'idle': 
        // Show appropriate status based on autosave settings
        if (settingsStore.autosaveEnabled) {
          return hasFileHandle.value ? 'Auto-save on' : 'Auto-save ready'
        }
        return 'Auto-save off'
      case 'no-handle': 
        if (settingsStore.autosaveEnabled) {
          return 'Save to enable'
        }
        return 'Not saved'
    }
  })
  
  // Format time ago helper
  function formatTimeAgo(date: Date): string {
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000)
    if (seconds < 60) return 'just now'
    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) return `${minutes}m ago`
    const hours = Math.floor(minutes / 60)
    return `${hours}h ago`
  }
  
  // Toast helper
  function toast(message: string, duration: number = 2000) {
    lastToastMessage.value = message
    showToast.value = true
    setTimeout(() => {
      showToast.value = false
    }, duration)
  }
  
  // Validate video file against expected source reference
  // Returns validation result with differences
  function validateVideoFile(
    file: File,
    fileDuration: number,
    expected: VideoSourceReference
  ): VideoValidationResult {
    const differences: VideoValidationResult['differences'] = []
    
    // Check filename
    if (file.name !== expected.filename) {
      differences.push({
        field: 'Filename',
        expected: expected.filename,
        actual: file.name,
        severity: 'warning'
      })
    }
    
    // Check file size (exact match expected)
    if (expected.fileSize > 0 && file.size !== expected.fileSize) {
      const expectedMB = (expected.fileSize / (1024 * 1024)).toFixed(2)
      const actualMB = (file.size / (1024 * 1024)).toFixed(2)
      differences.push({
        field: 'File size',
        expected: `${expectedMB} MB`,
        actual: `${actualMB} MB`,
        severity: 'warning'
      })
    }
    
    // Check duration (0.5s tolerance)
    const durationTolerance = 0.5
    if (expected.duration > 0 && Math.abs(fileDuration - expected.duration) > durationTolerance) {
      differences.push({
        field: 'Duration',
        expected: `${expected.duration.toFixed(2)}s`,
        actual: `${fileDuration.toFixed(2)}s`,
        severity: 'error'
      })
    }
    
    // Check expected frame count if available
    if (expected.expectedFrameCount && expected.projectFps) {
      const actualFrameCount = Math.floor(fileDuration * expected.projectFps)
      const frameDiff = Math.abs(actualFrameCount - expected.expectedFrameCount)
      const frameDiffPercent = (frameDiff / expected.expectedFrameCount) * 100
      
      if (frameDiffPercent > 5) {
        differences.push({
          field: 'Frame count',
          expected: `${expected.expectedFrameCount} frames`,
          actual: `${actualFrameCount} frames (${frameDiffPercent.toFixed(1)}% different)`,
          severity: 'error'
        })
      }
    }
    
    return {
      isExactMatch: differences.length === 0,
      differences
    }
  }
  
  // Pick save location for new project
  async function pickSaveLocation(suggestedName?: string): Promise<boolean> {
    const name = suggestedName || projectName.value
    const handle = await ProjectService.pickSaveLocation(name.replace(/[^a-z0-9_\-]/gi, '_'))
    
    if (handle) {
      console.log('[AutoSave Debug] pickSaveLocation got handle, setting hasFileHandle=true')
      hasFileHandle.value = true
      projectName.value = handle.name.replace('.lucas', '')
      projectPath.value = handle.name
      autoSaveStatus.value = 'idle'
      
      // Do initial save
      await performAutoSave()
      
      // Start auto-save timer
      startAutoSaveTimer()
      
      toast(`Auto-save enabled: ${handle.name}`)
      return true
    }
    return false
  }
  
  // Start auto-save timer based on settings
  function startAutoSaveTimer() {
    stopAutoSaveTimer()
    
    // Don't start timer if autosave is disabled or instant mode (instant is handled by markDirty)
    if (!settingsStore.autosaveEnabled || settingsStore.autosaveInterval === 0) return
    
    const interval = settingsStore.autosaveInterval * 1000
    
    autoSaveTimer.value = window.setInterval(() => {
      if (isDirty.value && hasFileHandle.value && settingsStore.autosaveEnabled) {
        performAutoSave()
      }
    }, interval)
  }
  
  // Stop auto-save timer
  function stopAutoSaveTimer() {
    if (autoSaveTimer.value !== null) {
      clearInterval(autoSaveTimer.value)
      autoSaveTimer.value = null
    }
  }
  
  // Perform auto-save
  async function performAutoSave(): Promise<boolean> {
    console.log('[AutoSave Debug] performAutoSave called, hasFileHandle:', hasFileHandle.value)
    if (!hasFileHandle.value) return false
    
    const drawingStore = useDrawingStore()
    const videoStore = useVideoStore()
    
    console.log('[AutoSave Debug] Setting status to saving')
    autoSaveStatus.value = 'saving'
    
    try {
      const { video, drawing, currentFrame } = getProjectData()
      
      // Get video file for .fluf format
      const videoFile = projectFormat.value === 'fluf' ? videoStore.state.file : null
      
      const blob = await ProjectService.saveProject(
        projectName.value,
        video,
        drawing,
        currentFrame,
        drawingStore.frameDrawings,
        checkpoints.value,
        projectFormat.value,
        videoFile
      )
      
      const success = await ProjectService.saveToHandle(blob)
      
      if (success) {
        console.log('[AutoSave Debug] Save successful, setting status to saved')
        isDirty.value = false
        lastAutoSave.value = new Date()
        settingsStore.updateLastAutosaveTime()
        autoSaveStatus.value = 'saved'
        // Clear unsaved session flag since we just saved
        clearUnsavedSession()
        return true
      } else {
        autoSaveStatus.value = 'error'
        hasFileHandle.value = false
        toast('Auto-save failed - file access lost')
        return false
      }
    } catch (error) {
      console.error('Auto-save failed:', error)
      autoSaveStatus.value = 'error'
      return false
    }
  }
  
  // Mark project as dirty and trigger save consideration
  function markDirty() {
    isDirty.value = true
    // Update status to show unsaved changes
    if (autoSaveStatus.value === 'saved') {
      autoSaveStatus.value = 'idle'
    }
    // Mark session as having unsaved work for recovery
    saveUnsavedSession({
      hasUnsavedWork: true,
      timestamp: Date.now(),
      projectName: projectName.value
    })
    
    // For instant autosave (interval = 0), trigger save immediately
    if (hasFileHandle.value && settingsStore.autosaveEnabled && settingsStore.autosaveInterval === 0) {
      triggerInstantSave()
    }
  }
  
  // Debounced instant save to prevent rapid consecutive saves
  let instantSaveTimeout: number | null = null
  function triggerInstantSave() {
    if (instantSaveTimeout) {
      clearTimeout(instantSaveTimeout)
    }
    // Small debounce (300ms) to batch rapid changes like brush strokes
    instantSaveTimeout = window.setTimeout(async () => {
      instantSaveTimeout = null
      if (isDirty.value && hasFileHandle.value && settingsStore.autosaveEnabled) {
        await performAutoSave()
      }
    }, 300)
  }
  
  // Create a new checkpoint
  function createCheckpoint(customName?: string): ProjectCheckpoint {
    const drawingStore = useDrawingStore()
    
    const id = ProjectService.generateCheckpointId()
    const timestamp = new Date().toISOString()
    const name = customName || ProjectService.formatCheckpointName()
    
    // Clone current frames
    const framesCopy = new Map<number, FrameDrawing>()
    for (const [index, frame] of drawingStore.frameDrawings) {
      framesCopy.set(index, {
        frameIndex: frame.frameIndex,
        fabricJSON: frame.fabricJSON,
        thumbnail: frame.thumbnail
      })
    }
    
    const checkpoint: ProjectCheckpointFull = {
      id,
      timestamp,
      name,
      frameIndices: Array.from(framesCopy.keys()),
      frames: framesCopy
    }
    
    checkpoints.value.push(checkpoint)
    markDirty()
    
    toast(`✓ ${name}`)
    
    return checkpoint
  }
  
  // Restore a checkpoint
  function restoreCheckpoint(checkpointId: string): boolean {
    const checkpoint = checkpoints.value.find(cp => cp.id === checkpointId)
    if (!checkpoint) {
      console.error('Checkpoint not found:', checkpointId)
      return false
    }
    
    const drawingStore = useDrawingStore()
    
    // Clear current drawings and restore from checkpoint
    drawingStore.frameDrawings.clear()
    for (const [index, frame] of checkpoint.frames) {
      drawingStore.frameDrawings.set(index, {
        frameIndex: frame.frameIndex,
        fabricJSON: frame.fabricJSON,
        thumbnail: frame.thumbnail
      })
    }
    
    markDirty()
    toast(`Restored: ${checkpoint.name}`)
    
    return true
  }
  
  // Delete a checkpoint
  function deleteCheckpoint(checkpointId: string): boolean {
    const index = checkpoints.value.findIndex(cp => cp.id === checkpointId)
    if (index === -1) return false
    
    const name = checkpoints.value[index].name
    checkpoints.value.splice(index, 1)
    isDirty.value = true
    toast(`Deleted: ${name}`)
    
    return true
  }
  
  // Delete multiple checkpoints
  function deleteCheckpoints(checkpointIds: string[]): number {
    let deleted = 0
    for (const id of checkpointIds) {
      const index = checkpoints.value.findIndex(cp => cp.id === id)
      if (index !== -1) {
        checkpoints.value.splice(index, 1)
        deleted++
      }
    }
    if (deleted > 0) {
      isDirty.value = true
      toast(`Deleted ${deleted} checkpoint${deleted > 1 ? 's' : ''}`)
    }
    return deleted
  }
  
  // Delete all checkpoints
  function clearAllCheckpoints(): number {
    const count = checkpoints.value.length
    checkpoints.value = []
    if (count > 0) {
      isDirty.value = true
      toast(`Cleared all ${count} checkpoints`)
    }
    return count
  }
  
  // Get current project data for saving
  function getProjectData(): { video: VideoSettings; drawing: DrawingSettings; currentFrame: number } {
    const drawingStore = useDrawingStore()
    const videoStore = useVideoStore()
    
    // Build video source reference for video-based projects
    // ALWAYS save video metadata if this is a video project (not empty project)
    let videoSource: VideoSourceReference | undefined
    if (!videoStore.state.isEmptyProject) {
      if (videoStore.hasVideo && videoStore.state.file) {
        // Fresh video file available - build complete reference
        videoSource = {
          filename: videoStore.state.file.name,
          fileSize: videoStore.state.file.size,
          duration: videoStore.state.duration,
          mimeType: videoStore.state.file.type,
          expectedFrameCount: videoStore.state.frameCount,
          projectFps: videoStore.state.fps
        }
      } else if (videoSourceRef.value) {
        // Reconnected video or loaded from project - use stored reference with updates
        videoSource = {
          ...videoSourceRef.value,
          duration: videoStore.state.duration || videoSourceRef.value.duration,
          expectedFrameCount: videoStore.state.frameCount,
          projectFps: videoStore.state.fps
        }
      } else if (videoStore.hasVideo) {
        // Video loaded but no file/source info - create fallback reference
        // Ensures video projects always prompt for reconnect
        videoSource = {
          filename: 'Unknown video',
          fileSize: 0,
          duration: videoStore.state.duration,
          expectedFrameCount: videoStore.state.frameCount,
          projectFps: videoStore.state.fps
        }
      }
    }
    
    return {
      video: {
        fps: videoStore.state.fps,
        frameCount: videoStore.state.frameCount,
        width: videoStore.state.width,
        height: videoStore.state.height,
        cropTop: videoStore.state.cropTop,
        cropRight: videoStore.state.cropRight,
        cropBottom: videoStore.state.cropBottom,
        cropLeft: videoStore.state.cropLeft,
        isEmptyProject: videoStore.state.isEmptyProject,
        videoSource
      },
      drawing: {
        canvasSize: drawingStore.canvasSize,
        toolSettings: drawingStore.toolSettings
      },
      currentFrame: videoStore.state.currentFrame
    }
  }
  
  // Save project to file
  async function saveProject(saveAs: boolean = false): Promise<boolean> {
    const drawingStore = useDrawingStore()
    const videoStore = useVideoStore()
    
    isSaving.value = true
    
    try {
      const { video, drawing, currentFrame } = getProjectData()
      
      // Get video file for .fluf format
      const videoFile = projectFormat.value === 'fluf' ? videoStore.state.file : null
      
      const blob = await ProjectService.saveProject(
        projectName.value,
        video,
        drawing,
        currentFrame,
        drawingStore.frameDrawings,
        checkpoints.value,
        projectFormat.value,
        videoFile
      )
      
      // DIRECT APPROACH: Check ProjectService handle directly, ignore hasFileHandle ref
      const handle = ProjectService.getFileHandle()
      
      if (handle && !saveAs) {
        // We have a handle - save directly
        try {
          const writable = await handle.createWritable()
          await writable.write(blob)
          await writable.close()
          
          isDirty.value = false
          lastAutoSave.value = new Date()
          autoSaveStatus.value = 'saved'
          hasFileHandle.value = true
          toast(`Saved`)
          return true
        } catch (e) {
          // Handle failed, clear it and fall through to picker
          console.error('Direct save failed:', e)
          ProjectService.setFileHandle(null)
          hasFileHandle.value = false
        }
      }
      
      // No handle or saveAs - pick new location
      if (!ProjectService.supportsFileSystemAccess()) {
        // Fallback download
        const safeFilename = projectName.value.replace(/[^a-z0-9_\-]/gi, '_')
        const extension = projectFormat.value === 'fluf' ? '.fluf' : '.lucas'
        ProjectService.downloadBlob(blob, `${safeFilename}${extension}`)
        isDirty.value = false
        toast(`Downloaded: ${safeFilename}${extension}`)
        return true
      }
      
      // Pick save location
      const safeFilename = projectName.value.replace(/[^a-z0-9_\-]/gi, '_')
      const newHandle = await ProjectService.pickSaveLocation(safeFilename, projectFormat.value)
      
      if (!newHandle) {
        // User cancelled
        return false
      }
      
      // Save to new handle
      const writable = await newHandle.createWritable()
      await writable.write(blob)
      await writable.close()
      
      // Store handle for future saves
      ProjectService.setFileHandle(newHandle)
      hasFileHandle.value = true
      
      const chosenName = newHandle.name.replace(/\.(lucas|fluf)$/i, '')
      projectName.value = chosenName
      projectPath.value = newHandle.name
      isDirty.value = false
      lastAutoSave.value = new Date()
      autoSaveStatus.value = 'saved'
      startAutoSaveTimer()
      toast(`Saved: ${newHandle.name}`)
      return true
      
    } catch (error) {
      console.error('Failed to save project:', error)
      toast('Failed to save project')
      return false
    } finally {
      isSaving.value = false
    }
  }
  
  // Load project from file
  async function loadProject(): Promise<boolean> {
    isLoading.value = true
    
    try {
      // Try to use File System Access API for handle retention
      const result = await ProjectService.openFilePickerWithHandle()
      if (!result) {
        isLoading.value = false
        return false
      }
      
      const { file, handle } = result
      
      const { manifest, projectData, frames, checkpoints: loadedCheckpoints, embeddedVideo, formatType } = 
        await ProjectService.loadProject(file)
      
      const drawingStore = useDrawingStore()
      const videoStore = useVideoStore()
      
      // Apply loaded data
      projectName.value = manifest.name
      projectPath.value = file.name
      projectFormat.value = formatType
      
      // Clear and load frames
      console.log(`[ProjectStore] Loading ${frames.size} frames into drawing store`)
      drawingStore.frameDrawings.clear()
      for (const [index, frame] of frames) {
        drawingStore.frameDrawings.set(index, frame)
        console.log(`[ProjectStore] Set frame ${index} in store`)
      }
      console.log(`[ProjectStore] Drawing store now has ${drawingStore.frameDrawings.size} frames`)
      
      // Load drawing settings
      drawingStore.canvasSize = projectData.drawing.canvasSize
      drawingStore.toolSettings = projectData.drawing.toolSettings
      
      // Handle video loading based on format type
      if (embeddedVideo) {
        // .fluf format - video is embedded, load directly
        // Set project overrides so FPS/frameCount are preserved after video loads
        videoStore.setProjectVideoOverrides(projectData.video.fps, projectData.video.frameCount)
        videoStore.loadVideo(embeddedVideo)
        needsVideoReconnect.value = false
        videoSourceRef.value = null
        toast(`Loaded: ${manifest.name} (with video)`)
      } else if (!projectData.video.isEmptyProject) {
        // .lucas format - ALWAYS require video reconnection
        // Store the expected video source reference (may be from saved data or reconstructed)
        if (projectData.video.videoSource) {
          videoSourceRef.value = projectData.video.videoSource
        } else {
          // Reconstruct reference from project data (older files may not have full reference)
          videoSourceRef.value = {
            filename: 'Original video',
            fileSize: 0,
            duration: projectData.video.frameCount / projectData.video.fps,
            expectedFrameCount: projectData.video.frameCount,
            projectFps: projectData.video.fps
          }
        }
        
        // Try to load stored video file handle from IndexedDB
        const storedHandle = await loadVideoFileHandle()
        if (storedHandle) {
          ProjectService.setVideoFileHandle(storedHandle as any)
        }
        
        // Set project overrides so FPS/frameCount are preserved when video reconnects
        videoStore.setProjectVideoOverrides(projectData.video.fps, projectData.video.frameCount)
        
        // Try auto-reconnect using stored handle
        const autoFile = await ProjectService.tryGetVideoFromHandle()
        if (autoFile && videoSourceRef.value) {
          // Check if auto-connected file matches expected (filename + fileSize must match exactly)
          const isExactMatch = autoFile.name === videoSourceRef.value.filename && 
            (videoSourceRef.value.fileSize === 0 || autoFile.size === videoSourceRef.value.fileSize)
          
          if (isExactMatch) {
            // Exact match - auto-reconnect silently
            videoStore.loadVideo(autoFile)
            needsVideoReconnect.value = false
            showVideoReconnectDialog.value = false
            toast(`Loaded: ${manifest.name} (video auto-connected)`)
          } else {
            // File doesn't match - show dialog with pre-loaded file for validation
            pendingVideoFile.value = autoFile
            pendingVideoHandle.value = storedHandle
            needsVideoReconnect.value = true
            showVideoReconnectDialog.value = true
            
            // Create empty project with saved dimensions while waiting for user confirmation
            videoStore.createEmptyProject(
              projectData.video.width || 512,
              projectData.video.height || 512,
              projectData.video.frameCount || 100,
              projectData.video.fps || 24
            )
          }
        } else {
          // No auto-reconnect available - show dialog
          needsVideoReconnect.value = true
          showVideoReconnectDialog.value = true
          pendingVideoFile.value = null
          pendingVideoHandle.value = null
          videoValidationResult.value = null
          
          // Create empty project with saved dimensions while waiting for video
          videoStore.createEmptyProject(
            projectData.video.width || 512,
            projectData.video.height || 512,
            projectData.video.frameCount || 100,
            projectData.video.fps || 24
          )
        }
      } else {
        // Empty project
        videoStore.createEmptyProject(
          projectData.video.width || 512,
          projectData.video.height || 512,
          projectData.video.frameCount || 100,
          projectData.video.fps || 24
        )
      }
      
      // Apply crop settings
      videoStore.state.cropTop = projectData.video.cropTop
      videoStore.state.cropRight = projectData.video.cropRight
      videoStore.state.cropBottom = projectData.video.cropBottom
      videoStore.state.cropLeft = projectData.video.cropLeft
      
      // Set current frame
      videoStore.state.currentFrame = projectData.currentFrame
      
      // Load checkpoints
      checkpoints.value = loadedCheckpoints
      
      isDirty.value = false
      
      // Enable auto-save if we have a file handle
      if (handle) {
        hasFileHandle.value = true
        autoSaveStatus.value = 'saved'
        startAutoSaveTimer()
      }
      
      if (!embeddedVideo) {
        toast(`Loaded: ${manifest.name}`)
      }
      
      return true
    } catch (error) {
      console.error('Failed to load project:', error)
      toast('Failed to load project: ' + (error as Error).message)
      return false
    } finally {
      isLoading.value = false
    }
  }
  
  // Reset project state (for new project)
  async function resetProject() {
    projectName.value = 'Untitled'
    projectPath.value = ''
    projectFormat.value = 'lucas'
    checkpoints.value = []
    isDirty.value = false
    hasFileHandle.value = false
    autoSaveStatus.value = 'no-handle'
    needsVideoReconnect.value = false
    videoSourceRef.value = null
    showVideoReconnectDialog.value = false
    stopAutoSaveTimer()
    ProjectService.setFileHandle(null)
    ProjectService.setVideoFileHandle(null)
    await clearVideoFileHandle()
  }
  
  // Load a video file and set up the source reference for saving
  async function loadVideoFile(file: File, handle?: unknown) {
    const videoStore = useVideoStore()
    
    // Load the video in video store
    videoStore.loadVideo(file)
    
    // Save handle to IndexedDB for persistence across browser sessions
    if (handle) {
      ProjectService.setVideoFileHandle(handle as any)
      await saveVideoFileHandle(handle)
    }
    
    // Set up the source reference so it's saved with the project
    videoSourceRef.value = {
      filename: file.name,
      fileSize: file.size,
      duration: 0, // Will be updated when video metadata loads
      mimeType: file.type
    }
    
    // Clear any pending reconnect state
    needsVideoReconnect.value = false
    showVideoReconnectDialog.value = false
  }
  
  // Browse for video to reconnect - opens file picker and validates selection
  async function browseForVideo(): Promise<boolean> {
    // Use File System Access API to get handle for future auto-reconnect
    const result = await ProjectService.openVideoFilePickerWithHandle()
    if (!result) return false
    
    const { file, handle } = result
    
    // Store pending file for validation dialog
    pendingVideoFile.value = file
    pendingVideoHandle.value = handle
    
    // Get video duration for validation
    const duration = await getVideoDuration(file)
    
    // Validate against expected source
    if (videoSourceRef.value) {
      videoValidationResult.value = validateVideoFile(file, duration, videoSourceRef.value)
    } else {
      videoValidationResult.value = { isExactMatch: true, differences: [] }
    }
    
    return true
  }
  
  // Get video duration from file
  function getVideoDuration(file: File): Promise<number> {
    return new Promise((resolve) => {
      const video = document.createElement('video')
      video.preload = 'metadata'
      
      video.onloadedmetadata = () => {
        URL.revokeObjectURL(video.src)
        resolve(video.duration)
      }
      
      video.onerror = () => {
        URL.revokeObjectURL(video.src)
        resolve(0)
      }
      
      video.src = URL.createObjectURL(file)
    })
  }
  
  // Confirm video selection and load it (called from dialog after validation)
  async function confirmVideoSelection(): Promise<boolean> {
    const videoStore = useVideoStore()
    
    if (!pendingVideoFile.value) return false
    
    // If we have saved video settings from the project, apply them as overrides
    // This ensures FPS and frame count are preserved when reconnecting
    // Use the saved project FPS and frameCount, not the current state
    if (videoSourceRef.value && videoSourceRef.value.projectFps && videoSourceRef.value.expectedFrameCount) {
      videoStore.setProjectVideoOverrides(
        videoSourceRef.value.projectFps,
        videoSourceRef.value.expectedFrameCount
      )
      console.log(`[ProjectStore] Set video overrides: fps=${videoSourceRef.value.projectFps}, frames=${videoSourceRef.value.expectedFrameCount}`)
    }
    
    // Load the video
    videoStore.loadVideo(pendingVideoFile.value)
    
    // Save handle to IndexedDB for persistence across browser sessions
    if (pendingVideoHandle.value) {
      ProjectService.setVideoFileHandle(pendingVideoHandle.value as any)
      await saveVideoFileHandle(pendingVideoHandle.value)
    }
    
    // Clear reconnect state
    needsVideoReconnect.value = false
    showVideoReconnectDialog.value = false
    
    // Update the video source reference for future saves
    videoSourceRef.value = {
      filename: pendingVideoFile.value.name,
      fileSize: pendingVideoFile.value.size,
      duration: 0, // Will be updated when video loads
      mimeType: pendingVideoFile.value.type,
      expectedFrameCount: videoStore.state.frameCount,
      projectFps: videoStore.state.fps
    }
    
    // Clear pending state
    pendingVideoFile.value = null
    pendingVideoHandle.value = null
    videoValidationResult.value = null
    
    markDirty()
    toast(`Video connected: ${videoSourceRef.value.filename}`)
    
    return true
  }
  
  // Dismiss video reconnect dialog - NOT allowed for video projects (skip disabled)
  function dismissVideoReconnect() {
    // For video projects, user MUST provide a video - no skip allowed
    // This function now only clears the validation state if user wants to pick a different file
    pendingVideoFile.value = null
    pendingVideoHandle.value = null
    videoValidationResult.value = null
  }
  
  // View drawings without video overlay (for corrupt/lost video files)
  function viewDrawingsWithoutVideo() {
    // Close dialog and let user view drawings on the empty canvas
    // The empty project was already created with saved dimensions in loadProject
    showVideoReconnectDialog.value = false
    needsVideoReconnect.value = false
    pendingVideoFile.value = null
    pendingVideoHandle.value = null
    videoValidationResult.value = null
    
    toast('Viewing drawings without video overlay')
  }
  
  // Set project format
  function setFormat(format: ProjectFormatType) {
    if (projectFormat.value !== format) {
      projectFormat.value = format
      markDirty()
      
      if (format === 'fluf') {
        toast('Format: .fluf - Video will be embedded in project file')
      } else {
        toast('Format: .lucas - Video referenced by filename')
      }
    }
  }
  
  // Toggle checkpoint panel
  function toggleCheckpointPanel() {
    showCheckpointPanel.value = !showCheckpointPanel.value
  }
  
  // Session recovery functions
  async function checkForUnsavedSession(): Promise<{ hasSession: boolean; timestamp?: number; projectName?: string }> {
    const session = await loadUnsavedSession()
    if (session && session.hasUnsavedWork) {
      return {
        hasSession: true,
        timestamp: session.timestamp,
        projectName: session.projectName
      }
    }
    return { hasSession: false }
  }
  
  async function clearUnsavedSessionFlag() {
    await clearUnsavedSession()
  }
  
  // Watch for autosave setting changes and restart timer
  function setupAutosaveWatcher() {
    watch(
      () => [settingsStore.autosaveEnabled, settingsStore.autosaveInterval],
      () => {
        if (hasFileHandle.value) {
          startAutoSaveTimer()
        }
      }
    )
  }
  
  // Call setup after store is created
  setupAutosaveWatcher()
  
  return {
    // State
    projectName,
    projectPath,
    isDirty,
    checkpoints,
    isSaving,
    isLoading,
    showCheckpointPanel,
    lastToastMessage,
    showToast,
    
    // Auto-save state
    autoSaveStatus,
    lastAutoSave,
    hasFileHandle,
    needsVideoReconnect,
    videoSourceRef,
    showVideoReconnectDialog,
    
    // Video validation state
    pendingVideoFile,
    videoValidationResult,
    
    // Computed
    hasCheckpoints,
    checkpointCount,
    hasUnsavedChanges,
    isProjectSaved,
    supportsAutoSave,
    autoSaveStatusText,
    currentFormat,
    
    // Actions
    createCheckpoint,
    restoreCheckpoint,
    deleteCheckpoint,
    deleteCheckpoints,
    clearAllCheckpoints,
    saveProject,
    loadProject,
    resetProject,
    loadVideoFile,
    markDirty,
    toggleCheckpointPanel,
    toast,
    browseForVideo,
    confirmVideoSelection,
    dismissVideoReconnect,
    viewDrawingsWithoutVideo,
    setFormat,
    
    // Auto-save actions
    pickSaveLocation,
    performAutoSave,
    startAutoSaveTimer,
    stopAutoSaveTimer,
    
    // Session recovery
    checkForUnsavedSession,
    clearUnsavedSessionFlag
  }
})
