#!/usr/bin/env node

/*! JSON to GPX Converter
 * Converts AllPositions3.json race data to GPX format.
 * Each boat (identified by ID) becomes a separate track in the GPX file.
 * 
 * Usage: ./json2gpx.js <positions.json> <racesetup.json> [output.gpx]
 * 
 * \author Based on decyb project by Bernhard R. Fischer
 * \date 2025/07/23
 */

const fs = require('fs');
const path = require('path');

// Command line argument parsing
function parseArgs() {
    const args = process.argv.slice(2);
    
    if (args.length < 2) {
        console.error('Usage: ./json2gpx.js <positions.json> <racesetup.json> [output.gpx]');
        console.error('');
        console.error('Arguments:');
        console.error('  positions.json  - AllPositions3.json file');
        console.error('  racesetup.json  - RaceSetup.json file');
        console.error('  output.gpx      - Output GPX file (default: race_tracks.gpx)');
        process.exit(1);
    }
    
    return {
        positionsFile: args[0],
        raceSetupFile: args[1],
        outputFile: args[2] || 'race_tracks.gpx'
    };
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

// Generate GPX XML content
function generateGPX(positions, raceSetup) {
    const now = new Date().toISOString();
    const raceTitle = raceSetup.title || 'Sailing Race';
    
    let gpx = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="decyb-gpx-converter" xmlns="http://www.topografix.com/GPX/1/1">
  <metadata>
    <name>${escapeXml(raceTitle)}</name>
    <time>${now}</time>
    <desc>Converted from race data using decyb-gpx-converter</desc>
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

    gpx += `</gpx>`;
    return gpx;
}

// Main function
function main() {
    const args = parseArgs();
    
    console.log(`Reading positions from: ${args.positionsFile}`);
    const positions = readJsonFile(args.positionsFile);
    
    console.log(`Reading race setup from: ${args.raceSetupFile}`);
    const raceSetup = readJsonFile(args.raceSetupFile);
    
    console.log(`Converting ${positions.length} boats to GPX format...`);
    
    const gpxContent = generateGPX(positions, raceSetup);
    
    try {
        fs.writeFileSync(args.outputFile, gpxContent, 'utf8');
        console.log(`Successfully created: ${args.outputFile}`);
        console.log(`Generated ${positions.length} tracks`);
        
        // Print summary
        let totalPoints = 0;
        positions.forEach(boat => {
            totalPoints += boat.moments.length;
        });
        console.log(`Total track points: ${totalPoints}`);
        
    } catch (error) {
        console.error(`Error writing output file: ${error.message}`);
        process.exit(1);
    }
}

// Run the converter
if (require.main === module) {
    main();
}

module.exports = { generateGPX, readJsonFile, timestampToISO }; 