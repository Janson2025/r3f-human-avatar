// src/avatar/hooks/useBlink.js
import { useEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";

/**
 * Triggers occasional blinks by animating the eye blink morphs:
 * Ready Player Me names: eyeBlinkLeft, eyeBlinkRight
 */
export function useBlink({
  nodes,
  leftKey = "eyeBlinkLeft",
  rightKey = "eyeBlinkRight",
  minInterval = 2.5,
  maxInterval = 7.0,
  blinkDuration = 0.14, // total up+down time (s)
  asymmetry = 0.02,     // seconds offset between eyes for micro realism
}) {
  const tRef = useRef(0);
  const nextBlinkAtRef = useRef(Math.random() * (maxInterval - minInterval) + minInterval);
  const phaseRef = useRef(null); // { t0, duration, easing }

  const setBlinkTargets = (val) => {
    const skinned = nodes?.Wolf3D_Avatar;
    if (!skinned?.morphTargetDictionary) return;
    const li = skinned.morphTargetDictionary[leftKey];
    const ri = skinned.morphTargetDictionary[rightKey];
    if (li !== undefined) skinned.morphTargetInfluences[li] = val;
    if (ri !== undefined) skinned.morphTargetInfluences[ri] = val;
  };

  useEffect(() => {
    setBlinkTargets(0);
  }, []);

  useFrame((_, dt) => {
    tRef.current += dt;

    // Start a blink?
    if (!phaseRef.current && tRef.current >= nextBlinkAtRef.current) {
      phaseRef.current = {
        t0: tRef.current,
        duration: blinkDuration,
      };
    }

    // Evolve a blink
    if (phaseRef.current) {
      const { t0, duration } = phaseRef.current;
      const localT = (tRef.current - t0) / duration; // 0..1

      // Smooth ease in/out (up then down)
      let val;
      if (localT < 0.5) {
        const k = localT / 0.5;         // 0..1
        val = k * k;                    // ease-in (quad)
      } else if (localT < 1.0) {
        const k = (localT - 0.5) / 0.5; // 0..1
        val = 1 - k * k;                // ease-out (quad)
      } else {
        val = 0;
        phaseRef.current = null;
        // schedule next blink
        nextBlinkAtRef.current = tRef.current + (Math.random() * (maxInterval - minInterval) + minInterval);
      }

      // Apply with tiny asymmetry (eyes not perfectly sync)
      const skinned = nodes?.Wolf3D_Avatar;
      if (!skinned?.morphTargetDictionary) return;
      const li = skinned.morphTargetDictionary[leftKey];
      const ri = skinned.morphTargetDictionary[rightKey];

      const leftDelay = 0;
      const rightDelay = asymmetry;

      const apply = (idx, delay) => {
        if (idx === undefined) return;
        const delayedT = Math.max(0, Math.min(1, localT - delay));
        let v;
        if (delayedT < 0.5) {
          const k = delayedT / 0.5;
          v = k * k;
        } else if (delayedT < 1.0) {
          const k = (delayedT - 0.5) / 0.5;
          v = 1 - k * k;
        } else {
          v = 0;
        }
        skinned.morphTargetInfluences[idx] = v;
      };

      apply(li, leftDelay);
      apply(ri, rightDelay);
    }
  });
}
