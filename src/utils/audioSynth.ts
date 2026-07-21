import { PagerTone } from '../types';

let audioCtx: AudioContext | null = null;
let currentOscillators: OscillatorNode[] = [];
let currentGainNodes: GainNode[] = [];
let isPlaying = false;

/**
 * Get or create the Web Audio API AudioContext
 */
export function getAudioContext(): AudioContext {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    audioCtx = new AudioContextClass();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

/**
 * Check if audio is initialized and unlocked
 */
export function isAudioUnlocked(): boolean {
  return !!audioCtx && audioCtx.state === 'running';
}

/**
 * Unlock Audio Context on user gesture
 */
export async function unlockAudio(): Promise<boolean> {
  try {
    const ctx = getAudioContext();
    if (ctx.state === 'suspended') {
      await ctx.resume();
    }
    // Play a brief 0.05s subtle tone to ensure audio route is active
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    gain.gain.value = 0.01;
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.05);
    return ctx.state === 'running';
  } catch (err) {
    console.warn('Audio unlock failed:', err);
    return false;
  }
}

/**
 * Stop all active sound oscillators immediately
 */
export function stopAlertAudio() {
  currentOscillators.forEach((osc) => {
    try {
      osc.stop();
      osc.disconnect();
    } catch {
      // Ignore already stopped oscillators
    }
  });
  currentGainNodes.forEach((gain) => {
    try {
      gain.disconnect();
    } catch {
      // Ignore
    }
  });
  currentOscillators = [];
  currentGainNodes = [];
  isPlaying = false;

  if (navigator.vibrate) {
    navigator.vibrate(0);
  }
}

/**
 * Play a loud synthesized pager alert
 * @param tone The tone style
 * @param volume Master volume factor (0.1 to 1.0)
 * @param repeats Number of alert repetition cycles
 */
export async function playPagerAlert(tone: PagerTone = 'classic', volume: number = 0.8, repeats: number = 1) {
  stopAlertAudio();
  const ctx = getAudioContext();
  if (ctx.state === 'suspended') {
    await ctx.resume();
  }

  isPlaying = true;

  // Trigger tactile haptic vibration on mobile devices if available
  if (navigator.vibrate) {
    navigator.vibrate([200, 100, 200, 100, 300, 100, 400]);
  }

  const clampedVolume = Math.min(Math.max(volume, 0.05), 1.0);

  for (let r = 0; r < repeats; r++) {
    if (!isPlaying) break;
    const now = ctx.currentTime;

    switch (tone) {
      case 'classic': {
        // High-pitched rapid alternating 880Hz / 1760Hz square wave
        const duration = 0.6;
        const cycles = 6;
        const step = duration / cycles;

        for (let i = 0; i < cycles; i++) {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();

          osc.type = i % 2 === 0 ? 'square' : 'sawtooth';
          osc.frequency.setValueAtTime(i % 2 === 0 ? 880 : 1760, now + i * step);

          gain.gain.setValueAtTime(clampedVolume * 0.7, now + i * step);
          gain.gain.exponentialRampToValueAtTime(0.001, now + (i + 0.8) * step);

          osc.connect(gain);
          gain.connect(ctx.destination);

          osc.start(now + i * step);
          osc.stop(now + (i + 0.85) * step);

          currentOscillators.push(osc);
          currentGainNodes.push(gain);
        }
        await delay((duration + 0.25) * 1000);
        break;
      }

      case 'two-tone': {
        // Dual EMS/Fire pager tone: 600Hz for 0.35s then 1200Hz for 0.45s
        const osc1 = ctx.createOscillator();
        const gain1 = ctx.createGain();
        osc1.type = 'sawtooth';
        osc1.frequency.setValueAtTime(600, now);
        gain1.gain.setValueAtTime(clampedVolume * 0.8, now);
        gain1.gain.setValueAtTime(clampedVolume * 0.8, now + 0.35);
        gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.38);

        osc1.connect(gain1);
        gain1.connect(ctx.destination);
        osc1.start(now);
        osc1.stop(now + 0.38);
        currentOscillators.push(osc1);
        currentGainNodes.push(gain1);

        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.type = 'square';
        osc2.frequency.setValueAtTime(1200, now + 0.4);
        gain2.gain.setValueAtTime(clampedVolume * 0.8, now + 0.4);
        gain2.gain.setValueAtTime(clampedVolume * 0.8, now + 0.85);
        gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.88);

        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        osc2.start(now + 0.4);
        osc2.stop(now + 0.88);
        currentOscillators.push(osc2);
        currentGainNodes.push(gain2);

        await delay(1100);
        break;
      }

      case 'siren': {
        // Rapid dual sweep siren (700Hz -> 1600Hz -> 700Hz)
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(700, now);
        osc.frequency.linearRampToValueAtTime(1600, now + 0.25);
        osc.frequency.linearRampToValueAtTime(700, now + 0.5);
        osc.frequency.linearRampToValueAtTime(1600, now + 0.75);

        gain.gain.setValueAtTime(clampedVolume * 0.75, now);
        gain.gain.setValueAtTime(clampedVolume * 0.75, now + 0.75);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.8);

        currentOscillators.push(osc);
        currentGainNodes.push(gain);

        await delay(1000);
        break;
      }

      case 'high-frequency': {
        // Piercing 2400Hz pulse sequence
        const pulses = 5;
        const pulseLen = 0.08;
        const gap = 0.04;

        for (let i = 0; i < pulses; i++) {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          const pStart = now + i * (pulseLen + gap);

          osc.type = 'square';
          osc.frequency.setValueAtTime(2400, pStart);

          gain.gain.setValueAtTime(clampedVolume * 0.85, pStart);
          gain.gain.exponentialRampToValueAtTime(0.001, pStart + pulseLen);

          osc.connect(gain);
          gain.connect(ctx.destination);

          osc.start(pStart);
          osc.stop(pStart + pulseLen + 0.01);

          currentOscillators.push(osc);
          currentGainNodes.push(gain);
        }

        await delay((pulses * (pulseLen + gap) + 0.3) * 1000);
        break;
      }

      case 'burst': {
        // Quad octave burst (523, 1046, 2093, 4186Hz)
        const freqs = [523, 1046, 2093, 4186];
        freqs.forEach((f, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          const start = now + idx * 0.1;

          osc.type = 'triangle';
          osc.frequency.setValueAtTime(f, start);

          gain.gain.setValueAtTime(clampedVolume * 0.9, start);
          gain.gain.exponentialRampToValueAtTime(0.001, start + 0.12);

          osc.connect(gain);
          gain.connect(ctx.destination);

          osc.start(start);
          osc.stop(start + 0.14);

          currentOscillators.push(osc);
          currentGainNodes.push(gain);
        });

        await delay(700);
        break;
      }
    }
  }

  isPlaying = false;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
