# Custom Export Feature

## Overview

The **Custom Export** feature provides a highly customizable export system for your animations, offering extensive control over output format, quality, size, and appearance.

## Accessing Custom Export

1. Navigate to the Export Panel in your animation tracer
2. Click the **"Custom Export"** button (purple gradient button)
3. The Custom Export dialog will open with tabbed settings

## Export Formats

### Animated Formats
- **GIF** - Classic animated format with wide compatibility
  - Configurable color depth (8-256 colors)
  - Dithering options for smoother gradients
  - Loop control
  
- **MP4** - High-quality video format
  - Multiple codec options (H.264, VP8, VP9, AV1)
  - Bitrate control
  - Best for high-quality exports
  
- **WEBM** - Modern web-optimized video
  - Smaller file sizes
  - Good quality-to-size ratio
  
- **APNG** - Animated PNG with transparency
  - Full transparency support
  - Higher quality than GIF

### Static Formats
- **PNG** - Lossless image format
  - Perfect for single frames
  - Full transparency support
  
- **JPG** - Compressed image format
  - Smaller file sizes
  - Best for photographs/complex images
  
- **WEBP** - Modern image format
  - Better compression than JPG
  - Supports transparency

### Sequence Format
- **ZIP** - Archive of image sequence
  - Choose frame format (PNG/JPG/WEBP)
  - Individual frames in numbered sequence
  - Perfect for importing into video editors

## Settings Tabs

### 1. Format & Quality
- **Export Format**: Choose from 8 different formats
- **Quality Presets**: 
  - Low (60% quality)
  - Medium (80% quality)
  - High (90% quality)
  - Ultra (100% quality)
- **Compression**: Enable/disable with adjustable compression level (0-100%)

### 2. Animation Settings
- **Frame Rate (FPS)**: 1-60 FPS
  - Higher FPS = smoother animation
  - Lower FPS = smaller file size
  
- **Loop Animation**: Enable/disable looping
  
- **Duration**: Set custom duration (for video formats)
  
- **Video Codec** (MP4/WEBM only):
  - H.264 - Best compatibility
  - VP8 - Good quality
  - VP9 - High quality, modern
  - AV1 - Experimental, cutting-edge
  
- **Bitrate**: Control video quality (500-50000 kbps)
  
- **GIF Settings**:
  - Dithering - Smoother color gradients
  - Color Depth - 8 to 256 colors

### 3. Frame Selection
- **All Frames**: Export every frame you've drawn
- **Current Frame**: Export only the current frame
- **Custom Range**: Specify start and end frame indices
- Visual counter shows selected frame count

### 4. Size & Scale
- **Scale Slider**: 25% to 400% (0.25x to 4x)
  - Quick way to resize output
  
- **Custom Dimensions**: Set exact width/height in pixels
  - Range: 8px to 4096px
  
- **Maintain Aspect Ratio**: Lock proportions when resizing
  
- **Anti-aliasing**: Smooth edges and curves
  
- **Smoothing**: Enable image smoothing for scaled output

### 5. Appearance
- **Transparency**: Enable transparent background
  - Works with PNG, WEBP, GIF, APNG
  
- **Background Color**: Choose solid background color
  - Color picker with hex code input
  - Only active when transparency is disabled
  
- **Include Metadata**: Export additional metadata file
  - JSON format - Machine-readable
  - XML format - Standard structured data
  - TXT format - Human-readable

## Quick Presets

Access common export configurations instantly:

1. **Web Optimized GIF**
   - Format: GIF
   - Quality: Medium
   - FPS: 12
   - Color Depth: 128
   - Compression: 70%

2. **High Quality Video**
   - Format: MP4
   - Quality: Ultra
   - FPS: 30
   - Codec: H.264
   - Bitrate: 8000 kbps

3. **Small GIF**
   - Format: GIF
   - Quality: Low
   - FPS: 8
   - Scale: 50%
   - Color Depth: 64

4. **Twitter GIF**
   - Format: GIF
   - Quality: Medium
   - FPS: 15
   - Color Depth: 256
   - Optimized for social media

5. **Discord Emote**
   - Format: GIF
   - Quality: High
   - FPS: 24
   - Perfect for Discord emotes

6. **Sprite Sheet**
   - Format: PNG
   - Quality: Ultra
   - All frames
   - Transparency enabled

7. **Frame Sequence**
   - Format: ZIP
   - Quality: High
   - PNG sequence
   - For video editing software

## Tips & Best Practices

### For Small File Sizes
- Use GIF with lower color depth (64-128)
- Reduce FPS to 8-12
- Disable dithering
- Use 50% scale
- Enable high compression

### For Maximum Quality
- Use MP4 or PNG
- Set quality to Ultra
- Use 30+ FPS (for animations)
- Increase bitrate for videos
- Disable compression

### For Web Usage
- GIF: 12-15 FPS, medium quality
- WEBP: Great balance of size/quality
- WEBM: Best for modern browsers
- Keep dimensions under 800px

### For Social Media
- **Twitter**: GIF, 15 FPS, max 15MB
- **Discord**: GIF, 24 FPS, max 8MB (emote)
- **Instagram**: MP4, 30 FPS
- **Reddit**: GIF or MP4, 15 FPS

### For Game Development
- Use PNG sprite sheets
- ZIP format for frame sequences
- Keep transparency enabled
- Export at intended game resolution

## Technical Notes

### Current Implementation Status

✅ **Fully Implemented:**
- PNG, JPG, WEBP single image export
- Complete UI with all settings
- Frame selection and range
- Size and scaling controls
- Background and transparency
- Metadata export (JSON, XML, TXT)
- Quality presets

⚠️ **Requires Additional Libraries:**
- **GIF Export**: Requires `gif.js` library
- **Video Export (MP4/WEBM)**: Requires MediaRecorder API or `FFmpeg.js`
- **APNG Export**: Requires `upng-js` or `apng-js`
- **ZIP Export**: Requires `JSZip`

### Adding Library Support

To enable full functionality, install these libraries:

```bash
npm install gif.js jszip upng-js
```

Then update the export service methods to use these libraries instead of placeholder implementations.

## Keyboard Shortcuts

- `Esc` - Close Custom Export dialog
- `Enter` - Export with current settings (when dialog is open)

## Troubleshooting

**Issue**: Export button is disabled
- **Solution**: Make sure you have at least one frame drawn

**Issue**: GIF/Video export shows "feature in development"
- **Solution**: Install required libraries (see Technical Notes)

**Issue**: Output file is too large
- **Solution**: Reduce FPS, enable compression, lower quality, or reduce scale

**Issue**: Animation looks choppy
- **Solution**: Increase FPS to 15-30

**Issue**: Colors look wrong in GIF
- **Solution**: Increase color depth to 256, enable dithering

## Examples

### Example 1: Export for Twitter
1. Click Custom Export
2. Select "Twitter GIF" preset
3. Verify frame range is "All frames"
4. Click Export

### Example 2: High-Quality Video
1. Click Custom Export
2. Go to Format tab, select MP4
3. Set Quality to Ultra
4. Go to Animation tab, set FPS to 30
5. Select H.264 codec
6. Click Export

### Example 3: Transparent PNG Sequence
1. Click Custom Export
2. Select ZIP format
3. Set image sequence format to PNG
4. Enable transparency in Appearance tab
5. Click Export

## Future Enhancements

Planned features for future releases:
- Real-time preview in export dialog
- Batch export multiple format simultaneously
- Custom watermarking
- Frame interpolation for smoother animations
- Advanced color palette optimization
- Direct upload to social media platforms
- Cloud export and sharing links

## Support

For issues or feature requests, please check the project repository or documentation.
