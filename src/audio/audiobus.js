// src/audio/AudioBus.js
class AudioBus {
  constructor() {
    this.current = null;
    this.currentId = null;
  }

  /**
   * Play this audio; stop any other that was playing.
   * Returns the play() promise.
   */
  play(audioEl, id = "default") {
    if (!(audioEl instanceof HTMLAudioElement)) {
      throw new Error("AudioBus.play expects an HTMLAudioElement");
    }
    if (this.current && this.current !== audioEl) {
      // Stop the previous one
      try {
        this.current.pause();
        this.current.currentTime = 0;
        // optional: signal to listeners it was stopped by the bus
        this.current.dispatchEvent(new Event("forcedstop"));
      } catch {}
    }
    this.current = audioEl;
    this.currentId = id;
    return audioEl.play();
  }

  /**
   * Stop this specific audio if it’s playing.
   */
  stop(audioEl) {
    if (!audioEl) return;
    try {
      audioEl.pause();
    } catch {}
    if (this.current === audioEl) {
      this.current = null;
      this.currentId = null;
    }
  }

  /**
   * Stop whatever is current.
   */
  stopAll() {
    if (this.current) {
      try {
        this.current.pause();
        this.current.currentTime = 0;
      } catch {}
      this.current = null;
      this.currentId = null;
    }
  }
}

const bus = new AudioBus();
export default bus;
