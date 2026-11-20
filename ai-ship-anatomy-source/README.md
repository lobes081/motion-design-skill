# AI Ship Anatomy: video source

Source for `ai-ship-anatomy-explainer-2026-11-20.mp4` (3 min 55 s, 1080p, 30 fps).

The video explains the ten parts of an AI assistant (model, harness, context, tools, memory, skill, MCP, agent, hooks, plugin) as a moving blueprint sheet with three original characters.

## What is in this folder

| Path | What it is |
|---|---|
| `ship/index.html` | The HyperFrames composition: page layout, blueprint styles, and the interface timeline (GSAP) |
| `ship/js/sprites.js` | The three characters, drawn on a 2D canvas |
| `ship/js/world.js` | The 3D airship set and props (three.js), in the blueprint palette |
| `ship/js/story.js` | Direction: camera, acting, and callouts for each scene, as a function of time |
| `ship/js/timing.js` | Generated: start and end time of each line and cue |
| `ship/assets/soundtrack.m4a` | Generated: voices, sound effects, and music |
| `ship/lib/` | Local copies of GSAP and three.js r170 |
| `audio/build_audio.py` | The script, the voices, the timing, the sound effects, and the mix |
| `audio/vendor/` | Sound synthesis helpers from claude-animated-shorts (MIT) |

## How to render it again

You need Node.js 22 or later, FFmpeg, and Chrome.

```bash
cd ship
npx hyperframes check     # validate
npx hyperframes render    # write the MP4
```

To change the script or the voices, edit `SCENES` in `audio/build_audio.py`, then run it. It writes `ship/js/timing.js` and `ship/assets/soundtrack.m4a`, and it updates the duration in `ship/index.html`. It needs Python with `numpy`, `scipy`, `soundfile`, and `kokoro-onnx`, the Kokoro-82M ONNX model with a `voices.npz` file, and the music file:

```bash
python audio/build_audio.py <kokoro_model_dir> <pixelland.mp3> ship
```

## Credits

| Part | Source | License |
|---|---|---|
| Renderer | HyperFrames (HeyGen) | Apache 2.0 |
| 3D engine | three.js | MIT |
| Animation timeline | GSAP | GSAP standard license |
| Character-card technique and sound synthesis | claude-animated-shorts (mromidev) | MIT |
| Voices | Kokoro-82M | Apache 2.0 |
| Music | "Pixelland" by Kevin MacLeod (incompetech.com) | CC BY 4.0 (credit required) |

The characters are original designs. The blueprint look follows the "AI Ship Anatomy" infographic.
