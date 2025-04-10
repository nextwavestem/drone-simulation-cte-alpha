/* eslint-disable react/prop-types */
/* eslint-disable react/no-unknown-property */

import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, Environment,useGLTF, Html,Line } from '@react-three/drei';
import { useRef, useEffect, useState } from "react";
import PropTypes from 'prop-types';
import * as THREE from 'three';
import { Drone } from '../components/Drone.jsx';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader';
import emitter from '../config/eventEmmiter.js';

const loader = new FontLoader(); 
let GlobalCamera;
let GlobalScene;
let lastPosition = null;
let measurementLineColor = "white";
let measurementPinColor = "black";
let dronePathColor = "yellow"
let measurementTextColor="black"

const CameraController = ({ measurementViewEnabled }) => {
  const { camera, gl, scene } = useThree();
  const controlsRef = useRef();

  useEffect(() => {
    if (measurementViewEnabled) {
      camera.position.set(5, 100, -3); // Move camera to top-down view
      camera.lookAt(new THREE.Vector3(0, 0, 0));
      camera.updateProjectionMatrix();

      if (controlsRef.current) {
        controlsRef.current.maxPolarAngle = Math.PI / 2; // Lock to top-down
        controlsRef.current.minPolarAngle = Math.PI / 2;
        controlsRef.current.enableRotate = false; // Disable rotation
      }
    } else {
      // Reset camera to default view
      camera.position.set(50, 50, 50);
      camera.lookAt(new THREE.Vector3(0, 0, 0));
      camera.updateProjectionMatrix();

      if (controlsRef.current) {
        controlsRef.current.maxPolarAngle = Math.PI; // Allow full rotation
        controlsRef.current.minPolarAngle = 0;
        controlsRef.current.enableRotate = true; // Enable rotation
      }
    }
    GlobalCamera = camera;
    GlobalScene = scene;
  }, [measurementViewEnabled, camera]);

  return (
    <>
      {!measurementViewEnabled && (
        <OrbitControls ref={controlsRef} args={[camera, gl.domElement]} />
      )}
    </>
  );
};

const Pin = ({ position }) => {
  return (
    <mesh position={position}>
      <sphereGeometry args={[0.5, 16, 16]} />
      <meshStandardMaterial color={measurementPinColor} />
    </mesh>
  );
};

const handleCanvasClick = (event, setPins, enableMeasurement, droneRef) => {
  if (enableMeasurement) {
    const rect = event.target.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    const y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    const vector = new THREE.Vector3(x, y, 0.5);
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(vector, GlobalCamera);

    // Intersect the city model instead of all buildings
    const intersections = raycaster.intersectObject(GlobalScene, true); // true for recursive

    if (intersections.length > 0) {
      const point = intersections[0].point; // Get the intersection point
      setPins((prevPins) => [...prevPins, point]); // Update pin positions

      if (lastPosition == null) {
        lastPosition = droneRef.current.position.clone(); // Clone to avoid reference issues
      }
      const distance = lastPosition.distanceTo(point);

      // Draw a line from the drone to the intersection point
      const points = [lastPosition, point];
      const lineGeometry = new THREE.BufferGeometry().setFromPoints(points);
      const lineMaterial = new THREE.LineBasicMaterial({ color: measurementLineColor });
      const line = new THREE.Line(lineGeometry, lineMaterial);
      GlobalScene.add(line);
      lastPosition.copy(point); // Update lastPosition to the current intersection point

      // Display the distance near the point
      displayCoordinatesText(`${distance.toFixed(2)} cm`, point);
    }
  }
};

const displayCoordinatesText = (text, position) => {
  loader.load('assets/helvetiker_regular.typeface.json', (font) => {
    const textGeometry = new TextGeometry(text, {
      font: font,
      size: 0.9, // Adjust size as needed
      height: 0.09, // Adjust height
      curveSegments: 1,
      bevelEnabled: false,
      bevelThickness: 0.0,
      bevelSize: 0.03,
      bevelSegments: 2,
    });

    const textMaterial = new THREE.MeshBasicMaterial({ color: measurementTextColor });
    const textMesh = new THREE.Mesh(textGeometry, textMaterial);
    textMesh.position.set(position.x, position.y + 0.4, position.z); // Adjust Y position slightly above the line point
    textMesh.rotation.x = -Math.PI / 2; // Rotate 90 degrees around the X-axis

    GlobalScene.add(textMesh); // Add the text mesh to the scene
  }, undefined, (error) => {
    console.error('An error occurred loading the font:', error);
  });
};

const ScreenshotCapture = () => {
  const { gl } = useThree();

  const captureImage = () => {
    const dataUrl = gl.domElement.toDataURL("image/png");

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = `transportation_${timestamp}.png`;
    link.click();
  };

  useEffect(() => {
    const handleScreenshotCommand = () => {
      captureImage();
    };
    emitter.on('commandTakeScreenShot', handleScreenshotCommand);
    return () => {
      emitter.off('commandTakeScreenShot', handleScreenshotCommand);
    };
  }, []);

  return null; 
};

const Pointer = ({ start, end, label }) => {
  return (
    <group>
      <Line
        points={[start, end]}
        color="black"
        lineWidth={1}
        dashed={false}
      />

      <mesh position={end}>
        <sphereGeometry args={[0.3, 16, 16]} />
        <meshStandardMaterial color="red" />
      </mesh>

      <Html
        position={[end[0] + 0.5, end[1] + 0.5, end[2] + 0]} 
        style={{
          background: 'white',
          padding: '5px 20px',  
          borderRadius: '12px',  
          fontSize: '40px',       
          color: 'black',
          fontWeight: 'bold',
          boxShadow: '0px 0px 8px rgba(0,0,0,0.5)', 
          whiteSpace: 'nowrap',  
          textAlign: 'center',
          marginBottom: '20px'
        }}
        center
        distanceFactor={10}
      >
        {label}
      </Html>
    </group>
  );
};

const droneParts = [
  { start: [5, 2.7, 3], end: [5, 6, 3], label: "Propeller" },
  { start: [3.5, 2.2, 2.5], end: [10, 0, 0], label: "Brushless Motors" },
  { start: [3.5, 1, 2.5], end: [10, -5, 0], label: "Landing Gear" },
  { start: [0, 3, 2], end: [0, 0, 5], label: "Front Camera" },
  { start: [0, 1, 1], end: [-5, 0, 5], label: "Stabilizer" },
  { start: [0, 3, 0], end: [0, 8, 0], label: "Battery Power and Cover" },
  { start: [0, 1.2, 0], end: [-6, 0, 0], label: "Micro SD" },
  { start: [0, 0.5, -1], end: [0, 0, -6], label: "Battery Indicator" },
  { start: [0, 2, 0], end: [-6, 3, 0], label: "Infrared Sensor" },
];


const Engineering = ({
  droneRef,
  measurementViewEnabled,
  mouseControlEnabled,
}) => {
  const controlsRef = useRef();
  const [pins, setPins] = useState([]); // State to track pin positions
    // const droneX = droneRef.current.position.x;
    // const droneY = droneRef.current.position.y;
    // const droneZ = droneRef.current.position.z;

  return (
  <Canvas 
    shadows 
    onClick={(event) => handleCanvasClick(event, setPins, measurementViewEnabled, droneRef)} // Pass click event
  >
      <color attach="background" args={['#ffffff']} /> {/* Set background color */}

      <ambientLight intensity={0.4} color={new THREE.Color(0xffc1a0)} /> {/* Warm light color */}
      <Environment preset="sunset" intensity={0.5} /> {/* Adjusted intensity */}
     

      {pins.map((pin, index) => ( <Pin key={index} position={pin} /> ))}
      <CameraController measurementViewEnabled={measurementViewEnabled} />
      <ScreenshotCapture />
      <Drone
        ref={droneRef}
        controlsRef={controlsRef}
        measurementViewEnabled={measurementViewEnabled}
        mouseControlEnabled={mouseControlEnabled}
        droneScale={2}
        cameraOffset={[0,20,-18]}
        lineColor={dronePathColor} />
        
        {droneParts.map((pointer, index) => (
          <Pointer 
            key={index}
            start={pointer.start}
            end={pointer.end}
            label={pointer.label}
          />
        ))}

  </Canvas>
  );
};

Engineering.propTypes = {
  droneRef: PropTypes.object.isRequired, // Define the prop type
  mouseControlEnabled: PropTypes.bool,
  measurementViewEnabled:  PropTypes.bool,
};

export default Engineering;
