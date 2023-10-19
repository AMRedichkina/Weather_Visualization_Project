import { BlobServiceClient } from '@azure/storage-blob';
import Papa from 'papaparse';

const AZURE_CONNECTION_STRING = process.env.NEXT_PUBLIC_AZURE_CONNECTION_STRING;
const CONTAINER_NAME = process.env.NEXT_PUBLIC_CONTAINER_NAME;
const BLOB_NAME_WEATHER = process.env.NEXT_PUBLIC_BLOB_NAME_WEATHER;

async function streamToBuffer(readableStream) {
    return new Promise((resolve, reject) => {
        const chunks = [];
        readableStream.on("data", data => {
            chunks.push(data instanceof Buffer ? data : Buffer.from(data));
        });
        readableStream.on("end", () => {
            resolve(Buffer.concat(chunks));
        });
        readableStream.on("error", reject);
    });
}

export async function getAllWeatherData() {
    const blobServiceClient = BlobServiceClient.fromConnectionString(AZURE_CONNECTION_STRING);
    const containerClient = blobServiceClient.getContainerClient(CONTAINER_NAME);
    const blobClient = containerClient.getBlobClient(BLOB_NAME_WEATHER);
    const downloadResponse = await blobClient.download();

    const buffer = await streamToBuffer(downloadResponse.readableStreamBody);
    const csvString = buffer.toString();
    const parsedData = Papa.parse(csvString, { header: true });

    console.log("All Weather Data:", parsedData.data[0]);
    
    return parsedData.data;
}

export { streamToBuffer };