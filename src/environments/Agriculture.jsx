/* eslint-disable react/prop-types */
/* eslint-disable react/no-unknown-property */

import { Canvas, useThree } from "@react-three/fiber";
import { OrbitControls, Environment, useGLTF } from "@react-three/drei";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
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
      camera.position.set(5, 100, -5); // Move camera to top-down view
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
        size: 2, // Adjust size as needed
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
      //textMesh.lookAt(GlobalCamera.position);
      textMesh.quaternion.copy(GlobalCamera.quaternion);

      GlobalScene.add(textMesh); // Add the text mesh to the scene
    },
    undefined,
    (error) => {
      console.error("An error occurred loading the font:", error);
    }
  );
};

const Model = () => {
  const { scene } = useGLTF("assets/models/agriculture/farm.glb");
  //const modelPosition = [-300, 50, 300];
  const modelPosition = [0, 0, 175];
  // Set the desired rotation (in radians)
  const rotation = [0, 45, 0]; // Example: Rotate 45 degrees around the Y-axis

  // Apply rotation directly to the scene
  scene.rotation.set(rotation[0], rotation[1], rotation[2]);
  return <primitive object={scene} position={modelPosition} scale={10} />;
};

const Agriculture = ({
  droneRef,
  measurementViewEnabled,
  mouseControlEnabled,
}) => {
  const controlsRef = useRef();
  const droneCameraRef = useRef();
  const [pins, setPins] = useState([]); // State to track pin positions
  const barnRef = useRef();
  const birdRef1 = useRef();
  const birdRef2 = useRef();
  const birdRef3 = useRef();
  const canRef = useRef();
  const pestRef1 = useRef();
  const pestRef2 = useRef();
  const pollenRef1 = useRef();
  const pollenRef2 = useRef();

  useEffect(() => {
    let waterDroplet;
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
    const handleSpray = () => {
      const waterCan = canRef.current; // Access the watercan reference
      if (!waterCan) return;

      const loader = new GLTFLoader();
      loader.load(
        `${import.meta.env.BASE_URL}assets/models/agriculture/water.glb`,
        (gltf) => {
          const waterDroplet = gltf.scene;

          // Position the water droplet below the can
          const canPosition = new THREE.Vector3();
          waterCan.getWorldPosition(canPosition);

          waterDroplet.position.set(
            canPosition.x + 3,
            canPosition.y,
            canPosition.z
          );
          waterDroplet.scale.set(30, 30, 30);
          waterDroplet.visible = true;

          GlobalScene.add(waterDroplet);

          // Animate the water droplet falling
          const animationSpeed = 0.09;
          const intervalId = setInterval(() => {
            waterDroplet.position.y -= animationSpeed;
            console.log(
              `Droplet falling at Y position: `,
              waterDroplet.position.y
            );

            if (waterDroplet.position.y < -4) {
              // Adjust ground level if needed
              GlobalScene.remove(waterDroplet); // Remove the droplet when it reaches the ground
              clearInterval(intervalId);
            }
          }, 16); // 60 FPS
        },
        undefined,
        (error) => {
          console.error("Failed to load water droplet model:", error);
        }
      );
    };

    emitter.on("commandPickupObject", handlePickup);
    emitter.on("commandDropObject", handleDrop);
    emitter.on("commandSpray", handleSpray);

    return () => {
      emitter.off("commandPickupObject", handlePickup);
      emitter.off("commandDropObject", handleDrop);
      emitter.off("commandSpray", handleSpray);
    };
  }, []);
  useEffect(() => {
    const birdRefs = [birdRef1, birdRef2, birdRef3];
    const hasFlownMap = new Map(); // Track which birds have flown
    const flyingIntervals = new Map(); // Store intervals per bird

    const handleBirdFlight = () => {
      const drone = droneRef.current;
      if (!drone) return;

      const dronePosition = new THREE.Vector3();
      drone.getWorldPosition(dronePosition);

      birdRefs.forEach((ref, index) => {
        const bird = ref.current;
        if (!bird || hasFlownMap.get(index)) return;

        const birdPosition = new THREE.Vector3();
        bird.getWorldPosition(birdPosition);

        const distance = dronePosition.distanceTo(birdPosition);

        if (distance < 20 && !hasFlownMap.get(index)) {
          hasFlownMap.set(index, true); // Mark this bird as flown

          const flightSpeed = 0.15;
          const interval = setInterval(() => {
            bird.position.y += flightSpeed;
            bird.position.x += flightSpeed * 0.5;

            if (bird.position.y > 40) {
              clearInterval(interval);
              flyingIntervals.delete(index);
            }
          }, 16);

          flyingIntervals.set(index, interval);
        }
      });
    };

    const intervalId = setInterval(handleBirdFlight, 1000);

    return () => {
      clearInterval(intervalId);
      flyingIntervals.forEach((interval) => clearInterval(interval));
    };
  }, [droneRef, birdRef1, birdRef2, birdRef3]);

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
        environment="agriculture"
      />
      <Drone
        ref={droneRef}
        controlsRef={controlsRef}
        measurementViewEnabled={measurementViewEnabled}
        mouseControlEnabled={mouseControlEnabled}
        droneScale={0.9}
        cameraOffset={[0, 10, -20]}
        lineColor={dronePathColor}
        droneSpeed={0.6}
        droneCameraRef={droneCameraRef}
      />
      <SimpleModel
        ref={birdRef1}
        path={`${import.meta.env.BASE_URL}assets/models/agriculture/bird.glb`}
        position={[15, 50, 75]}
        scale={10}
        name="bird1"
        enableMeasurement={measurementViewEnabled}
      />
      <SimpleModel
        ref={birdRef2}
        path={`${import.meta.env.BASE_URL}assets/models/agriculture/bird.glb`}
        position={[-85, 70, -35]}
        scale={10}
        name="bird2"
        enableMeasurement={measurementViewEnabled}
      />
      <SimpleModel
        ref={birdRef3}
        path={`${import.meta.env.BASE_URL}assets/models/agriculture/bird.glb`}
        position={[105, 30, 45]}
        scale={10}
        name="bird3"
        enableMeasurement={measurementViewEnabled}
      />
      <SimpleModel
        ref={canRef}
        path={`${import.meta.env.BASE_URL}assets/models/agriculture/can.glb`}
        position={[-70, 2, 140]}
        rotation={[0, Math.PI / 2, 0]}
        scale={20}
        name="watercan"
        enableMeasurement={measurementViewEnabled}
      />
      {/*<SimpleModel
        ref={barnRef}
        path={`${import.meta.env.BASE_URL}assets/models/agriculture/barn.glb`}
        position={[18, -2, 4]}
        scale={40}
        enableMeasurement={measurementViewEnabled}
      />*/}
      <SimpleModel
        ref={pestRef1}
        path={`${
          import.meta.env.BASE_URL
        }assets/models/agriculture/pesticides.glb`}
        position={[10.43, 0, -45.13]}
        rotation={[0, Math.PI / 2, 0]}
        scale={20}
        name="pesticide1"
        enableMeasurement={measurementViewEnabled}
      />
      <SimpleModel
        ref={pestRef2}
        path={`${
          import.meta.env.BASE_URL
        }assets/models/agriculture/pesticides.glb`}
        position={[120.91, 0.27, 130.75]}
        rotation={[0, Math.PI / 2, 0]}
        scale={20}
        name="pesticide2"
        enableMeasurement={measurementViewEnabled}
      />
      <SimpleModel
        ref={pollenRef1}
        path={`${import.meta.env.BASE_URL}assets/models/agriculture/pollen.glb`}
        position={[47, 49, 97]}
        rotation={[0, Math.PI / 2, Math.PI / 2]}
        scale={0.3}
        name="pollen1"
        enableMeasurement={measurementViewEnabled}
      />
      <SimpleModel
        ref={pollenRef2}
        path={`${import.meta.env.BASE_URL}assets/models/agriculture/pollen.glb`}
        position={[13, 48, 100]}
        rotation={[0, Math.PI / 2, Math.PI / 2]}
        scale={0.3}
        name="pollen2"
        enableMeasurement={measurementViewEnabled}
      />
    </Canvas>
  );
};

Agriculture.propTypes = {
  droneRef: PropTypes.object.isRequired, // Define the prop type
  mouseControlEnabled: PropTypes.bool,
  measurementViewEnabled: PropTypes.bool,
};

export default Agriculture;
