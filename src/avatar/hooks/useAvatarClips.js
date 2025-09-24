// src/avatar/hooks/useAvatarClips.js
import { useFBX } from "@react-three/drei";

export function useAvatarClips() {
  // Core clips
  const idle = useFBX("/animations/Idle.fbx");
  const angry = useFBX("/animations/Angry%20Gesture.fbx");
  const greet = useFBX("/animations/Standing%20Greeting.fbx");

  // Talking clips
  const talk1 = useFBX("/animations/Talking1hand.fbx");
  const talk2 = useFBX("/animations/Talking2hands.fbx");
  const talk3 = useFBX("/animations/TalkingOneHandAfterTheOther.fbx");

  // Assign names so the animator & pools can find them
  if (idle.animations?.[0]) idle.animations[0].name = "Idle";
  if (angry.animations?.[0]) angry.animations[0].name = "Angry";
  if (greet.animations?.[0]) greet.animations[0].name = "Greeting";

  if (talk1.animations?.[0]) talk1.animations[0].name = "Talk1";
  if (talk2.animations?.[0]) talk2.animations[0].name = "Talk2";
  if (talk3.animations?.[0]) talk3.animations[0].name = "Talk3";

  // Return all non-empty clips
  return [
    idle.animations?.[0],
    angry.animations?.[0],
    greet.animations?.[0],
    talk1.animations?.[0],
    talk2.animations?.[0],
    talk3.animations?.[0],
  ].filter(Boolean);
}
