#!/usr/bin/env node

/*! Enhanced Garmin GPX Downloader
 * Downloads GPX files from various Garmin URL formats with better error handling.
 * 
 * Usage: ./download_garmin_gpx_enhanced.js <garmin_url> [output.gpx]
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
        console.error('Usage: ./download_garmin_gpx_enhanced.js <garmin_url> [output.gpx]');
        console.error('');
        console.error('Arguments:');
        console.error('  garmin_url  - Garmin share URL (e.g., https://share.garmin.com/zimmer)');
        console.error('  output.gpx  - Output GPX file (default: garmin_track.gpx)');
        console.error('');
        console.error('Supported URL types:');
        console.error('  - Garmin Connect: https://connect.garmin.com/modern/activity/1234567890');
        console.error('  - Garmin Share: https://share.garmin.com/zimmer');
        console.error('  - Direct GPX: https://connect.garmin.com/modern/proxy/activity-service-1.1/json/activity/1234567890/details');
        process.exit(1);
    }
    
    return {
        garminUrl: args[0],
        outputFile: args[1] || 'garmin_track.gpx'
    };
}

// Download file from URL with detailed error reporting
function downloadFile(urlString, outputPath) {
    return new Promise((resolve, reject) => {
        const parsedUrl = url.parse(urlString);
        const protocol = parsedUrl.protocol === 'https:' ? https : http;
        
        console.log(`Downloading from: ${urlString}`);
        
        const request = protocol.get(urlString, (response) => {
            console.log(`Response status: ${response.statusCode} ${response.statusMessage}`);
            console.log(`Content-Type: ${response.headers['content-type']}`);
            
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
            
            // Check if we're getting HTML instead of GPX
            const contentType = response.headers['content-type'] || '';
            if (contentType.includes('text/html') && !contentType.includes('application/gpx+xml')) {
                console.log('Warning: Received HTML instead of GPX. This might be a MapShare page.');
                console.log('MapShare URLs typically require manual download or different API calls.');
            }
            
            const file = fs.createWriteStream(outputPath);
            response.pipe(file);
            
            file.on('finish', () => {
                file.close();
                console.log(`Downloaded: ${outputPath}`);
                
                // Check if the file is actually GPX
                const content = fs.readFileSync(outputPath, 'utf8');
                if (!content.includes('<?xml') || !content.includes('<gpx')) {
                    console.log('Warning: Downloaded file does not appear to be valid GPX format.');
                    console.log('This might be an HTML page or other format.');
                }
                
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

// Check if URL is a MapShare URL
function isMapShareUrl(url) {
    return url.includes('share.garmin.com') && !url.includes('activity');
}

// Provide alternative solutions for MapShare URLs
function suggestMapShareAlternatives(mapName) {
    console.log('\n=== MapShare URL Detected ===');
    console.log('MapShare URLs (share.garmin.com) typically do not provide direct GPX downloads.');
    console.log('Here are some alternatives:');
    console.log('');
    console.log('1. Manual Download:');
    console.log(`   - Visit: https://share.garmin.com/${mapName}`);
    console.log('   - Look for a "Download" or "Export" button');
    console.log('   - Save the GPX file manually');
    console.log('');
    console.log('2. Use Garmin Connect URL instead:');
    console.log('   - Find the activity in Garmin Connect');
    console.log('   - Use the activity URL: https://connect.garmin.com/modern/activity/1234567890');
    console.log('');
    console.log('3. Contact the MapShare owner:');
    console.log('   - Ask them to export and share the GPX file directly');
    console.log('');
    console.log('4. Use a different tracking service:');
    console.log('   - Many sailors use other services that provide direct GPX downloads');
}

// Main function
async function main() {
    const args = parseArgs();
    
    try {
        // Check if it's a MapShare URL
        if (isMapShareUrl(args.garminUrl)) {
            const mapName = args.garminUrl.split('/').pop();
            suggestMapShareAlternatives(mapName);
            console.log('\nAttempting to download anyway (may not work)...\n');
        }
        
        // Convert URL if needed
        const gpxUrl = convertToGpxUrl(args.garminUrl);
        
        // Download the GPX file
        await downloadFile(gpxUrl, args.outputFile);
        
        console.log(`Successfully downloaded GPX file: ${args.outputFile}`);
        
        // Show file info
        const stats = fs.statSync(args.outputFile);
        console.log(`File size: ${(stats.size / 1024).toFixed(1)} KB`);
        
        // Validate the downloaded file
        const content = fs.readFileSync(args.outputFile, 'utf8');
        if (content.includes('<?xml') && content.includes('<gpx')) {
            console.log('✅ File appears to be valid GPX format');
        } else {
            console.log('⚠️  File may not be valid GPX format');
            console.log('First 200 characters of downloaded content:');
            console.log(content.substring(0, 200));
        }
        
    } catch (error) {
        console.error(`Error downloading GPX: ${error.message}`);
        
        if (isMapShareUrl(args.garminUrl)) {
            const mapName = args.garminUrl.split('/').pop();
            suggestMapShareAlternatives(mapName);
        } else {
            console.log('\nTroubleshooting tips:');
            console.log('1. Check if the URL is correct and publicly accessible');
            console.log('2. Try using a Garmin Connect activity URL instead');
            console.log('3. Verify the activity is not private');
            console.log('4. Try again later (Garmin servers may be busy)');
        }
        
        process.exit(1);
    }
}

// Run the downloader
if (require.main === module) {
    main();
}

module.exports = { downloadFile, convertToGpxUrl, extractActivityId, isMapShareUrl }; 