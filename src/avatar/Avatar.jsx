/*
Split version: tiny orchestrator with animation scheduler
*/
import React, { useEffect } from "react";
import { useControls } from "leva";

import { useAvatarMesh } from "./hooks/useAvatarMesh";
import { useAvatarClips } from "./hooks/useAvatarClips";
import { useAvatarAnimator } from "./hooks/useAvatarAnimator";
import { useAudioLipsync } from "./hooks/useAudioLipsync";

import { useAnimationSceduler } from "./hooks/useAnimationSceduler";
import { introPool } from "./hooks/AnimationPools";

import { useHeadAimBlend } from "./hooks/useHeadAimBlend";
import { useBlink } from "./hooks/useBlink";

import * as THREE from "three";

export function Avatar(props) {
  // UI controls
  const { playAudio, script } = useControls({
    playAudio: false,
    script: { value: "intro", options: ["intro", "drugScreen"] },
  });

  // Mesh (GLB)
  const { groupRef, nodes, materials } = useAvatarMesh("/models/Avatar1.glb");

  // Animations
  const clips = useAvatarClips(); // ensure this includes Talk1/2/3 + Greeting + Idle
  const { mixer, fadeTo } = useAvatarAnimator(groupRef, clips);

  // Audio + visemes (now we need the audio instance)
  const { audio } = useAudioLipsync({ script, playAudio, nodes });


  // Auto mode (mostly looks at camera, occasionally eases away & back)
  useHeadAimBlend({
    nodes,
    auto: true,
    autoHigh: 0.25,         // hangs very close to full look-at
    autoLow: 0.35,          // dips to ~55% so animation influences the head
    autoTrackDwell: [2.5, 5],
    autoAwayDwell: [0.9, 1.6],
    autoEase: 3.5,          // slower/softer transitions
    maxYaw: THREE.MathUtils.degToRad(35),
    maxPitch: THREE.MathUtils.degToRad(20),
  });

  console.log()

  // Blink
  useBlink({ nodes, minInterval: 3, maxInterval: 6, blinkDuration: 0.12 });

  // Kickoff logic:
  // - For intro: play Greeting once; scheduler will handle the rest on 'finished'
  // - Else: just loop Angry (or change to Talk1 if you prefer)
  useEffect(() => {
    if (!mixer) return;

    if (playAudio) {
      if (script === "intro" && clips.find((c) => c.name === "Greeting")) {
        fadeTo("Greeting", { loopOnce: true, fade: 0.3 });
      } else if (clips.find((c) => c.name === "Angry")) {
        fadeTo("Angry", { loopOnce: false, fade: 0.3 });
      }
    } else {
      fadeTo("Idle", { loopOnce: false, fade: 0.2 });
    }
  }, [playAudio, script, clips, fadeTo, mixer]);

  // Scheduler: only active during the intro while audio is playing
  useAnimationSceduler({
    mixer,
    fadeTo,
    audio,
    enabled: playAudio && script === "intro",
    pool: introPool,
    idleKey: "Idle",
    idleHoldMs: [900, 1500],
  });

  return (
    <group ref={groupRef} dispose={null} {...props}>
      {nodes.Hips && <primitive object={nodes.Hips} />}
      {nodes.Wolf3D_Avatar && (
        <skinnedMesh
          name="Wolf3D_Avatar"
          geometry={nodes.Wolf3D_Avatar.geometry}
          material={materials.Wolf3D_Avatar}
          skeleton={nodes.Wolf3D_Avatar.skeleton}
          morphTargetDictionary={nodes.Wolf3D_Avatar.morphTargetDictionary}
          morphTargetInfluences={nodes.Wolf3D_Avatar.morphTargetInfluences}
        />
      )}
    </group>
  );
}
