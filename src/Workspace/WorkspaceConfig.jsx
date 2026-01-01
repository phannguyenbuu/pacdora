import React from 'react';
import './WorkspaceConfig.css';

const WorkspaceConfig = () => {
  return (
    <div className="configurator-container">
      {/* 3D Car Scene - User handles this */}
      <div className="car-3d-container">
        {/* Your 3D scene goes here */}
      </div>

      {/* Top Left Panel */}
      <div className="panel panel-top-left">
        <div className="panel-content">
          <h3>Model Info</h3>
          <p>Ferrari 458 Italia</p>
        </div>
      </div>

      {/* Left Bottom Panel */}
      <div className="panel panel-left-bottom">
        <div className="panel-content">
          <h3>Performance</h3>
          <p>0-60: 3.0s</p>
          <p>Top Speed: 202 mph</p>
        </div>
      </div>

      {/* Middle Top Panel */}
      <div className="panel panel-middle-top">
        <div className="panel-content">
          <h3>Color</h3>
          <div className="color-picker">
            <div className="color-option red"></div>
            <div className="color-option black"></div>
            <div className="color-option blue"></div>
          </div>
        </div>
      </div>

      {/* Middle Bottom Panel */}
      <div className="panel panel-middle-bottom">
        <div className="panel-content">
          <h3>Wheels</h3>
          <select>
            <option>Standard</option>
            <option>Sport</option>
          </select>
        </div>
      </div>

      {/* Top Right Panel */}
      <div className="panel panel-top-right">
        <div className="panel-content">
          <h3>Price</h3>
          <div className="price">$289,000</div>
        </div>
      </div>

      {/* Bottom Right Panel */}
      <div className="panel panel-bottom-right">
        <div className="panel-content">
          <button className="save-btn">Save Config</button>
          <button className="share-btn">Share</button>
        </div>
      </div>
    </div>
  );
};

export default WorkspaceConfig;
