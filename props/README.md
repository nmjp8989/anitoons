# Scene props

Open **Scenes** and choose a prop under **Props & furniture**. Click a placed object to select it. Drag to move it; green circles identify available targets. Small items snap to a hand, shoulder (bag), or tabletop. Drag a character onto a sofa or scooter to snap into a seated pose, **or drag the sofa/scooter underneath a character**. The green seat target is deliberately generous, so you can drop by the head as well as the hips. If a seat is hard to reach, click the character or furniture and use **Sit on Sofa**, **Ride Scooter**, or **Seat character** in its action panel. Select a cup held in a hand and press **Drink**. Select an occupied scooter and press **Ride across scene**, or drag the vehicle with its rider.

Controls also provide Attach, Detach, Stand up and Remove. Focus an object and use arrow keys to move it, Enter to inspect it, or Delete to remove a prop. Touch uses the same pointer controls. Clicks select without detaching; dragging an attached object detaches it first. Deleting furniture releases its occupants and detaches objects on it. An occupied hand/seat rejects another attachment.

Each background saves its own cast, object instances, positions and attachments in browser local storage. Switching settings restores that setting's arrangement. Picture and SVG exports include objects and omit selection guides. Browser data clearing removes saved arrangements.

## Add an asset

Place `name.svg` and `name.json` here. Use self-contained SVG paths/shapes and metadata matching the examples. A handheld asset's origin is its grip; furniture uses a ground origin. Metadata declares its viewBox, display label, tags and named anchors. Each anchor has a six-number SVG matrix, accepted tags and capacity. Run `python tools/build_prop_catalog.py`, or push the source files and the asset workflow regenerates `catalog.js`.

`attachments.js` handles nested matrix transforms. `scene-props.js` connects the picker, drag/drop, compatibility rules, saved worlds and live wrist anchors. Characters have stable instance IDs independent of their preset. Sitting uses dedicated legs within the original body outline group. Riding aligns the pelvis with the seat, solves the existing arm joints toward the handlebar and positions feet at the footrest. These are limited-animation poses, not a physics simulation.

## Current scope

Assets: cup, book, bag, low table, sofa, scooter. Interactions: hold, carry, drink, sit and ride. Live anchors: both hands, shoulder, furniture surface, seat, handlebar and footrest. Characters keep held cups, books and bags when sitting. A seated character can accept additional handheld props: drag an item to either hand or drop it over the upper body to give it to a free hand. On the scooter, the free arm reaches the handlebar while the occupied arm holds the item. On the sofa, empty arms rest on the lap and the occupied arm lifts the item naturally. A seated character can use the **Drink** action without standing. The scooter pose faces right; the sofa pose faces front. The facing selector is locked while seated; standing restores the earlier view and action.

Mission puzzle rules and inventory integration are a separate layer; this update operates in the Scenes builder. Persistent SVG/JSON scene interchange and arbitrary user-defined interaction rules are not yet exposed in the UI.

Tests: `node tests/attachments.cjs`; browser integration: `CHROMIUM_PATH=/path/to/chromium node tests/scene-props.cjs` (requires Playwright).
