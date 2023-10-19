import { BlobServiceClient } from '@azure/storage-blob';
import Wkt from 'wicket';
import { createInterface } from 'readline';
import Papa from 'papaparse';

// Initialize Wkt instance for handling Well-Known Text.
const wkt = new Wkt.Wkt();

// Retrieve Azure blob configuration from environment variables.
const AZURE_CONNECTION_STRING = process.env.NEXT_PUBLIC_AZURE_CONNECTION_STRING;
const CONTAINER_NAME = process.env.NEXT_PUBLIC_CONTAINER_NAME;
const BLOB_NAME = process.env.NEXT_PUBLIC_BLOB_NAME;

/**
 * Fetch the GeoJSON representation of the given region from Azure blob storage.
 * 
 * @param {string} regionName - The name of the region to retrieve GeoJSON data for.
 * @returns {Object} GeoJSON representation of the region.
 */
export async function getRegionGeoJson(regionName) {
     // Create Azure blob service client.
    const blobServiceClient = BlobServiceClient.fromConnectionString(AZURE_CONNECTION_STRING);
    const containerClient = blobServiceClient.getContainerClient(CONTAINER_NAME);
    const blobClient = containerClient.getBlobClient(BLOB_NAME);
    const downloadResponse = await blobClient.download();

    // Find the region row within the stream.
    const regionRow = await findRegionRowInStream(downloadResponse.readableStreamBody, regionName);
    // Parse the row using PapaParse.
    const parsedRow = Papa.parse(regionRow, { header: false }).data[0];
    const wktData = parsedRow[5];

    // Convert WKT data to GeoJSON.
    const wktInstance = new Wkt.Wkt();
    wktInstance.read(wktData);
    return wktInstance.toJson();
}

/**
 * Iterate through a readable stream to find a row containing a specific region name.
 * 
 * @param {ReadableStream} stream - The stream to search through.
 * @param {string} regionName - The name of the region to find.
 * @returns {string} The line containing the specified region name.
 * @throws {Error} If the region is not found in the stream.
 */
async function findRegionRowInStream(stream, regionName) {
    // Create an interface for reading from the stream line-by-line.
    const readlineInterface = createInterface({
        input: stream,
        crlfDelay: Infinity
    });

     // Iterate through the lines of the stream.
    for await (const line of readlineInterface) {
        if (line.includes(regionName)) {
            readlineInterface.close();
            stream.destroy();
            return line;
        }
    }

    throw new Error("Region not found");
}
