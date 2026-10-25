# Mission JSON format (v2)

**One player, separate stories.** A mission is plain JSON. There is no JavaScript code inside the story. `mission-engine.js` evaluates conditions and changes state; `player.js` draws the scenes, handles input, dialogue, music and cut-frame animations. `mission-props.js` is the reusable catalogue of SVG objects.

Start with [mission.json](mission.json), which is the complete working example.

## Minimum mission data

```json
{
  "id": "my-adventure",
  "version": 2,
  "title": "My Adventure",
  "startScene": "room",
  "startMessage": "hello",
  "hero": {
    "id": "character", "name": "The Hero",
    "layout": {"room": [665,128,220,394]},
    "label": {"room": [773,105,150]}
  },
  "scenes": {
    "room": {
      "name": "The room", "icon": "⌂", "art": "home", "music": "home",
      "objects": [
        {"id": "sofa", "type": "sofa", "name": "Sofa — sit down"}
      ]
    }
  },
  "dialogues": {
    "hello": {"text": "Welcome! Tap the sofa."},
    "seated": {"text": "Comfy!"}
  },
  "rules": [
    {"when": "click:sofa", "in": "room", "actions": ["pose:sit", "message:seated"]}
  ],
  "objectives": [{"text": "Explore the room"}],
  "hints": [{"text": "Tap the sofa."}]
}
```

To play a separate adventure without changing the first one, save it as `missions/adventures/my-adventure.json` and open `/missions/?mission=my-adventure`. The player only accepts short lowercase filename slugs from the local `adventures/` folder (not arbitrary paths or remote URLs). The default `/missions/` loads `mission.json`. There is no visual mission picker or authoring UI yet.

### Scenes and props

- Each scene has `name`, `art` (a scenery key in `assets.js`), `music` (a synthesized soundtrack preset), and `objects`.
- Each object has `id`, `type` (sprite key in `mission-props.js`) and `name`; it may also have `if`, `badge: [text,x,y,width]`, `hitbox: [x,y,width,height]`, or `interactive:false`. Coordinates use the 1280×650 SVG world.
- `hero.layout` uses `[x,y,width,height]` for scene/pose positions. `hero.label` is `[x,y,width]`. Character art comes from Anitoons' existing rig bridge.
- `inventoryItems` maps item IDs to labels and visual keys. `draggable` lists item IDs that can be dragged or tapped then combined.

### Rules and effects

Events are strings such as `click:cupboard`, `drop:cup:character`, `enter:yard`, and `navigate:yard`. Multiple rules can have the same event; the **first rule whose scene and conditions match** is used. Conditions are AND-separated with `+`, and `!` negates:

```json
{"when":"drop:key:scooter","in":"yard","if":"inventory.key+!unlocked",
 "actions":["flag:unlocked","sound:unlock","message:keyUnlocked"]}
```

Condition tokens: `tea` (flag), `!tea`, `inventory.key`, `visible.key`, `scene.yard`, `pose.sit`, `started`, `ending`, `complete`.

State-changing actions: `flag:x`, `unflag:x`, `inventory:x`, `remove:x`, `show:x`, `hide:x`, `pose:x`, `scene:x`, `ending:complete`. Browser actions: `message:id`, `sound:cue`, `select:id`, `event:another:event`, and `cutscene:id`.

To transition between scenes, define a corresponding navigation rule:

```json
{"when":"navigate:yard","in":"home","actions":["scene:yard"]}
```

The player invokes `enter:yard` after changing the scene, allowing a conditional arrival dialogue. The final `ending:complete` action should follow a cutscene; the engine calls `finish()` only once the playback completes.

### Dialogue and choices

```json
"question": {
  "text": "Where should we go?",
  "choices": [
    {"label": "Go outside", "scene": "yard"},
    {"label": "Open cupboard", "event": "click:cupboard"},
    {"label": "Ask again", "message": "question", "if": "tea"}
  ]
}
```

`objectives`, `hints` and `progressLabels` are ordered arrays of `{if?,text}`; the first matching entry wins. `progress` entries are achievement conditions counted in the progress bar.

### Limited-animation cutscenes

```json
"cutscenes": {
  "departure": {
    "music": "cutscene",
    "frames": [
      {"caption": "The engine starts…", "duration": 850, "style": "riding"},
      {"caption": "And away!", "duration": 2500, "style": "depart"}
    ]
  }
}
```

For now, the player recognizes `riding` and `depart` as optional presentation effects; a future version can add more to the reusable animation catalogue. Sounds are generated locally by Web Audio, not external files.

## Checks

```sh
node tests/missions.cjs
node --check missions/mission-engine.js
node --check missions/player.js
node --check missions/mission-props.js
```

A JSON mission is **not** an executable script. Do not accept arbitrary JavaScript, inline SVG, or remote URLs as new action types; extend the vetted renderer and action catalogue instead.

**Not in v2:** a visual mission editor, auto-generating JSON from prompts, user accounts, persistence, dynamically importing new artwork, or mobile packaging. The current mission remains a static, offline-capable web implementation (served via HTTP, with no external APIs).
