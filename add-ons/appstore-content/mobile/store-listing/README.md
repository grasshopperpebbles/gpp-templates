# Store Listing Content

This directory contains all metadata and content for your app store listings.

## Directory Structure

```
store-listing/
├── app-store/           # iOS App Store Connect
│   ├── metadata.json    # App metadata
│   ├── description.md   # Long description (4000 chars max)
│   ├── keywords.txt     # Keywords (100 chars max)
│   ├── whats-new.md     # Release notes template
│   ├── privacy-policy.md
│   └── screenshots/     # Screenshot specs
└── play-store/          # Google Play Console
    ├── metadata.json    # App metadata
    ├── short-description.txt  # 80 chars max
    ├── full-description.txt   # 4000 chars max
    ├── whats-new.txt    # Release notes
    └── graphics/        # Asset specs
```

## iOS App Store

### Character Limits
- **App Name**: 30 characters
- **Subtitle**: 30 characters
- **Keywords**: 100 characters (comma-separated)
- **Description**: 4,000 characters
- **What's New**: 4,000 characters
- **Promotional Text**: 170 characters

### Screenshots Required
| Device | Size (pixels) | Required |
|--------|---------------|----------|
| iPhone 6.7" | 1290 x 2796 | Yes |
| iPhone 6.5" | 1284 x 2778 | Yes |
| iPhone 5.5" | 1242 x 2208 | Optional |
| iPad Pro 12.9" | 2048 x 2732 | If iPad app |

### App Preview Videos
- Up to 3 videos per localization
- 15-30 seconds each
- H.264 codec, .mov or .mp4

## Google Play Store

### Character Limits
- **App Name**: 30 characters
- **Short Description**: 80 characters
- **Full Description**: 4,000 characters

### Graphics Required
| Asset | Size (pixels) | Format |
|-------|---------------|--------|
| App Icon | 512 x 512 | PNG (32-bit) |
| Feature Graphic | 1024 x 500 | PNG or JPEG |
| Phone Screenshots | 16:9 or 9:16 | Min 320px |
| Tablet Screenshots | 16:9 or 9:16 | 7" and 10" |
| TV Banner | 1280 x 720 | If TV app |

### Promo Video
- YouTube URL only
- No age restrictions
- Public or unlisted

## Workflow

1. Edit metadata.json files with your app details
2. Write descriptions in the respective files
3. Add keywords (App Store) based on research
4. Prepare screenshots per specifications
5. Create feature graphic (Play Store)
6. Write release notes for each version
7. Upload via App Store Connect / Play Console

## Tips

- **Keywords**: Research competitors, use App Store Optimization tools
- **Screenshots**: Show key features, use captions
- **Description**: Lead with benefits, include features, end with call-to-action
- **Localization**: Consider translating for top markets
