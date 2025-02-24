import React from "react";
import { HashRouter, Routes, Route } from "react-router-dom";
import ReactDOM from "react-dom/client";
import DroneSlateSimulator from "./simulators/DroneSlateSimulator.jsx";
import DroneArchitectureSimulator from './simulators/DroneArchitectureSimulator.jsx'
import DroneTransportationSimulator from "./simulators/DroneTransportationSimulator.jsx";
import DroneBusinessSimulator from './simulators/DroneBusinessSimulator.jsx';

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <HashRouter>
      <Routes>
        <Route path="/" element={<DroneTransportationSimulator />} />
        <Route path="/transportation" element={<DroneTransportationSimulator />} />
        <Route path="/architecture" element={<DroneArchitectureSimulator />} />
        <Route path="/business" element={<DroneBusinessSimulator />} />
        <Route path="/slate" element={<DroneSlateSimulator />} />

      </Routes>
    </HashRouter>
  </React.StrictMode>
);
