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
import ScreenshotCapture from "../components/ScreenshotCapture.jsx";

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
      camera.position.set(5, 18, -5); // Move camera to top-down view
      camera.lookAt(new THREE.Vector3(-2, -3, 11));
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
      //textMesh.rotation.x = -Math.PI / 2; // Rotate 90 degrees around the X-axis
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
  const { scene } = useGLTF("assets/models/education/classroom2.glb");
  //const modelPosition = [175, -85, 120];
  const modelPosition = [35, -11, 13];
  // Set the desired rotation (in radians)
  const rotation = [0, 240, 0]; // Example: Rotate 45 degrees around the Y-axis

  // Apply rotation directly to the scene
  scene.rotation.set(rotation[0], rotation[1], rotation[2]);
  return <primitive object={scene} position={modelPosition} scale={9} />;
};

const Education = ({
  droneRef,
  measurementViewEnabled,
  mouseControlEnabled,
}) => {
  const controlsRef = useRef();
  const [pins, setPins] = useState([]); // State to track pin positions
  const bookRef = useRef();
  const bookReff = useRef();
  const bookRef1 = useRef();
  const bookRef2 = useRef();
  const droneCameraRef = useRef();

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
      <ScreenshotCapture
        droneCameraRef={droneCameraRef}
        environment="education"
      />
      <Drone
        ref={droneRef}
        controlsRef={controlsRef}
        measurementViewEnabled={measurementViewEnabled}
        mouseControlEnabled={mouseControlEnabled}
        droneScale={0.8}
        cameraOffset={[5, 9, -12]}
        lineColor={dronePathColor}
        droneSpeed={0.4}
        droneCameraRef={droneCameraRef}
      />
      <SimpleModel
        ref={bookRef}
        path={`${import.meta.env.BASE_URL}assets/models/education/book.glb`}
        position={[7, -3, 18]}
        scale={1}
        name="book1"
        enableMeasurement={measurementViewEnabled}
      />
      <SimpleModel
        ref={bookReff}
        path={`${import.meta.env.BASE_URL}assets/models/education/book.glb`}
        position={[12, -1.5, 47]}
        scale={1}
        name="book2"
        enableMeasurement={measurementViewEnabled}
      />
      <SimpleModel
        ref={bookRef1}
        path={`${import.meta.env.BASE_URL}assets/models/education/books.glb`}
        position={[3, -1.5, 1]}
        scale={0.6}
        name="book3"
        enableMeasurement={measurementViewEnabled}
      />
      <SimpleModel
        ref={bookRef2}
        path={`${import.meta.env.BASE_URL}assets/models/education/books.glb`}
        position={[3, -1.5, -0.5]}
        scale={0.6}
        name="book4"
        enableMeasurement={measurementViewEnabled}
      />
      <SimpleModel
        path={`${import.meta.env.BASE_URL}assets/models/education/pen.glb`}
        position={[-14, -8, 20]}
        scale={0.3}
        name="pen1"
        enableMeasurement={measurementViewEnabled}
      />
      <SimpleModel
        path={`${import.meta.env.BASE_URL}assets/models/infotech/trashcan.glb`}
        position={[-9, -10, -2]}
        scale={4}
        name="trashcan"
        enableMeasurement={measurementViewEnabled}
      />
      <SimpleModel
        path={`${import.meta.env.BASE_URL}assets/models/infotech/paper.glb`}
        position={[-7, -10, 48]}
        scale={1}
        name="trash1"
        enableMeasurement={measurementViewEnabled}
      />
      <SimpleModel
        path={`${import.meta.env.BASE_URL}assets/models/infotech/paper.glb`}
        position={[-27, -10, 3]}
        scale={1}
        name="trash2"
        enableMeasurement={measurementViewEnabled}
      />
    </Canvas>
  );
};

Education.propTypes = {
  droneRef: PropTypes.object.isRequired, // Define the prop type
  mouseControlEnabled: PropTypes.bool,
  measurementViewEnabled: PropTypes.bool,
};

export default Education;
