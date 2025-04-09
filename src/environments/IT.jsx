/* eslint-disable react/prop-types */
/* eslint-disable react/no-unknown-property */

import { Canvas, useThree } from "@react-three/fiber";
import { OrbitControls, Environment, useGLTF } from "@react-three/drei";
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
      camera.position.set(20, 70, -40); // Move camera to top-down view
      camera.lookAt(new THREE.Vector3(20, 20, 10));
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

      // Display the distance near the point
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
      //textMesh.rotation.x = Math.PI; // Rotate 90 degrees around the X-axis
      textMesh.lookAt(GlobalCamera.position);
      GlobalScene.add(textMesh); // Add the text mesh to the scene
    },
    undefined,
    (error) => {
      console.error("An error occurred loading the font:", error);
    }
  );
};

const Model = () => {
  const { scene } = useGLTF("assets/models/infotech/office1.glb");
  const modelPosition = [-105, -18, 45];
  //const modelPosition = [-300, -22, -125];
  // Set the desired rotation (in radians)
  const rotation = [0, 90, 0]; // Example: Rotate 45 degrees around the Y-axis

  // Apply rotation directly to the scene
  scene.rotation.set(rotation[0], rotation[1], rotation[2]);
  return <primitive object={scene} position={modelPosition} scale={20} />;
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

const IT = ({ droneRef, measurementViewEnabled, mouseControlEnabled }) => {
  const controlsRef = useRef();
  const [pins, setPins] = useState([]); // State to track pin positions
  const shelfRef = useRef();
  const desktopRef1 = useRef();
  const desktopRef2 = useRef();
  const deskRef = useRef();
  const trashcanRef = useRef();
  const bananaRef = useRef();
  const paperRef = useRef();
  const alphabetRef1 = useRef();
  const alphabetRef2 = useRef();

  useEffect(() => {
    const handlePickup = (objectName) => {
      const drone = droneRef.current;
      const book = GlobalScene.getObjectByName(objectName);
      if (!drone || !book) return;

      const dronePos = new THREE.Vector3();
      const bookPos = new THREE.Vector3();
      drone.getWorldPosition(dronePos);
      book.getWorldPosition(bookPos);
      const distance = dronePos.distanceTo(bookPos);

      if (distance < 15) {
        drone.attach(book);
        book.position.set(0, 2, 0);
        console.log(`Picked up ${objectName}`);
      } else {
        console.log(`${objectName} too far to pick up.`);
      }
    };

    const handleDrop = (objectName) => {
      const drone = droneRef.current;
      const book = GlobalScene.getObjectByName(objectName);
      if (!drone || !book) return;

      GlobalScene.attach(book);
      const dropPosition = new THREE.Vector3();
      drone.getWorldPosition(dropPosition);
      book.position.copy(dropPosition);
      console.log(`Dropped ${objectName}`);
    };

    emitter.on("commandPickupObject", handlePickup);
    emitter.on("commandDropObject", handleDrop);

    return () => {
      emitter.off("commandPickupObject", handlePickup);
      emitter.off("commandDropObject", handleDrop);
    };
  }, []);
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
        droneScale={0.5}
        cameraOffset={[-5.5, 5, -9]}
        lineColor={dronePathColor}
        droneSpeed={0.1}
      />
      <SimpleModel
        ref={desktopRef1}
        path={`${import.meta.env.BASE_URL}assets/models/infotech/desktop.glb`}
        position={[32, -6, 6]}
        rotation={[0, Math.PI + 45, 0]}
        scale={2}
        name="desktop1"
        enableMeasurement={measurementViewEnabled}
      />
      <SimpleModel
        ref={shelfRef}
        path={`${import.meta.env.BASE_URL}assets/models/infotech/shelf.glb`}
        position={[35, -17, 4]}
        rotation={[0, Math.PI / 4, 0]}
        scale={15}
        enableMeasurement={measurementViewEnabled}
      />
      <SimpleModel
        ref={desktopRef2}
        path={`${import.meta.env.BASE_URL}assets/models/infotech/desktop.glb`}
        position={[32, 1, 6]}
        rotation={[0, Math.PI + 45, 0]}
        scale={2}
        name="desktop2"
        enableMeasurement={measurementViewEnabled}
      />
      <SimpleModel
        ref={trashcanRef}
        path={`${import.meta.env.BASE_URL}assets/models/infotech/trashcan.glb`}
        position={[30, -18, 10]}
        rotation={[0, Math.PI / 2, 0]}
        scale={9}
        //name="trashcan"
        enableMeasurement={measurementViewEnabled}
      />
      <SimpleModel
        ref={deskRef}
        path={`${import.meta.env.BASE_URL}assets/models/infotech/desk.glb`}
        position={[-3, -5, 80]}
        rotation={[0, Math.PI / 5, 0]}
        scale={5}
        enableMeasurement={measurementViewEnabled}
      />
      <SimpleModel
        ref={bananaRef}
        path={`${import.meta.env.BASE_URL}assets/models/infotech/banana.glb`}
        position={[15, -1, 10]}
        rotation={[0, Math.PI / 2, 0]}
        scale={9}
        name="peel"
        enableMeasurement={measurementViewEnabled}
      />
      <SimpleModel
        ref={paperRef}
        path={`${import.meta.env.BASE_URL}assets/models/infotech/paper.glb`}
        position={[20, -18, 5]}
        //rotation={[0, Math.PI, 0]}
        scale={2}
        name="paper"
        enableMeasurement={measurementViewEnabled}
      />
      <SimpleModel
        ref={alphabetRef1}
        path={`${import.meta.env.BASE_URL}assets/models/infotech/alphabet1.glb`}
        position={[-2.5, 0.5, 96.5]}
        //rotation={[0, Math.PI, 0]}
        scale={7}
        enableMeasurement={measurementViewEnabled}
      />
      <SimpleModel
        ref={alphabetRef2}
        path={`${import.meta.env.BASE_URL}assets/models/infotech/alphabet2.glb`}
        position={[27, 0, 138.3]}
        rotation={[0, 110, 0]}
        scale={7}
        enableMeasurement={measurementViewEnabled}
      />
    </Canvas>
  );
};

IT.propTypes = {
  droneRef: PropTypes.object.isRequired, // Define the prop type
  mouseControlEnabled: PropTypes.bool,
  measurementViewEnabled: PropTypes.bool,
};

export default IT;
