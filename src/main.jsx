import React from "react";
import { HashRouter, Routes, Route } from "react-router-dom";
import ReactDOM from "react-dom/client";
import DroneSlateSimulator from "./simulators/DroneSlateSimulator.jsx";
import DroneArchitectureSimulator from './simulators/DroneArchitectureSimulator.jsx'
import DroneTransportationSimulator from "./simulators/DroneTransportationSimulator.jsx";
import DroneBusinessSimulator from './simulators/DroneBusinessSimulator.jsx';
import DroneEducationSimulator from './simulators/DroneEducationSimulator.jsx';
import DroneCommunicationSimulator from './simulators/DroneCommunicationSimulator.jsx';
import DroneEngineeringSimulator from './simulators/DroneEngineeringSimulator.jsx'
import DroneHealthScienceSimulator from './simulators/DroneHealthScienceSimulator.jsx'
import DroneHumanServicesSimulator from './simulators/DroneHumanServicesSimulator.jsx'
import DroneITSimulator from './simulators/DroneITSimulator.jsx'
import DroneAgricultureSimulator from './simulators/DroneITSimulator.jsx'

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <HashRouter>
      <Routes>
        <Route path="/" element={<DroneTransportationSimulator />} />
        <Route path="/transportation" element={<DroneTransportationSimulator />} />
        <Route path="/architecture" element={<DroneArchitectureSimulator />} />
        <Route path="/business" element={<DroneBusinessSimulator />} />
        <Route path="/education" element={<DroneEducationSimulator />} />
        <Route path="/communication" element={<DroneCommunicationSimulator />} />
        <Route path="/engineering" element={<DroneEngineeringSimulator />} />
        <Route path="/healthscience" element={<DroneHealthScienceSimulator />} />
        <Route path="/human-services" element={<DroneHumanServicesSimulator />} />
        <Route path="/information-technology" element={<DroneITSimulator />} />
        <Route path="/agriculture" element={<DroneAgricultureSimulator />} />

        <Route path="/slate" element={<DroneSlateSimulator />} />

      </Routes>
    </HashRouter>
  </React.StrictMode>
);
