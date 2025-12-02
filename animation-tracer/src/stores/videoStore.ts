import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { VideoState } from '../types/video'

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
  
  // Computed
  const currentTime = computed(() => state.value.currentFrame / state.value.fps)
  const hasVideo = computed(() => state.value.url !== '')
  
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
    state.value.currentFrame = Math.max(0, Math.min(frame, state.value.frameCount - 1))
  }
  
  function nextFrame() {
    if (state.value.currentFrame < state.value.frameCount - 1) {
      state.value.currentFrame++
    }
  }
  
  function previousFrame() {
    if (state.value.currentFrame > 0) {
      state.value.currentFrame--
    }
  }
  
  function setFps(fps: number) {
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
    croppedWidth,
    croppedHeight,
    loadVideo,
    setVideoMetadata,
    setCurrentFrame,
    nextFrame,
    previousFrame,
    setFps,
    setCrop,
    resetCrop,
    clearVideo
  }
})
