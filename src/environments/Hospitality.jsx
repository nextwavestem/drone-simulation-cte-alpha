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
      camera.position.set(5, 50, -3); // Move camera to top-down view
      camera.lookAt(new THREE.Vector3(0, 0, 0));
      camera.updateProjectionMatrix();

      if (controlsRef.current) {
        controlsRef.current.maxPolarAngle = Math.PI / 2;
        controlsRef.current.minPolarAngle = Math.PI / 2;
        controlsRef.current.enableRotate = false;
      }
    } else {
      //camera.position.set(50, 50, 50);
      camera.position.set(5, 5, 20);
      camera.lookAt(new THREE.Vector3(0, 0, 0));
      camera.updateProjectionMatrix();

      if (controlsRef.current) {
        controlsRef.current.maxPolarAngle = Math.PI;
        controlsRef.current.minPolarAngle = 0;
        controlsRef.current.enableRotate = true;
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

    const intersections = raycaster.intersectObject(GlobalScene, true);

    if (intersections.length > 0) {
      const point = intersections[0].point;
      setPins((prevPins) => [...prevPins, point]);

      if (lastPosition == null) {
        lastPosition = droneRef.current.position.clone();
      }
      const distance = lastPosition.distanceTo(point);

      const points = [lastPosition, point];
      const lineGeometry = new THREE.BufferGeometry().setFromPoints(points);
      const lineMaterial = new THREE.LineBasicMaterial({
        color: measurementLineColor,
      });
      const line = new THREE.Line(lineGeometry, lineMaterial);
      GlobalScene.add(line);
      lastPosition.copy(point);
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
        size: 1,
        height: 0.09,
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
      textMesh.position.set(position.x, position.y + 0.4, position.z);
      //textMesh.rotation.x = -Math.PI / 2;
      textMesh.lookAt(GlobalCamera.position);
      GlobalScene.add(textMesh);
    },
    undefined,
    (error) => {
      console.error("An error occurred loading the font:", error);
    }
  );
};

const Model = () => {
  const { scene } = useGLTF("assets/models/hospitality/room1.glb");
  console.log("Loaded GLB scene:", scene);
  const modelPosition = [0, -80, 10];
  const rotation = [0, 180, 0];

  scene.rotation.set(rotation[0], rotation[1], rotation[2]);
  return <primitive object={scene} position={modelPosition} scale={50} />;
  const box = new THREE.Box3().setFromObject(scene);
  console.log("Model Bounding Box Min:", box.min);
  console.log("Model Bounding Box Max:", box.max);

  // Ensure the model is properly positioned and scaled
  //scene.scale.set(1, 1, 1);

  // Center the model at (0, 0, 0)
  scene.position.set(0, 0, 0);
  //scene.rotation.set(0, 0, 0);

  return <primitive object={scene} />;
};

const Hospitality = ({
  droneRef,
  measurementViewEnabled,
  mouseControlEnabled,
}) => {
  const controlsRef = useRef();
  const [pins, setPins] = useState([]);
  const cushionRef1 = useRef();
  const cushionRef2 = useRef();
  const walletRef = useRef();
  const trashcanRef = useRef();
  const bananaRef = useRef();
  const lostRef = useRef();
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

      if (distance < 20) {
        drone.attach(book);
        book.position.set(0, 2, 0);
        console.log(`Picked up ${objectName}`);
      } else {
        console.log(distance);
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
      }
    >
      <color attach="background" args={["#87CEEB"]} />
      <ambientLight intensity={0.4} color={new THREE.Color(0xffc1a0)} />
      <Environment preset="sunset" intensity={0.5} />
      <Model />
      {pins.map((pin, index) => (
        <Pin key={index} position={pin} />
      ))}
      <CameraController measurementViewEnabled={measurementViewEnabled} />
      <ScreenshotCapture
        droneCameraRef={droneCameraRef}
        environment="hospitality"
      />
      <Drone
        ref={droneRef}
        controlsRef={controlsRef}
        droneCameraRef={droneCameraRef}
        measurementViewEnabled={measurementViewEnabled}
        mouseControlEnabled={mouseControlEnabled}
        droneScale={2}
        cameraOffset={[10, 20, -20]}
        lineColor={dronePathColor}
        droneSpeed={0.4}
      />
      <SimpleModel
        ref={cushionRef1}
        path={`${
          import.meta.env.BASE_URL
        }assets/models/hospitality/cushion.glb`}
        position={[-20, -30, 6]}
        rotation={[0, Math.PI + 45, 0]}
        scale={20}
        name="cushion1"
        enableMeasurement={measurementViewEnabled}
      />
      <SimpleModel
        ref={walletRef}
        path={`${import.meta.env.BASE_URL}assets/models/hospitality/wallet.glb`}
        position={[20, -10, 50]}
        rotation={[0, Math.PI / 4, 0]}
        scale={0.5}
        name="wallet"
        enableMeasurement={measurementViewEnabled}
      />
      <SimpleModel
        ref={cushionRef2}
        path={`${
          import.meta.env.BASE_URL
        }assets/models/hospitality/cushion.glb`}
        position={[-45, -30, 6]}
        rotation={[0, Math.PI + 45, 0]}
        scale={20}
        name="cushion2"
        enableMeasurement={measurementViewEnabled}
      />
      <SimpleModel
        ref={trashcanRef}
        path={`${import.meta.env.BASE_URL}assets/models/infotech/trashcan.glb`}
        position={[0, -35, 50]}
        rotation={[0, Math.PI / 2, 0]}
        scale={20}
        //name="trashcan"
        enableMeasurement={measurementViewEnabled}
      />
      <SimpleModel
        ref={bananaRef}
        path={`${import.meta.env.BASE_URL}assets/models/infotech/banana.glb`}
        position={[-30, -35, 50]}
        rotation={[0, Math.PI / 2, 0]}
        scale={15}
        name="peel"
        enableMeasurement={measurementViewEnabled}
      />
      <SimpleModel
        ref={lostRef}
        path={`${import.meta.env.BASE_URL}assets/models/hospitality/lost.glb`}
        position={[-20, -30, 80]}
        rotation={[0, Math.PI / 2, 0]}
        scale={70}
        name="LostandFound"
        enableMeasurement={measurementViewEnabled}
      />
    </Canvas>
  );
};

Hospitality.propTypes = {
  droneRef: PropTypes.object.isRequired,
  mouseControlEnabled: PropTypes.bool,
  measurementViewEnabled: PropTypes.bool,
};

export default Hospitality;
