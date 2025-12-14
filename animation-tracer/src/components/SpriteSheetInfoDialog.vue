<template>
  <Teleport to="body">
    <div v-if="isOpen" class="dialog-overlay" @click="close">
      <div class="dialog" @click.stop>
        <div class="dialog-header">
          <h2>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/><path d="M3 15h18"/><path d="M9 3v18"/><path d="M15 3v18"/></svg>
            Sprite Sheet Configuration
          </h2>
          <button class="close-btn" @click="close">×</button>
        </div>

        <div class="dialog-content">
          <!-- Quick Stats -->
          <div class="info-section stats-section">
            <h3>📊 Sprite Sheet Statistics</h3>
            <div class="stats-grid">
              <div class="stat-item">
                <span class="stat-label">Sheet Size</span>
                <span class="stat-value">{{ metadata.sheetWidth }} × {{ metadata.sheetHeight }} px</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">Frame Size</span>
                <span class="stat-value">{{ metadata.frameWidth }} × {{ metadata.frameHeight }} px</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">Total Frames</span>
                <span class="stat-value">{{ metadata.frames.length }}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">Grid Layout</span>
                <span class="stat-value">{{ cols }} columns × {{ rows }} rows</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">Padding</span>
                <span class="stat-value">{{ padding }} px</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">Frame Order</span>
                <span class="stat-value">Left→Right, Top→Bottom</span>
              </div>
            </div>
          </div>

          <!-- Universal Configuration -->
          <div class="info-section">
            <h3>⚙️ Universal Configuration Values</h3>
            <p class="section-desc">Copy these values into your game engine or animation software:</p>
            <div class="config-table">
              <div class="config-row">
                <span class="config-key">Columns (H Frames)</span>
                <code class="config-value copyable" @click="copyToClipboard(cols.toString())">{{ cols }}</code>
              </div>
              <div class="config-row">
                <span class="config-key">Rows (V Frames)</span>
                <code class="config-value copyable" @click="copyToClipboard(rows.toString())">{{ rows }}</code>
              </div>
              <div class="config-row">
                <span class="config-key">Frame Width</span>
                <code class="config-value copyable" @click="copyToClipboard(metadata.frameWidth.toString())">{{ metadata.frameWidth }}</code>
              </div>
              <div class="config-row">
                <span class="config-key">Frame Height</span>
                <code class="config-value copyable" @click="copyToClipboard(metadata.frameHeight.toString())">{{ metadata.frameHeight }}</code>
              </div>
              <div class="config-row">
                <span class="config-key">Margin/Padding</span>
                <code class="config-value copyable" @click="copyToClipboard(padding.toString())">{{ padding }}</code>
              </div>
              <div class="config-row">
                <span class="config-key">Spacing (between frames)</span>
                <code class="config-value copyable" @click="copyToClipboard(padding.toString())">{{ padding }}</code>
              </div>
              <div class="config-row">
                <span class="config-key">X Offset (first frame)</span>
                <code class="config-value copyable" @click="copyToClipboard('0')">0</code>
              </div>
              <div class="config-row">
                <span class="config-key">Y Offset (first frame)</span>
                <code class="config-value copyable" @click="copyToClipboard('0')">0</code>
              </div>
              <div class="config-row">
                <span class="config-key">Total Frame Count</span>
                <code class="config-value copyable" @click="copyToClipboard(metadata.frames.length.toString())">{{ metadata.frames.length }}</code>
              </div>
            </div>
            <p class="click-hint">💡 Click any value to copy to clipboard</p>
          </div>

          <!-- Engine-Specific Tabs -->
          <div class="info-section engines-section">
            <h3>🎮 Engine-Specific Setup</h3>
            <div class="engine-tabs">
              <button 
                v-for="engine in engines" 
                :key="engine.id"
                :class="{ active: activeEngine === engine.id }"
                @click="activeEngine = engine.id"
              >
                {{ engine.name }}
              </button>
            </div>

            <!-- Unity -->
            <div v-if="activeEngine === 'unity'" class="engine-content">
              <h4>Unity (2D Sprite)</h4>
              <ol class="setup-steps">
                <li>Import your sprite sheet PNG into Unity (drag into Assets folder)</li>
                <li>Select the sprite in the Project window</li>
                <li>In the Inspector, set these properties:
                  <ul>
                    <li><strong>Texture Type:</strong> Sprite (2D and UI)</li>
                    <li><strong>Sprite Mode:</strong> Multiple</li>
                    <li><strong>Pixels Per Unit:</strong> {{ Math.min(metadata.frameWidth, metadata.frameHeight) }} (or your preferred scale)</li>
                    <li><strong>Filter Mode:</strong> Point (for pixel art) or Bilinear (for smooth art)</li>
                  </ul>
                </li>
                <li>Click <strong>"Sprite Editor"</strong> button</li>
                <li>In Sprite Editor, click <strong>"Slice"</strong> dropdown</li>
                <li>Set slice settings:
                  <ul>
                    <li><strong>Type:</strong> Grid By Cell Size</li>
                    <li><strong>Pixel Size X:</strong> <code>{{ metadata.frameWidth }}</code></li>
                    <li><strong>Pixel Size Y:</strong> <code>{{ metadata.frameHeight }}</code></li>
                    <li><strong>Offset X:</strong> <code>0</code></li>
                    <li><strong>Offset Y:</strong> <code>0</code></li>
                    <li><strong>Padding X:</strong> <code>{{ padding }}</code></li>
                    <li><strong>Padding Y:</strong> <code>{{ padding }}</code></li>
                  </ul>
                </li>
                <li>Click <strong>"Slice"</strong> then <strong>"Apply"</strong></li>
                <li>Create Animation: Window → Animation → Animation</li>
                <li>Drag all sprite slices into the Animation timeline</li>
              </ol>
              <div class="code-block">
                <div class="code-header">Unity C# Animation Script</div>
                <pre><code>// Attach to your SpriteRenderer GameObject
public class SpriteAnimator : MonoBehaviour
{
    public Sprite[] frames;
    public float fps = {{ suggestedFps }};
    private SpriteRenderer sr;
    private int currentFrame;
    private float timer;

    void Start() {
        sr = GetComponent&lt;SpriteRenderer&gt;();
    }

    void Update() {
        timer += Time.deltaTime;
        if (timer >= 1f / fps) {
            timer = 0;
            currentFrame = (currentFrame + 1) % frames.Length;
            sr.sprite = frames[currentFrame];
        }
    }
}</code></pre>
              </div>
            </div>

            <!-- Godot -->
            <div v-if="activeEngine === 'godot'" class="engine-content">
              <h4>Godot 4.x (AnimatedSprite2D)</h4>
              <ol class="setup-steps">
                <li>Import your sprite sheet PNG (drag into FileSystem)</li>
                <li>Create a new <strong>AnimatedSprite2D</strong> node</li>
                <li>In Inspector, click <strong>Sprite Frames → New SpriteFrames</strong></li>
                <li>Click the SpriteFrames to open the Animation panel</li>
                <li>Click the grid icon <strong>"Add frames from Sprite Sheet"</strong></li>
                <li>Select your sprite sheet image</li>
                <li>Configure the grid:
                  <ul>
                    <li><strong>Horizontal:</strong> <code>{{ cols }}</code></li>
                    <li><strong>Vertical:</strong> <code>{{ rows }}</code></li>
                  </ul>
                </li>
                <li>Select all frames (click first, Shift+click last) and click "Add Frames"</li>
                <li>Set animation FPS in the Animation panel (default: {{ suggestedFps }})</li>
              </ol>
              <div class="code-block">
                <div class="code-header">Godot GDScript</div>
                <pre><code># For Sprite2D with manual animation
extends Sprite2D

@export var hframes: int = {{ cols }}
@export var vframes: int = {{ rows }}
@export var fps: float = {{ suggestedFps }}

var current_frame: int = 0
var timer: float = 0.0
var total_frames: int = {{ metadata.frames.length }}

func _ready():
    self.hframes = hframes
    self.vframes = vframes

func _process(delta):
    timer += delta
    if timer >= 1.0 / fps:
        timer = 0.0
        current_frame = (current_frame + 1) % total_frames
        self.frame = current_frame</code></pre>
              </div>
              <div class="note-box">
                <strong>💡 Godot Tip:</strong> Set <code>Texture → Filter</code> to "Nearest" for pixel art, or "Linear" for smooth scaling.
              </div>
            </div>

            <!-- GameMaker -->
            <div v-if="activeEngine === 'gamemaker'" class="engine-content">
              <h4>GameMaker Studio 2</h4>
              <ol class="setup-steps">
                <li>Right-click in Asset Browser → <strong>Create → Sprite</strong></li>
                <li>Click <strong>"Import Strip Image"</strong> (or Edit Image → Import Strip)</li>
                <li>Select your sprite sheet PNG</li>
                <li>Configure import settings:
                  <ul>
                    <li><strong>Number of frames:</strong> <code>{{ metadata.frames.length }}</code></li>
                    <li><strong>Frames per row:</strong> <code>{{ cols }}</code></li>
                    <li><strong>Frame width:</strong> <code>{{ metadata.frameWidth }}</code></li>
                    <li><strong>Frame height:</strong> <code>{{ metadata.frameHeight }}</code></li>
                    <li><strong>Horizontal cell offset:</strong> <code>0</code></li>
                    <li><strong>Vertical cell offset:</strong> <code>0</code></li>
                    <li><strong>Horizontal pixel offset:</strong> <code>0</code></li>
                    <li><strong>Vertical pixel offset:</strong> <code>0</code></li>
                    <li><strong>Horizontal separation:</strong> <code>{{ padding }}</code></li>
                    <li><strong>Vertical separation:</strong> <code>{{ padding }}</code></li>
                  </ul>
                </li>
                <li>Click <strong>"Convert"</strong></li>
                <li>Set origin point (usually center for characters)</li>
                <li>Adjust animation speed: <code>image_speed</code> or FPS in sprite editor</li>
              </ol>
              <div class="code-block">
                <div class="code-header">GameMaker GML</div>
                <pre><code>// In Create event
image_speed = {{ suggestedFps / 60 }}; // At 60 FPS room speed
// Or use: image_speed = 1; and set sprite FPS to {{ suggestedFps }}

// Manual animation control
image_index = 0; // Start frame
image_number; // Total frames ({{ metadata.frames.length }})

// Loop animation manually
if (image_index >= image_number - 1) {
    image_index = 0;
}</code></pre>
              </div>
            </div>

            <!-- Phaser -->
            <div v-if="activeEngine === 'phaser'" class="engine-content">
              <h4>Phaser 3</h4>
              <ol class="setup-steps">
                <li>Load the sprite sheet in your preload function</li>
                <li>Create the animation in your create function</li>
                <li>Play the animation on your sprite</li>
              </ol>
              <div class="code-block">
                <div class="code-header">Phaser 3 JavaScript</div>
                <pre><code>// In preload()
this.load.spritesheet('animation', 'path/to/spritesheet.png', {
    frameWidth: {{ metadata.frameWidth }},
    frameHeight: {{ metadata.frameHeight }},
    margin: 0,
    spacing: {{ padding }},
    startFrame: 0,
    endFrame: {{ metadata.frames.length - 1 }}
});

// In create()
this.anims.create({
    key: 'play',
    frames: this.anims.generateFrameNumbers('animation', {
        start: 0,
        end: {{ metadata.frames.length - 1 }}
    }),
    frameRate: {{ suggestedFps }},
    repeat: -1 // -1 = loop forever
});

// Create sprite and play
const sprite = this.add.sprite(400, 300, 'animation');
sprite.play('play');

// Alternative: Manual frame control
sprite.setFrame(0); // Set specific frame</code></pre>
              </div>
            </div>

            <!-- PixiJS -->
            <div v-if="activeEngine === 'pixi'" class="engine-content">
              <h4>PixiJS</h4>
              <ol class="setup-steps">
                <li>Load the sprite sheet texture</li>
                <li>Create animation frames from the texture</li>
                <li>Create AnimatedSprite and play</li>
              </ol>
              <div class="code-block">
                <div class="code-header">PixiJS JavaScript</div>
                <pre><code>import * as PIXI from 'pixi.js';

// Load texture
const texture = PIXI.Texture.from('spritesheet.png');

// Create frames array
const frames = [];
const frameWidth = {{ metadata.frameWidth }};
const frameHeight = {{ metadata.frameHeight }};
const cols = {{ cols }};
const rows = {{ rows }};
const padding = {{ padding }};
const totalFrames = {{ metadata.frames.length }};

for (let i = 0; i < totalFrames; i++) {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const x = col * (frameWidth + padding);
    const y = row * (frameHeight + padding);
    
    const rect = new PIXI.Rectangle(x, y, frameWidth, frameHeight);
    const frameTexture = new PIXI.Texture(texture.baseTexture, rect);
    frames.push(frameTexture);
}

// Create animated sprite
const animatedSprite = new PIXI.AnimatedSprite(frames);
animatedSprite.animationSpeed = {{ suggestedFps / 60 }}; // Relative to ticker
animatedSprite.play();
animatedSprite.x = 400;
animatedSprite.y = 300;
animatedSprite.anchor.set(0.5);

app.stage.addChild(animatedSprite);</code></pre>
              </div>
            </div>

            <!-- CSS -->
            <div v-if="activeEngine === 'css'" class="engine-content">
              <h4>CSS Animation (Web)</h4>
              <ol class="setup-steps">
                <li>Create an element with fixed dimensions matching frame size</li>
                <li>Set the sprite sheet as background</li>
                <li>Use CSS animation with steps() to cycle through frames</li>
              </ol>
              <div class="code-block">
                <div class="code-header">HTML</div>
                <pre><code>&lt;div class="sprite-animation"&gt;&lt;/div&gt;</code></pre>
              </div>
              <div class="code-block">
                <div class="code-header">CSS</div>
                <pre><code>.sprite-animation {
    width: {{ metadata.frameWidth }}px;
    height: {{ metadata.frameHeight }}px;
    background-image: url('spritesheet.png');
    background-repeat: no-repeat;
    animation: play {{ animationDuration }}s steps({{ metadata.frames.length }}) infinite;
}

@keyframes play {
    from { background-position: 0 0; }
    to { background-position: -{{ metadata.sheetWidth }}px 0; }
}

/* For multi-row sprite sheets, use JavaScript or multiple animations */</code></pre>
              </div>
              <div class="note-box">
                <strong>⚠️ Note:</strong> CSS sprite animation works best with single-row sprite sheets. For multi-row sheets ({{ rows }} rows), consider using JavaScript or a library.
              </div>
              <div class="code-block" v-if="rows > 1">
                <div class="code-header">JavaScript (Multi-row)</div>
                <pre><code>const sprite = document.querySelector('.sprite-animation');
const frameWidth = {{ metadata.frameWidth }};
const frameHeight = {{ metadata.frameHeight }};
const cols = {{ cols }};
const totalFrames = {{ metadata.frames.length }};
const fps = {{ suggestedFps }};
let currentFrame = 0;

setInterval(() => {
    const col = currentFrame % cols;
    const row = Math.floor(currentFrame / cols);
    const x = -col * frameWidth;
    const y = -row * frameHeight;
    sprite.style.backgroundPosition = `${x}px ${y}px`;
    currentFrame = (currentFrame + 1) % totalFrames;
}, 1000 / fps);</code></pre>
              </div>
            </div>

            <!-- Aseprite -->
            <div v-if="activeEngine === 'aseprite'" class="engine-content">
              <h4>Aseprite Import</h4>
              <ol class="setup-steps">
                <li>Open Aseprite</li>
                <li>Go to <strong>File → Import Sprite Sheet</strong></li>
                <li>Select your sprite sheet PNG</li>
                <li>Configure import:
                  <ul>
                    <li><strong>Type:</strong> Horizontal Strip or By Rows (for {{ rows }} rows)</li>
                    <li><strong>Width:</strong> <code>{{ metadata.frameWidth }}</code> px</li>
                    <li><strong>Height:</strong> <code>{{ metadata.frameHeight }}</code> px</li>
                    <li><strong>Margin X/Y:</strong> <code>0</code></li>
                    <li><strong>Spacing X/Y:</strong> <code>{{ padding }}</code></li>
                  </ul>
                </li>
                <li>Click <strong>"Import"</strong></li>
              </ol>
              <div class="note-box">
                <strong>💡 Aseprite Tip:</strong> After import, you can adjust frame durations in the timeline. The imported animation will have {{ metadata.frames.length }} frames.
              </div>
            </div>

            <!-- Construct -->
            <div v-if="activeEngine === 'construct'" class="engine-content">
              <h4>Construct 3</h4>
              <ol class="setup-steps">
                <li>Right-click in Project Bar → <strong>Import → Sprite</strong></li>
                <li>Select your sprite sheet PNG</li>
                <li>In the import dialog, configure:
                  <ul>
                    <li><strong>Import as sprite strip:</strong> ✓ (checked)</li>
                    <li><strong>Number of frames:</strong> <code>{{ metadata.frames.length }}</code></li>
                    <li><strong>Horizontal cells:</strong> <code>{{ cols }}</code></li>
                    <li><strong>Vertical cells:</strong> <code>{{ rows }}</code></li>
                  </ul>
                </li>
                <li>After import, double-click the sprite to open the Animations editor</li>
                <li>Set animation speed and loop settings</li>
              </ol>
              <div class="note-box">
                <strong>💡 Construct Tip:</strong> Use the "Speed" property in animation properties. A speed of {{ suggestedFps }} will play at {{ suggestedFps }} FPS.
              </div>
            </div>
          </div>

          <!-- Frame Data Reference -->
          <div class="info-section">
            <h3>📐 Individual Frame Coordinates</h3>
            <p class="section-desc">Exact pixel positions for each frame (useful for custom implementations):</p>
            <div class="frame-data-container">
              <table class="frame-table">
                <thead>
                  <tr>
                    <th>Frame</th>
                    <th>X</th>
                    <th>Y</th>
                    <th>Width</th>
                    <th>Height</th>
                    <th>Row</th>
                    <th>Col</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(frame, index) in metadata.frames" :key="index">
                    <td>{{ index }}</td>
                    <td>{{ frame.x }}</td>
                    <td>{{ frame.y }}</td>
                    <td>{{ frame.width }}</td>
                    <td>{{ frame.height }}</td>
                    <td>{{ Math.floor(index / cols) }}</td>
                    <td>{{ index % cols }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- JSON Export -->
          <div class="info-section">
            <h3>📋 Export Configuration Data</h3>
            <div class="export-buttons">
              <button @click="copyJsonConfig" class="export-btn">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                Copy JSON Config
              </button>
              <button @click="downloadJsonConfig" class="export-btn">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                Download JSON
              </button>
            </div>
          </div>
        </div>

        <div class="dialog-footer">
          <span class="success-message" v-if="copySuccess">✓ Copied to clipboard!</span>
          <button class="close-button" @click="close">Done</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { SpriteSheetMetadata } from '../types/export'

const props = defineProps<{
  isOpen: boolean
  metadata: SpriteSheetMetadata
  padding: number
  suggestedFps?: number
}>()

const emit = defineEmits<{
  (e: 'close'): void
}>()

const activeEngine = ref('unity')
const copySuccess = ref(false)

const engines = [
  { id: 'unity', name: 'Unity' },
  { id: 'godot', name: 'Godot' },
  { id: 'gamemaker', name: 'GameMaker' },
  { id: 'phaser', name: 'Phaser' },
  { id: 'pixi', name: 'PixiJS' },
  { id: 'css', name: 'CSS/Web' },
  { id: 'aseprite', name: 'Aseprite' },
  { id: 'construct', name: 'Construct' }
]

const cols = computed(() => {
  if (!props.metadata.frames.length) return 1
  // Calculate columns from frame positions
  const maxX = Math.max(...props.metadata.frames.map(f => f.x))
  return Math.floor(maxX / (props.metadata.frameWidth + props.padding)) + 1
})

const rows = computed(() => {
  return Math.ceil(props.metadata.frames.length / cols.value)
})

const suggestedFps = computed(() => props.suggestedFps || 12)

const animationDuration = computed(() => {
  return props.metadata.frames.length / suggestedFps.value
})

function close() {
  emit('close')
}

function copyToClipboard(text: string) {
  navigator.clipboard.writeText(text)
  showCopySuccess()
}

function showCopySuccess() {
  copySuccess.value = true
  setTimeout(() => {
    copySuccess.value = false
  }, 2000)
}

function getJsonConfig() {
  return {
    spriteSheet: {
      width: props.metadata.sheetWidth,
      height: props.metadata.sheetHeight,
      format: 'png'
    },
    frame: {
      width: props.metadata.frameWidth,
      height: props.metadata.frameHeight
    },
    grid: {
      columns: cols.value,
      rows: rows.value,
      padding: props.padding,
      spacing: props.padding,
      offsetX: 0,
      offsetY: 0
    },
    animation: {
      totalFrames: props.metadata.frames.length,
      suggestedFps: suggestedFps.value,
      duration: animationDuration.value,
      frameOrder: 'left-to-right, top-to-bottom'
    },
    frames: props.metadata.frames.map((f, i) => ({
      index: i,
      x: f.x,
      y: f.y,
      width: f.width,
      height: f.height,
      row: Math.floor(i / cols.value),
      col: i % cols.value
    }))
  }
}

function copyJsonConfig() {
  const config = getJsonConfig()
  navigator.clipboard.writeText(JSON.stringify(config, null, 2))
  showCopySuccess()
}

function downloadJsonConfig() {
  const config = getJsonConfig()
  const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'spritesheet-config.json'
  a.click()
  URL.revokeObjectURL(url)
}
</script>

<style scoped>
.dialog-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  padding: 20px;
}

.dialog {
  background: #1e1e1e;
  border-radius: 12px;
  width: 100%;
  max-width: 800px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
  border: 1px solid #333;
}

.dialog-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid #333;
  background: #252525;
  border-radius: 12px 12px 0 0;
}

.dialog-header h2 {
  margin: 0;
  font-size: 18px;
  color: #fff;
  display: flex;
  align-items: center;
  gap: 10px;
}

.dialog-header svg {
  color: var(--accent, #e85d04);
}

.close-btn {
  background: none;
  border: none;
  color: #888;
  font-size: 24px;
  cursor: pointer;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
}

.close-btn:hover {
  background: #333;
  color: #fff;
}

.dialog-content {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
}

.info-section {
  margin-bottom: 24px;
  padding-bottom: 24px;
  border-bottom: 1px solid #333;
}

.info-section:last-child {
  border-bottom: none;
  margin-bottom: 0;
}

.info-section h3 {
  margin: 0 0 12px 0;
  font-size: 14px;
  color: #fff;
  font-weight: 600;
}

.section-desc {
  margin: 0 0 12px 0;
  font-size: 12px;
  color: #888;
}

/* Stats Grid */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.stat-item {
  background: #252525;
  padding: 12px;
  border-radius: 8px;
  border: 1px solid #333;
}

.stat-label {
  display: block;
  font-size: 10px;
  color: #888;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 4px;
}

.stat-value {
  font-size: 14px;
  color: #fff;
  font-weight: 600;
}

/* Config Table */
.config-table {
  background: #252525;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid #333;
}

.config-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  border-bottom: 1px solid #333;
}

.config-row:last-child {
  border-bottom: none;
}

.config-key {
  font-size: 12px;
  color: #aaa;
}

.config-value {
  font-size: 13px;
  font-family: 'Consolas', 'Monaco', monospace;
  background: #1a1a1a;
  padding: 4px 10px;
  border-radius: 4px;
  color: var(--accent, #e85d04);
}

.config-value.copyable {
  cursor: pointer;
  transition: all 0.15s;
}

.config-value.copyable:hover {
  background: var(--accent, #e85d04);
  color: #fff;
}

.click-hint {
  margin: 10px 0 0 0;
  font-size: 11px;
  color: #666;
  text-align: center;
}

/* Engine Tabs */
.engine-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 16px;
}

.engine-tabs button {
  padding: 8px 14px;
  background: #252525;
  border: 1px solid #333;
  border-radius: 6px;
  color: #888;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.15s;
}

.engine-tabs button:hover {
  background: #333;
  color: #fff;
}

.engine-tabs button.active {
  background: var(--accent, #e85d04);
  border-color: var(--accent, #e85d04);
  color: #fff;
}

.engine-content {
  background: #252525;
  border-radius: 8px;
  padding: 16px;
  border: 1px solid #333;
}

.engine-content h4 {
  margin: 0 0 12px 0;
  font-size: 14px;
  color: #fff;
}

.setup-steps {
  margin: 0;
  padding-left: 20px;
  color: #ccc;
  font-size: 12px;
  line-height: 1.8;
}

.setup-steps li {
  margin-bottom: 6px;
}

.setup-steps ul {
  margin: 6px 0;
  padding-left: 18px;
}

.setup-steps code {
  background: #1a1a1a;
  padding: 2px 6px;
  border-radius: 3px;
  color: var(--accent, #e85d04);
  font-size: 11px;
}

.setup-steps strong {
  color: #fff;
}

/* Code Block */
.code-block {
  margin-top: 12px;
  background: #1a1a1a;
  border-radius: 6px;
  overflow: hidden;
  border: 1px solid #333;
}

.code-header {
  padding: 8px 12px;
  background: #252525;
  font-size: 11px;
  color: #888;
  border-bottom: 1px solid #333;
}

.code-block pre {
  margin: 0;
  padding: 12px;
  overflow-x: auto;
}

.code-block code {
  font-size: 11px;
  line-height: 1.6;
  color: #d4d4d4;
  font-family: 'Consolas', 'Monaco', monospace;
}

.note-box {
  margin-top: 12px;
  padding: 10px 14px;
  background: rgba(232, 93, 4, 0.1);
  border: 1px solid rgba(232, 93, 4, 0.3);
  border-radius: 6px;
  font-size: 12px;
  color: #ccc;
}

.note-box strong {
  color: var(--accent, #e85d04);
}

/* Frame Data Table */
.frame-data-container {
  max-height: 200px;
  overflow-y: auto;
  background: #252525;
  border-radius: 8px;
  border: 1px solid #333;
}

.frame-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 11px;
}

.frame-table th {
  position: sticky;
  top: 0;
  background: #333;
  padding: 8px 10px;
  text-align: left;
  color: #888;
  font-weight: 500;
  text-transform: uppercase;
  font-size: 10px;
}

.frame-table td {
  padding: 6px 10px;
  border-top: 1px solid #333;
  color: #ccc;
  font-family: monospace;
}

.frame-table tr:hover td {
  background: #2a2a2a;
}

/* Export Buttons */
.export-buttons {
  display: flex;
  gap: 10px;
}

.export-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  background: #252525;
  border: 1px solid #333;
  border-radius: 6px;
  color: #fff;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.15s;
}

.export-btn:hover {
  background: #333;
  border-color: var(--accent, #e85d04);
}

/* Dialog Footer */
.dialog-footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 20px;
  border-top: 1px solid #333;
  background: #252525;
  border-radius: 0 0 12px 12px;
}

.success-message {
  color: #4ade80;
  font-size: 12px;
}

.close-button {
  padding: 10px 24px;
  background: var(--accent, #e85d04);
  border: none;
  border-radius: 6px;
  color: #fff;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s;
}

.close-button:hover {
  filter: brightness(1.1);
}

/* Responsive */
@media (max-width: 600px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .engine-tabs {
    gap: 4px;
  }
  
  .engine-tabs button {
    padding: 6px 10px;
    font-size: 11px;
  }
}
</style>
