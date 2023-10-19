"use client";

import React, { useState, useEffect } from "react";
import LocationAggregatorMap from "./components/Map.jsx";
import SidePanel from "./components/SidePanel.jsx";
import "./page.css";

/**
 * HomePage Component
 *
 * This component acts as the main container for the map visualization and the 
 * side panel controls. It manages the state related to the displayed region,
 * date-time settings, and the visibility of various map layers. Data for the 
 * map visualization is fetched based on the selected region and date-time.
 */
const HomePage = () => {
  const [details, setDetails] = useState([]);
  const [regionName, setRegionName] = useState("Rio de Janeiro");
  const [selectedDateTime, setSelectedDateTime] = useState("2022-10-05T00:00");
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [showScatterplot, setShowScatterplot] = useState(false);
  const [showSurfacePressure, setShowSurfacePressure] = useState(false);

  // Toggle functions for map layers' visibility.
  const toggleHeatmap = () => {
    setShowHeatmap(!showHeatmap);
  };

  const toggleScatterplot = () => {
    setShowScatterplot(!showScatterplot);
  };

  const toggleSurfacePressure = () => {
    setShowSurfacePressure(!showSurfacePressure);
  };

  // Fetch data from the server based on the selected region and date-time.
  useEffect(() => {
    const getData = async () => {
      console.log(`region name`, regionName)
      console.log(`selectedDateTime`, selectedDateTime)
      const response = await fetch(
        `../api/getDataRegion?regionName=${regionName}&selectedDateTime=${selectedDateTime}`
      );
      const data = await response.json();
      console.log(data.points)
      setDetails(data.points);
    };

    // Invoke the data fetching function.
    getData();
  }, [regionName, selectedDateTime]); // Re-fetch when region or date-time changes.

  return (
    <div className="homepage-container">
      <div className="homepage-sidepanel">
        <SidePanel 
            regionName={regionName} 
            setRegionName={setRegionName}
            selectedDateTime={selectedDateTime}
            setSelectedDateTime={setSelectedDateTime}
            showHeatmap={showHeatmap}
            showScatterplot={showScatterplot}
            showSurfacePressure={showSurfacePressure}
            toggleHeatmap={toggleHeatmap}
            toggleScatterplot={toggleScatterplot}
            toggleSurfacePressure={toggleSurfacePressure}
          />
      </div>
      <div className="homepage-map">
        <LocationAggregatorMap
          data={details}
          showHeatmap={showHeatmap}
          showScatterplot={showScatterplot}
          showSurfacePressure={showSurfacePressure}
        />
      </div>
    </div>
  );
};

export default HomePage;
