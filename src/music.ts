const LOOP_BEATS = 32;
const BEAT = 60 / 50;

type Voice = "melody" | "chord" | "bass";

type Hit = {
  beat: number;
  notes: number[];
  length: number;
  level: number;
  voice: Voice;
};

const PHRASE: Hit[] = [
  { beat: 0, notes: [69], length: 1.7, level: 0.075, voice: "melody" },
  { beat: 3, notes: [65], length: 1.7, level: 0.07, voice: "melody" },
  { beat: 6, notes: [62], length: 1.8, level: 0.065, voice: "melody" },
  { beat: 8, notes: [70], length: 1.7, level: 0.07, voice: "melody" },
  { beat: 11, notes: [67], length: 1.7, level: 0.065, voice: "melody" },
  { beat: 14, notes: [62], length: 1.8, level: 0.06, voice: "melody" },
  { beat: 16, notes: [65], length: 1.6, level: 0.068, voice: "melody" },
  { beat: 19, notes: [62], length: 1.6, level: 0.062, voice: "melody" },
  { beat: 22, notes: [58], length: 1.8, level: 0.058, voice: "melody" },
  { beat: 24, notes: [64], length: 1.5, level: 0.066, voice: "melody" },
  { beat: 27, notes: [61], length: 1.5, level: 0.06, voice: "melody" },
  { beat: 30, notes: [62], length: 2.2, level: 0.072, voice: "melody" },
  { beat: 0, notes: [50, 53, 57], length: 7.2, level: 0.022, voice: "chord" },
  { beat: 8, notes: [55, 58, 62], length: 7.2, level: 0.02, voice: "chord" },
  { beat: 16, notes: [58, 62, 65], length: 7.2, level: 0.02, voice: "chord" },
  { beat: 24, notes: [57, 61, 64], length: 7.2, level: 0.02, voice: "chord" },
  { beat: 0, notes: [38], length: 6.5, level: 0.055, voice: "bass" },
  { beat: 8, notes: [43], length: 6.5, level: 0.05, voice: "bass" },
  { beat: 16, notes: [46], length: 6.5, level: 0.05, voice: "bass" },
  { beat: 24, notes: [45], length: 6.5, level: 0.052, voice: "bass" },
];

function pitch(midi: number) {
  return 440 * 2 ** ((midi - 69) / 12);
}

export class ManorScore {
  onChange: ((playing: boolean) => void) | null = null;
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private dry: GainNode | null = null;
  private wet: GainNode | null = null;
  private timer = 0;
  private epoch = 0;
  private beat = 0;
  private nextAt = 0;
  private live = false;

  async start() {
    this.epoch += 1;
    const ctx = this.ensure();
    if (ctx.state === "suspended") await ctx.resume();
    const now = ctx.currentTime;
    const master = this.master;
    if (!master) return;
    master.gain.cancelScheduledValues(now);
    master.gain.setValueAtTime(Math.max(master.gain.value, 0.0001), now);
    master.gain.linearRampToValueAtTime(0.9, now + 1.8);
    if (!this.live) {
      this.live = true;
      this.beat = 0;
      this.nextAt = now + 0.12;
      this.pump();
      this.timer = window.setInterval(() => this.pump(), 90);
    }
    this.onChange?.(ctx.state === "running");
  }

  stop() {
    this.epoch += 1;
    const epoch = this.epoch;
    this.live = false;
    if (this.timer) {
      window.clearInterval(this.timer);
      this.timer = 0;
    }
    const ctx = this.ctx;
    const master = this.master;
    if (ctx && master) {
      const now = ctx.currentTime;
      master.gain.cancelScheduledValues(now);
      master.gain.setValueAtTime(Math.max(master.gain.value, 0.0001), now);
      master.gain.linearRampToValueAtTime(0.0001, now + 0.35);
      window.setTimeout(() => {
        if (this.epoch === epoch) void ctx.suspend();
      }, 400);
    }
    this.onChange?.(false);
  }

  private ensure() {
    if (this.ctx && this.master && this.dry && this.wet) return this.ctx;
    const ctx = new AudioContext();
    const master = ctx.createGain();
    master.gain.value = 0.0001;
    const dry = ctx.createGain();
    dry.gain.value = 0.86;
    const wet = ctx.createGain();
    wet.gain.value = 0.38;
    const reverb = ctx.createConvolver();
    reverb.buffer = roomImpulse(ctx);
    dry.connect(master);
    wet.connect(reverb);
    reverb.connect(master);
    master.connect(ctx.destination);
    hush(ctx, master);
    this.ctx = ctx;
    this.master = master;
    this.dry = dry;
    this.wet = wet;
    return ctx;
  }

  private pump() {
    const ctx = this.ctx;
    const dry = this.dry;
    const wet = this.wet;
    if (!ctx || !dry || !wet || !this.live) return;
    const horizon = ctx.currentTime + 0.35;
    while (this.nextAt < horizon) {
      const when = this.nextAt + (Math.random() - 0.5) * 0.02;
      for (const hit of PHRASE) {
        if (hit.beat !== this.beat) continue;
        for (const note of hit.notes) {
          this.strike(ctx, dry, wet, Math.max(when, ctx.currentTime), note, hit.length * BEAT, hit.level, hit.voice);
        }
      }
      this.beat = (this.beat + 1) % LOOP_BEATS;
      this.nextAt += BEAT;
    }
  }

  private strike(
    ctx: AudioContext,
    dry: GainNode,
    wet: GainNode,
    when: number,
    midi: number,
    seconds: number,
    level: number,
    voice: Voice,
  ) {
    const freq = pitch(midi);
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    const open = voice === "melody" ? 2400 : voice === "chord" ? 980 : 280;
    filter.frequency.setValueAtTime(open, when);
    filter.frequency.exponentialRampToValueAtTime(Math.max(90, open * 0.32), when + seconds);
    filter.Q.value = voice === "melody" ? 0.7 : 0.4;

    const amp = ctx.createGain();
    amp.gain.setValueAtTime(0.0001, when);
    amp.gain.exponentialRampToValueAtTime(level, when + 0.025);
    amp.gain.exponentialRampToValueAtTime(level * (voice === "chord" ? 0.5 : 0.26), when + 0.2);
    amp.gain.exponentialRampToValueAtTime(0.0001, when + seconds);

    const partials = voice === "bass" ? [1, 2] : [1, 2, 3, 4];
    const weights = voice === "bass" ? [1, 0.22] : [0.74, 0.2, 0.08, 0.035];
    partials.forEach((partial, index) => {
      const osc = ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq * partial, when);
      const partialGain = ctx.createGain();
      partialGain.gain.value = weights[index] ?? 0;
      osc.connect(partialGain);
      partialGain.connect(filter);
      osc.start(when);
      osc.stop(when + seconds + 0.05);
    });

    filter.connect(amp);
    amp.connect(dry);
    if (voice !== "bass") amp.connect(wet);
  }
}

function roomImpulse(ctx: AudioContext) {
  const length = Math.floor(ctx.sampleRate * 1.7);
  const impulse = ctx.createBuffer(2, length, ctx.sampleRate);
  for (let channel = 0; channel < 2; channel += 1) {
    const data = impulse.getChannelData(channel);
    for (let index = 0; index < length; index += 1) {
      const fade = (1 - index / length) ** 2.6;
      data[index] = (Math.random() * 2 - 1) * fade;
    }
  }
  return impulse;
}

function hush(ctx: AudioContext, master: GainNode) {
  const seconds = 2;
  const buffer = ctx.createBuffer(1, ctx.sampleRate * seconds, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let index = 0; index < data.length; index += 1) data[index] = Math.random() * 2 - 1;
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  source.loop = true;
  const filter = ctx.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.value = 340;
  filter.Q.value = 0.7;
  const gain = ctx.createGain();
  gain.gain.value = 0.018;
  source.connect(filter);
  filter.connect(gain);
  gain.connect(master);
  source.start();
}
