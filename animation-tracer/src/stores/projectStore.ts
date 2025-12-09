import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { FrameDrawing } from '../types/drawing'
import type { 
  ProjectCheckpoint, 
  ProjectCheckpointFull,
  VideoSettings,
  DrawingSettings
} from '../types/project'
import { ProjectService } from '../services/projectService'
import { useDrawingStore } from './drawingStore'
import { useVideoStore } from './videoStore'

export const useProjectStore = defineStore('project', () => {
  // Current project state
  const projectName = ref<string>('Untitled')
  const projectPath = ref<string>('') // Empty if not saved yet
  const isDirty = ref<boolean>(false) // Has unsaved changes
  
  // Checkpoints
  const checkpoints = ref<ProjectCheckpointFull[]>([])
  
  // UI state
  const isSaving = ref<boolean>(false)
  const isLoading = ref<boolean>(false)
  const showCheckpointPanel = ref<boolean>(false)
  const lastToastMessage = ref<string>('')
  const showToast = ref<boolean>(false)
  
  // Computed
  const hasCheckpoints = computed(() => checkpoints.value.length > 0)
  const checkpointCount = computed(() => checkpoints.value.length)
  const hasUnsavedChanges = computed(() => isDirty.value)
  const isProjectSaved = computed(() => projectPath.value !== '')
  
  // Toast helper
  function toast(message: string, duration: number = 2000) {
    lastToastMessage.value = message
    showToast.value = true
    setTimeout(() => {
      showToast.value = false
    }, duration)
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
    isDirty.value = true
    
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
    
    isDirty.value = true
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
        isEmptyProject: videoStore.state.isEmptyProject
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
    
    isSaving.value = true
    
    try {
      // If no name set or saveAs, prompt for name
      let filename = projectName.value
      if (saveAs || filename === 'Untitled') {
        const newName = prompt('Project name:', filename)
        if (!newName) {
          isSaving.value = false
          return false
        }
        filename = newName
        projectName.value = newName
      }
      
      const { video, drawing, currentFrame } = getProjectData()
      
      const blob = await ProjectService.saveProject(
        filename,
        video,
        drawing,
        currentFrame,
        drawingStore.frameDrawings,
        checkpoints.value
      )
      
      // Download the file
      const safeFilename = filename.replace(/[^a-z0-9_\-]/gi, '_')
      ProjectService.downloadBlob(blob, `${safeFilename}.lucas`)
      
      projectPath.value = `${safeFilename}.lucas`
      isDirty.value = false
      
      toast(`Saved: ${filename}.lucas`)
      
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
      const file = await ProjectService.openFilePicker()
      if (!file) {
        isLoading.value = false
        return false
      }
      
      const { manifest, projectData, frames, checkpoints: loadedCheckpoints } = 
        await ProjectService.loadProject(file)
      
      const drawingStore = useDrawingStore()
      const videoStore = useVideoStore()
      
      // Apply loaded data
      projectName.value = manifest.name
      projectPath.value = file.name
      
      // Clear and load frames
      drawingStore.frameDrawings.clear()
      for (const [index, frame] of frames) {
        drawingStore.frameDrawings.set(index, frame)
      }
      
      // Load drawing settings
      drawingStore.canvasSize = projectData.drawing.canvasSize
      drawingStore.toolSettings = projectData.drawing.toolSettings
      
      // Load video settings (create empty project with saved dimensions)
      videoStore.createEmptyProject(
        projectData.video.width || 512,
        projectData.video.height || 512,
        projectData.video.frameCount || 100,
        projectData.video.fps || 24
      )
      
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
      
      toast(`Loaded: ${manifest.name}`)
      
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
    checkpoints.value = []
    isDirty.value = false
  }
  
  // Mark project as dirty (has changes)
  function markDirty() {
    isDirty.value = true
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
    
    // Computed
    hasCheckpoints,
    checkpointCount,
    hasUnsavedChanges,
    isProjectSaved,
    
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
    toast
  }
})
