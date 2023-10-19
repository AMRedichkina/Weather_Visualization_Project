import { getAllWeatherData } from './geoPointsDataHelper';
import { getRegionGeoJson } from './geoJsonHelper'
import { point as turfPoint, booleanPointInPolygon } from '@turf/turf';

/**
 * Converts ISO 8601 formatted DateTime to Azure's expected DateTime format.
 * 
 * @param {string} iso8601DateTime - Date and time in ISO 8601 format.
 * @returns {string|null} Azure's expected DateTime format or null if conversion failed.
 */
function convertISO8601ToAzureDateTime(iso8601DateTime) {
    const parts = iso8601DateTime.split('T');
    if (parts.length === 2) {
        const datePart = parts[0];
        const timePart = parts[1];
        return `${datePart} ${timePart}:00`;
    }
    return null;
}

/**
 * Filters out weather data points based on the specified target DateTime.
 * 
 * @param {Array} points - List of weather data points.
 * @param {string} targetDateTime - The DateTime value to filter by.
 * @returns {Array} Filtered list of weather data points.
 */
function filterPointsByDateTime(points, targetDateTime) {
    return points.filter(point => point.time === targetDateTime);
}

/**
 * Filters weather data points by ensuring they fall within a given region (geoJson) 
 * and are within a specified DateTime.
 * 
 * @param {Array} points - List of weather data points.
 * @param {Object} geoJson - GeoJSON representation of the region.
 * @param {string} selectedDateTime - The DateTime value to filter by.
 * @returns {Array} Filtered list of weather data points.
 */
async function getDataWithinRegion(points, geoJson, selectedDateTime) {
    const iso8601DateTime = convertISO8601ToAzureDateTime(selectedDateTime);
    console.log(`Target DateTime: ${iso8601DateTime}`);

    const dateTimeFilteredPoints = filterPointsByDateTime(points, iso8601DateTime);


    points.forEach(point => {
        if (!dateTimeFilteredPoints.includes(point)) {
            console.log(`Point filtered out due to date-time mismatch:`, point);
        }
    });

    const uniqueCoordinates = new Set();
    const filteredRows = dateTimeFilteredPoints.filter(point => {
        const longitude = parseFloat(point.longitude);
        const latitude = parseFloat(point.latitude);

        if (!isNaN(longitude) && !isNaN(latitude)) {
            const coordinate = `${longitude},${latitude}`;
            if (!uniqueCoordinates.has(coordinate)) {
                uniqueCoordinates.add(coordinate);
                const pt = turfPoint([longitude, latitude]);
                if (!booleanPointInPolygon(pt, geoJson)) {
                    console.log(`Point filtered out due to not being in the geoJson region:`, point);
                    return false;
                }
                return true;
            } else {
                console.log(`Point filtered out due to duplicate coordinates:`, point);
                return false;
            }
        } else {
            console.log(`Point filtered out due to invalid coordinates:`, point);
            return false;
        }
    });

    console.log("Final filtered temperature points:", filteredRows);
    return filteredRows;
}

export default async (req, res) => {
    const { regionName, selectedDateTime } = req.query;

    console.log(`Fetching temperature for region: ${regionName}`);

    try {
        const allWeatherData = await getAllWeatherData();
        const geoJson = await getRegionGeoJson(regionName);
        const temperaturePoints = await getDataWithinRegion(allWeatherData, geoJson, selectedDateTime);

        res.status(200).json({ points: temperaturePoints });
    } catch (error) {
        console.error("Error:", error);
        res.status(500).json({ error: error.toString() });
    }
};
