# Testing the Video Embed Feature

## Test Checklist

### 1. Video Upload Test
- [ ] Navigate to `/admin/selected-work/new` or edit an existing work
- [ ] Click the "Add Video" button
- [ ] Select a video file (try different formats: MP4, WebM, MOV)
- [ ] Verify upload progress indicator appears
- [ ] Confirm success message with markdown copied to clipboard
- [ ] Paste the markdown into the editor

### 2. Video Markdown Test
Paste this example markdown in the editor:

```markdown
# My Sample Content

Here's a video demo:

!video[Demo Video](https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4)

More content here...
```

### 3. Video Rendering Test
- [ ] Save the content
- [ ] View the work on the public page
- [ ] Verify video renders with Video.js player
- [ ] Check that video has play controls
- [ ] Confirm video width matches images
- [ ] Test play/pause functionality
- [ ] Test volume controls
- [ ] Test fullscreen mode

### 4. Responsive Test
- [ ] Test on mobile device or resize browser
- [ ] Verify video scales properly
- [ ] Check controls are accessible on small screens

### 5. Multiple Videos Test
Try content with multiple videos:

```markdown
# Feature Overview

## First Feature

!video[Feature 1](video1-url)

Description...

## Second Feature

!video[Feature 2](video2-url)

More description...
```

### 6. Edge Cases
- [ ] Test with very long video URLs
- [ ] Test with special characters in alt text
- [ ] Test video markdown mixed with images
- [ ] Test empty alt text: `!video[](url)`

## Sample Test Video URLs

Use these free test videos from Google:

1. Big Buck Bunny:
   ```
   https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4
   ```

2. Elephant's Dream:
   ```
   https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4
   ```

3. For What It's Worth:
   ```
   https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4
   ```

## Expected Behavior

### Upload Process
1. Click "Add Video" button
2. File picker opens
3. Select video file
4. Upload progress shows (spinner + "Uploading..." text)
5. Success alert appears with markdown
6. Markdown is copied to clipboard
7. Paste markdown in desired location in editor

### Video Display
1. Videos render in content with Video.js player
2. Big centered play button appears
3. Click play button to start video
4. Control bar appears at bottom with:
   - Play/pause button
   - Progress bar
   - Volume control
   - Fullscreen button
5. Video maintains aspect ratio
6. Videos are same width as images in content

## Troubleshooting Common Issues

### Video doesn't upload
- Check Supabase credentials in `.env.local`
- Check network tab for errors
- Verify file is a supported video format

### Video doesn't render
- Check markdown syntax is exact: `!video[alt](url)`
- Verify URL is accessible
- Check browser console for errors
- Ensure Video.js loaded (check network tab)

### Video player looks wrong
- Clear browser cache
- Check that `globals.css` includes Video.js styles
- Verify Video.js CSS is imported in VideoPlayer component

## Performance Notes

- First video load may be slow as Video.js initializes
- Large videos will take time to buffer
- Consider adding poster images in future for better UX
- Video.js adds ~100kb to bundle size (acceptable)

## Next Steps After Testing

If tests pass:
1. Commit changes to `video-embed` branch
2. Create pull request
3. Add deployment notes if needed
4. Update main documentation

If tests fail:
1. Check console errors
2. Review implementation
3. Fix issues
4. Re-test

