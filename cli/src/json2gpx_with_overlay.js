#!/usr/bin/env node

/*! JSON to GPX Converter with Overlay Support
 * Converts AllPositions3.json race data to GPX format with optional overlay tracks.
 * Each boat (identified by ID) becomes a separate track in the GPX file.
 * Can include additional GPX files as overlay tracks.
 * 
 * Usage: ./json2gpx_with_overlay.js <positions.json> <racesetup.json> [options] [output.gpx]
 * 
 * \author Based on decyb project by Bernhard R. Fischer
 * \date 2025/07/23
 */

const fs = require('fs');
const path = require('path');

// Command line argument parsing
function parseArgs() {
    const args = process.argv.slice(2);
    
    // Check for --list-overlays first
    if (args.length === 1 && args[0] === '--list-overlays') {
        listOverlayFiles();
        process.exit(0);
    }
    
    if (args.length < 2) {
        console.error('Usage: ./json2gpx_with_overlay.js <positions.json> <racesetup.json> [options] [output.gpx]');
        console.error('');
        console.error('Arguments:');
        console.error('  positions.json  - AllPositions3.json file');
        console.error('  racesetup.json  - RaceSetup.json file');
        console.error('  output.gpx      - Output GPX file (default: race_tracks_with_overlay.gpx)');
        console.error('');
        console.error('Options:');
        console.error('  --overlay <file.gpx>     - Add overlay GPX file');
        console.error('  --overlay-name <name>    - Name for overlay track (default: "Overlay Track")');
        console.error('  --overlay-color <color>  - Color for overlay track (default: "FF0000")');
        console.error('  --garmin-url <url>       - Download and add Garmin track as overlay');
        console.error('  --list-overlays          - List available overlay files');
        process.exit(1);
    }
    
    const options = {
        positionsFile: args[0],
        raceSetupFile: args[1],
        outputFile: 'race_tracks_with_overlay.gpx',
        overlays: [],
        garminUrl: null
    };
    
    // Parse options
    let outputFileSet = false;
    for (let i = 2; i < args.length; i++) {
        switch (args[i]) {
            case '--overlay':
                if (i + 1 < args.length) {
                    options.overlays.push({
                        file: args[++i],
                        name: 'Overlay Track',
                        color: 'FF0000'
                    });
                }
                break;
            case '--overlay-name':
                if (i + 1 < args.length && options.overlays.length > 0) {
                    options.overlays[options.overlays.length - 1].name = args[++i];
                }
                break;
            case '--overlay-color':
                if (i + 1 < args.length && options.overlays.length > 0) {
                    options.overlays[options.overlays.length - 1].color = args[++i];
                }
                break;
            case '--garmin-url':
                if (i + 1 < args.length) {
                    options.garminUrl = args[++i];
                }
                break;
            case '--list-overlays':
                listOverlayFiles();
                process.exit(0);
                break;
            default:
                if (!args[i].startsWith('--') && !outputFileSet) {
                    options.outputFile = args[i];
                    outputFileSet = true;
                }
                break;
        }
    }
    
    return options;
}

// List available overlay files
function listOverlayFiles() {
    const overlayDir = './data';
    if (fs.existsSync(overlayDir)) {
        console.log('Available overlay files:');
        const files = fs.readdirSync(overlayDir).filter(f => f.endsWith('.gpx'));
        files.forEach(file => {
            const stats = fs.statSync(path.join(overlayDir, file));
            console.log(`  ${file} (${(stats.size / 1024).toFixed(1)} KB)`);
        });
    } else {
        console.log('No data directory found. Create ./data/ to store overlay files.');
    }
}

// Read and parse JSON files
function readJsonFile(filename) {
    try {
        const data = fs.readFileSync(filename, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error(`Error reading ${filename}: ${error.message}`);
        process.exit(1);
    }
}

// Read GPX file and extract track points
function readGpxFile(filename) {
    try {
        const data = fs.readFileSync(filename, 'utf8');
        return parseGpxTrack(data);
    } catch (error) {
        console.error(`Error reading GPX file ${filename}: ${error.message}`);
        return null;
    }
}

// Parse GPX track data
function parseGpxTrack(gpxData) {
    const tracks = [];
    const trackRegex = /<trk[^>]*>([\s\S]*?)<\/trk>/g;
    const trkptRegex = /<trkpt[^>]*lat="([^"]*)"[^>]*lon="([^"]*)"[^>]*>([\s\S]*?)<\/trkpt>/g;
    const timeRegex = /<time>([^<]*)<\/time>/;
    const nameRegex = /<name>([^<]*)<\/name>/;
    
    let match;
    while ((match = trackRegex.exec(gpxData)) !== null) {
        const trackContent = match[1];
        const nameMatch = nameRegex.exec(trackContent);
        const trackName = nameMatch ? nameMatch[1] : 'Unknown Track';
        
        const points = [];
        let pointMatch;
        while ((pointMatch = trkptRegex.exec(trackContent)) !== null) {
            const lat = parseFloat(pointMatch[1]);
            const lon = parseFloat(pointMatch[2]);
            const pointContent = pointMatch[3];
            
            const timeMatch = timeRegex.exec(pointContent);
            const time = timeMatch ? new Date(timeMatch[1]).getTime() / 1000 : Date.now() / 1000;
            
            points.push({
                lat: lat,
                lon: lon,
                at: time
            });
        }
        
        if (points.length > 0) {
            tracks.push({
                name: trackName,
                points: points
            });
        }
    }
    
    return tracks;
}

// Convert Unix timestamp to ISO 8601 format
function timestampToISO(timestamp) {
    return new Date(timestamp * 1000).toISOString();
}

// Escape XML special characters
function escapeXml(text) {
    if (!text) return '';
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}

// Download Garmin GPX file
async function downloadGarminGpx(garminUrl, outputFile) {
    const { downloadFile } = require('./download_garmin_gpx.js');
    
    try {
        console.log(`Downloading Garmin track from: ${garminUrl}`);
        await downloadFile(garminUrl, outputFile);
        return outputFile;
    } catch (error) {
        console.error(`Error downloading Garmin GPX: ${error.message}`);
        return null;
    }
}

// Generate GPX XML content with overlays
function generateGPXWithOverlays(positions, raceSetup, overlays) {
    const now = new Date().toISOString();
    const raceTitle = raceSetup.title || 'Sailing Race';
    
    let gpx = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="decyb-gpx-converter" xmlns="http://www.topografix.com/GPX/1/1">
  <metadata>
    <name>${escapeXml(raceTitle)}</name>
    <time>${now}</time>
    <desc>Converted from race data using decyb-gpx-converter with overlays</desc>
  </metadata>
`;

    // Create boat ID to team mapping
    const boatToTeam = {};
    if (raceSetup.teams) {
        raceSetup.teams.forEach(team => {
            boatToTeam[team.id] = team;
        });
    }

    // Convert each boat's track
    positions.forEach(boat => {
        const team = boatToTeam[boat.id];
        const boatName = team ? (team.name || `Boat ${boat.id}`) : `Boat ${boat.id}`;
        const owner = team ? (team.owner || 'Unknown') : 'Unknown';
        const model = team ? (team.model || 'Unknown') : 'Unknown';
        const country = team ? (team.country || 'Unknown') : 'Unknown';
        const sailNumber = team ? (team.sail || '') : '';
        
        // Create track description
        let desc = `Boat ID: ${boat.id}, Owner: ${owner}, Model: ${model}, Country: ${country}`;
        if (sailNumber) {
            desc += `, Sail: ${sailNumber}`;
        }

        gpx += `  <trk>
    <name>${escapeXml(boatName)} (${escapeXml(owner)})</name>
    <desc>${escapeXml(desc)}</desc>
    <trkseg>
`;

        // Add track points in chronological order (oldest first)
        const sortedMoments = boat.moments.sort((a, b) => a.at - b.at);
        
        sortedMoments.forEach(moment => {
            gpx += `      <trkpt lat="${moment.lat}" lon="${moment.lon}">
        <time>${timestampToISO(moment.at)}</time>
        <extensions>
          <dtf>${moment.dtf || 0}</dtf>`;
            
            // Add additional fields if available
            if (moment.alt !== undefined) {
                gpx += `
          <ele>${moment.alt}</ele>`;
            }
            if (moment.lap !== undefined) {
                gpx += `
          <lap>${moment.lap}</lap>`;
            }
            if (moment.pc !== undefined) {
                gpx += `
          <pc>${moment.pc}</pc>`;
            }
            
            gpx += `
        </extensions>
      </trkpt>
`;
        });

        gpx += `    </trkseg>
  </trk>
`;
    });

    // Add overlay tracks
    overlays.forEach(overlay => {
        if (overlay.tracks && overlay.tracks.length > 0) {
            overlay.tracks.forEach(track => {
                gpx += `  <trk>
    <name>${escapeXml(overlay.name)} - ${escapeXml(track.name)}</name>
    <desc>Overlay track from ${overlay.source}</desc>
    <trkseg>
`;

                track.points.forEach(point => {
                    gpx += `      <trkpt lat="${point.lat}" lon="${point.lon}">
        <time>${timestampToISO(point.at)}</time>
        <extensions>
          <overlay>true</overlay>
          <color>${overlay.color}</color>
        </extensions>
      </trkpt>
`;
                });

                gpx += `    </trkseg>
  </trk>
`;
            });
        }
    });

    gpx += `</gpx>`;
    return gpx;
}

// Main function
async function main() {
    const args = parseArgs();
    
    console.log(`Reading positions from: ${args.positionsFile}`);
    const positions = readJsonFile(args.positionsFile);
    
    console.log(`Reading race setup from: ${args.raceSetupFile}`);
    const raceSetup = readJsonFile(args.raceSetupFile);
    
    console.log(`Converting ${positions.length} boats to GPX format...`);
    
    // Process overlays
    const overlays = [];
    
    // Handle Garmin URL download
    if (args.garminUrl) {
        const garminFile = 'garmin_overlay.gpx';
        const downloadedFile = await downloadGarminGpx(args.garminUrl, garminFile);
        if (downloadedFile) {
            const tracks = readGpxFile(downloadedFile);
            if (tracks) {
                overlays.push({
                    name: 'Garmin Track',
                    color: 'FF0000',
                    source: 'Garmin',
                    tracks: tracks
                });
                console.log(`Added Garmin overlay with ${tracks.length} tracks`);
            }
        }
    }
    
    // Handle overlay files
    for (const overlay of args.overlays) {
        const tracks = readGpxFile(overlay.file);
        if (tracks) {
            overlays.push({
                name: overlay.name,
                color: overlay.color,
                source: overlay.file,
                tracks: tracks
            });
            console.log(`Added overlay ${overlay.file} with ${tracks.length} tracks`);
        }
    }
    
    const gpxContent = generateGPXWithOverlays(positions, raceSetup, overlays);
    
    try {
        fs.writeFileSync(args.outputFile, gpxContent, 'utf8');
        console.log(`Successfully created: ${args.outputFile}`);
        console.log(`Generated ${positions.length} race tracks`);
        console.log(`Generated ${overlays.length} overlay sources`);
        
        // Print summary
        let totalPoints = 0;
        positions.forEach(boat => {
            totalPoints += boat.moments.length;
        });
        console.log(`Total race track points: ${totalPoints}`);
        
        let overlayPoints = 0;
        overlays.forEach(overlay => {
            overlay.tracks.forEach(track => {
                overlayPoints += track.points.length;
            });
        });
        console.log(`Total overlay track points: ${overlayPoints}`);
        
    } catch (error) {
        console.error(`Error writing output file: ${error.message}`);
        process.exit(1);
    }
}

// Run the converter
if (require.main === module) {
    main();
}

module.exports = { generateGPXWithOverlays, readGpxFile, parseGpxTrack }; 