import { AppContainer } from '../components/AppContainer.jsx';
import { useRef, useState, useEffect } from "react";
import {Toolbar} from '../components/Toolbar.jsx'
import emitter from '../config/eventEmmiter.js';
import Communication from '../environments/Communication.jsx';

import BlockPad from '../components/blockly/BlockPad.jsx';
import "../css/droneCommunicationSimulator.css";

const DroneCommunicationSimulator = () => {
  window.gtag('event', 'page_view', { page_path: window.location.pathname });

  const droneRef = useRef(); // Create a ref for the Drone component
  const [measurementView, setMeasurementView] = useState(false);
  const [mouseControl, setMouseControl] = useState(false);

  const [dronePosition, setDronePosition] = useState({
    xPos: 0,
    yPos: 0,
    zPos: 0,
    xRot: 0,
    yRot: 0,
    zRot: 0
  });

  useEffect(() => {
    const setMeasurementViewValue = (value) => { setMeasurementView(value); };
    const setMouseControlValue = (value) => { setMouseControl(value); };

    
    emitter.on('measurementViewEnabled', setMeasurementViewValue);
    emitter.on('mouseControlEnabled', setMouseControlValue);

    const updateDronePosition = () => {
      if (droneRef.current) {
        setDronePosition({
          xPos: droneRef.current.position.x,
          yPos: droneRef.current.position.y,
          zPos: droneRef.current.position.z,
          xRot: droneRef.current.rotation.x,
          yRot: droneRef.current.rotation.y,
          zRot: droneRef.current.rotation.z,
        });
      }
    };

    // Set up a recurring interval to check the drone’s position
    const interval = setInterval(updateDronePosition, 100); // Updates every 100 ms
      return () => clearInterval(interval); // Clean up on unmount
    }, []);
  
    return (
      <AppContainer>     
          <div className="simulation-container">
            <div className="blockpad-container">
              <BlockPad/>
            </div>
            
            <div className="transportation-canvas-container">
              <Toolbar dronePosition={dronePosition} />
              <Communication 
                droneRef={droneRef} 
                measurementViewEnabled={measurementView}
                mouseControlEnabled={mouseControl} />
            </div>
          </div>
      </AppContainer>
    );
};

export default DroneCommunicationSimulator;
