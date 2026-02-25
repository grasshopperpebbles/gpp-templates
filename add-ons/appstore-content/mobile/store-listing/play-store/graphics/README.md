# Google Play Store Graphics

## Required Assets

### App Icon

| Spec | Requirement |
|------|-------------|
| Size | 512 x 512 pixels |
| Format | PNG (32-bit with alpha) |
| Max file size | 1 MB |

**Guidelines:**
- No transparency or shadows (Google adds shadow)
- Avoid text (hard to read at small sizes)
- Use consistent branding with your app

### Feature Graphic (Required)

| Spec | Requirement |
|------|-------------|
| Size | 1024 x 500 pixels |
| Format | PNG or JPEG |
| Max file size | 1 MB |

**Guidelines:**
- Displayed at the top of your store listing
- No device frames in the image
- Text should be minimal and large enough to read
- Consider how it looks with the Play button overlay

### Screenshots (Required)

| Device Type | Min | Max | Aspect Ratio |
|-------------|-----|-----|--------------|
| Phone | 2 | 8 | 16:9 or 9:16 |
| 7" Tablet | 0 | 8 | 16:9 or 9:16 |
| 10" Tablet | 0 | 8 | 16:9 or 9:16 |

**Resolution Requirements:**
- Minimum: 320px on shortest side
- Maximum: 3840px on longest side
- Format: PNG or JPEG (no alpha)

**Best Practices:**
- First 3 screenshots appear in search results
- Use text overlays to highlight features
- Show actual app screens
- Consider device frames for context

## Optional Assets

### Promo Video

| Spec | Requirement |
|------|-------------|
| Source | YouTube URL only |
| Duration | 30 seconds - 2 minutes recommended |
| Visibility | Public or Unlisted (not Private) |
| Age restrictions | None |

**Best Practices:**
- Hook viewers in the first 5 seconds
- Show app in action
- Include captions for accessibility
- End with your app icon and name

### TV Banner (If Android TV app)

| Spec | Requirement |
|------|-------------|
| Size | 1280 x 720 pixels |
| Format | PNG or JPEG |

### Daydream 360° Stereoscopic Image (If VR app)

| Spec | Requirement |
|------|-------------|
| Size | 4096 x 4096 pixels |
| Format | PNG or JPEG |

## File Naming Convention

```
icon_512x512.png
feature_graphic_1024x500.png
screenshot_01_phone.png
screenshot_02_phone.png
screenshot_03_phone.png
screenshot_01_tablet_7.png
screenshot_01_tablet_10.png
promo_video_url.txt
```

## Graphics Checklist

- [ ] App icon (512x512)
- [ ] Feature graphic (1024x500)
- [ ] Phone screenshots (min 2)
- [ ] Tablet 7" screenshots (recommended)
- [ ] Tablet 10" screenshots (recommended)
- [ ] Promo video YouTube URL (recommended)
- [ ] All images within size limits
- [ ] No transparency in screenshots
- [ ] Text readable at small sizes
- [ ] Consistent visual branding
