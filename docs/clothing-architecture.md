# Shared clothing and body rig — v71

`index.html` owns one renderer, `bodyRigSvg`, used by both headshot and full-body views. Neutral, speech, and reaction animation operate on the same DOM joints. Never substitute a clipped shirt or a separate animated arm asset.

## Adding and changing clothes

Add a record to `WARDROBE`: `label`, `template`, `neck`, and optional `buttons`, `pocket`, `pouch`, `belt`, `bow`, or `pattern: 'stripe'`. The catalogue derives its labels from this registry. Supported templates are sleeveless, short, long, jacket, tunic, and dress. Template data controls sleeve coverage, hem length, and flare. The sleeve is generated inside its arm joint chain; body details belong to the bodice.

Modify a record once to change all poses and camera views. Remove a record to retire a design; `garmentDesign` and `garmentTemplate` fall back to the classic sweater for saved characters referencing a removed design. Keep `crew` as the default design or update the fallback functions when changing it. Existing design IDs are retained as migration aliases for the newly generated clothes; their former SVG geometry is removed.

Add a reusable template when a garment needs new structural behavior. Arbitrary imported SVG garments are not automatically rigged. Colour uses the existing shirt gradient, so character colour controls continue to work.

## Joint and view contract

`BODY_RIG` defines shoulder anchors and arm lengths. Arm coordinates are nested shoulder → elbow → wrist. Clothing never changes those anchors. `setBodyArmPose` only writes joint transforms. All assembled parts receive the same body projection for front and ¾ views; near/far arm drawing order changes with the camera. Framing controls crop and full-body horizontal proportion, not garment topology.

The lower body uses hip → knee → ankle groups, ready for a future gait implementation. Walking in place is available in v72. The front view uses depth foreshortening; ¾ views solve the two-bone chain against alternating foot targets and keep the shoes level. Arms counter-swing. World-space travel, terrain-aware foot planting and cloth/skirt deformation are not implemented. Dresses retain their template hem while the legs walk underneath.

One silhouette filter outlines the combined pieces, avoiding closed outlines at overlapping shoulder and elbow joints. Internal garment details have explicit strokes.

## Verification

Install Playwright in your development environment, then run `node tests/body-rig.cjs`. Set `CHROMIUM_PATH` to an existing Chromium executable if needed. Tests cover 390 combinations of garment, framing, camera and wave phase; verify stable path geometry and DOM joints; check both leg chains; and exercise adding/removing a design.

Inspect rendered neutral, raised-arm, short-sleeve, sleeveless, jacket and dress examples as well as running tests. Geometry invariance alone does not establish drawing quality.

### v73 walking correction

Walking now uses a shared sagittal foot trajectory with a 60% support phase and a 40% lifted return. A two-segment solution bends the knee forward before projecting the joints into front and three-quarter views. Independent segment transforms preserve limb width; inverse shin transforms keep shoes level. Arms counter-swing along the viewing direction. This replaces sideways screen-space knee rotations. The animation remains a walk in place. Tests cover grounded support, continuous loop boundaries, forward knee bends, and no airborne phase, in addition to the wardrobe checks.
