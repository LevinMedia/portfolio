# Video Embed Feature for Selected Works

## Overview

This feature allows you to embed videos in your Selected Works content using the Milkdown editor. Videos are uploaded to Supabase storage and rendered using Video.js player with native controls.

## How to Use

### Uploading Videos

1. Navigate to the Selected Works admin page (`/admin/selected-work`)
2. Create a new work or edit an existing one
3. In the content editor, click the **"Add Video"** button above the editor
4. Select your video file from your computer
5. Wait for the upload to complete
6. The video markdown will be copied to your clipboard automatically
7. Paste the markdown (`!video[Video](url)`) where you want the video to appear in your content

### Video Markdown Syntax

Videos use a custom markdown syntax similar to images:

```markdown
!video[Alt text or description](https://your-video-url.mp4)
```

### Supported Video Formats

The following video formats are supported:
- MP4 (`.mp4`)
- WebM (`.webm`)
- OGG (`.ogg`)
- QuickTime (`.mov`)
- AVI (`.avi`)
- Matroska (`.mkv`)
- MPEG (`.mpeg`, `.mpg`)
- 3GP (`.3gp`)
- FLV (`.flv`)

### File Size

There is no file size limit for video uploads. However, keep in mind that larger videos will take longer to upload and may impact page load times for your visitors.

## Technical Implementation

### Architecture

1. **Video Upload API** (`/api/admin/upload-video/route.ts`)
   - Handles video file uploads
   - Validates video file types
   - Stores videos in Supabase storage under `selected-works-videos/` folder
   - Returns public URL for the uploaded video

2. **VideoPlayer Component** (`/components/VideoPlayer.tsx`)
   - React wrapper around Video.js
   - Provides consistent styling and behavior
   - Features:
     - Click-to-play (no autoplay)
     - Native browser controls
     - Responsive sizing (matches image width)
     - Fluid layout

3. **MilkdownEditor Updates** (`/components/MilkdownEditor.tsx`)
   - Added "Add Video" button for easy uploads
   - Video upload handling with progress feedback
   - Clipboard integration for easy markdown insertion

4. **Content Rendering** (`/components/SelectedWorkDetail.tsx`)
   - Custom parser to detect `!video[alt](url)` syntax
   - Renders videos using VideoPlayer component
   - Videos display at same width as images for consistency

### Video Player Styling

The Video.js player has been customized to match the site's design system:
- Rounded corners
- Custom play button styling
- Backdrop blur effects on control bar
- Theme-aware (adapts to light/dark mode)
- Primary color accent on progress bar

### Storage

Videos are stored in the Supabase `media` bucket under the `selected-works-videos/` folder with the following naming convention:

```
{timestamp}-{random-string}.{extension}
```

Example: `1234567890-abc123def.mp4`

## Usage Examples

### Simple Video Embed

```markdown
# My Project

Here's a demo video of the project:

!video[Project Demo](https://your-storage-url.com/video.mp4)

The video shows the main features...
```

### Multiple Videos

```markdown
## Feature Overview

!video[Feature 1 Demo](https://url1.mp4)

Description of feature 1...

!video[Feature 2 Demo](https://url2.mp4)

Description of feature 2...
```

## Troubleshooting

### Video Not Playing

- Check that the video URL is accessible
- Verify the video format is supported
- Check browser console for errors

### Upload Fails

- Verify Supabase credentials are configured
- Check file type is supported
- Check network connection
- Review server logs for detailed error messages

### Video Doesn't Render

- Ensure you're using the correct markdown syntax: `!video[alt](url)`
- Check that the URL is complete and valid
- Verify Video.js is loaded (check browser console)

## Future Enhancements

Potential improvements for future versions:

- Drag-and-drop video upload
- Video thumbnail generation
- Progress bar during upload
- Video compression/optimization
- Poster image selection
- Multiple video format output for browser compatibility
- Video metadata editor (title, description)
- Video playlist support

## Notes

- Videos play inline with native browser controls
- No autoplay - users must click to play
- Videos are responsive and maintain aspect ratio
- Same width as images for visual consistency
- Lazy loading support for better performance

