# Custom Export Quick Reference

## 🚀 Quick Start

1. Click the **Custom Export** button (purple gradient)
2. Choose a preset from the dropdown, OR
3. Customize settings in the tabs
4. Click **Export**

---

## 📋 Preset Guide

| Preset | Best For | Format | FPS | Quality |
|--------|----------|--------|-----|---------|
| **Web Optimized GIF** | Websites | GIF | 12 | Medium |
| **High Quality Video** | Professional | MP4 | 30 | Ultra |
| **Small GIF** | Email, sharing | GIF | 8 | Low |
| **Twitter GIF** | Social media | GIF | 15 | Medium |
| **Discord Emote** | Chat emotes | GIF | 24 | High |
| **Sprite Sheet** | Game dev | PNG | - | Ultra |
| **Frame Sequence** | Video editing | ZIP | - | High |

---

## 🎨 Format Comparison

| Format | Type | Transparency | Animation | Quality | Size |
|--------|------|--------------|-----------|---------|------|
| **GIF** | Image | Limited | ✅ Yes | Medium | Small |
| **MP4** | Video | ❌ No | ✅ Yes | High | Medium |
| **WEBM** | Video | ❌ No | ✅ Yes | High | Small |
| **APNG** | Image | ✅ Full | ✅ Yes | High | Large |
| **PNG** | Image | ✅ Full | ❌ No | Lossless | Large |
| **JPG** | Image | ❌ No | ❌ No | Good | Small |
| **WEBP** | Image | ✅ Full | ❌ No | High | Small |
| **ZIP** | Archive | Varies | Sequence | Varies | Varies |

---

## ⚡ Settings at a Glance

### Format & Quality Tab
- **Format**: Pick output type (GIF, MP4, PNG, etc.)
- **Quality**: Low → Medium → High → Ultra
- **Compression**: Reduce file size

### Animation Tab
- **FPS**: 1-60 (higher = smoother)
- **Loop**: Repeat animation
- **Codec**: Video encoding (H.264 recommended)
- **Dithering**: Smoother GIF colors

### Frames Tab
- **All Frames**: Export everything
- **Current**: Just one frame
- **Custom**: Pick range (start/end)

### Size Tab
- **Scale**: 25% to 400%
- **Dimensions**: Custom width × height
- **Lock Aspect**: Maintain proportions

### Appearance Tab
- **Transparent**: See-through background
- **BG Color**: Solid color background
- **Metadata**: Include tech details

---

## 💡 Pro Tips

### Smaller Files
```
✓ Lower FPS (8-12)
✓ Reduce color depth (64-128)
✓ Enable compression
✓ Scale to 50-75%
✗ Disable dithering
```

### Better Quality
```
✓ Higher FPS (24-30)
✓ Ultra quality
✓ Full color depth (256)
✓ No compression
✓ 100% or larger scale
```

### Social Media
```
Twitter:  GIF, 15 FPS, <15MB
Discord:  GIF, 24 FPS, <8MB  
Instagram: MP4, 30 FPS
Reddit:    GIF/MP4, 15 FPS
```

---

## 🎯 Common Use Cases

### Export for Webpage
1. Select: **Web Optimized GIF** preset
2. Adjust scale if needed
3. Export!

### Export for Video Editor
1. Select: **Frame Sequence** preset
2. Choose PNG format
3. Extract ZIP after download

### Export Single Frame
1. Format Tab → PNG
2. Frames Tab → Current
3. Appearance Tab → Enable transparency
4. Export!

### Export Sprite Sheet for Game
1. Select: **Sprite Sheet** preset
2. Verify all frames selected
3. Size to game resolution
4. Export!

---

## ⚙️ Advanced Settings

### GIF Optimization
- **Color Depth 64**: Very small, lower quality
- **Color Depth 128**: Balanced (recommended)
- **Color Depth 256**: Best quality, larger file
- **Dithering ON**: Smoother gradients, larger file
- **Dithering OFF**: Sharper edges, smaller file

### Video Codecs
- **H.264**: Best compatibility, widely supported
- **VP9**: Better quality, modern browsers
- **VP8**: Good fallback option
- **AV1**: Cutting edge, limited support

### Metadata Formats
- **JSON**: For developers/programs
- **XML**: Standard data format
- **TXT**: Human-readable info

---

## ❓ Troubleshooting

| Problem | Solution |
|---------|----------|
| Export disabled | Draw at least one frame first |
| File too large | Lower FPS, quality, or scale |
| Choppy animation | Increase FPS to 15+ |
| Wrong colors | Increase color depth, enable dithering |
| No transparency | Use PNG/WEBP/APNG, enable transparency |

---

## 🔧 Keyboard Shortcuts

- **Esc** - Close dialog
- **Enter** - Export (when in dialog)

---

## 📦 File Size Estimates

For a 10-frame animation at 256×256px:

| Format | Settings | Approx. Size |
|--------|----------|--------------|
| Small GIF | Low, 64 colors | ~50-100 KB |
| Medium GIF | Medium, 128 colors | ~150-300 KB |
| Large GIF | High, 256 colors | ~400-800 KB |
| MP4 Video | High, H.264 | ~200-500 KB |
| PNG Sequence | Ultra quality | ~2-5 MB (ZIP) |

---

## 🌟 Best Practices

1. **Start with a preset** - Customize from there
2. **Preview before export** - Check frame range
3. **Test different settings** - Find the sweet spot
4. **Save metadata** - Document your settings
5. **Keep originals** - Can re-export anytime

---

## 📚 Learn More

- Full Guide: `CUSTOM_EXPORT_GUIDE.md`
- Technical Setup: `EXPORT_LIBRARIES_SETUP.md`
- Implementation: `IMPLEMENTATION_SUMMARY.md`

---

**Happy Exporting! 🎨✨**
