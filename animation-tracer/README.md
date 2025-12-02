# Animation Tracer

A web-based tool for creating hand-drawn animations by tracing over video frames. Upload a video, use drawing tools to trace each frame, and export your artwork as a sprite sheet.

## Features

- **Video Upload**: Drag & drop or select video files
- **Frame Navigation**: Use arrow keys or timeline to navigate between frames
- **Drawing Tools**:
  - Pen tool (P) - freehand drawing
  - Eraser (E) - erase strokes
  - Rectangle (R) - draw rectangles
  - Circle (C) - draw circles
  - Line (L) - draw straight lines
  - Select (V) - select and move objects
- **Color Picker**: Choose any color or use presets
- **Brush Size**: Adjustable stroke width
- **Canvas Sizes**: 32×32, 64×64, 128×128, 256×256, 512×512, or custom
- **Sprite Sheet Export**: Export all frames as a packed sprite sheet with JSON metadata
- **Frame Export**: Export individual frames as PNG

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `←` / `→` | Previous / Next frame |
| `P` | Pen tool |
| `E` | Eraser |
| `R` | Rectangle |
| `C` | Circle |
| `L` | Line |
| `V` | Select |
| `Ctrl+Z` | Undo |
| `Ctrl+Y` | Redo |

## Getting Started

### Prerequisites

- Node.js 18+ (download from https://nodejs.org/)

### Installation

```bash
# Navigate to project directory
cd animation-tracer

# Install dependencies
npm install

# Start development server
npm run dev
```

Open http://localhost:5173 in your browser.

### Build for Production

```bash
npm run build
```

The built files will be in the `dist` folder.

## Usage

1. **Upload a video**: Drag a video file onto the upload area or click to browse
2. **Set canvas size**: Choose your target sprite size (e.g., 64×64 for pixel art)
3. **Navigate frames**: Use arrow keys or the timeline slider
4. **Draw**: Select tools and trace over the video reference
5. **Toggle reference**: Show/hide the video layer as needed
6. **Export**: Click "Export Sprite Sheet" to download your animation

## Tech Stack

- Vue 3 + TypeScript
- Fabric.js for canvas drawing
- Vite for build tooling
- Pinia for state management

## Project Structure

```
animation-tracer/
├── src/
│   ├── components/
│   │   ├── VideoPlayer.vue      # Video upload and frame display
│   │   ├── DrawingCanvas.vue    # Fabric.js drawing surface
│   │   ├── ToolPalette.vue      # Drawing tools UI
│   │   ├── Timeline.vue         # Frame navigation
│   │   └── ExportPanel.vue      # Export options
│   ├── stores/
│   │   ├── drawingStore.ts      # Drawing state management
│   │   └── videoStore.ts        # Video state management
│   ├── services/
│   │   └── exportService.ts     # Sprite sheet generation
│   ├── types/
│   │   ├── drawing.ts           # Drawing types
│   │   ├── video.ts             # Video types
│   │   └── export.ts            # Export types
│   ├── styles/
│   │   └── main.css             # Global styles
│   ├── App.vue                  # Root component
│   └── main.ts                  # Entry point
├── package.json
└── vite.config.ts
```

## License

MIT
