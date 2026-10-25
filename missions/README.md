# Anitoons Missions — first playable

**The Missing Key** is a short point-and-click adventure with two connected locations and an ending. It adds a Missions entry to the character studio; existing studio features remain available.

Serve the repository through any static HTTP server and open `/missions/`. It uses no build step, external artwork, audio downloads, accounts, or API keys. Opening via `file://` is unsupported because the mission definition loads with `fetch`.

## Play

1. Give Harpreet the cup of chai, by dragging it or selecting it and then selecting him.
2. Choose to search the cupboard, or visit the courtyard first and return.
3. Open the cupboard and collect the key.
4. Go outside. Use the pocket key on the scooter.
5. Move Harpreet onto the scooter and start it.

The sofa is an optional sitting interaction. Tab and Enter activate objects; Escape cancels selection. The hint button gives guidance for the current puzzle step. Restart and Play again clear the mission. Progress is intentionally session-only.

## Structure

- `mission.json`: title, question, choices, scene music identifiers, and event/action rules.
- `mission-engine.js`: DOM-independent rule conditions, flags, inventory and poses. Completing the mission waits for the departure sequence.
- `missions.js`: browser scene rendering, pointer and keyboard interactions, dialogue, cut-frame timing, and synthesized Web Audio music/effects.
- `assets.js`: original SVG backgrounds, furniture, cup, key, classic scooter and fallback character.
- `character-bridge.js`: renders pose snapshots from the existing Anitoons Harpreet preset in a same-origin hidden studio frame. Custom seated legs and a riding arm supplement the current rig. The built-in fallback is used if the frame cannot provide art.

Music differs between home and courtyard. All music and effects are generated locally with oscillators and filtered noise; playback begins with the Play button. Muting, background-tab suspension and reduced-motion CSS are included.

This is a first mission runtime, not a finished visual mission editor. Object IDs and some dialogue/scene actions in the browser adapter are specific to this mission. Add a second mission before generalizing them into an editor.

## Check

```sh
node tests/missions.cjs
node --check missions/missions.js
node --check missions/assets.js
node --check missions/character-bridge.js
```

Browser QA: full mission completion, outside-first return path, real cup drag, tap-to-combine key, seated pose, locked-scooter response, generated audio context startup, and replay reset. Physical mobile devices have not been tested.
