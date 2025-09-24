// src/avatar/hooks/useAvatarAnimator.js
import * as THREE from "three";
import { useAnimations } from "@react-three/drei";
import { useEffect, useMemo, useRef } from "react";

export function useAvatarAnimator(groupRef, clips) {
  const { actions, mixer } = useAnimations(clips, groupRef);

  const currentRef = useRef(null);

  const fadeTo = useMemo(
    () => (name, { fade = 0.35, loopOnce = false } = {}) => {
      const next = actions?.[name];
      if (!next) return;

      Object.keys(actions || {}).forEach((k) => {
        if (k !== name) actions[k]?.fadeOut?.(fade);
      });

      if (loopOnce) {
        next.setLoop(THREE.LoopOnce, 1);
        next.clampWhenFinished = true;
      } else {
        next.setLoop(THREE.LoopRepeat, Infinity);
        next.clampWhenFinished = false;
      }

      next.reset().fadeIn(fade).play();
      currentRef.current = name;
    },
    [actions]
  );

  // Ensure we start in Idle if available
  useEffect(() => {
    if (actions?.Idle && !currentRef.current) {
      fadeTo("Idle", { loopOnce: false, fade: 0.2 });
    }
  }, [actions, fadeTo]);

  return { actions, mixer, fadeTo, currentRef };
}
