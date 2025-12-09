<template>
  <Teleport to="body">
    <div v-if="settingsStore.shouldShowMobilePrompt()" class="dialog-overlay">
      <div class="dialog">
        <div class="dialog-header">
          <div class="mobile-icon">📱</div>
          <h2>Mobile Device Detected</h2>
        </div>
        
        <div class="dialog-content">
          <p class="description">
            Would you like to switch to Mobile Mode? This provides a simplified, touch-optimized interface.
          </p>
          
          <div class="features-list">
            <div class="feature">✓ Touch-friendly controls</div>
            <div class="feature">✓ Simplified toolbar</div>
            <div class="feature">✓ Full-screen canvas</div>
          </div>
          
          <div class="actions-row">
            <button class="btn-mobile" @click="handleEnableMobile">
              Use Mobile Mode
            </button>
            <button class="btn-desktop" @click="handleStayDesktop">
              Stay on Desktop
            </button>
          </div>
          
          <p class="hint">
            You can switch modes anytime from the settings menu.
          </p>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { useSettingsStore } from '../stores/settingsStore'

const settingsStore = useSettingsStore()

function handleEnableMobile() {
  settingsStore.enableMobileMode()
}

function handleStayDesktop() {
  settingsStore.dismissMobilePrompt()
}
</script>

<style scoped>
.dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.75);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10001;
}

.dialog {
  background: #252525;
  border-radius: 12px;
  width: 340px;
  max-width: 90vw;
  border: 1px solid #333;
  overflow: hidden;
}

.dialog-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 24px 16px 16px;
  background: linear-gradient(180deg, #2a2a2a 0%, #252525 100%);
  border-bottom: 1px solid #333;
}

.mobile-icon {
  font-size: 40px;
  margin-bottom: 12px;
}

.dialog-header h2 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #eee;
}

.dialog-content {
  padding: 20px;
}

.description {
  margin: 0 0 16px;
  font-size: 13px;
  color: #999;
  line-height: 1.5;
  text-align: center;
}

.features-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 20px;
  padding: 12px;
  background: #1a1a1a;
  border-radius: 8px;
}

.feature {
  font-size: 13px;
  color: #7c7;
}

.actions-row {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 16px;
}

.btn-mobile {
  width: 100%;
  padding: 14px 20px;
  background: linear-gradient(180deg, #4a9eff 0%, #3a8eef 100%);
  border: none;
  border-radius: 8px;
  color: #fff;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;
}

.btn-mobile:hover {
  background: linear-gradient(180deg, #5aafff 0%, #4a9eff 100%);
  transform: translateY(-1px);
}

.btn-mobile:active {
  transform: translateY(0);
}

.btn-desktop {
  width: 100%;
  padding: 12px 20px;
  background: none;
  border: 1px solid #444;
  border-radius: 8px;
  color: #888;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.btn-desktop:hover {
  border-color: #555;
  color: #aaa;
}

.hint {
  margin: 0;
  font-size: 11px;
  color: #555;
  text-align: center;
}
</style>
