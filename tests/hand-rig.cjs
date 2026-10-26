'use strict';
// Regression checks for Umto's wrist-local hand assets. Run with: node tests/hand-rig.cjs
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const start=html.indexOf('const HAND_REAL_PATH=');
const end=html.indexOf('\nfunction applyFraming()',start);
assert.ok(start>0 && end>start,'Hand asset definitions must be present');
const handCode=html.slice(start,end)
 .replace(/^state\.handPose=.*\n/m,'')
 .replace(/^catalogs\.handPose=.*\n/m,'');
const sandbox={rigDetail:(d,w)=>'<path data-line="'+w+'" d="'+d+'"/>'};
vm.runInNewContext(handCode+'\nglobalThis.handTest={HAND_POSES,actionHandSvg,proportionalHandSvg,HAND_FOLDED_THUMB};',sandbox);
const {HAND_POSES,actionHandSvg,proportionalHandSvg,HAND_FOLDED_THUMB}=sandbox.handTest;

for(const pose of ['open','relaxed','fist','point']){
 assert.equal(HAND_POSES[pose].anatomical,true,pose+' uses anatomical geometry');
 assert.match(HAND_POSES[pose].d,/^M -12 0\b/,pose+' must share the wrist anchor');
 for(const view of ['palm','back','edge','up']){
  const markup=actionHandSvg(pose,view);
  assert.ok(markup.includes('data-action-hand="'+pose+'"'),pose+' must render');
  assert.ok(!/NaN|undefined|scale\(-/.test(markup),pose+'/'+view+' must not flip independently of arm');
  assert.ok(markup.includes('stroke="#15100f"'),pose+' should retain black contour');
 }
}
for(const pose of ['fist','point'])
 assert.ok(actionHandSvg(pose).includes(HAND_FOLDED_THUMB),pose+' must share folded thumb');
assert.ok(proportionalHandSvg(0,0,1,'relaxed').includes(HAND_POSES.relaxed.d),'Thumbs and previews share geometry');

const arm=html.slice(html.indexOf('function rigArmSvg('),html.indexOf('\nfunction bodyCameraX('));
assert.ok(arm.includes('scale(${side*depth*bodyShapeProfile().arm} 1)'),'Parent rig must handle mirroring');
assert.ok(arm.indexOf('data-hand-action display="none"')<arm.indexOf('data-hand-cuff'),'Cuff must cover wrist seam');
console.log('PASS: hand anatomy, pose views, mirror symmetry, folded thumbs and cuff layering');
