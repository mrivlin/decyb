#!/usr/bin/env node

/*! Garmin GPX Downloader
 * Downloads GPX files from Garmin share URLs and integrates with race data.
 * 
 * Usage: ./download_garmin_gpx.js <garmin_url> [output.gpx]
 * 
 * \author Based on decyb project
 * \date 2025/07/23
 */

const fs = require('fs');
const https = require('https');
const http = require('http');
const url = require('url');

// Command line argument parsing
function parseArgs() {
    const args = process.argv.slice(2);
    
    if (args.length < 1) {
        console.error('Usage: ./download_garmin_gpx.js <garmin_url> [output.gpx]');
        console.error('');
        console.error('Arguments:');
        console.error('  garmin_url  - Garmin share URL (e.g., https://share.garmin.com/zimmer)');
        console.error('  output.gpx  - Output GPX file (default: garmin_track.gpx)');
        process.exit(1);
    }
    
    return {
        garminUrl: args[0],
        outputFile: args[1] || 'garmin_track.gpx'
    };
}

// Download file from URL
function downloadFile(urlString, outputPath) {
    return new Promise((resolve, reject) => {
        const parsedUrl = url.parse(urlString);
        const protocol = parsedUrl.protocol === 'https:' ? https : http;
        
        console.log(`Downloading from: ${urlString}`);
        
        const request = protocol.get(urlString, (response) => {
            // Handle redirects
            if (response.statusCode >= 300 && response.statusCode < 400) {
                const location = response.headers.location;
                console.log(`Redirecting to: ${location}`);
                return downloadFile(location, outputPath).then(resolve).catch(reject);
            }
            
            if (response.statusCode !== 200) {
                reject(new Error(`HTTP ${response.statusCode}: ${response.statusMessage}`));
                return;
            }
            
            const file = fs.createWriteStream(outputPath);
            response.pipe(file);
            
            file.on('finish', () => {
                file.close();
                console.log(`Downloaded: ${outputPath}`);
                resolve(outputPath);
            });
            
            file.on('error', (err) => {
                fs.unlink(outputPath, () => {}); // Delete file on error
                reject(err);
            });
        });
        
        request.on('error', (err) => {
            reject(err);
        });
        
        request.setTimeout(30000, () => {
            request.destroy();
            reject(new Error('Request timeout'));
        });
    });
}

// Extract activity ID from Garmin Connect URL
function extractActivityId(garminUrl) {
    const match = garminUrl.match(/activity\/(\d+)/);
    return match ? match[1] : null;
}

// Convert Garmin Connect URL to direct GPX download
function convertToGpxUrl(garminUrl) {
    const activityId = extractActivityId(garminUrl);
    if (activityId) {
        return `https://connect.garmin.com/modern/proxy/activity-service-1.1/json/activity/${activityId}/details`;
    }
    
    // If it's already a share.garmin.com URL, it should work directly
    if (garminUrl.includes('share.garmin.com')) {
        return garminUrl;
    }
    
    return garminUrl;
}

// Main function
async function main() {
    const args = parseArgs();
    
    try {
        // Convert URL if needed
        const gpxUrl = convertToGpxUrl(args.garminUrl);
        
        // Download the GPX file
        await downloadFile(gpxUrl, args.outputFile);
        
        console.log(`Successfully downloaded GPX file: ${args.outputFile}`);
        
        // Show file info
        const stats = fs.statSync(args.outputFile);
        console.log(`File size: ${(stats.size / 1024).toFixed(1)} KB`);
        
    } catch (error) {
        console.error(`Error downloading GPX: ${error.message}`);
        process.exit(1);
    }
}

// Run the downloader
if (require.main === module) {
    main();
}

module.exports = { downloadFile, convertToGpxUrl, extractActivityId }; 