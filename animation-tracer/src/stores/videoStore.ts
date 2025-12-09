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
    cropLeft: 0
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
    if (!lastVideoName.value) return
    saveVideoMetadata({
      lastVideoName: lastVideoName.value,
      lastVideoPath: lastVideoPath.value,
      fps: state.value.fps,
      cropTop: state.value.cropTop,
      cropRight: state.value.cropRight,
      cropBottom: state.value.cropBottom,
      cropLeft: state.value.cropLeft,
      currentFrame: state.value.currentFrame
    })
  }, 500)
  
  // Auto-save watchers
  watch(() => state.value.fps, debouncedSave)
  watch(() => state.value.cropTop, debouncedSave)
  watch(() => state.value.cropRight, debouncedSave)
  watch(() => state.value.cropBottom, debouncedSave)
  watch(() => state.value.cropLeft, debouncedSave)
  watch(() => state.value.currentFrame, debouncedSave)
  
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
    state.value.frameCount = Math.floor(state.value.duration * fps)
    // Adjust current frame if it's now out of bounds
    if (state.value.currentFrame >= state.value.frameCount) {
      state.value.currentFrame = state.value.frameCount - 1
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
      cropLeft: 0
    }
  }
  
  return {
    state,
    currentTime,
    hasVideo,
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
    notifyVideoSeeked,
    waitForVideoSeek,
    getFrameChangeVersion
  }
})
