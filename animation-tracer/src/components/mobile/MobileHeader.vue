<template>
  <div class="mobile-header">
    <button class="menu-btn" @click="toggleMenu">
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
    </button>
    
    <div class="title">FrameForge</div>
    
    <button class="action-btn" @click="handleQuickExport">
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
    </button>
    
    <!-- Slide-out menu -->
    <Teleport to="body">
      <div v-if="menuOpen" class="menu-overlay" @click="closeMenu">
        <div class="menu-panel" @click.stop>
          <div class="menu-header">
            <span>Menu</span>
            <button class="close-btn" @click="closeMenu">×</button>
          </div>
          
          <div class="menu-items">
                        <button class="menu-item" @click="handleImportVideo">
                          <svg class="menu-icon" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><polygon points="10 9 15 12 10 15 10 9"/></svg>
                          <span>Import Video</span>
                        </button>
            <button class="menu-item" @click="handleToggleVideo">
              <svg v-if="settingsStore.showMobileVideoOverlay" class="menu-icon" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
              <svg v-else class="menu-icon" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
              <span>{{ settingsStore.showMobileVideoOverlay ? 'Hide Video' : 'Show Video' }}</span>
            </button>
            
            <!-- Background Color -->
            <div class="menu-item bg-color-item">
              <svg class="menu-icon" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/></svg>
              <span>Background</span>
              <input 
                type="color" 
                :value="canvasBgColor"
                @input="handleBgColorChange"
                class="bg-color-input"
              />
            </div>
            
            <div class="menu-divider"></div>
            
            <button class="menu-item" @click="handleNewProject">
              <svg class="menu-icon" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/></svg>
              <span>New Project</span>
            </button>
            
            <button class="menu-item" @click="handleOpenProject">
              <svg class="menu-icon" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
              <span>Open Project</span>
            </button>
            
            <button class="menu-item" @click="handleSaveProject">
              <svg class="menu-icon" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
              <span>Save Project</span>
            </button>
            
            <div class="menu-divider"></div>
            
            <button class="menu-item" @click="handleExport">
              <svg class="menu-icon" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
              <span>Export Animation</span>
            </button>
            
            <div class="menu-divider"></div>
            
            <button class="menu-item switch-desktop" @click="handleSwitchToDesktop">
              <svg class="menu-icon" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
              <span>Switch to Desktop</span>
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useSettingsStore } from '../../stores/settingsStore'
import { useProjectStore } from '../../stores/projectStore'
import { useVideoStore } from '../../stores/videoStore'

const settingsStore = useSettingsStore()
const projectStore = useProjectStore()
const videoStore = useVideoStore()

const menuOpen = ref(false)

// Canvas background color from store
const canvasBgColor = computed(() => settingsStore.canvasBackgroundColor)

const emit = defineEmits<{
  (e: 'export'): void
  (e: 'quick-export'): void
  (e: 'new-project'): void
}>()

function handleBgColorChange(event: Event) {
  const color = (event.target as HTMLInputElement).value
  settingsStore.setCanvasBackgroundColor(color)
}

function toggleMenu() {
  menuOpen.value = !menuOpen.value
}

function closeMenu() {
  menuOpen.value = false
}

function handleToggleVideo() {
  settingsStore.toggleMobileVideoOverlay()
  closeMenu()
}

function handleNewProject() {
  projectStore.createNewProject()
  projectStore.toast('New project created')
  closeMenu()
}

function handleOpenProject() {
  projectStore.loadProject()
  projectStore.toast('Project loaded')
  closeMenu()
}

function handleSaveProject() {
  projectStore.saveProject()
  projectStore.toast('Project saved')
  closeMenu()
}

function handleExport() {
  projectStore.exportProject()
  projectStore.toast('Export started')
  closeMenu()
}

function handleImportVideo() {
  videoStore.importVideo()
  projectStore.toast('Import video dialog opened')
  closeMenu()
}

function handleQuickExport() {
  projectStore.quickExport()
}

function handleSwitchToDesktop() {
  settingsStore.disableMobileMode()
  closeMenu()
}
</script>

<style scoped>
.mobile-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 48px;
  padding: 0 8px;
  background: #1a1a1a;
  border-bottom: 1px solid #333;
  user-select: none;
  -webkit-user-select: none;
}

.menu-btn,
.action-btn {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: none;
  color: #ccc;
  font-size: 20px;
  cursor: pointer;
  border-radius: 8px;
  transition: background 0.15s ease;
}

.menu-btn:active,
.action-btn:active {
  background: #333;
}

.title {
  font-size: 16px;
  font-weight: 600;
  color: #eee;
}

/* Menu overlay */
.menu-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 10000;
  user-select: none;
  -webkit-user-select: none;
}

.menu-panel {
  position: absolute;
  top: 0;
  left: 0;
  width: 280px;
  max-width: 80vw;
  height: 100%;
  background: #1e1e1e;
  box-shadow: 4px 0 20px rgba(0, 0, 0, 0.5);
  display: flex;
  flex-direction: column;
}

.menu-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  border-bottom: 1px solid #333;
  font-size: 16px;
  font-weight: 600;
  color: #eee;
}

.close-btn {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: none;
  color: #666;
  font-size: 24px;
  cursor: pointer;
}

.close-btn:active {
  color: #999;
}

.menu-items {
  flex: 1;
  overflow-y: auto;
  padding: 8px 0;
}

.menu-item {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 14px 16px;
  background: none;
  border: none;
  color: #ccc;
  font-size: 15px;
  text-align: left;
  cursor: pointer;
  transition: background 0.15s ease;
}

.menu-item:active {
  background: #2a2a2a;
}

.menu-icon {
  width: 24px;
  height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.menu-icon svg {
  display: block;
}

.menu-divider {
  height: 1px;
  background: #333;
  margin: 8px 16px;
}

.switch-desktop {
  color: #888;
}

/* Background color picker item */
.bg-color-item {
  cursor: default;
}

.bg-color-input {
  width: 36px;
  height: 28px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  background: transparent;
  margin-left: auto;
  padding: 0;
}

.bg-color-input::-webkit-color-swatch-wrapper {
  padding: 2px;
}

.bg-color-input::-webkit-color-swatch {
  border: 2px solid #444;
  border-radius: 4px;
}
</style>
