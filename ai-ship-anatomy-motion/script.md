# script.md: ai-ship-anatomy

Mode: motion
Aspect: 16:9
Audience: general
Style: default
Voice: kokoro:am_michael
Voice speed: 0.9
Captions: auto
Music: synth:cosmic
Music level: -21
Sound effects: on
Max duration: 215

## Narration
- s01: In The Matrix, Trinity needs to fly a helicopter. Seconds later, a pilot program loads into her head, and she can fly. AI assistants have a part that works the same way. It's called a skill.
- s02: But a skill is only one of ten parts. Let's follow one request through all ten: make a page that shows my week.
- s03: Part one is the model, the brain. It was trained once, before you ever typed a word. Text goes in, and text comes out. On its own, it can't open your calendar or save a file.
- s04: Part two is the harness, the app around the brain. Claude Code is one. The model writes what it wants to do. The harness does it, then reports back. That loop repeats until the job is done.
- s05: Part three is the context window, the model's working memory. Your request, the rules, every file, and every result go in here. Space is limited. When it fills up, the oldest parts get summarized. If something isn't in the context, the model doesn't know it.
- s06: Part four is tools, the model's hands. Read a file. Run a command. Search the web. Each tool is one action that the harness runs for the model.
- s07: Part five is memory. The model forgets everything when a session ends. So a memory file loads your standing rules at every start, like use tables, or ask before deleting.
- s08: Part six is the skill. The model sees a shelf of skill titles. Our request needs a dashboard, so only the dashboard skill loads, with its full instructions. That's the upload from the movie. The brain doesn't change. It just gets better instructions to read.
- s09: Part seven is MCP, a standard plug to the outside world. It connects the model to your calendar, your email, or GitHub. A skill is knowing how to fly. MCP is the helicopter. You need both.
- s10: Part eight is the agent. Reading a whole year of events would fill the context. So the model sends a helper with its own working memory. The helper reads everything and brings back one short summary.
- s11: Part nine is hooks, automatic rules. Every time a file is saved, a hook checks it. The model doesn't decide, and it can't skip the check.
- s12: Part ten is the plugin, a package. One install delivered the dashboard skill, the calendar connection, and the check. A plugin isn't a new ability. It's the box the other parts come in.
- s13: So here's our request again. The harness started the session and loaded memory. The model read the context, loaded a skill, reached the calendar through MCP, sent a helper, and used a tool to write the page. A hook checked it.
- s14: The famous upload is a skill. But the brain still needs the ship, the memory, and the helicopter.

## Scenes
| id | start | end | visual | note |
|---|---|---|---|---|
| s01 | 0.00 | 14.60 | graphic: graphics/world.html | hook: one upload, a neural core lights up |
| s02 | 14.60 | 23.13 | graphic: graphics/world.html | pull back to the ten-part map, the request packet appears |
| s03 | 23.13 | 36.30 | graphic: graphics/world.html | model core: text in, text out, blocked arms |
| s04 | 36.30 | 50.13 | graphic: graphics/world.html | harness ring wraps the core, loop runs |
| s05 | 50.13 | 68.63 | graphic: graphics/world.html | context column fills, oldest blocks compress |
| s06 | 68.63 | 79.53 | graphic: graphics/world.html | three tool arms reach files, terminal, web |
| s07 | 79.53 | 92.77 | graphic: graphics/world.html | session wipes, memory file reloads |
| s08 | 92.77 | 111.60 | graphic: graphics/world.html | skill shelf, one skill unrolls into context |
| s09 | 111.60 | 127.37 | graphic: graphics/world.html | MCP plug routes to calendar, email, GitHub |
| s10 | 127.37 | 141.57 | graphic: graphics/world.html | helper spawns, fills its own context, returns summary |
| s11 | 141.57 | 151.77 | graphic: graphics/world.html | save event trips a hook gate, check passes |
| s12 | 151.77 | 165.20 | graphic: graphics/world.html | plugin box opens, parts fly to their stations |
| s13 | 165.20 | 182.00 | graphic: graphics/world.html | the request packet retraces the whole map |
| s14 | 182.00 | 189.13 | graphic: graphics/world.html | close on the core and the skill |

## Sound
- @s01:loads: riser 0.7
- @s01:fly: impact 0.8
- @s01:skill: chime 0.7
- @s02:ten: whoosh 0.7
- @s02:request: pop 0.6
- @s03:model: zoom 0.6
- @s03:text: tick 0.5
- @s03:can't: tap 0.6
- @s04:harness: whoosh 0.7
- @s04:loop: pulse 0.6
- @s05:context: zoom 0.6
- @s05:summarized: sub_drop 0.6
- @s06:tools: whoosh 0.6
- @s06:read: tick 0.5
- @s06:command: tick 0.5
- @s06:search: tick 0.5
- @s07:memory: zoom 0.6
- @s07:forgets: sub_drop 0.6
- @s07:loads: chime 0.6
- @s08:skill: whoosh 0.6
- @s08:dashboard: pop 0.6
- @s08:upload: shimmer 0.8
- @s09:plug: zoom 0.6
- @s09:connects: pulse 0.6
- @s09:helicopter: impact 0.6
- @s10:agent: whoosh 0.6
- @s10:sends: whoosh 0.6
- @s10:summary: chime 0.6
- @s11:hooks: zoom 0.6
- @s11:saved: tap 0.7
- @s11:checks: chime 0.6
- @s12:plugin: whoosh 0.6
- @s12:install: boom 0.6
- @s13:request: riser 0.6
- @s13:checked: chime 0.7
- @s14:skill: shimmer 0.7

## Caption fixes
- Clawed code -> Claude Code
- Clawed -> Claude
- hook's -> hooks
- Part 9 -> Part nine
- Part 1 is the plugin -> Part ten is the plugin
- M C P -> MCP

## Emphasis
- skill
- ten parts
- model
- harness
- context window
- tools
- memory
- MCP
- agent
- hooks
- plugin
