# Anitoons Missions — reusable web player

**Mission 001: The Missing Key** is a playable point-and-click adventure with two connected locations, chai, a sofa, a key puzzle, a scooter, branches, locally generated music/SFX and a limited-animation ending.

**New in v2:** the story content is no longer hard-coded into the browser's click handlers. The same `MissionEngine` and `player.js` can play different adventures defined in JSON. See [Mission JSON format](MISSION_FORMAT.md).

## Mission 002 — The Rooftop Kite

Open **[Mission 002](./?mission=rooftop-kite)**, or navigate to `/missions/?mission=rooftop-kite` when the static site is served over HTTP. This uses exactly the same engine as Mission 001, but a completely separate [JSON definition](adventures/rooftop-kite.json), [illustrated scene pack](kite-art.js), dialogue and branching puzzle.

- Workshop: repair a torn kite with coloured paper, then tie cotton thread.
- Rooftop: drag the kite into the chalk launch circle, choose the gentle east wind (the west gust offers a retry), and launch.
- Finale: generated breeze and festival-themed tones accompany a short, limited-animation flight above the rooftops.

Works with drag-and-drop or tap-to-select, including the inventory pocket, hints, replay and keyboard control. No external image, audio or AI-generation APIs are called at runtime. The second mission is content generated for this demonstration, **not** a working text-prompt-to-game authoring feature.

## Play

Serve the repository using a static HTTP server and open `/missions/` (for example with `python3 -m http.server 8000`). No install, API key, paid assets or build step required. `file://` is unsupported because JSON is loaded with `fetch`.

1. Give Harpreet chai by dragging the cup onto him, or tap the cup and then him.
2. Search the cupboard or visit the courtyard first and return.
3. Take the key from the cupboard.
4. Go outside and use the key on the scooter.
5. Move Harpreet onto the scooter and start it.

You can also sit on the sofa. Keyboard: Tab and Enter to explore, Escape to cancel selection. The Hint, Restart, Sound and Replay controls remain available. Game progress is session-only.

## Separation of responsibilities

| File | Responsibility |
| --- | --- |
| `mission.json` | **Content only:** locations, props, dialogue, choices, branching rules, objectives, hints, inventory items, cutscene timeline and completion copy. |
| `mission-engine.js` | **Generic story logic:** rule resolution, conditions, flags, inventory, scene/pose state and completion; no DOM. |
| `player.js` | **Reusable runtime:** HTML/SVG renderer, inputs, drag/drop and tap equivalents, dialogue widgets, music and cut-frame playback. |
| `assets.js` | Original SVG scene art, props, scooter and fallback actor. |
| `mission-props.js` | Small sprite adapter mapping named prop types to existing SVG artwork; reusable for future mission JSON. |
| `character-bridge.js` | Same-origin snapshot bridge to existing Anitoons character rig; fallback works if unavailable. |
| `missions.css` | Shared responsive presentation. |
| `tests/missions.cjs` | Full key/scooter sequence plus a second independent synthetic mission to prove the engine isn't key-specific. |

The mission browser player is deliberately simple: no build tooling, external runtime library, AI API call, server DB or visual editor.

## Check

```sh
node tests/missions.cjs
node tests/missions-002.cjs
node --check missions/player.js
node --check missions/mission-engine.js
node --check missions/mission-props.js
node --check missions/kite-art.js
```

Also test in a browser: home first, outside first, drag cup, tap-to-combine key, sofa sitting and standing, blocked scooter, mounting, ending and replay. The JavaScript syntax and DOM-independent event flow are checked, but physical device QA is separate.

## Next

Author a second genuine adventure with different objects/scenes (adding any new SVG artwork to the prop catalogue). Then add a small mission picker and a simple mission-building UI. The core does not require changing for new dialogue, scene transitions, conditions or puzzles.


## Mission 003 — The Last Delivery

Open `/missions/delivery.html` (or `/missions/?mission=last-delivery`). This is a
fullscreen dusk adventure with three playable locations, a cinema finale, three
characters from the existing Anitoons rig, stored dialogue, approximate audio-driven
mouth motion, short action sequences, inventory combinations and autosave.

Recover the parcel address with the desk lamp, tighten the scooter terminal with
Meena's spanner, and trade Kabir either a paper/pencil pinwheel or a warm chai for
the headlight fuse. Fit the fuse, then take Clocktower Hill. The flooded underpass
allows a retry. Tool repair and the trade can be solved in either order.

The shared `MissionEngine` still owns puzzle state. `sequence-runner.js` runs the
walking/pose/voice/effect cues. `delivery-bridge.js` builds pose banks using the
existing studio rig. The new presentation is separate from the legacy Mission
001/002 player. See `docs/mission-audio.md` for the single-secret voice pipeline.

Checks: `node tests/missions-003.cjs` plus the existing mission/audio tests.

Mission 003 presentation update: true left/right rig poses, twelve walk samples
phased by distance, compact joint/face pose patches, idle breathing/blinks/glances
and neighbour gestures. Dialogue uses large A/B/C/D buttons (keyboard letters or
1–4), plus Cinematic/Follow/Wide camera modes, action close-ups, extra ambient
props and a quiet original procedural score that ducks under speech. Stored
voice clips are reused. Check `node tests/delivery-presentation.cjs` as well.

## Mission 004 — The Missing Moon Lantern

Open `/missions/moon-lantern.html` or `/missions/?mission=moon-lantern`.
A cozy mystery in four original SVG locations: the reading room, courtyard,
potting shed and moonflower greenhouse. Harpreet and Kabir follow a blue ribbon,
a moonflower petal and plant tag 13; Meena has kept the lantern safe from the breeze.

Grade 1 investigations use touchable visual counters: 10 − 6 empty hooks, 7 + 5
picnic snacks, comparing 14 and 12 footprints, repeating blue/gold patterns,
and ordering 11, 12, 13, 14. An optional 6 + 6 flower puzzle offers extra practice.
Answers give explanatory retries; no timer, score or lives. A final deduction uses
the collected evidence. The child can pack snacks early or return for them later.

This mission reuses the Mission 003 walking/idle rig, camera, original procedural
score, inventory controls, subtitles, autosave and sequence runner. The new
`moon-lantern-art.js` supplies original vector scenery; `moon-lantern.js` adds
the visual math table and clue notebook. Mission JSON owns all story state and
correct answers. Saved progress is separate from Mission 003.

Voice generation uses the existing GitHub workflow and reference voices; choose
`moon-lantern` to regenerate just this mission. Until its audio manifest is available,
all dialogue remains readable and the procedural music and sounds still play.

Validation: `node tests/missions-004.cjs`, Mission 003 regression and shared
camera/score checks. Browser/device layout should also be checked at landscape
phone and desktop sizes.
