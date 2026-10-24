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

### v75 continuous clothes and body direction

The walking trouser contour is now a single filled path through hip, knee, and cuff. Joint transforms still attach the shoes, but no independently rotated cloth edges can expose a knee gap. Rest/gesture hands and relaxed back/edge hands are separate shared rig states. Near/far arms and hip anchors follow the same body projection as collars, seams, pockets and hems. Garment projection maps absolute SVG path control points (M/L/H/V/C/Q/S/T/Z) once; templates must use those absolute commands. It does not duplicate clipped strips, avoiding projection bands. Front geometry remains unchanged.

The visible appbar version is checked against the document version. Visual review covers six walking phases in each camera view and sleeveless, long-sleeved, tunic and dress templates. Regression tests also check that the knee center remains inside the trouser fill and walking does not display open palms. This remains a stylized 2D walk in place, not a full 3D cloth simulation.

### v76 hip attachment and gesture hands

Trouser roots now share fixed inner/outer hip anchors with a rounded pelvis bridge; leg spread affects the lower leg rather than pulling the waistband apart. The pelvis no longer ends in a square ledge. Coverage tests sample the hip region across 24 walk phases in each view for every outfit, as well as knee coverage.

Open, pointing, and relaxed hands are shared rig states. Explaining uses a palm-up left hand and an index-pointing right hand with smaller shoulder rotation so both fit in the headshot frame. The cartoon hand family has broader palms, rounded fingers, and revised thumb orientation. These remain procedural vector assets shared by every clothing template.
