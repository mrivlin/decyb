# GPX Overlay Integration Guide

This guide explains how to automatically pull and integrate GPX files from Garmin and other sources with your race data.

## Overview

The overlay system allows you to combine race data with additional GPX tracks from:
- **Garmin Connect** - Direct download from share.garmin.com URLs
- **Local GPX files** - Custom overlay tracks
- **Multiple sources** - Combine multiple overlays in one file

## Quick Start

### 1. Download Garmin Track and Create Overlay

```bash
# Download from Garmin share URL and create overlay
./bin/json2gpx_with_overlay data/AllPositions3.json data/RaceSetup.json \
  --garmin-url "https://share.garmin.com/zimmer" \
  data/race_with_garmin.gpx
```

### 2. Add Local GPX File as Overlay

```bash
# Add local GPX file as overlay
./bin/json2gpx_with_overlay data/AllPositions3.json data/RaceSetup.json \
  --overlay data/my_track.gpx \
  --overlay-name "My Sailing Track" \
  --overlay-color "00FF00" \
  data/race_with_overlay.gpx
```

### 3. Combine Multiple Overlays

```bash
# Combine race data with multiple overlays
./bin/json2gpx_with_overlay data/AllPositions3.json data/RaceSetup.json \
  --garmin-url "https://share.garmin.com/zimmer" \
  --overlay data/course.gpx --overlay-name "Race Course" --overlay-color "0000FF" \
  --overlay data/weather.gpx --overlay-name "Weather Track" --overlay-color "FFFF00" \
  data/complete_race.gpx
```

## Garmin Integration

### Supported URL Formats

The system supports various Garmin URL formats:

1. **Share URLs** (Recommended):
   ```
   https://share.garmin.com/zimmer
   https://share.garmin.com/activity/1234567890
   ```

2. **Connect URLs**:
   ```
   https://connect.garmin.com/modern/activity/1234567890
   ```

3. **Direct GPX URLs**:
   ```
   https://connect.garmin.com/modern/proxy/activity-service-1.1/json/activity/1234567890/details
   ```

### Automatic URL Conversion

The system automatically:
- Follows redirects from share.garmin.com URLs
- Converts Connect URLs to direct download links
- Handles authentication redirects
- Supports both HTTP and HTTPS

### Example: Download from Garmin Share

```bash
# Download from a Garmin share URL
./download_garmin_gpx "https://share.garmin.com/zimmer" data/my_garmin_track.gpx

# Use the downloaded file as overlay
./bin/json2gpx_with_overlay data/AllPositions3.json data/RaceSetup.json \
  --overlay data/my_garmin_track.gpx \
  --overlay-name "Garmin Track" \
  data/race_with_garmin.gpx
```

## Overlay Management

### Creating Overlay Directory

```bash
# Create directory for overlay files
mkdir data

# Download and store overlay files
./download_garmin_gpx "https://share.garmin.com/zimmer" data/garmin_track.gpx
./download_garmin_gpx "https://share.garmin.com/activity/1234567890" data/activity.gpx
```

### Listing Available Overlays

```bash
# List all available overlay files
./json2gpx_with_overlay --list-overlays
```

### Using Stored Overlays

```bash
# Use stored overlay file
./json2gpx_with_overlay AllPositions3.json RaceSetup.json \
  --overlay overlays/garmin_track.gpx \
  --overlay-name "Garmin Overlay" \
  race_with_stored_overlay.gpx
```

## Advanced Features

### Custom Overlay Colors

Set custom colors for overlay tracks:

```bash
./json2gpx_with_overlay AllPositions3.json RaceSetup.json \
  --overlay course.gpx \
  --overlay-name "Race Course" \
  --overlay-color "0000FF" \
  race_with_blue_course.gpx
```

Color formats:
- **Hex**: `FF0000` (red), `00FF00` (green), `0000FF` (blue)
- **Named**: `red`, `green`, `blue`, `yellow`, `purple`

### Multiple Overlays

Combine multiple overlay sources:

```bash
./json2gpx_with_overlay AllPositions3.json RaceSetup.json \
  --garmin-url "https://share.garmin.com/zimmer" \
  --overlay course.gpx --overlay-name "Race Course" --overlay-color "0000FF" \
  --overlay weather.gpx --overlay-name "Weather" --overlay-color "FFFF00" \
  --overlay currents.gpx --overlay-name "Currents" --overlay-color "00FFFF" \
  complete_race_analysis.gpx
```

### Overlay Metadata

Overlay tracks include metadata in GPX extensions:

```xml
<trkpt lat="37.7749" lon="-122.4194">
  <time>2025-07-23T10:00:00Z</time>
  <extensions>
    <overlay>true</overlay>
    <color>FF0000</color>
  </extensions>
</trkpt>
```

## Error Handling

### Common Issues and Solutions

1. **Garmin URL Not Found**:
   ```
   Error downloading GPX: HTTP 404: Not Found
   ```
   - Check if the URL is correct and publicly accessible
   - Try using the direct share.garmin.com URL

2. **Authentication Required**:
   ```
   Error downloading GPX: HTTP 401: Unauthorized
   ```
   - The Garmin activity may be private
   - Use a publicly shared activity URL

3. **Invalid GPX File**:
   ```
   Error reading GPX file: Invalid XML structure
   ```
   - Check if the downloaded file is valid GPX
   - Try downloading manually to verify

4. **Network Timeout**:
   ```
   Error downloading GPX: Request timeout
   ```
   - Check internet connection
   - Try again later (Garmin servers may be busy)

### Debugging Tips

1. **Test URL manually**:
   ```bash
   curl -I "https://share.garmin.com/zimmer"
   ```

2. **Check downloaded file**:
   ```bash
   head -20 garmin_overlay.gpx
   ```

3. **Validate GPX structure**:
   ```bash
   grep -c "<trkpt>" garmin_overlay.gpx
   ```

## Integration Examples

### Example 1: Race with Course Overlay

```bash
# Download race course from Garmin
./download_garmin_gpx "https://share.garmin.com/race-course" course.gpx

# Create race with course overlay
./json2gpx_with_overlay AllPositions3.json RaceSetup.json \
  --overlay course.gpx \
  --overlay-name "Race Course" \
  --overlay-color "0000FF" \
  race_with_course.gpx
```

### Example 2: Multiple Weather Tracks

```bash
# Download multiple weather tracks
./download_garmin_gpx "https://share.garmin.com/weather-1" weather1.gpx
./download_garmin_gpx "https://share.garmin.com/weather-2" weather2.gpx

# Combine with race data
./json2gpx_with_overlay AllPositions3.json RaceSetup.json \
  --overlay weather1.gpx --overlay-name "Weather AM" --overlay-color "FFFF00" \
  --overlay weather2.gpx --overlay-name "Weather PM" --overlay-color "FF8800" \
  race_with_weather.gpx
```

### Example 3: Real-time Integration

```bash
# Download latest track and create overlay
./download_garmin_gpx "https://share.garmin.com/latest" latest_track.gpx

# Update race visualization with latest data
./json2gpx_with_overlay AllPositions3.json RaceSetup.json \
  --overlay latest_track.gpx \
  --overlay-name "Latest Position" \
  --overlay-color "FF0000" \
  race_updated.gpx
```

## File Structure

```
cli/
├── json2gpx_with_overlay.js    # Main overlay converter
├── json2gpx_with_overlay       # Executable wrapper
├── download_garmin_gpx.js      # Garmin downloader
├── download_garmin_gpx         # Downloader wrapper
├── overlays/                   # Directory for overlay files
│   ├── course.gpx
│   ├── weather.gpx
│   └── garmin_track.gpx
└── README_OVERLAY.md          # This documentation
```

## Best Practices

1. **Organize overlays**: Store overlay files in `./overlays/` directory
2. **Use descriptive names**: Name overlays clearly (e.g., "Race Course", "Weather Track")
3. **Choose distinct colors**: Use different colors for different overlay types
4. **Validate downloads**: Check downloaded files before using as overlays
5. **Backup originals**: Keep original overlay files separate from processed data

## Troubleshooting

### Garmin Download Issues

If Garmin downloads fail:

1. **Check URL format**: Ensure it's a valid Garmin share URL
2. **Verify accessibility**: Make sure the activity is publicly shared
3. **Try alternative**: Use a different Garmin share URL
4. **Manual download**: Download manually and use `--overlay` option

### GPX Parsing Issues

If overlay GPX files don't parse correctly:

1. **Check file format**: Ensure it's valid GPX 1.1 format
2. **Validate structure**: Check for proper `<trk>` and `<trkpt>` tags
3. **Test manually**: Open in a GPX viewer to verify
4. **Simplify**: Try with a simpler GPX file first

## Future Enhancements

Planned features for overlay system:

- **Real-time updates**: Automatic refresh of overlay data
- **Web interface**: Browser-based overlay management
- **Advanced filtering**: Time-based overlay filtering
- **Statistics**: Overlay track analysis and comparison
- **Multiple formats**: Support for KML, GeoJSON overlays 