# AllPositions3 to GPX Converter - Phased Development Plan

## Overview

This document outlines the phased development plan for creating a tool to convert `AllPositions3.json` race data to GPX format. Each boat identified by an ID in the AllPositions3 file becomes a separate track in the GPX file.

## Data Structure Analysis

### Input Format (`AllPositions3.json`)
```json
[
  {
    "id": 1,                    // Boat ID (maps to team ID in RaceSetup)
    "moments": [
      {
        "dtf": 0,               // Distance to finish
        "lat": 22.1883,         // Latitude
        "lon": -158.4001,       // Longitude  
        "at": 1753333200        // Unix timestamp
      }
    ]
  }
]
```

### Output Format (GPX)
```xml
<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="decyb-gpx-converter">
  <metadata>
    <name>Transpac 2025 Return Race Tracks</name>
    <time>2025-07-23T22:14:25Z</time>
  </metadata>
  
  <trk>
    <name>Aimant de Fille (Steven Ernest)</name>
    <desc>Boat ID: 1, Model: J/145, Country: US</desc>
    <trkseg>
      <trkpt lat="22.1883" lon="-158.4001">
        <time>2025-07-23T22:14:25Z</time>
        <extensions>
          <dtf>0</dtf>
        </extensions>
      </trkpt>
    </trkseg>
  </trk>
</gpx>
```

## Phase 1: Core Converter (JavaScript/Node.js) ✅ COMPLETED

**File**: `cli/json2gpx.js`

### Features:
- Read `AllPositions3.json` and `RaceSetup.json`
- Map boat IDs to team information
- Convert Unix timestamps to ISO 8601 format
- Generate valid GPX XML structure
- Handle multiple boats as separate tracks
- Include metadata (boat name, owner, model, country)

### Command Line Interface:
```bash
./json2gpx <positions.json> <racesetup.json> [output.gpx]
```

### Implementation Status: ✅ COMPLETED
- Core conversion functionality
- Error handling and validation
- Rich metadata mapping
- Standard GPX output format
- Command line interface
- Documentation

## Phase 2: Enhanced Features

### Time Filtering
- `--start-time` and `--end-time` options
- Filter tracks by date/time ranges
- Support for various time formats

### Boat Filtering
- `--boat-id` to export specific boats only
- Multiple boat selection
- Exclusion options

### Track Segmentation
- Split tracks by time gaps (>1 hour)
- Handle recording interruptions
- Maintain track continuity

### Metadata Enrichment
- Include race information
- Course data integration
- Performance statistics

### Format Options
- Standard GPX vs extended with custom fields
- Compression options
- Multiple output formats

## Phase 3: Advanced Features

### Course Overlay
- Include race course as route/waypoints
- Mark start/finish lines
- Show course boundaries

### Statistics Generation
- Add track statistics as GPX extensions
- Speed calculations
- Distance measurements
- Performance metrics

### Compression
- Gzip output for large files
- Efficient memory usage
- Streaming processing

### Batch Processing
- Convert multiple race files
- Directory processing
- Automated workflows

### Validation
- GPX schema validation
- Data integrity checks
- Error reporting

## Phase 4: Advanced Features

### Real-time Conversion
- Stream processing for live data
- WebSocket integration
- Real-time race tracking

### Web Interface
- Browser-based conversion
- Drag-and-drop file upload
- Interactive preview

### API Integration
- Direct from YB servers
- RESTful API endpoints
- Authentication support

### Multiple Formats
- KML export options
- GeoJSON export
- CSV/Excel formats
- Custom format plugins

### Statistics Generation
- Speed, distance, performance metrics
- Race analysis reports
- Performance comparisons

## Technical Implementation Details

### Data Mapping
```javascript
// Boat ID to Team mapping
const boatToTeam = {};
raceSetup.teams.forEach(team => {
  boatToTeam[team.id] = team;
});

// Track point conversion
const convertPoint = (moment) => ({
  lat: moment.lat,
  lon: moment.lon,
  time: new Date(moment.at * 1000).toISOString(),
  extensions: {
    dtf: moment.dtf,
    // Additional fields: alt, lap, pc if available
  }
});
```

### GPX Structure
```javascript
const gpxTemplate = {
  version: "1.1",
  creator: "decyb-gpx-converter",
  metadata: {
    name: raceTitle,
    time: new Date().toISOString(),
    desc: `Converted from ${raceName} race data`
  },
  tracks: [] // Each boat becomes a track
};
```

### Error Handling
- Invalid JSON input
- Missing RaceSetup data
- Invalid coordinates
- Timestamp conversion errors
- XML generation errors

## File Structure

```
cli/
├── json2gpx.js          # Main converter ✅
├── json2gpx             # Executable wrapper ✅
├── package.json          # Dependencies (if needed)
├── README.md            # Usage documentation ✅
└── PHASED_PLAN.md      # This file ✅
```

## Dependencies

### Required:
- **Node.js**: For JavaScript execution ✅
- **Built-in modules**: `fs`, `path`, `process` ✅
- **Optional**: `xmlbuilder` or manual XML generation ✅

### Optional:
- **jq**: For JSON preprocessing
- **xmllint**: For GPX validation

## Usage Examples

### Basic Conversion
```bash
./json2gpx AllPositions3.json RaceSetup.json race_tracks.gpx
```

### Filtered Conversion
```bash
./json2gpx AllPositions3.json RaceSetup.json --boat-id 1,2,3 selected_boats.gpx
```

### Time Filtered
```bash
./json2gpx AllPositions3.json RaceSetup.json --start-time "2025-07-20" --end-time "2025-07-25" filtered_tracks.gpx
```

## Output Features

### Standard GPX Elements
- ✅ Multiple tracks (one per boat)
- ✅ Track points with coordinates and timestamps
- ✅ Track names from boat/owner information
- ✅ Metadata with race information

### Custom Extensions
- Distance to finish (DTF)
- Boat information (model, owner, country)
- Race-specific metadata

### Validation
- GPX 1.1 schema compliance
- Coordinate validation
- Timestamp format validation

## Testing Strategy

### Test Cases
1. **Basic conversion**: Single boat, minimal data
2. **Multiple boats**: All 29 boats from current data
3. **Time ordering**: Verify chronological order
4. **Coordinate validation**: Check lat/lon ranges
5. **GPX validation**: Ensure valid XML structure
6. **Large files**: Performance with full race data

### Sample Data
- Use current `AllPositions3.json` (29 boats, 205+ points each)
- Test with different race datasets
- Validate output in GPX viewers (Google Earth, etc.)

## Future Enhancements

### Phase 5: Enterprise Features
- **Database integration**: Store conversion history
- **User management**: Multi-user support
- **Advanced analytics**: Race performance analysis
- **Mobile support**: iOS/Android apps
- **Cloud integration**: AWS/Azure deployment

### Phase 6: Community Features
- **Plugin system**: Third-party format support
- **Community sharing**: Race data repository
- **Collaboration tools**: Team race analysis
- **Social features**: Race result sharing

## Success Metrics

### Phase 1 (Completed)
- ✅ Converts all boat data to GPX format
- ✅ Maintains data integrity
- ✅ Provides clear error messages
- ✅ Generates valid GPX files
- ✅ Includes rich metadata

### Phase 2 (Planned)
- Time filtering functionality
- Boat selection options
- Enhanced metadata
- Performance improvements

### Phase 3 (Planned)
- Course overlay features
- Statistics generation
- Batch processing
- Advanced validation

## Conclusion

Phase 1 has been successfully completed with a fully functional JSON to GPX converter. The tool provides a solid foundation for converting race data to the widely-supported GPX format, making it accessible for use in other GPS and mapping applications.

Future phases will add advanced features for filtering, analysis, and integration with other systems. 