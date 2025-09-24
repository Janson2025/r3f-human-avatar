// src/avatar/AnimationPools.js

// Pool used during the intro after "Greeting" finishes.
export const introPool = [
  // Talking clips (heavier weights via startingLuck)
  { key: "Talk1", startingLuck: 3, baseLuck: 1, luckGrowth: 1.1 },
  { key: "Talk2", startingLuck: 2, baseLuck: 1, luckGrowth: 1.1 },
  { key: "Talk3", startingLuck: 1, baseLuck: 1, luckGrowth: 1.1 },

  // Let Idle slip in occasionally; it will get luckGrowth when skipped
  { key: "Idle",  startingLuck: 0.2, baseLuck: 0.2, luckGrowth: 0.4 },
];

// (Later you can add: export const explainPool = [...], etc.)
