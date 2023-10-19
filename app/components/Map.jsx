import React, { useMemo } from "react";
import Map from "react-map-gl";
import { HeatmapLayer } from "@deck.gl/aggregation-layers";
import { ScatterplotLayer } from "@deck.gl/layers"
import { HexagonLayer } from '@deck.gl/aggregation-layers';
import DeckGL from "@deck.gl/react";
import "mapbox-gl/dist/mapbox-gl.css";
import {
  lightingEffect,
  material,
  INITIAL_VIEW_STATE,
  colorRange,
} from "../../lib/mapconfig.js";

/**
 * Compute bilinear interpolation for given x, y, and data points.
 * 
 * @param {number} x - The x-coordinate for interpolation.
 * @param {number} y - The y-coordinate for interpolation.
 * @param {Array} points - The data points to interpolate.
 * @returns {number} - Interpolated value.
 */
function bilinearInterpolation(x, y, points) {
  const [p00, p01, p10, p11] = points;

  const p00_value = parseFloat(p00.sp);
  const p01_value = parseFloat(p01.sp);
  const p10_value = parseFloat(p10.sp);
  const p11_value = parseFloat(p11.sp);
  if (isNaN(p00_value) || isNaN(p01_value) || isNaN(p10_value) || isNaN(p11_value)) {
    console.error("Error converting sp to number for points:", points);
    return NaN;
  }
  return (p00_value + p01_value + p10_value + p11_value) / 4;
}

/**
 * Get surrounding points for given latitude and longitude.
 * 
 * @param {number} lat - Latitude.
 * @param {number} lon - Longitude.
 * @param {Array} data - The dataset to find surrounding points.
 * @returns {Array} - An array of surrounding points.
 */
function getSurroundingPoints(lat, lon, data) {
  let p00, p01, p10, p11;

  for (const point of data) {
      if (point.latitude <= lat && point.longitude <= lon) p00 = point;
      if (point.latitude <= lat && point.longitude > lon) p01 = point;
      if (point.latitude > lat && point.longitude <= lon) p10 = point;
      if (point.latitude > lat && point.longitude > lon) p11 = point;

      if (p00 && p01 && p10 && p11) break;
  }

  return [p00, p01, p10, p11];
}

/**
 * Generate interpolated points for the given dataset.
 * 
 * @param {Array} data - The dataset to interpolate.
 * @param {number} gridSize - The grid size for interpolation.
 * @returns {Array} - An array of interpolated points.
 */
function generateInterpolatedPoints(data, gridSize) {
  const lats = data.map(p => parseFloat(p.latitude));
  const lons = data.map(p => parseFloat(p.longitude));

  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLon = Math.min(...lons);
  const maxLon = Math.max(...lons);

  const latStep = (maxLat - minLat) / gridSize;
  const lonStep = (maxLon - minLon) / gridSize;

  const interpolatedPoints = [];

  for (let lat = minLat; lat <= maxLat; lat += latStep) {
      for (let lon = minLon; lon <= maxLon; lon += lonStep) {
          const surroundingPoints = getSurroundingPoints(lat, lon, data);
          if (surroundingPoints.includes(undefined)) continue;

          const x = (lon - surroundingPoints[0].longitude) / (surroundingPoints[2].longitude - surroundingPoints[0].longitude);
          const y = (lat - surroundingPoints[0].latitude) / (surroundingPoints[1].latitude - surroundingPoints[0].latitude);

          const interpolatedPressure = bilinearInterpolation(x, y, surroundingPoints);
          if (isNaN(interpolatedPressure)) {
            console.log("Interpolation produced NaN for", lat, lon, "with surrounding points", surroundingPoints);
          }
          if (surroundingPoints.includes(undefined)) {
            console.log("Missing surrounding points for", lat, lon);
            continue;
          }        
          interpolatedPoints.push({ latitude: lat, longitude: lon, sp: interpolatedPressure });
      }
  }

  return interpolatedPoints;
}

/**
 * Determine the color for a given pressure value.
 * 
 * @param {number} pressure - The pressure value to color-code.
 * @returns {Array} - RGB color array.
 */
const getColorForPressureRange = (pressure) => {
  if (pressure <= 98000) {
      return [0, 100, 0];
  } else if (pressure > 98000 && pressure <= 100000) {
      return [255, 165, 0];
  } else {
      return [128, 0, 0];
  }
};

/**
 * Component for visualizing location data on a map.
 * Allows for various types of visualizations including heatmap, scatterplot, and surface pressure.
 * 
 * @param {Object} props - The component's properties.
 * @returns {React.Component} - A rendered map visualization.
 */
const LocationAggregatorMap = ({ upperPercentile = 100, coverage = 1, data, showHeatmap, showScatterplot, showSurfacePressure }) => {
  
  // Memoized generation of interpolated data based on the provided data
  const interpolatedData = useMemo(() => {
    return generateInterpolatedPoints(data, 30);
  }, [data]);
  
  // Definition of map layers based on visualization toggles
  const layers = [
    showHeatmap &&
      new HeatmapLayer({
        id: 'heatMap',
        data: data,
        getPosition: d => [parseFloat(d.longitude), parseFloat(d.latitude)],
        getWeight: d => {
          console.log(d.t2m)
          return parseFloat(d.t2m) - 273.15
        },
        intensity: 1,
        radiusPixels: 650,
        threshold: 0.5,
        colorRange: [
          [1, 152, 189],
          [73, 227, 206],
          [216, 254, 181],
          [254, 237, 177],
          [254, 173, 84],
          [209, 55, 78]
        ]
      }),

    showScatterplot &&
      new ScatterplotLayer({
        id: 'scatterplot-layer',
        data,
        pickable: true,
        opacity: 0.8,
        stroked: true,
        filled: true,
        radiusScale: 1000,
        radiusMinPixels: 1,
        radiusMaxPixels: 100,
        lineWidthMinPixels: 1,
        getPosition: d => [parseFloat(d.longitude), parseFloat(d.latitude)],
        getFillColor: d => [0, 0, 128],
        getLineColor: d => [0, 0, 0]
        }),

      showSurfacePressure &&
      new HexagonLayer({
          id: "heatmap-low",
          data: interpolatedData.filter(d => parseFloat(d.sp) <= 98000),
          getPosition: d => [parseFloat(d.longitude), parseFloat(d.latitude)],
          getElevationWeight: d => parseFloat(d.sp),
          "coverage": 1,
          "pickable": false,
          "autoHighlight": true,
          "elevationRange": [
            10000,
            30000
          ],
          "elevationScale": 0.5,
          "extruded": true,
          "radius": 1500,
          "upperPercentile": 100,
          colorRange: [getColorForPressureRange(98000)],
          material,
      }),

      showSurfacePressure &&
      new HexagonLayer({
          id: "heatmap-mid",
          data: interpolatedData.filter(d => parseFloat(d.sp) > 98000 && parseFloat(d.sp) <= 100000),
          getPosition: d => [parseFloat(d.longitude), parseFloat(d.latitude)],
          getElevationWeight: d => parseFloat(d.sp),
          "coverage": 1,
          "pickable": false,
          "autoHighlight": true,
          "elevationRange": [
            30000,
            60000
          ],
          "elevationScale": 0.5,
          "extruded": true,
          "radius": 2000,
          "upperPercentile": 100,
          colorRange: [getColorForPressureRange(99000)],
          material,
      }),

      showSurfacePressure &&
      new HexagonLayer({
          id: "heatmap-high",
          data: interpolatedData.filter(d => parseFloat(d.sp) > 100000),
          getPosition: d => [parseFloat(d.longitude), parseFloat(d.latitude)],
          getElevationWeight: d => parseFloat(d.sp),
          "coverage": 1,
          "pickable": false,
          "autoHighlight": true,
          "elevationRange": [
            60000,
            90000
          ],
          "elevationScale": 0.5,
          "extruded": true,
          "radius": 3000,
          "upperPercentile": 100,
          colorRange: [getColorForPressureRange(101000)],
          material,
      }),

      showSurfacePressure &&
      new HexagonLayer({
          id: "heatmap-low",
          data: data.filter(d => parseFloat(d.sp) <= 98000),
          getPosition: d => [parseFloat(d.longitude), parseFloat(d.latitude)],
          getElevationWeight: d => parseFloat(d.sp),
          "coverage": 1,
          "pickable": false,
          "autoHighlight": true,
          "elevationRange": [
            10000,
            30000
          ],
          "elevationScale": 0.5,
          "extruded": true,
          "radius": 1500,
          "upperPercentile": 100,
          colorRange: [getColorForPressureRange(98000)],
          material,
      }),

      showSurfacePressure &&
      new HexagonLayer({
          id: "heatmap-mid",
          data: data.filter(d => parseFloat(d.sp) > 98000 && parseFloat(d.sp) <= 100000),
          getPosition: d => [parseFloat(d.longitude), parseFloat(d.latitude)],
          getElevationWeight: d => parseFloat(d.sp),
          "coverage": 1,
          "pickable": false,
          "autoHighlight": true,
          "elevationRange": [
            30000,
            60000
          ],
          "elevationScale": 0.5,
          "extruded": true,
          "radius": 2000,
          "upperPercentile": 100,
          colorRange: [getColorForPressureRange(99000)],
          material,
      }),

      showSurfacePressure &&
      new HexagonLayer({
          id: "heatmap-high",
          data: data.filter(d => parseFloat(d.sp) > 100000),
          getPosition: d => [parseFloat(d.longitude), parseFloat(d.latitude)],
          getElevationWeight: d => parseFloat(d.sp),
          "coverage": 1,
          "pickable": false,
          "autoHighlight": true,
          "elevationRange": [
            60000,
            90000
          ],
          "elevationScale": 0.5,
          "extruded": true,
          "radius": 3000,
          "upperPercentile": 100,
          colorRange: [getColorForPressureRange(101000)],
          material,
      }),
  ];

  return (
    <div>
      <DeckGL
        layers={layers}
        getTooltip={({object}) => object && `Longitude: ${object.longitude}\nLatitude: ${object.latitude}\nTemperature: ${object.t2m}\nd2m: ${object.d2m}\nsp: ${object.sp}\ntcc: ${object.tcc}\ntime: ${object.time}\nu10: ${object.u10}\nu100: ${object.u100}\nv10: ${object.v10}\nv100: ${object.v100}`}
        effects={[lightingEffect]}
        initialViewState={INITIAL_VIEW_STATE}
        controller={true}
      >
        <Map
          className=""
          controller={true}
          mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN}
          //mapStyle="mapbox://styles/petherem/cl2hdvc6r003114n2jgmmdr24"
          mapStyle="mapbox://styles/mapbox/light-v10"
          //mapStyle="mapbox://styles/mapbox/streets-v11"
          //mapStyle="https://basemaps.cartocdn.com/gl/dark-matter-nolabels-gl-style/style.json"
          //mapStyle="mapbox://styles/mapbox/satellite-v9"
        ></Map>
      </DeckGL>
    </div>
  );
};

export default LocationAggregatorMap;
