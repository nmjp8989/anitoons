# SVG scenes

Add a self-contained `.svg` here and push to `main`. GitHub Actions regenerates `catalog.js` and requests a Pages rebuild. The character studio's Scenes picker reads this catalogue. Existing missions keep their own scene art for now.

Use `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 800">` and a `<title>` for the picker label. The filename is the stable scene ID; don't rename a scene used by saved scenes. Use paths, shapes, gradients and presentation attributes. Scripts, external images, style blocks and external references are rejected. Keep the lower central area clear for characters. Props intended for interaction belong in separate assets.

For local/offline use, run `python tools/build_scene_catalog.py` before opening `index.html`. The compiled catalogue embeds the SVGs, including in picture/SVG exports. New SVG files appear after the workflow and Pages deployment finish.
