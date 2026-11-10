/**
 * A soft two-note bell, synthesised with the Web Audio API: no file to load.
 *
 * Browsers keep audio off until the visitor has interacted with the page, so
 * the context is created — and resumed — on the first click or key press
 * (`unlockChime`). Until then `playChime` says it could not play, and the
 * caller says so instead of failing silently.
 */

let context: AudioContext | null = null;

function audio(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  context ??= new Ctor();
  return context;
}

/** Audio allowed: the page has had a gesture and the context runs. */
export const chimeReady = () => context?.state === "running";

/**
 * Resume audio on the page's first click, tap or key press. Returns the
 * listener's removal. `onReady` is told once audio is allowed.
 */
export function unlockChime(onReady?: () => void): () => void {
  const unlock = () => {
    const ctx = audio();
    if (!ctx) return;
    void ctx.resume().then(() => {
      if (ctx.state === "running") {
        remove();
        onReady?.();
      }
    });
  };
  const events = ["pointerdown", "keydown", "touchstart"] as const;
  const remove = () => events.forEach((e) => window.removeEventListener(e, unlock, true));
  events.forEach((e) => window.addEventListener(e, unlock, true));
  return remove;
}

/** One bell stroke: a sine and its soft octave, a quick rise and a long fade. */
function strike(ctx: AudioContext, frequency: number, at: number, out: AudioNode) {
  for (const [ratio, level] of [
    [1, 1],
    [2, 0.18],
  ] as const) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = frequency * ratio;
    gain.gain.setValueAtTime(0.0001, at);
    gain.gain.exponentialRampToValueAtTime(level, at + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, at + 1.4);
    osc.connect(gain).connect(out);
    osc.start(at);
    osc.stop(at + 1.5);
  }
}

/** Play the chime; false when the browser does not allow audio yet. */
export function playChime(): boolean {
  const ctx = context;
  if (!ctx || ctx.state !== "running") return false;
  const out = ctx.createGain();
  out.gain.value = 0.22;
  out.connect(ctx.destination);
  const now = ctx.currentTime + 0.02;
  strike(ctx, 784, now, out); // G5
  strike(ctx, 1047, now + 0.18, out); // C6
  return true;
}
