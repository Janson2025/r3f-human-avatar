// src/avatar/hooks/useHeadAimBlend.js
import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

/**
 * Blend procedural head aim with the current animated pose.
 * weight: 0..1 (0 = pure animation, 1 = pure look-at camera)
 * If auto is true, the hook gently modulates weight around high values.
 */
export function useHeadAimBlend({
  nodes,
  target = null, // defaults to active camera
  headHintNames = ["Head", "head", "Head001", "BipHead", "HeadTop_End"],
  neckHintNames = ["Neck", "neck", "Neck001", "BipNeck"],

  // clamping in radians
  maxYaw = THREE.MathUtils.degToRad(40),
  maxPitch = THREE.MathUtils.degToRad(25),

  // external control (0..1). If you pass undefined and auto=true, it will modulate.
  weight,

  // optional auto modulation (keeps near 1.0, occasionally dips & rises smoothly)
  auto = true,
  autoHigh = 0.25,          // typical high value to hover near
  autoLow = 0.1,           // how low it dips on “look away”
  autoTrackDwell = [2.0, 4.0],  // seconds near high
  autoAwayDwell  = [0.8, 1.6],  // seconds near low
  autoEase = 4.0,               // easing speed for weight changes (higher=faster)
}) {
  const { camera, clock } = useThree();

  // find a head/neck bone
  const headBone = useMemo(() => {
    const search = (names) =>
      names
        .map((n) => nodes?.[n])
        .find((o) => o && o.isBone && typeof o.quaternion?.slerp === "function");
    return (
      search(headHintNames) ||
      search(neckHintNames) ||
      Object.values(nodes || {}).find((n) => n?.isBone && /head|neck/i.test(n.name || ""))
    );
  }, [nodes, headHintNames, neckHintNames]);

  // temps
  const m4 = useMemo(() => new THREE.Matrix4(), []);
  const vHeadW = useMemo(() => new THREE.Vector3(), []);
  const vTargetW = useMemo(() => new THREE.Vector3(), []);
  const qDesired = useMemo(() => new THREE.Quaternion(), []);
  const qFromAnim = useMemo(() => new THREE.Quaternion(), []);
  const qFinal = useMemo(() => new THREE.Quaternion(), []);
  const axisX = useMemo(() => new THREE.Vector3(1, 0, 0), []);
  const axisY = useMemo(() => new THREE.Vector3(0, 1, 0), []);

  // auto modulation state
  const modeRef = useRef("track"); // "track" (near high) | "away" (dip toward low)
  const nextSwitchAt = useRef(0);
  const wTarget = useRef(autoHigh);
  const wCurrent = useRef(autoHigh);

  const randRange = (a, b) => a + Math.random() * Math.max(0, b - a);

  useEffect(() => {
    if (!auto) return;
    nextSwitchAt.current = clock.getElapsedTime() + randRange(...autoTrackDwell);
    modeRef.current = "track";
    wTarget.current = autoHigh;
    wCurrent.current = autoHigh;
  }, [auto, autoTrackDwell, autoHigh, clock]);

  useFrame((_, dt) => {
    if (!headBone) return;

    // pick target (camera by default)
    const tgtObj = target?.current || camera;

    // world positions
    headBone.getWorldPosition(vHeadW);
    vTargetW.setFromMatrixPosition(tgtObj.matrixWorld);

    // local space
    const parent = headBone.parent || headBone;
    m4.copy(parent.matrixWorld).invert();
    const headLocal = vHeadW.clone().applyMatrix4(m4);
    const targetLocal = vTargetW.clone().applyMatrix4(m4);

    // direction + clamp yaw/pitch
    const dir = targetLocal.clone().sub(headLocal).normalize();
    const yaw = Math.atan2(dir.x, dir.z);
    const pitch = Math.asin(THREE.MathUtils.clamp(dir.y, -1, 1));
    const cy = THREE.MathUtils.clamp(yaw, -maxYaw, maxYaw);
    const cp = THREE.MathUtils.clamp(pitch, -maxPitch, maxPitch);

    qDesired.copy(new THREE.Quaternion().setFromAxisAngle(axisY, cy))
            .multiply(new THREE.Quaternion().setFromAxisAngle(axisX, cp));

    // external vs auto weight
    let w = typeof weight === "number" ? THREE.MathUtils.clamp(weight, 0, 1) : undefined;

    // auto-modulate w if not provided
    if (w === undefined && auto) {
      const now = clock.getElapsedTime();
      if (now >= nextSwitchAt.current) {
        if (modeRef.current === "track") {
          modeRef.current = "away";
          nextSwitchAt.current = now + randRange(...autoAwayDwell);
          wTarget.current = autoLow;
        } else {
          modeRef.current = "track";
          nextSwitchAt.current = now + randRange(...autoTrackDwell);
          wTarget.current = autoHigh;
        }
      }
      // ease wCurrent -> wTarget
      const k = 1 - Math.exp(-autoEase * dt);
      wCurrent.current += (wTarget.current - wCurrent.current) * k;
      w = wCurrent.current;
    }

    // Blend: animated pose (as is) -> desired look pose by weight w
    // Note: headBone.quaternion is already driven by the animation system before our frame.
    qFromAnim.copy(headBone.quaternion);
    qFinal.copy(qFromAnim).slerp(qDesired, THREE.MathUtils.clamp(w ?? 1, 0, 1));
    headBone.quaternion.copy(qFinal);
  });
}
