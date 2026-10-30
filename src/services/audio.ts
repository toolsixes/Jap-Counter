/**
 * Procedural Web Audio API sound synthesis for Jaap Counter.
 * 100% procedural, zero external audio asset / 404 dependencies.
 */

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

export function playChantSound(type: 'bowl' | 'bell' | 'wood' | 'chime' | 'silent' = 'wood') {
  if (type === 'silent') return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;

  try {
    if (type === 'wood') {
      // Authentic tactile wooden Rudraksha bead click
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(820, now);
      filter.Q.setValueAtTime(3.5, now);

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(280, now);
      osc.frequency.exponentialRampToValueAtTime(70, now + 0.05);

      gain.gain.setValueAtTime(0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.065);
    } else if (type === 'bell') {
      // Sacred temple ghanta / silver bell
      const freqs = [1046.5, 2093, 3136];
      freqs.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq + (i === 1 ? 4 : 0), now);

        const amp = 0.2 / (i + 1);
        gain.gain.setValueAtTime(amp, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.8 + i * 0.2);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 1.2);
      });
    } else if (type === 'bowl') {
      // Resonant Tibetan Singing Bowl
      const harmonics = [261.63, 523.25, 784.88, 1046.5];
      harmonics.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq * (1 + (idx === 0 ? 0 : 0.003)), now);

        const baseGain = idx === 0 ? 0.25 : 0.1 / idx;
        gain.gain.setValueAtTime(baseGain, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.4);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 1.5);
      });
    } else if (type === 'chime') {
      // 528 Hz sacred Solfeggio frequency tone
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(528, now);

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.9);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 1.0);
    }
  } catch {
    // Audio contexts can be locked until first user tap
  }
}

/**
 * Grand celebration chord when 108 chants (1 full Mala) are completed!
 */
export function playMalaCompletionSound() {
  const ctx = getAudioContext();
  if (!ctx) return;
  const now = ctx.currentTime;

  try {
    // Major triad + sacred harmonic wash (C4 - E4 - G4 - C5 - E5)
    const notes = [261.63, 329.63, 392.00, 523.25, 659.25];
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + i * 0.08);

      gain.gain.setValueAtTime(0.001, now + i * 0.08);
      gain.gain.linearRampToValueAtTime(0.18, now + i * 0.08 + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 2.8);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + i * 0.08);
      osc.stop(now + 3.0);
    });
  } catch {
    // Ignore error
  }
}

/**
 * Trigger subtle device vibration / haptic feedback
 */
export function triggerHaptic(duration = 25) {
  if (typeof window !== 'undefined' && 'vibrate' in navigator) {
    try {
      navigator.vibrate(duration);
    } catch {
      // Vibration may be restricted on some platforms
    }
  }
}
