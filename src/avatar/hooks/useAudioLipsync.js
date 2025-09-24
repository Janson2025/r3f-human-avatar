// src/avatar/hooks/useAudioLipsync.js
import { useEffect, useMemo, useRef } from "react";
import { useLoader, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import AudioBus from "../../audio/audiobus";

// NEW: richer, case-correct mapping with gentle co-articulation
const VISEME_PRESETS = {
  A: { viseme_PP: 1.0 },
  B: { viseme_I: 0.85, viseme_SS: 0.10, viseme_kk: 0.05 },
  C: { viseme_E: 1.0 },
  D: { viseme_aa: 1.0 }, // <-- lower-case 'aa'
  E: { viseme_O: 1.0 },
  F: { viseme_U: 1.0 },
  G: { viseme_FF: 1.0 },
  H: { viseme_DD: 0.85, viseme_nn: 0.15 },
  X: { viseme_sil: 0.15 }
};

export function useAudioLipsync({
  script,
  playAudio,
  nodes,
  attack = 18,
  decay = 20,
  maxWeight = 1,
  id = "avatar",
}) {
  const audioRef = useRef(null);
  if (!audioRef.current) audioRef.current = new Audio();
  const audio = audioRef.current;

  // Load lipsync JSON (Rhubarb format)
  let lipsync = null;
  try {
    const jsonStr = useLoader(THREE.FileLoader, `/audios/${script}.json`);
    lipsync = JSON.parse(jsonStr);
  } catch {
    lipsync = { mouthCues: [] };
  }

  // State for smoothed weights per *blendshape name*
  const weightsRef = useRef({});
  const targetsRef = useRef({});

  useEffect(() => {
    const url = `/audios/${script}.mp3`;
    audio.pause();
    audio.currentTime = 0;
    audio.src = url;
    audio.load();

    if (playAudio) {
      AudioBus.play(audio, `${id}:${script}`).catch(() => {});
    }

    const onErr = () => {
      const err = audio.error;
      console.warn(`[Audio] load error for ${url} code=${err?.code}`);
    };
    audio.addEventListener("error", onErr);
    return () => audio.removeEventListener("error", onErr);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [script]);

  useEffect(() => {
    if (playAudio) {
      AudioBus.play(audio, `${id}:${script}`).catch(() => {});
    } else {
      AudioBus.stop(audio);
      audio.currentTime = 0;
    }
  }, [playAudio, script, id, audio]);

  useEffect(() => {
    return () => {
      AudioBus.stop(audio);
      audio.src = "";
      audio.removeAttribute("src");
      try { audio.load(); } catch {}
    };
  }, [audio]);

  useFrame((_, dt) => {
    const skinned = nodes?.Wolf3D_Avatar;
    if (!skinned?.morphTargetDictionary) return;

    // 1) Find the active Rhubarb key at current audio time
    const t = audio.currentTime;
    let active = "X"; // default to idle if none
    const cues = lipsync?.mouthCues || [];
    for (let i = 0; i < cues.length; i++) {
      const c = cues[i];
      if (t >= c.start && t < c.end) { active = c.value; break; }
    }

    // 2) Build target map from preset (scaled by maxWeight)
    const preset = VISEME_PRESETS[active] || VISEME_PRESETS.X;
    // Zero targets by default each frame
    targetsRef.current = {};
    Object.keys(VISEME_PRESETS).forEach(k => {
      Object.keys(VISEME_PRESETS[k]).forEach(name => { targetsRef.current[name] = 0; });
    });
    // Apply active preset
    for (const [name, w] of Object.entries(preset)) {
      targetsRef.current[name] = Math.min(maxWeight, w * maxWeight);
    }

    // 3) Ease weights per blendshape and write to influences
    const ease = (cur, tgt, rate) => {
      const k = 1 - Math.exp(-rate * dt);
      return cur + (tgt - cur) * k;
    };

    // Ensure we iterate over all possible names we might touch
    const allNames = new Set(Object.values(VISEME_PRESETS).flatMap(o => Object.keys(o)));
    allNames.forEach((name) => {
      const tgt = targetsRef.current[name] ?? 0;
      const cur = weightsRef.current[name] ?? 0;
      const rate = tgt > cur ? attack : decay;
      const next = ease(cur, tgt, rate);
      weightsRef.current[name] = next;

      const idx = skinned.morphTargetDictionary[name];
      if (idx !== undefined) skinned.morphTargetInfluences[idx] = next;
    });
  });

  return { audio };
}
