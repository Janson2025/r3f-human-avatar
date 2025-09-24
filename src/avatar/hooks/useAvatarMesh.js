// src/avatar/hooks/useAvatarMesh.js
import { useMemo, useRef } from "react";
import { useGLTF } from "@react-three/drei";
import { useGraph } from "@react-three/fiber";
import { SkeletonUtils } from "three-stdlib";

export function useAvatarMesh(glbPath = "/models/Avatar1.glb") {
  const { scene } = useGLTF(glbPath);
  const clone = useMemo(() => SkeletonUtils.clone(scene), [scene]);
  const { nodes, materials } = useGraph(clone);
  const groupRef = useRef();
  return { groupRef, nodes, materials };
}
