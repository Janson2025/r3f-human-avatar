// src/avatar/hooks/useAnimationSceduler.js
import { useEffect, useMemo, useRef } from "react";
import { LuckPicker } from "../../utlis/luckPicker";

/**
 * Schedules next animation using a luck-weighted pool.
 * Expects your animator's `fadeTo(name, {loopOnce, fade})` and the `mixer`.
 */
export function useAnimationSceduler({
  mixer,
  fadeTo,
  audio,                 // HTMLAudioElement (from useAudioLipsync)
  enabled = true,        // e.g., (playAudio && script === "intro")
  pool,                  // array of { key, startingLuck, baseLuck, luckGrowth }
  idleKey = "Idle",
  idleHoldMs = [900, 1500],
}) {
  const picker = useMemo(() => new LuckPicker(pool || []), [pool]);
  const runningRef = useRef(false);
  const idleTimeoutRef = useRef(null);

  const clearIdleTimeout = () => {
    if (idleTimeoutRef.current) {
      clearTimeout(idleTimeoutRef.current);
      idleTimeoutRef.current = null;
    }
  };

  useEffect(() => {
    runningRef.current = !!enabled;
    if (!enabled) clearIdleTimeout();
    return () => { runningRef.current = false; clearIdleTimeout(); };
  }, [enabled]);

  useEffect(() => {
    if (!mixer) return;

    const onFinished = () => {
      if (!runningRef.current) return;
      if (!audio || audio.paused || audio.ended) return;

      const next = picker.pick();
      if (!next) return;

      if (next === idleKey) {
        // Idle loops; hold briefly then pick again
        fadeTo(idleKey, { loopOnce: false, fade: 0.25 });
        clearIdleTimeout();
        const [min, max] = idleHoldMs;
        const wait = Math.floor(min + Math.random() * Math.max(0, max - min));
        idleTimeoutRef.current = setTimeout(() => {
          if (!runningRef.current) return;
          if (!audio || audio.paused || audio.ended) return;
          const rePick = picker.pick();
          const chosen = rePick === idleKey ? picker.pick() : rePick;
          if (chosen) fadeTo(chosen, { loopOnce: true, fade: 0.25 });
        }, wait);
      } else {
        // Talking/gesture clips play once; mixer will fire 'finished' again
        fadeTo(next, { loopOnce: true, fade: 0.25 });
      }
    };

    mixer.addEventListener("finished", onFinished);
    return () => {
      mixer.removeEventListener("finished", onFinished);
      clearIdleTimeout();
    };
  }, [mixer, fadeTo, audio, picker, idleKey, idleHoldMs]);
}
