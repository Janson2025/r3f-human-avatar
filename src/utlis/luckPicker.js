// src/utils/luckPicker.js

/**
 * LuckPicker implements a "weighted fairness" roulette:
 * - Each item has: key, startingLuck, baseLuck, luckGrowth.
 * - On pick: the chosen item's currentLuck resets to baseLuck.
 * - All non-chosen items increase currentLuck by luckGrowth.
 * - The next pick is weighted by currentLuck.
 *
 * Example item:
 * { key: "Talk1", startingLuck: 3, baseLuck: 1, luckGrowth: 1.2 }
 */
export class LuckPicker {
  constructor(items = [], rng = Math.random) {
    if (!Array.isArray(items)) throw new Error("items must be an array");
    this.rng = rng;
    this.map = new Map(); // key -> { baseLuck, luckGrowth, currentLuck }
    items.forEach((it) => this.add(it));
  }

  add({ key, startingLuck = 1, baseLuck = 1, luckGrowth = 1 }) {
    if (!key) throw new Error("item.key required");
    this.map.set(key, {
      baseLuck: Math.max(0, baseLuck),
      luckGrowth: Math.max(0, luckGrowth),
      currentLuck: Math.max(0, startingLuck),
    });
  }

  // Optional: set state back from a save point
  setState(stateObj) {
    Object.entries(stateObj || {}).forEach(([key, v]) => {
      if (this.map.has(key)) {
        this.map.get(key).currentLuck = Math.max(0, Number(v) || 0);
      }
    });
  }

  // Useful for debugging or persistence
  getState() {
    const out = {};
    this.map.forEach((v, k) => (out[k] = v.currentLuck));
    return out;
  }

  // If you want to temporarily restrain the pool, pass a subset of keys
  // e.g., picker.pick(["Talk1","Talk2"]) to exclude Talk3 for a moment.
  pick(allowedKeys) {
    const entries = [];
    if (allowedKeys && allowedKeys.length) {
      for (const k of allowedKeys) {
        const rec = this.map.get(k);
        if (rec) entries.push([k, rec]);
      }
    } else {
      this.map.forEach((rec, k) => entries.push([k, rec]));
    }

    if (!entries.length) return null;

    // Sum weights
    let total = 0;
    for (const [, rec] of entries) total += rec.currentLuck;

    // If all zero, give everyone +baseLuck (or +1) to avoid deadlock
    if (total <= 0) {
      for (const [, rec] of entries) {
        rec.currentLuck += rec.baseLuck > 0 ? rec.baseLuck : 1;
      }
      total = entries.reduce((s, [, r]) => s + r.currentLuck, 0);
    }

    // Roulette wheel
    const r = this.rng() * total;
    let acc = 0;
    let chosenKey = entries[entries.length - 1][0]; // fallback to last
    for (const [key, rec] of entries) {
      acc += rec.currentLuck;
      if (r <= acc) {
        chosenKey = key;
        break;
      }
    }

    // Update lucks: chosen resets to base, others grow
    for (const [key, rec] of entries) {
      if (key === chosenKey) {
        rec.currentLuck = rec.baseLuck;
      } else {
        rec.currentLuck += rec.luckGrowth;
      }
    }

    return chosenKey;
  }
}
