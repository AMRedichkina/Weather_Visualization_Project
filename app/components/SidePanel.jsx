import React from 'react';
import "./SidePanel.css";

/**
 * SidePanel Component: Displays control elements like input fields and toggle buttons.
 *
 * @param {Object} props - Properties passed to the component.
 * @param {string} props.regionName - Current region name.
 * @param {Function} props.setRegionName - Setter function for region name.
 * @param {string} props.selectedDateTime - Currently selected date and time.
 * @param {Function} props.setSelectedDateTime - Setter function for date and time.
 * @param {boolean} props.showHeatmap - Toggle state for heatmap visualization.
 * @param {boolean} props.showScatterplot - Toggle state for scatterplot visualization.
 * @param {boolean} props.showSurfacePressure - Toggle state for surface pressure visualization.
 * @param {Function} props.toggleHeatmap - Function to toggle heatmap visibility.
 * @param {Function} props.toggleScatterplot - Function to toggle scatterplot visibility.
 * @param {Function} props.toggleSurfacePressure - Function to toggle surface pressure visibility.
 * 
 * @returns {React.Component} Rendered side panel component.
 */
const SidePanel = ({ 
    regionName, 
    setRegionName,
    selectedDateTime,
    setSelectedDateTime,
    showHeatmap,
    showScatterplot,
    showSurfacePressure,
    toggleHeatmap,
    toggleScatterplot,
    toggleSurfacePressure,
}) => {
    return (
        <div className="sidepanel">
            <h2 className="sidepanel-region">Region</h2>
            <input
                type="text"
                placeholder="Region Name"
                value={regionName}
                onChange={(e) => setRegionName(e.target.value)}
                className="sidepanel-input"
            />
            <h2 className="sidepanel-region">Data and Time</h2>
            <input
                type="datetime-local"
                value={selectedDateTime}
                onChange={(e) => setSelectedDateTime(e.target.value)}
                className="sidepanel-input"
            />
            <h2 className="sidepanel-region">Layers</h2>
            <button
                onClick={toggleScatterplot}
                className={`sidepanel-button ${showScatterplot ? 'button-scatterplot-active' : 'button-scatterplot-inactive'}`}
            >
                {showScatterplot ? 'Information' : 'Information'}
            </button>
            <button
                onClick={toggleHeatmap}
                className={`sidepanel-button ${showHeatmap ? 'button-heatmap-active' : 'button-heatmap-inactive'}`}
            >
                {showHeatmap ? 'Temperature (Heatmap)' : 'Temperature (Heatmap)'}
            </button>
            <button
                onClick={toggleSurfacePressure}
                className={`sidepanel-button ${showSurfacePressure ? 'button-heatmap-active' : 'button-heatmap-inactive'}`}
            >
                {showHeatmap ? 'Surface Pressure' : 'Surface Pressure'}
            </button>
            
        </div>
      );
    };
    
    export default SidePanel;
