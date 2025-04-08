/* eslint-disable react/prop-types */
/* eslint-disable react/no-unknown-property */

import { Canvas, useThree } from "@react-three/fiber";
import { OrbitControls, Environment, useGLTF, Text } from "@react-three/drei";
import { useRef, useEffect, useState } from "react";
import PropTypes from "prop-types";
import * as THREE from "three";
import { Drone } from "../components/Drone.jsx";
import { TextGeometry } from "three/addons/geometries/TextGeometry.js";
import { FontLoader } from "three/examples/jsm/loaders/FontLoader";
import emitter from "../config/eventEmmiter.js";
import SimpleModel from "../components/SimpleModel";

const loader = new FontLoader();
let GlobalCamera;
let GlobalScene;
let lastPosition = null;
let measurementLineColor = "white";
let measurementPinColor = "black";
let dronePathColor = "yellow";
let measurementTextColor = "black";

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
      const lineMaterial = new THREE.LineBasicMaterial({
        color: measurementLineColor,
      });
      const line = new THREE.Line(lineGeometry, lineMaterial);
      GlobalScene.add(line);
      lastPosition.copy(point); // Update lastPosition to the current intersection point

      const coordinatesText = `X: ${point.x.toFixed(
        2
      )} cm, Y: ${point.y.toFixed(2)} cm, Z: ${point.z.toFixed(2)} cm`;
      displayCoordinatesText(coordinatesText, point);
    }
  }
};

const displayCoordinatesText = (text, position) => {
  loader.load(
    "assets/helvetiker_regular.typeface.json",
    (font) => {
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

      const textMaterial = new THREE.MeshBasicMaterial({
        color: measurementTextColor,
      });
      const textMesh = new THREE.Mesh(textGeometry, textMaterial);
      textMesh.position.set(position.x, position.y + 0.4, position.z); // Adjust Y position slightly above the line point
      //textMesh.rotation.x = -Math.PI / 2; // Rotate 90 degrees around the X-axis

      GlobalScene.add(textMesh); // Add the text mesh to the scene
    },
    undefined,
    (error) => {
      console.error("An error occurred loading the font:", error);
    }
  );
};

const Model = () => {
  const { scene } = useGLTF("assets/models/architecture/museum.glb");
  const modelPosition = [50, -70, -130];

  // Set the desired rotation (in radians)
  const rotation = [0, 220, 0]; // Example: Rotate 45 degrees around the Y-axis

  // Apply rotation directly to the scene
  scene.rotation.set(rotation[0], rotation[1], rotation[2]);
  return <primitive object={scene} position={modelPosition} scale={15} />;
};

const ScreenshotCapture = () => {
  const { gl } = useThree();

  const captureImage = () => {
    const dataUrl = gl.domElement.toDataURL("image/png");

    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = `transportation_${timestamp}.png`;
    link.click();
  };

  useEffect(() => {
    const handleScreenshotCommand = () => {
      captureImage();
    };
    emitter.on("commandTakeScreenShot", handleScreenshotCommand);
    return () => {
      emitter.off("commandTakeScreenShot", handleScreenshotCommand);
    };
  }, []);

  return null;
};

const Architecture = ({
  droneRef,
  measurementViewEnabled,
  mouseControlEnabled,
}) => {
  const controlsRef = useRef();
  const [pins, setPins] = useState([]); // State to track pin positions
  const childRef = useRef();
  const frameRef = useRef();
  const firstaidRef = useRef();
  const walletRef = useRef();
  const fireRef = useRef();

  return (
    <Canvas
      shadows
      onClick={(event) =>
        handleCanvasClick(event, setPins, measurementViewEnabled, droneRef)
      } // Pass click event
    >
      <color attach="background" args={["#87CEEB"]} />{" "}
      {/* Set background color */}
      <ambientLight intensity={0.4} color={new THREE.Color(0xffc1a0)} />{" "}
      {/* Warm light color */}
      <Environment preset="sunset" intensity={0.5} /> {/* Adjusted intensity */}
      <Model />
      <Text
        position={[-80, 30, -200]}
        fontSize={5}
        color="white"
        rotation={[0, Math.PI, 0]}
      >
        The Serving Room
      </Text>
      <Text
        position={[-80, 30, -100]}
        fontSize={5}
        color="white"
        rotation={[0, Math.PI, 0]}
      >
        The Dining Room
      </Text>
      <Text
        position={[-10, 30, 50]}
        fontSize={5}
        color="white"
        rotation={[0, Math.PI, 0]}
      >
        The Upper Vestibule
      </Text>
      <Text
        position={[-10, -50, 50]}
        fontSize={5}
        color="white"
        rotation={[0, Math.PI, 0]}
      >
        The Lower Vestibule
      </Text>
      <Text
        position={[-50, 30, 160]}
        fontSize={5}
        color="white"
        rotation={[0, Math.PI, 0]}
      >
        The Small Drawing Room
      </Text>
      <Text
        position={[80, 30, 40]}
        fontSize={5}
        color="white"
        rotation={[0, Math.PI, 0]}
      >
        The Morning Room
      </Text>
      <Text
        position={[80, 30, 140]}
        fontSize={5}
        color="white"
        rotation={[0, Math.PI, 0]}
      >
        The Great Drawing Room
      </Text>
      <Text
        position={[230, 20, 140]}
        fontSize={5}
        color="white"
        rotation={[0, Math.PI, 0]}
      >
        The Smoking Room
      </Text>
      <Text
        position={[200, 20, 40]}
        fontSize={5}
        color="white"
        rotation={[0, Math.PI, 0]}
      >
        The Armoury
      </Text>
      <Text
        position={[210, 20, -100]}
        fontSize={5}
        color="white"
        rotation={[0, Math.PI, 0]}
      >
        The Billiard Room
      </Text>
      <Text
        position={[200, 10, -200]}
        fontSize={5}
        color="white"
        rotation={[0, Math.PI, 0]}
      >
        The Porcelain Room
      </Text>
      {pins.map((pin, index) => (
        <Pin key={index} position={pin} />
      ))}
      <CameraController measurementViewEnabled={measurementViewEnabled} />
      <ScreenshotCapture />
      <Drone
        ref={droneRef}
        controlsRef={controlsRef}
        measurementViewEnabled={measurementViewEnabled}
        mouseControlEnabled={mouseControlEnabled}
        droneScale={0.6}
        cameraOffset={[0, 10, -13]}
        lineColor={dronePathColor}
        droneSpeed={0.4}
      />
      <SimpleModel
        ref={childRef}
        path={`${import.meta.env.BASE_URL}assets/models/architecture/child.glb`}
        position={[160, -5, -200]}
        scale={20}
        enableMeasurement={measurementViewEnabled}
      />
      <SimpleModel
        ref={firstaidRef}
        path={`${
          import.meta.env.BASE_URL
        }assets/models/architecture/first_aid.glb`}
        position={[-35, 10, -200]}
        rotation={[0, Math.PI / 2, 0]}
        scale={40}
        enableMeasurement={measurementViewEnabled}
      />
      <SimpleModel
        ref={frameRef}
        path={`${import.meta.env.BASE_URL}assets/models/architecture/frame.glb`}
        position={[0, -10, 70]}
        rotation={[-90, 0, 0]}
        scale={2}
        enableMeasurement={measurementViewEnabled}
      />
      <SimpleModel
        ref={walletRef}
        path={`${import.meta.env.BASE_URL}assets/models/hospitality/wallet.glb`}
        position={[170, 10, 70]}
        rotation={[0, 0, 0]}
        scale={0.4}
        enableMeasurement={measurementViewEnabled}
      />
      <SimpleModel
        ref={fireRef}
        path={`${import.meta.env.BASE_URL}assets/models/manufacturing/fire.glb`}
        position={[3, 20, 170]}
        rotation={[0, 140, 0]}
        scale={0.03}
        enableMeasurement={measurementViewEnabled}
      />
    </Canvas>
  );
};

Architecture.propTypes = {
  droneRef: PropTypes.object.isRequired, // Define the prop type
  mouseControlEnabled: PropTypes.bool,
  measurementViewEnabled: PropTypes.bool,
};

export default Architecture;
