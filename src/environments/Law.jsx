/* eslint-disable react/prop-types */
/* eslint-disable react/no-unknown-property */

import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, Environment,useGLTF, Line, Text } from '@react-three/drei';
import { useRef, useEffect, useState, useMemo } from "react";
import PropTypes from 'prop-types';
import * as THREE from 'three';
import { Drone } from '../components/Drone.jsx';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader';
import emitter from '../config/eventEmmiter.js';
import { clone } from 'three/examples/jsm/utils/SkeletonUtils';

const loader = new FontLoader(); 
let GlobalCamera;
let GlobalScene;
let lastPosition = null;
let measurementLineColor = "white";
let measurementPinColor = "black";
let dronePathColor = "yellow"
let measurementTextColor="yellow"

const CameraController = ({ measurementViewEnabled }) => {
  const { camera, gl, scene } = useThree();
  const controlsRef = useRef();

  useEffect(() => {
    if (measurementViewEnabled) {
      camera.position.set(0, 100, -3); // Move camera to top-down view
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
      const coordinatesText = `X: ${point.x.toFixed(2)} cm, Y: ${point.y.toFixed(2)} cm, Z: ${point.z.toFixed(2)} cm`;

      // Display the distance near the point
      displayCoordinatesText(coordinatesText, point);
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



const Model = () => {
  const { scene } = useGLTF('assets/models/transportation/future_city_compressed.glb'); 
  const modelPosition = [-200, -5, 90];

  // Set the desired rotation (in radians)
  const rotation = [0, 0, 0]; // Example: Rotate 45 degrees around the Y-axis

  // Apply rotation directly to the scene
  scene.rotation.set(rotation[0], rotation[1], rotation[2]);
  return <primitive object={scene} position={modelPosition} scale={1} />;
};

const ChargingCar = ({ position, rotation, scale = 0.02, text = "0", type="car" }) => {
  let scene;
  if (type === "truck") {
    scene = useGLTF('assets/models/transportation/truck.glb').scene;
  } else {
    scene = useGLTF('assets/models/transportation/tesla.glb').scene;
  }
  

  const clonedScene = useMemo(() => {
    const cloneScene = clone(scene);
    cloneScene.rotation.set(rotation[0], rotation[1], rotation[2]);
    return cloneScene;
  }, [scene, rotation]);

  const start = [position[0], position[1] + 5, position[2]]; 
  const end = position;

  return (
    <>
      {/* Pointer Line */}
      <Line points={[start, end]}  color="white" lineWidth={2} />
      
      <Text position={[start[0], start[1] + 3, start[2]]} rotation={[0,90,0]}
        fontSize={3} color="red" anchorX="center" anchorY="middle" >
        {text}
      </Text>

      <primitive object={clonedScene} position={position} scale={scale} />
    </>
  );
};

const Car = ({ position, rotation, scale = 0.02 }) => {
  const { scene } = useGLTF('assets/models/transportation/tesla.glb');
  const clonedScene = clone(scene); 
  clonedScene.rotation.set(rotation[0], rotation[1], rotation[2]);

  return <primitive object={clonedScene} position={position} scale={scale} />;
};


const Truck = ({ position, rotation, scale = 3 }) => {
  const { scene } = useGLTF('assets/models/transportation/truck.glb');
  const clonedScene = clone(scene); 
  clonedScene.rotation.set(rotation[0], rotation[1], rotation[2]);

  return <primitive object={clonedScene} position={position} scale={scale} />;
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

const Law = ({
  droneRef,
  measurementViewEnabled,
  mouseControlEnabled,
}) => {
  const controlsRef = useRef();
  const [pins, setPins] = useState([]); // State to track pin positions
  
  return (
  <Canvas 
    shadows 
    onClick={(event) => handleCanvasClick(event, setPins, measurementViewEnabled, droneRef)} // Pass click event
  >
      <color attach="background" args={['#000000']} /> {/* Set background color */}

      <ambientLight intensity={0.4} color={new THREE.Color(0xffc1a0)} /> {/* Warm light color */}
      <Environment preset="sunset" intensity={0.5} /> {/* Adjusted intensity */}
      <Model />

      {pins.map((pin, index) => ( <Pin key={index} position={pin} /> ))}
      <CameraController measurementViewEnabled={measurementViewEnabled} />
      <ScreenshotCapture />
      <Drone
        ref={droneRef}
        controlsRef={controlsRef}
        measurementViewEnabled={measurementViewEnabled}
        mouseControlEnabled={mouseControlEnabled}
        droneScale={0.3}
        cameraOffset={[0, 5, -20]}
        lineColor={dronePathColor}
      />
      <Car position={[0, -5, 91]} rotation={[0, 110, 0]}/>
      <Car position={[25, -5, 91]} rotation={[0, 110, 0]}/>
      <Car position={[6, -5, 95]} rotation={[0, 0, 0]}/>

      <Car position={[37, -5, 40]} rotation={[0, 17.3, 0]}/>
      <Truck position={[33, -3.4, 60]} rotation={[0, 0, 0]}/>


      <Car position={[-30, -5, 40]} rotation={[0, 17.3, 0]}/>
      <Truck position={[-30, -3.4, 60]} rotation={[0, 0, 0]}/>



      {/*  charging cars */}

      <ChargingCar position={[-50, -5, 40]} rotation={[0, 17.3, 0]} text="0"/>
      <ChargingCar position={[-55, -5, 40]} rotation={[0, 17.3, 0]} text="15"/>
      <ChargingCar position={[-60, -5, 40]} rotation={[0, 17.3, 0]} text="30"/>
      <ChargingCar position={[-65, -5, 40]} rotation={[0, 17.3, 0]} text="6"/>
      <ChargingCar position={[-70, -5, 40]} rotation={[0, 17.3, 0]} text="2"/>
      <ChargingCar position={[-75, -5, 40]} rotation={[0, 17.3, 0]} text="50"/>

      <ChargingCar position={[-50, -3.4, 20]} rotation={[0, 0, 0]} text="30" type="truck" scale={3}/>
      <ChargingCar position={[-57, -3.4, 20]} rotation={[0, 0, 0]} text="0" type="truck" scale={3}/>
      <ChargingCar position={[-64, -3.4, 20]} rotation={[0, 0, 0]} text="51" type="truck" scale={3}/>
  </Canvas>
  );
};

Law.propTypes = {
  droneRef: PropTypes.object.isRequired, // Define the prop type
  mouseControlEnabled: PropTypes.bool,
  measurementViewEnabled:  PropTypes.bool,
};

export default Law;
