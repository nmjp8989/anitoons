# Pickable props and attachments

## Asset and instance
An asset is reusable artwork (`props/cup.svg`) plus metadata (`props/cup.json`). An instance has a stable unique ID, asset ID, transform, optional parent attachment, state and draw order. Ten cups use one asset and ten instances. Character preset IDs are not instance IDs: two copies of the same character must have different entity IDs.

## Named anchors
Characters expose anchors from their live animated rig: `leftHand`, `rightHand`, `head`, `shoulder`, `seat`. Props expose anchors such as a table's `surface`, a scooter's `seat` and `handlebar`, or a bag's `handle`. Author the prop's grip point at its local origin, or apply the inverse grip transform when attaching.

An attachment is `{entity: "actor-17", anchor: "rightHand"}`. The child world transform is parent world × live anchor × child local transform. `attachments.js` implements that rule, nested props, cycle rejection, snapping and detaching without a position jump. Update character anchor matrices after posing, using the wrist matrix relative to the scene canvas. Read matrices before attaching or detaching; avoid side-on singular transforms.

## Interaction flow
1. Pick an instance; highlight valid attachment targets.
2. Drag in scene coordinates (inverse canvas screen matrix), with pointer capture for touch/mouse.
3. On release, attach to the closest compatible anchor or leave on the ground.
4. Apply a named interaction: `cup + hand → hold`, `cup + mouth → drink`, `character + sofa seat → sit`.
5. Change pose/state and play a short animation/audio cue. Keep rule logic in mission JSON rather than inside SVG art.

Anchor metadata specifies accepted tags, capacity, facing and depth. Resolve layering independently from parenting: a cup can follow a wrist while drawing behind fingers. Render ground items, rear attachments, characters and front attachments in explicit layers. Reject occupied or incompatible anchors in the interaction controller. Delete-parent behavior should detach children in world space, never silently delete them.

## Persistence
Save versioned entity records and attachment references with the scene. Validate unique IDs, missing assets, missing parents, cycles and numeric transforms on load. Store each scene's placements separately; changing backgrounds must not move props into another location accidentally. Include foreground and prop layers in image/SVG exports.

## Delivery stages
Implemented now: SVG background catalogue and the pure attachment-transform module with tests.
Next: prop catalogue with cup, book, bag, table and sofa; pick/drag UI; live wrist anchor adapter; attach/detach controls and persistence. Then add sit/drink/ride rules and mission integration. The current scene UI does not yet provide prop dragging or attachments.
