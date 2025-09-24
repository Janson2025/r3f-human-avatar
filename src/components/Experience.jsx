// Experience.jsx
import { OrbitControls, Environment, useTexture } from "@react-three/drei";
import { useRef } from "react";
import { useThree } from "@react-three/fiber";
import { Avatar } from "../avatar/Avatar";

export const Experience = () => {
  const texture = useTexture(
    "textures/Lucid_Origin_city_rooftop_garden_at_late_night_illuminated_by__1.jpg"
  );
  const viewport = useThree((state) => state.viewport);

  return (
    <>
      {/* Scene bg (push well behind camera so it acts like a backdrop) */}
      <mesh position={[0, 0, -5]}>
        <planeGeometry args={[viewport.width * 2, viewport.height * 2]} />
        <meshBasicMaterial map={texture} />
      </mesh>

      {/* Subtle fill so the avatar isn’t pitch black where the cone doesn’t reach */}
      <ambientLight intensity={0.15} />

      {/* Environmental reflections (night) */}
      <Environment preset="night" environmentIntensity={2} />

      {/* Accent directionals (optional) */}
      <directionalLight intensity={2.5} position={[-7, 5, -10]} color={"#04D9FF"} />
      <directionalLight intensity={0.5} position={[7, -5, 10]} color={"#d62084"} />
      <directionalLight intensity={1.75} position={[10, 10, 10]} color={"#fff3ff"} />
      {/* Avatar */}
      <Avatar position={[0, -3, 5]} scale={2} />
    </>
  );
};
