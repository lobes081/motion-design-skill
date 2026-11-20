"""Script, voices, timing, sound effects and the final mix for the RPG-style explainer.

Outputs (into the HyperFrames project):
  ship/js/timing.js          window.TIMING = { dur, scenes[], cues{} }  (the picture is timed to this)
  ship/assets/soundtrack.m4a  voice + sound effects + music, loudness-normalized
Sound effects use the procedural synth helpers from claude-animated-shorts (vendor/, MIT).
Usage: build_audio.py <kokoro_model_dir> <music.mp3> <project_dir>
"""
import sys, os, json, hashlib, subprocess
import numpy as np
import soundfile as sf
from scipy import signal

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HERE, "vendor"))
import dsp as D            # noqa: E402
import sfx_gen as G        # noqa: E402

KMODEL, MUSIC, PROJ = sys.argv[1], sys.argv[2], sys.argv[3]
SR = D.SR
VOICES = {"N": ("am_michael", 1.0), "K": ("am_puck", 1.0), "O": ("af_heart", 1.0), "S": ("am_liam", 1.08)}
SAY = [("CLAUDE.md", "Claude dot M D"), ("MCP", "M C P")]

# (scene id, options, lines).  Line = (speaker, text, options).  gap = pause before the line.
SCENES = [
    ("intro", dict(pre=1.3, post=0.5), [
        ("N", "In The Matrix, an operator uploads a fighting program into the hero's head."),
        ("O", "Loading combat training. Hold still.", dict(gap=0.5)),
        ("K", "I know kung fu!", dict(gap=1.9)),
        ("N", "In a game, we would call that learning a skill.", dict(gap=1.1)),
        ("N", "But a skill is only one of ten parts. Let's build the whole ship, in order."),
    ]),
    ("title", dict(pre=0.7, post=2.3), [
        ("N", "The ten parts of the ship."),
    ]),
    ("model", dict(), [
        ("N", "Part one: the model. This is our hero. A trained brain."),
        ("N", "Text goes in, and text comes out."),
        ("N", "But alone, the hero can't open a door, or remember yesterday."),
        ("K", "I can think. I just can't reach anything."),
    ]),
    ("harness", dict(), [
        ("N", "Part two: the harness. It's the ship around the hero, and the operator who runs it."),
        ("N", "The hero says what to do. The operator does it, and reports back. Then the loop repeats."),
        ("O", "You call it. I run it."),
    ]),
    ("context", dict(), [
        ("N", "Part three: context. It's the hero's backpack. Working memory, with limited slots."),
        ("N", "Messages, files, and results each take a slot."),
        ("N", "When the pack is full, the oldest items get squeezed into a summary."),
        ("N", "If it's not in the pack, the hero doesn't know it."),
    ]),
    ("tools", dict(), [
        ("N", "Part four: tools. These are the hero's hands."),
        ("N", "Read a file. Run a command. Search the web. Each tool is one action."),
    ]),
    ("memory", dict(), [
        ("N", "Part five: memory. When a session ends, the backpack is emptied."),
        ("N", "But the journal stays on the ship. The operator reads it to the hero at every start."),
        ("N", "In Claude Code, that journal is a file called CLAUDE.md."),
    ]),
    ("skill", dict(), [
        ("N", "Part six: the skill. Scrolls sit on a shelf, and the hero sees only the titles."),
        ("N", "When a job needs one, that scroll opens, and the full instructions load."),
        ("K", "I know motion design!", dict(gap=0.9)),
        ("N", "That's the upload from the movie. It doesn't change the brain. It adds pages to read.", dict(gap=0.6)),
    ]),
    ("mcp", dict(), [
        ("N", "Part seven: MCP. It's a gate to places outside the ship. Email. A calendar. GitHub."),
        ("N", "A skill is knowing how to fly. MCP is the helicopter. You need both."),
    ]),
    ("agent", dict(), [
        ("N", "Part eight: the agent. A big job would fill the hero's backpack."),
        ("N", "So the hero sends a scout, who has a backpack of his own."),
        ("N", "The scout does the job, and brings back one short report."),
        ("S", "Two hundred files read. Here's the summary!"),
    ]),
    ("hooks", dict(), [
        ("N", "Part nine: hooks. A hook is an alarm bell wired to an action."),
        ("N", "Each time the hero edits a file, the bell rings, and the tests run."),
        ("N", "Nobody decides. It can't be skipped."),
    ]),
    ("plugin", dict(), [
        ("N", "Part ten: the plugin. It's a treasure chest."),
        ("N", "Open it once, and scrolls, gates, scouts, and bells all go to their places."),
    ]),
    ("party", dict(post=1.0), [
        ("N", "Here's the full party, in build order."),
        ("N", "The model only ever reads one long text.", dict(gap=1.2)),
        ("N", "The other nine parts decide what goes in, and what happens with the answer."),
    ]),
    ("outro", dict(post=9.5), [
        ("N", "So the famous upload is a skill. But the hero still needs the ship, the pack, and the helicopter."),
        ("K", "I know kung fu.", dict(gap=0.7)),
    ]),
]

# Cue = (scene, line index, "s" start | "e" end of that line, offset seconds, sound, gain dB)
CUES = {
    "scrollThrow": ("intro", 1, "s", 0.25, "whoosh", -6), "scrollHit": ("intro", 1, "e", 1.0, "fanfare", -3),
    "titleIn": ("title", 0, "s", -0.45, "boom", -4),
    "textIn": ("model", 1, "s", 0.1, "blip", -8), "textOut": ("model", 1, "s", 1.15, "blip2", -8),
    "bonk": ("model", 2, "s", 1.55, "thud", -4),
    "call": ("harness", 1, "s", 0.3, "blip", -8), "run": ("harness", 1, "s", 1.9, "tick", -4),
    "report": ("harness", 1, "s", 3.3, "chime", -8),
    "call2": ("harness", 2, "s", 0.1, "blip", -8), "run2": ("harness", 2, "s", 1.0, "tick", -4),
    "packFull": ("context", 2, "s", 0.3, "buzz", -10), "squeeze": ("context", 2, "s", 2.0, "squeeze", -6),
    "tool1": ("tools", 1, "s", 0.25, "zap", -7), "tool2": ("tools", 1, "s", 1.45, "zap", -7), "tool3": ("tools", 1, "s", 2.75, "zap", -7),
    "night": ("memory", 0, "s", 2.3, "down", -6), "journal": ("memory", 1, "s", 0.3, "chime", -6),
    "journalLoad": ("memory", 1, "s", 2.6, "pop", -5),
    "scrollPick": ("skill", 1, "s", 0.5, "whoosh", -8), "scrollOpen": ("skill", 1, "s", 1.7, "paper", -6),
    "skillHit": ("skill", 1, "e", 0.3, "fanfare", -3),
    "gateOpen": ("mcp", 0, "s", 1.4, "hum", -8), "beam1": ("mcp", 0, "s", 4.0, "pop", -6),
    "beam2": ("mcp", 0, "s", 4.7, "pop", -6), "beam3": ("mcp", 0, "s", 5.6, "pop", -6),
    "scoutPop": ("agent", 1, "s", 0.5, "pop", -4), "scoutGo": ("agent", 1, "e", 0.0, "whoosh", -8),
    "scoutBack": ("agent", 2, "s", 1.9, "whoosh", -8), "reportIn": ("agent", 2, "e", 0.15, "chime", -6),
    "edit1": ("hooks", 1, "s", 1.0, "hammer", -6), "bell1": ("hooks", 1, "s", 1.9, "bell", -5), "tests1": ("hooks", 1, "s", 3.1, "chime", -8),
    "edit2": ("hooks", 2, "s", 0.1, "hammer", -6), "bell2": ("hooks", 2, "s", 0.55, "bell", -5), "tests2": ("hooks", 2, "s", 1.5, "chime", -8),
    "chestOpen": ("plugin", 1, "s", 0.1, "creak", -6), "loot": ("plugin", 1, "s", 0.7, "sparkle", -6),
    "lootLand": ("plugin", 1, "s", 2.0, "chime", -7),
    "partyIn": ("party", 0, "s", 0.1, "ticks", -8), "quote": ("party", 1, "s", -0.5, "boom", -8),
    "endSpark": ("outro", 1, "s", 0.0, "sparkle", -8), "endChord": ("outro", 1, "e", 0.2, "fanfare", -5),
}


# ------------------------------------------------------------------ voice
_k = None
def tts(who, text, cache):
    global _k
    voice, speed = VOICES[who]
    say = text
    for a, b in SAY:
        say = say.replace(a, b)
    path = os.path.join(cache, hashlib.md5((voice + str(speed) + say).encode()).hexdigest()[:12] + ".wav")
    if not os.path.exists(path):
        if _k is None:
            from kokoro_onnx import Kokoro
            _k = Kokoro(os.path.join(KMODEL, "model.onnx"), os.path.join(KMODEL, "voices.npz"))
        a, sr = _k.create(say, voice=voice, speed=speed, lang="en-us")
        sf.write(path, a, sr)
    a, sr = sf.read(path)
    a = signal.resample_poly(a, SR, sr)
    idx = np.where(np.abs(a) > 0.01)[0]                      # trim silence, keep short tails
    a = a[max(0, idx[0] - 600): idx[-1] + 4000]
    return a / (np.sqrt(np.mean(a ** 2)) + 1e-9) * 0.085       # same loudness for every voice


# ------------------------------------------------------------------ sound effects
def env(n, a=0.004, d=0.05):
    t = np.arange(n) / SR
    return np.minimum(t / a, 1) * np.exp(-np.maximum(t - a, 0) / d)

def note(f, dur=0.5, tau=0.18):
    return D.modal(dur, [(f, 1.0, tau), (f * 2, 0.35, tau * 0.6), (f * 3.01, 0.12, tau * 0.4)])

def seq(notes, step=0.085, dur=0.6, tau=0.2):
    y = np.zeros(D.ns(step * len(notes) + dur))
    for i, f in enumerate(notes):
        x = note(f, dur, tau); k = D.ns(i * step); y[k:k + len(x)] += x
    return y * 0.3

def sfx(name, r):
    if name == "whoosh": return G.whoosh(0.55, r, peak=0.22, f_lo=400, f_hi=2600) * 0.6
    if name == "paper": return G.whoosh(0.35, r, peak=0.08, f_lo=1500, f_hi=5000, tail=0.12, air=0.5) * 0.4
    if name == "down": return G.whoosh(1.1, r, peak=0.15, f_lo=1800, f_hi=250, tail=0.5) * 0.6
    if name == "fanfare": return seq([523.25, 659.25, 783.99, 1046.5, 1318.5], 0.09, 0.9, 0.3)
    if name == "chime": return seq([783.99, 1046.5], 0.08, 0.6, 0.22)
    if name == "pop":
        n = D.ns(0.09); f = np.linspace(700, 320, n); return np.sin(D.phase(f)) * env(n, 0.003, 0.03) * 0.5
    if name in ("blip", "blip2"):
        n = D.ns(0.07); f0 = 880 if name == "blip" else 1175
        return D.lp(np.sign(np.sin(D.TAU * f0 * np.arange(n) / SR)), 3000) * env(n, 0.003, 0.03) * 0.25
    if name == "tick": return G.clink(r, 2100, 0.1) * 0.5
    if name == "ticks":
        y = np.zeros(D.ns(1.9))
        for i in range(10):
            x = G.clink(r, 1500 + i * 130, 0.08) * 0.4; k = D.ns(i * 0.16); y[k:k + len(x)] += x
        return y
    if name == "thud":
        n = D.ns(0.35); t = np.arange(n) / SR
        return (np.sin(D.TAU * 85 * t) * np.exp(-t / 0.07) + 0.5 * D.lp(r.standard_normal(n), 400) * np.exp(-t / 0.03)) * 0.7
    if name == "boom":
        n = D.ns(1.2); t = np.arange(n) / SR
        return (np.sin(D.phase(np.linspace(70, 42, n))) * np.exp(-t / 0.35) * 0.8 + G.whoosh(1.2, r, peak=0.4, f_lo=200, f_hi=1200)[:n] * 0.4)
    if name == "buzz":
        n = D.ns(0.14); x = D.lp(np.sign(np.sin(D.TAU * 150 * np.arange(n) / SR)), 1200) * env(n, 0.005, 0.2) * 0.3
        return np.concatenate([x, np.zeros(D.ns(0.06)), x])
    if name == "squeeze":
        n = D.ns(0.5); f = np.linspace(300, 1400, n); t = np.arange(n) / SR
        return np.concatenate([np.sin(D.phase(f)) * np.minimum(t / 0.05, 1) * np.exp(-(0.5 - t) * 2) * 0.3, sfx("pop", r)])
    if name == "zap":
        n = D.ns(0.22); f = np.linspace(1800, 500, n)
        return (np.sin(D.phase(f)) * env(n, 0.004, 0.07) * 0.4 + np.pad(G.clink(r, 2600, 0.12) * 0.4, (D.ns(0.1), 0))[:n])
    if name == "hum":
        n = D.ns(2.2); t = np.arange(n) / SR
        y = sum(np.sin(D.TAU * f * t + i) for i, f in enumerate([110, 164.8, 220, 329.6])) * (1 + 0.3 * np.sin(D.TAU * 5 * t))
        return y * np.minimum(t / 0.8, 1) * np.minimum((2.2 - t) / 0.8, 1) * 0.12
    if name == "hammer": return G.hammer_hit(r) * 0.7
    if name == "bell":
        f = 1244.5
        return D.modal(1.8, [(f, 1.0, 0.7), (f * 2.76, 0.5, 0.4), (f * 5.4, 0.25, 0.2), (f * 0.5, 0.3, 0.9)]) * 0.3
    if name == "creak": return np.concatenate([G.creak(0.55, r, 140, 260) * 0.5, sfx("thud", r) * 0.5])
    if name == "sparkle":
        y = np.zeros(D.ns(1.3))
        for i in range(12):
            x = G.clink(r, r.uniform(2500, 6000), 0.14) * 0.35; k = D.ns(r.uniform(0, 1.0)); y[k:k + len(x)] += x
        return y
    raise KeyError(name)


def main():
    cache = os.path.join(HERE, "voice"); os.makedirs(cache, exist_ok=True)
    t = 0.0
    scenes, placed, index = [], [], {}
    for sid, opt, lines in SCENES:
        t0 = t; t += opt.get("pre", 1.0)
        out = []
        for i, ln in enumerate(lines):
            who, text = ln[0], ln[1]; lo = ln[2] if len(ln) > 2 else {}
            if i > 0 or "gap" in lo:
                t += lo.get("gap", 0.38)
            a = tts(who, text, cache)
            d = len(a) / SR
            placed.append((t, a))
            out.append(dict(who=who, text=text, t0=round(t, 3), t1=round(t + d, 3)))
            t += d
        t += opt.get("post", 0.7)
        scenes.append(dict(id=sid, t0=round(t0, 3), t1=round(t, 3), lines=out))
        index[sid] = out
    dur = round(np.ceil(t * 30) / 30, 3)

    cues = {}
    for name, (sid, li, anchor, off, snd, gain) in CUES.items():
        ln = index[sid][li]
        cues[name] = round((ln["t0"] if anchor == "s" else ln["t1"]) + off, 3)
    # one soft pop when each part's name plate lands
    plates = [(s["t0"] + 0.35) for s in scenes if s["id"] not in ("intro", "title", "party", "outro")]

    N = D.ns(dur)
    voice = np.zeros((2, N)); fx = np.zeros((2, N))
    for tt_, a in placed:
        D.place(voice, a, tt_)
    r = D.rng(7)
    for name, (sid, li, anchor, off, snd, gain) in CUES.items():
        x = sfx(snd, r)
        D.place(fx, D.widen(x, r, 9, 0.4), cues[name], D.dbg(gain))
    for p in plates:
        D.place(fx, sfx("pop", r), p, D.dbg(-10))
    # typewriter-free: no per-letter blips under the voice

    # music: loop, quiet, ducked under the voice
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", MUSIC, "-f", "f32le", "-ac", "2", "-ar", str(SR), "-"],
                         capture_output=True, check=True).stdout
    m = np.frombuffer(raw, np.float32).reshape(-1, 2).T.astype(np.float64)
    reps = int(np.ceil(N / m.shape[1]))
    m = np.tile(m, (1, reps))[:, :N]
    level = np.abs(voice[0])
    k = D.ns(0.25); smooth = np.convolve(level, np.ones(k) / k, mode="same")
    duck = 1.0 - 0.55 * np.clip(smooth / 0.03, 0, 1)
    tsec = np.arange(N) / SR
    fade = np.minimum(tsec / 1.5, 1) * np.minimum((dur - tsec) / 4.0, 1)
    music = m * D.dbg(-21) * duck * fade

    mix = voice + fx + music
    tmp = os.path.join(HERE, "mix.wav")
    D.write_wav(tmp, mix)
    os.makedirs(os.path.join(PROJ, "assets"), exist_ok=True)
    out = os.path.join(PROJ, "assets", "soundtrack.m4a")
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", tmp, "-af", "loudnorm=I=-16:TP=-1.5:LRA=11",
                    "-ar", "48000", "-c:a", "aac", "-b:a", "192k", out], check=True)
    timing = dict(dur=dur, scenes=scenes, cues=cues)
    with open(os.path.join(PROJ, "js", "timing.js"), "w") as f:
        f.write("window.TIMING = " + json.dumps(timing, indent=1) + ";\n")
    import re
    html = os.path.join(PROJ, "index.html")
    src = open(html).read()
    open(html, "w").write(re.sub(r'data-duration="[0-9.]+"', f'data-duration="{dur:g}"', src))
    print("duration", dur, "s;", len(placed), "lines;", len(cues), "cues")
    for s in scenes:
        print(f"  {s['id']:8s} {s['t0']:7.2f} - {s['t1']:7.2f}")


main()
