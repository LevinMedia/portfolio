# Video Encoding Guide for Web Playback

## The Problem
The `MEDIA_ERR_DECODE` error (code 3) occurs when:
- Video uses unsupported codecs (like H.265/HEVC, ProRes, etc.)
- Video file is corrupted
- Video uses features not supported by browsers

## Recommended Format

### Container & Codecs
- **Container**: MP4 (`.mp4`)
- **Video Codec**: H.264 (AVC) - NOT H.265/HEVC
- **Audio Codec**: AAC
- **Frame Rate**: 24, 25, 30, or 60 fps

### Quality Settings
- **Resolution**: Up to 1920x1080 (1080p)
- **Video Bitrate**: 5-8 Mbps for 1080p, 2-4 Mbps for 720p
- **Audio Bitrate**: 128-192 kbps
- **Profile**: High Profile, Level 4.0 or 4.1

## How to Re-encode Videos

### Using FFmpeg (Command Line)

```bash
ffmpeg -i input.mov -c:v libx264 -profile:v high -level:v 4.1 -pix_fmt yuv420p -crf 23 -c:a aac -b:a 128k -movflags +faststart output.mp4
```

**Explanation:**
- `-c:v libx264`: Use H.264 video codec
- `-profile:v high -level:v 4.1`: Compatibility settings
- `-pix_fmt yuv420p`: Color format for maximum compatibility
- `-crf 23`: Quality (lower = better, 18-28 is good range)
- `-c:a aac -b:a 128k`: AAC audio at 128kbps
- `-movflags +faststart`: Optimize for web streaming

### Using HandBrake (GUI Tool)

1. Download HandBrake: https://handbrake.fr/
2. Open your video file
3. Select these settings:
   - **Preset**: "Web" → "Gmail Medium 3 Minutes 720p30"
   - **Format**: MP4
   - **Video Codec**: H.264
   - **Audio Codec**: AAC
4. Click "Start Encode"

### Using Online Tools

- **CloudConvert**: https://cloudconvert.com/
  - Upload video
  - Select "Convert to MP4"
  - Click "Advanced" → Set codec to H.264
  - Download result

## Browser Support

| Codec | Chrome | Firefox | Safari | Edge |
|-------|--------|---------|--------|------|
| H.264 (MP4) | ✅ | ✅ | ✅ | ✅ |
| H.265/HEVC | ❌ | ❌ | ⚠️ | ❌ |
| VP9 (WebM) | ✅ | ✅ | ❌ | ✅ |
| ProRes | ❌ | ❌ | ❌ | ❌ |

**✅ Supported** | **⚠️ Limited** | **❌ Not Supported**

## Troubleshooting

### Video plays locally but not on web?
Your video player might support codecs that browsers don't. Re-encode to H.264.

### Video is too large?
- Lower the CRF value (higher number = smaller file)
- Reduce resolution (1080p → 720p)
- Lower bitrate

### Video looks pixelated?
- Lower the CRF value (lower number = better quality)
- Increase bitrate
- Check source video quality

### Audio out of sync?
- Ensure constant frame rate: add `-r 30` to FFmpeg command
- Use `-async 1` flag in FFmpeg

## Quick Check: Is My Video Web-Compatible?

Run this command to check your video:

```bash
ffmpeg -i yourfile.mp4
```

Look for:
- **Video codec**: Should say `h264` (NOT `hevc` or `h265`)
- **Audio codec**: Should say `aac` (NOT `pcm` or `flac`)
- **Pixel format**: Should say `yuv420p`

## Best Practices

1. **Always test videos** in the browser after uploading
2. **Keep source files** in case you need to re-encode
3. **Encode before uploading** - don't rely on automatic conversion
4. **Target 720p or 1080p** for best balance of quality and file size
5. **Use H.264** for maximum compatibility across all browsers

## Need Help?

If you continue having issues:
1. Check the browser console for specific error codes
2. Verify the video plays in VLC or another player
3. Try re-encoding with the exact FFmpeg command above
4. Consider using multiple formats (MP4 + WebM) for fallback

