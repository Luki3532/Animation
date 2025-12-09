import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
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
import { AUTO_SAVE_INTERVAL } from '../types/project'
import { ProjectService } from '../services/projectService'
import { useDrawingStore } from './drawingStore'
import { useVideoStore } from './videoStore'

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
  
  // Video reconnection state
  const needsVideoReconnect = ref<boolean>(false)
  const videoSourceRef = ref<VideoSourceReference | null>(null)
  const showVideoReconnectDialog = ref<boolean>(false)
  
  // Computed
  const hasCheckpoints = computed(() => checkpoints.value.length > 0)
  const checkpointCount = computed(() => checkpoints.value.length)
  const hasUnsavedChanges = computed(() => isDirty.value)
  const isProjectSaved = computed(() => projectPath.value !== '')
  const supportsAutoSave = computed(() => ProjectService.supportsFileSystemAccess())
  const currentFormat = computed(() => projectFormat.value)
  const autoSaveStatusText = computed(() => {
    switch (autoSaveStatus.value) {
      case 'saving': return 'Saving...'
      case 'saved': return lastAutoSave.value 
        ? `Saved ${formatTimeAgo(lastAutoSave.value)}` 
        : 'Saved'
      case 'error': return 'Save failed'
      case 'idle': return 'Auto-save on'
      case 'no-handle': return hasFileHandle.value ? '' : 'Not saved'
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
  
  // Pick save location for new project
  async function pickSaveLocation(suggestedName?: string): Promise<boolean> {
    const name = suggestedName || projectName.value
    const handle = await ProjectService.pickSaveLocation(name.replace(/[^a-z0-9_\-]/gi, '_'))
    
    if (handle) {
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
  
  // Start auto-save timer
  function startAutoSaveTimer() {
    stopAutoSaveTimer()
    autoSaveTimer.value = window.setInterval(() => {
      if (isDirty.value && hasFileHandle.value) {
        performAutoSave()
      }
    }, AUTO_SAVE_INTERVAL)
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
    if (!hasFileHandle.value) return false
    
    const drawingStore = useDrawingStore()
    const videoStore = useVideoStore()
    
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
        isDirty.value = false
        lastAutoSave.value = new Date()
        autoSaveStatus.value = 'saved'
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
    
    // Build video source reference if we have a video loaded
    let videoSource: VideoSourceReference | undefined
    if (videoStore.hasVideo && videoStore.state.file) {
      videoSource = {
        filename: videoStore.state.file.name,
        fileSize: videoStore.state.file.size,
        duration: videoStore.state.duration
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
      
      // If we have a file handle, save directly to it
      if (hasFileHandle.value && !saveAs) {
        const success = await ProjectService.saveToHandle(blob)
        if (success) {
          isDirty.value = false
          lastAutoSave.value = new Date()
          toast(`Saved`)
          return true
        }
        // If save to handle failed, fall through to download
        hasFileHandle.value = false
      }
      
      // No file handle or saveAs - prompt for name and download
      let filename = projectName.value
      if (saveAs || filename === 'Untitled' || !hasFileHandle.value) {
        const newName = prompt('Project name:', filename)
        if (!newName) {
          isSaving.value = false
          return false
        }
        filename = newName
        projectName.value = newName
      }
      
      const safeFilename = filename.replace(/[^a-z0-9_\-]/gi, '_')
      const extension = projectFormat.value === 'fluf' ? '.fluf' : '.lucas'
      ProjectService.downloadBlob(blob, `${safeFilename}${extension}`)
      
      projectPath.value = `${safeFilename}${extension}`
      isDirty.value = false
      
      toast(`Saved: ${filename}${extension}`)
      
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
      drawingStore.frameDrawings.clear()
      for (const [index, frame] of frames) {
        drawingStore.frameDrawings.set(index, frame)
      }
      
      // Load drawing settings
      drawingStore.canvasSize = projectData.drawing.canvasSize
      drawingStore.toolSettings = projectData.drawing.toolSettings
      
      // Handle video loading based on format type
      if (embeddedVideo) {
        // .fluf format - video is embedded, load directly
        videoStore.loadVideo(embeddedVideo)
        needsVideoReconnect.value = false
        videoSourceRef.value = null
        toast(`Loaded: ${manifest.name} (with video)`)
      } else if (projectData.video.videoSource && !projectData.video.isEmptyProject) {
        // .lucas format - need to reconnect video
        needsVideoReconnect.value = true
        videoSourceRef.value = projectData.video.videoSource
        showVideoReconnectDialog.value = true
        
        // Create empty project with saved dimensions while waiting for video
        videoStore.createEmptyProject(
          projectData.video.width || 512,
          projectData.video.height || 512,
          projectData.video.frameCount || 100,
          projectData.video.fps || 24
        )
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
  function resetProject() {
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
  }
  
  // Browse for video to reconnect
  async function browseForVideo(): Promise<boolean> {
    const videoStore = useVideoStore()
    
    const file = await ProjectService.openVideoFilePicker()
    if (!file) return false
    
    // Load the video
    videoStore.loadVideo(file)
    
    // Clear reconnect state
    needsVideoReconnect.value = false
    showVideoReconnectDialog.value = false
    
    // Update the video source reference for future saves
    videoSourceRef.value = {
      filename: file.name,
      fileSize: file.size,
      duration: 0, // Will be updated when video loads
      mimeType: file.type
    }
    
    markDirty()
    toast(`Video reconnected: ${file.name}`)
    
    return true
  }
  
  // Dismiss video reconnect dialog (user chooses to work without video)
  function dismissVideoReconnect() {
    showVideoReconnectDialog.value = false
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
    markDirty,
    toggleCheckpointPanel,
    toast,
    browseForVideo,
    dismissVideoReconnect,
    setFormat,
    
    // Auto-save actions
    pickSaveLocation,
    performAutoSave,
    startAutoSaveTimer,
    stopAutoSaveTimer
  }
})
