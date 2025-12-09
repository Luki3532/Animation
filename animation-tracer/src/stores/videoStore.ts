import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import type { VideoState } from '../types/video'
import {
  saveVideoMetadata,
  loadVideoMetadata,
  debounce
} from '../services/persistenceService'

export const useVideoStore = defineStore('video', () => {
  const state = ref<VideoState>({
    file: null,
    url: '',
    duration: 0,
    fps: 24, // Default FPS
    frameCount: 0,
    currentFrame: 0,
    isLoaded: false,
    width: 0,
    height: 0,
    cropTop: 0,
    cropRight: 0,
    cropBottom: 0,
    cropLeft: 0,
    isEmptyProject: false
  })
  
  // Frame synchronization state - ensures video seek completes before drawings load
  const isSeekingVideo = ref(false)
  const videoSeekResolvers = ref<Array<() => void>>([])
  const frameChangeVersion = ref(0) // Increment on each frame change to detect stale operations
  
  // Last video reference for reopening
  const lastVideoName = ref<string>('')
  const lastVideoPath = ref<string>('')
  const savedCurrentFrame = ref<number>(0)
  
  // Persistence state
  const isLoaded = ref(false)
  
  // Computed
  const currentTime = computed(() => state.value.currentFrame / state.value.fps)
  const hasVideo = computed(() => state.value.url !== '')
  const hasProject = computed(() => hasVideo.value || state.value.isEmptyProject)
  const hasSavedVideo = computed(() => lastVideoName.value !== '')
  
  // Cropped dimensions
  const croppedWidth = computed(() => {
    const leftPx = (state.value.cropLeft / 100) * state.value.width
    const rightPx = (state.value.cropRight / 100) * state.value.width
    return Math.max(1, state.value.width - leftPx - rightPx)
  })
  
  const croppedHeight = computed(() => {
    const topPx = (state.value.cropTop / 100) * state.value.height
    const bottomPx = (state.value.cropBottom / 100) * state.value.height
    return Math.max(1, state.value.height - topPx - bottomPx)
  })
  
  // Debounced save function
  const debouncedSave = debounce(() => {
    if (!isLoaded.value) return
    // Save for both video projects and empty projects
    if (!lastVideoName.value && !state.value.isEmptyProject) return
    saveVideoMetadata({
      lastVideoName: lastVideoName.value,
      lastVideoPath: lastVideoPath.value,
      fps: state.value.fps,
      cropTop: state.value.cropTop,
      cropRight: state.value.cropRight,
      cropBottom: state.value.cropBottom,
      cropLeft: state.value.cropLeft,
      currentFrame: state.value.currentFrame,
      // Empty project fields
      isEmptyProject: state.value.isEmptyProject,
      emptyProjectWidth: state.value.isEmptyProject ? state.value.width : undefined,
      emptyProjectHeight: state.value.isEmptyProject ? state.value.height : undefined,
      emptyProjectFrameCount: state.value.isEmptyProject ? state.value.frameCount : undefined
    })
  }, 500)
  
  // Auto-save watchers
  watch(() => state.value.fps, debouncedSave)
  watch(() => state.value.cropTop, debouncedSave)
  watch(() => state.value.cropRight, debouncedSave)
  watch(() => state.value.cropBottom, debouncedSave)
  watch(() => state.value.cropLeft, debouncedSave)
  watch(() => state.value.currentFrame, debouncedSave)
  watch(() => state.value.frameCount, debouncedSave) // Also save when frame count changes
  watch(() => state.value.isEmptyProject, debouncedSave)
  
  // Initialize from storage
  async function initFromStorage() {
    const saved = await loadVideoMetadata()
    if (saved) {
      lastVideoName.value = saved.lastVideoName
      lastVideoPath.value = saved.lastVideoPath
      savedCurrentFrame.value = saved.currentFrame
      // Store saved crop/fps to apply when video is reloaded
      state.value.fps = saved.fps
      state.value.cropTop = saved.cropTop
      state.value.cropRight = saved.cropRight
      state.value.cropBottom = saved.cropBottom
      state.value.cropLeft = saved.cropLeft
      
      // Restore empty project if it was saved
      if (saved.isEmptyProject && saved.emptyProjectWidth && saved.emptyProjectHeight && saved.emptyProjectFrameCount) {
        state.value.isEmptyProject = true
        state.value.width = saved.emptyProjectWidth
        state.value.height = saved.emptyProjectHeight
        state.value.frameCount = saved.emptyProjectFrameCount
        state.value.duration = saved.emptyProjectFrameCount / saved.fps
        state.value.currentFrame = Math.min(saved.currentFrame, saved.emptyProjectFrameCount - 1)
        state.value.isLoaded = true
      }
    }
    isLoaded.value = true
  }
  
  // Apply saved settings after video loads
  function applySavedSettings() {
    if (savedCurrentFrame.value > 0 && savedCurrentFrame.value < state.value.frameCount) {
      state.value.currentFrame = savedCurrentFrame.value
    }
  }
  
  // Actions
  function loadVideo(file: File) {
    // Revoke previous URL if exists
    if (state.value.url) {
      URL.revokeObjectURL(state.value.url)
    }
    
    state.value.file = file
    state.value.url = URL.createObjectURL(file)
    state.value.isLoaded = false
    state.value.currentFrame = 0
    
    // Save video name for reopen feature
    lastVideoName.value = file.name
    // Note: We can't get the full path due to browser security
    // but we store the name for user recognition
    lastVideoPath.value = file.name
  }
  
  function setVideoMetadata(duration: number, width: number, height: number, fps: number = 24) {
    state.value.duration = duration
    state.value.width = width
    state.value.height = height
    state.value.fps = fps
    state.value.frameCount = Math.floor(duration * fps)
    state.value.isLoaded = true
    // The video will seek to the first frame after metadata loads,
    // so mark as seeking to ensure proper synchronization
    isSeekingVideo.value = true
    frameChangeVersion.value++
  }
  
  function setCurrentFrame(frame: number) {
    const newFrame = Math.max(0, Math.min(frame, state.value.frameCount - 1))
    if (newFrame !== state.value.currentFrame) {
      frameChangeVersion.value++
      isSeekingVideo.value = true
      state.value.currentFrame = newFrame
    }
  }

  function nextFrame() {
    if (state.value.currentFrame < state.value.frameCount - 1) {
      frameChangeVersion.value++
      isSeekingVideo.value = true
      state.value.currentFrame++
    }
  }

  function previousFrame() {
    if (state.value.currentFrame > 0) {
      frameChangeVersion.value++
      isSeekingVideo.value = true
      state.value.currentFrame--
    }
  }

  // Called by VideoPlayer when video seek operation completes
  function notifyVideoSeeked() {
    isSeekingVideo.value = false
    // Resolve all pending waiters
    const resolvers = videoSeekResolvers.value
    videoSeekResolvers.value = []
    resolvers.forEach(resolve => resolve())
  }

  // Returns a promise that resolves when video seek is complete
  function waitForVideoSeek(): Promise<void> {
    if (!isSeekingVideo.value) {
      return Promise.resolve()
    }
    return new Promise(resolve => {
      videoSeekResolvers.value.push(resolve)
    })
  }

  // Get current frame change version (for stale detection)
  function getFrameChangeVersion(): number {
    return frameChangeVersion.value
  }  function setFps(fps: number) {
    state.value.fps = fps
    // For video projects, recalculate frame count from duration
    // For empty projects, keep the existing frame count
    if (!state.value.isEmptyProject) {
      state.value.frameCount = Math.floor(state.value.duration * fps)
    }
    // Recalculate duration for empty projects
    if (state.value.isEmptyProject) {
      state.value.duration = state.value.frameCount / fps
    }
    // Adjust current frame if it's now out of bounds
    if (state.value.currentFrame >= state.value.frameCount) {
      state.value.currentFrame = Math.max(0, state.value.frameCount - 1)
    }
  }
  
  function setCrop(top: number, right: number, bottom: number, left: number) {
    state.value.cropTop = Math.max(0, Math.min(49, top))
    state.value.cropRight = Math.max(0, Math.min(49, right))
    state.value.cropBottom = Math.max(0, Math.min(49, bottom))
    state.value.cropLeft = Math.max(0, Math.min(49, left))
  }
  
  function resetCrop() {
    state.value.cropTop = 0
    state.value.cropRight = 0
    state.value.cropBottom = 0
    state.value.cropLeft = 0
  }
  
  function clearVideo() {
    if (state.value.url) {
      URL.revokeObjectURL(state.value.url)
    }
    state.value = {
      file: null,
      url: '',
      duration: 0,
      fps: 24,
      frameCount: 0,
      currentFrame: 0,
      isLoaded: false,
      width: 0,
      height: 0,
      cropTop: 0,
      cropRight: 0,
      cropBottom: 0,
      cropLeft: 0,
      isEmptyProject: false
    }
  }

  // Create an empty project without video reference
  function createEmptyProject(width: number, height: number, fps: number, frameCount: number) {
    clearVideo()
    state.value.width = width
    state.value.height = height
    state.value.fps = fps
    state.value.frameCount = frameCount
    state.value.duration = frameCount / fps
    state.value.currentFrame = 0
    state.value.isLoaded = true
    state.value.isEmptyProject = true
    // For empty projects, no video seek needed
    isSeekingVideo.value = false
    frameChangeVersion.value++
  }

  // Add frames to the end of the project (empty projects only)
  function addFrames(count: number) {
    if (!state.value.isEmptyProject || count <= 0) return
    state.value.frameCount += count
    state.value.duration = state.value.frameCount / state.value.fps
  }

  // Insert frames after the current frame position (empty projects only)
  // Returns the insertion index so drawings can be shifted
  function insertFramesAfterCurrent(count: number): number {
    if (!state.value.isEmptyProject || count <= 0) return -1
    const insertAfterIndex = state.value.currentFrame
    state.value.frameCount += count
    state.value.duration = state.value.frameCount / state.value.fps
    // Move to the first newly inserted frame
    state.value.currentFrame = insertAfterIndex + 1
    return insertAfterIndex + 1 // Return where frames were inserted
  }

  // Set frame count directly (empty projects only)
  function setFrameCount(count: number) {
    if (!state.value.isEmptyProject) return
    state.value.frameCount = Math.max(1, count)
    state.value.duration = state.value.frameCount / state.value.fps
    // Adjust current frame if out of bounds
    if (state.value.currentFrame >= state.value.frameCount) {
      state.value.currentFrame = state.value.frameCount - 1
    }
  }
  
  // Set project dimensions (empty projects only)
  function setProjectDimensions(width: number, height: number) {
    if (!state.value.isEmptyProject) return
    state.value.width = Math.max(8, Math.min(4096, width))
    state.value.height = Math.max(8, Math.min(4096, height))
  }
  
  return {
    state,
    currentTime,
    hasVideo,
    hasProject,
    hasSavedVideo,
    lastVideoName,
    lastVideoPath,
    croppedWidth,
    croppedHeight,
    isLoaded,
    isSeekingVideo,
    initFromStorage,
    applySavedSettings,
    loadVideo,
    setVideoMetadata,
    setCurrentFrame,
    nextFrame,
    previousFrame,
    setFps,
    setCrop,
    resetCrop,
    clearVideo,
    createEmptyProject,
    addFrames,
    insertFramesAfterCurrent,
    setFrameCount,
    setProjectDimensions,
    notifyVideoSeeked,
    waitForVideoSeek,
    getFrameChangeVersion
  }
})
