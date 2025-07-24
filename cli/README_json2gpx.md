# JSON to GPX Converter

This tool converts race data from the YB (Yellowbrick) format to standard GPX format for use in GPS applications, mapping software, and other tools.

## Overview

The converter takes two JSON files as input:
- `AllPositions3.json` - Contains track data for all boats in the race
- `RaceSetup.json` - Contains boat/team information and race metadata

And outputs a single GPX file with each boat as a separate track.

## Usage

```bash
./json2gpx <positions.json> <racesetup.json> [output.gpx]
```

### Arguments

- `positions.json` - AllPositions3.json file from YB race data
- `racesetup.json` - RaceSetup.json file from YB race data  
- `output.gpx` - Output GPX file (optional, defaults to `race_tracks.gpx`)

### Examples

```bash
# Basic conversion
./json2gpx AllPositions3.json RaceSetup.json race_tracks.gpx

# Use default output filename
./json2gpx AllPositions3.json RaceSetup.json

# Convert different race data
./json2gpx ggr2022_positions.json ggr2022_setup.json ggr2022_tracks.gpx
```

## Output Format

The generated GPX file contains:

- **Metadata**: Race title, creation time, description
- **Multiple tracks**: One track per boat/team
- **Track information**: Boat name, owner, model, country, sail number
- **Track points**: Coordinates, timestamps, distance to finish (DTF)
- **Extensions**: Additional race-specific data (altitude, lap, etc.)

### Example GPX Structure

```xml
<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="decyb-gpx-converter">
  <metadata>
    <name>Transpac Return</name>
    <time>2025-07-24T05:23:05.040Z</time>
    <desc>Converted from race data using decyb-gpx-converter</desc>
  </metadata>
  
  <trk>
    <name>Aimant de Fille (Steven Ernest)</name>
    <desc>Boat ID: 1, Owner: Steven Ernest, Model: J/145, Country: United States, Sail: 56203</desc>
    <trkseg>
      <trkpt lat="21.2843" lon="-157.8419">
        <time>2025-07-16T01:00:05.000Z</time>
        <extensions>
          <dtf>0</dtf>
        </extensions>
      </trkpt>
    </trkseg>
  </trk>
</gpx>
```

## Data Mapping

### Input JSON Structure
```json
[
  {
    "id": 1,
    "moments": [
      {
        "dtf": 0,
        "lat": 22.1883,
        "lon": -158.4001,
        "at": 1753333200
      }
    ]
  }
]
```

### Output GPX Elements
- **Track name**: `{Boat Name} ({Owner})`
- **Track description**: Boat ID, owner, model, country, sail number
- **Track points**: Latitude, longitude, ISO timestamp
- **Extensions**: DTF (distance to finish), altitude, lap, performance data

## Features

- ✅ **Multiple tracks**: Each boat becomes a separate GPX track
- ✅ **Rich metadata**: Boat information from RaceSetup.json
- ✅ **Chronological ordering**: Track points sorted by timestamp
- ✅ **XML escaping**: Proper handling of special characters
- ✅ **Error handling**: Graceful error messages for invalid files
- ✅ **Statistics**: Summary of tracks and points generated

## Compatibility

The generated GPX files are compatible with:
- Google Earth
- Garmin BaseCamp
- OpenStreetMap editors
- GPS navigation devices
- Mapping applications
- Race analysis software

## Requirements

- Node.js (built-in modules only, no external dependencies)
- Read access to input JSON files
- Write access to output directory

## Error Handling

The tool provides clear error messages for:
- Missing input files
- Invalid JSON format
- File read/write errors
- Missing required data fields

## Performance

- Processes large race files efficiently
- Memory usage scales with input size
- Output file size: ~1MB for 29 boats with 6,000+ track points

## Future Enhancements

Planned features for future versions:
- Time filtering options
- Boat ID filtering
- Track segmentation by time gaps
- Course overlay as routes/waypoints
- Statistics generation
- Multiple output formats (KML, GeoJSON)

## Author

Based on the decyb project by Bernhard R. Fischer
Modified for JSON to GPX conversion 