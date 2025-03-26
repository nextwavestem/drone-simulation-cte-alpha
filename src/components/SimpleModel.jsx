import { useGLTF, Text } from "@react-three/drei";
import {
  useRef,
  useImperativeHandle,
  useEffect,
  forwardRef,
  useState,
  useMemo,
} from "react";
import { clone } from "three/examples/jsm/utils/SkeletonUtils";
const SimpleModel = forwardRef(
  (
    {
      path,
      position,
      rotation = [0, 0, 0],
      scale = 1,
      name,
      enableMeasurement,
    },
    ref
  ) => {
    const { scene } = useGLTF(path);
    const internalRef = useRef();
    const [hovered, setHovered] = useState(false);

    const clonedScene = useMemo(() => clone(scene), [scene]);

    useImperativeHandle(ref, () => internalRef.current);

    useEffect(() => {
      if (internalRef.current) {
        internalRef.current.name = name;
      }
    }, [name]);

    return (
      <>
        <group
          position={position}
          rotation={rotation}
          scale={scale}
          onPointerOver={() => setHovered(true)}
          onPointerOut={() => setHovered(false)}
        >
          <primitive object={clonedScene} ref={internalRef} />
        </group>

        {hovered && (
          <Text
            position={[position[0] - 2, position[1] + 1, position[2] + 3]}
            fontSize={0.8}
            color="black"
            anchorX="center"
            anchorY="center"
            rotation={
              enableMeasurement ? [Math.PI / 2, Math.PI, 0] : [0, Math.PI, 0]
            }
          >
            {name}
          </Text>
        )}
      </>
    );
  }
);

export default SimpleModel;
