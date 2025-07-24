# Garmin GPX Download Solutions

## The Problem: HTTP 500 Error with MapShare URLs

When you try to download from `https://share.garmin.com/zimmer`, you get an HTTP 500 error because:

1. **MapShare URLs don't provide direct GPX downloads** - They're web pages, not direct file links
2. **Garmin's servers are rejecting automated requests** - They may block programmatic access
3. **The URL format is different** - MapShare uses a different system than Garmin Connect

## Solution 1: Use Garmin Connect URLs Instead

**MapShare URLs** (don't work for direct download):
```
https://share.garmin.com/zimmer
https://share.garmin.com/activity/1234567890
```

**Garmin Connect URLs** (work for direct download):
```
https://connect.garmin.com/modern/activity/1234567890
https://connect.garmin.com/modern/activity/9876543210
```

### How to Find Garmin Connect URLs

1. **From MapShare page**: Look for a link to "View in Garmin Connect"
2. **From the owner**: Ask them to share the Garmin Connect activity URL
3. **From Garmin Connect**: If you have access, find the activity and copy the URL

### Example with Garmin Connect URL

```bash
# This should work (replace with actual activity ID)
./download_garmin_gpx_enhanced "https://connect.garmin.com/modern/activity/1234567890"
```

## Solution 2: Manual Download from MapShare

1. **Visit the MapShare page**: `https://share.garmin.com/zimmer`
2. **Look for download options**:
   - "Download" button
   - "Export" button
   - "GPX" or "Track" download link
3. **Save the file** and use it as an overlay

```bash
# After manual download
./json2gpx_with_overlay AllPositions3.json RaceSetup.json \
  --overlay manually_downloaded_track.gpx \
  --overlay-name "Zimmer Track" \
  race_with_overlay.gpx
```

## Solution 3: Contact the MapShare Owner

Ask the person who owns the MapShare to:

1. **Export the GPX file** from their Garmin Connect account
2. **Share the Garmin Connect activity URL** instead of MapShare
3. **Upload the GPX file** to a file sharing service

## Solution 4: Alternative Tracking Services

Many sailors use services that provide direct GPX downloads:

### PredictWind
```bash
# PredictWind provides direct GPX downloads
curl "https://forecast.predictwind.com/tracking/display/boatname.gpx" -o boat_track.gpx
```

### YB Tracker
```bash
# YB provides direct downloads (what we're already using)
wget "https://cf.yb.tl/BIN/race/AllPositions3" -O race_data.bin
```

### Other Services
- **Spot Tracker**: Direct GPX downloads available
- **DeLorme**: Provides export options
- **Custom tracking systems**: Often have API endpoints

## Solution 5: Create Your Own GPX File

If you have the track data in another format, convert it:

```bash
# Convert from CSV to GPX
./csv2gpx track_data.csv track.gpx

# Convert from KML to GPX
./kml2gpx track_data.kml track.gpx
```

## Testing Different URL Types

Let's test what works and what doesn't:

### ✅ Working URL Types

```bash
# Garmin Connect activity (if public)
./download_garmin_gpx_enhanced "https://connect.garmin.com/modern/activity/1234567890"

# Direct GPX URL (if you have the activity ID)
./download_garmin_gpx_enhanced "https://connect.garmin.com/modern/proxy/activity-service-1.1/json/activity/1234567890/details"
```

### ❌ Non-working URL Types

```bash
# MapShare URLs (return HTML, not GPX)
./download_garmin_gpx_enhanced "https://share.garmin.com/zimmer"

# Private activities (return 401/403)
./download_garmin_gpx_enhanced "https://connect.garmin.com/modern/activity/private_activity"
```

## Enhanced Error Handling

The enhanced downloader provides detailed feedback:

```bash
./download_garmin_gpx_enhanced "https://share.garmin.com/zimmer"
```

**Output:**
```
=== MapShare URL Detected ===
MapShare URLs (share.garmin.com) typically do not provide direct GPX downloads.
Here are some alternatives:

1. Manual Download:
   - Visit: https://share.garmin.com/zimmer
   - Look for a "Download" or "Export" button
   - Save the GPX file manually

2. Use Garmin Connect URL instead:
   - Find the activity in Garmin Connect
   - Use the activity URL: https://connect.garmin.com/modern/activity/1234567890

3. Contact the MapShare owner:
   - Ask them to export and share the GPX file directly

4. Use a different tracking service:
   - Many sailors use other services that provide direct GPX downloads
```

## Workaround: Manual Process

If you need the Zimmer track specifically:

1. **Visit**: https://share.garmin.com/zimmer
2. **Look for**: Download/Export/GPX button
3. **Save as**: `zimmer_track.gpx`
4. **Use as overlay**:
   ```bash
   ./json2gpx_with_overlay AllPositions3.json RaceSetup.json \
     --overlay zimmer_track.gpx \
     --overlay-name "Zimmer Track" \
     --overlay-color "FF0000" \
     race_with_zimmer.gpx
   ```

## Future Solutions

### Option 1: Web Scraping
Create a script that:
1. Visits the MapShare page
2. Extracts track data from JavaScript
3. Converts to GPX format

### Option 2: API Integration
If Garmin provides an API:
1. Register for API access
2. Use API endpoints to download tracks
3. Convert to GPX format

### Option 3: Browser Automation
Use tools like Selenium to:
1. Automate browser interaction
2. Click download buttons
3. Save files automatically

## Summary

The HTTP 500 error occurs because MapShare URLs are web pages, not direct file downloads. The solutions are:

1. **Use Garmin Connect URLs** instead of MapShare URLs
2. **Manual download** from the MapShare web page
3. **Contact the owner** for the proper Garmin Connect URL
4. **Use alternative tracking services** that provide direct downloads
5. **Create your own GPX** from other data sources

The enhanced downloader will help you identify the issue and provide appropriate alternatives. 