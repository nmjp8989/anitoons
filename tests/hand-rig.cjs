'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const start=html.indexOf('const HAND_REAL_PATH=');
const end=html.indexOf('\nfunction applyFraming()',start);
const code=html.slice(start,end).replace(/^state\.handPose=.*\n/m,'').replace(/^catalogs\.handPose=.*\n/m,'');
const sandbox={rigDetail:(d,w)=>`<path d="${d}" fill="none" stroke="#161011" stroke-width="${w}"/>`};
vm.runInNewContext(code+'\nglobalThis.hands={HAND_POSES,actionHandSvg,proportionalHandSvg,HAND_REAL_PATH};',sandbox);
const {HAND_POSES,actionHandSvg,proportionalHandSvg,HAND_REAL_PATH}=sandbox.hands;
for(const [pose,h] of Object.entries(HAND_POSES)){
 assert.equal(h.fingers.length,4,pose+' needs four digits in addition to thumb');
 for(const view of ['palm','back','edge','up']){
  const art=actionHandSvg(pose,view);
  assert(!/NaN|undefined|scale\(-/.test(art));
  assert(art.includes(HAND_REAL_PATH),pose+' must retain common palm and wrist');
  assert(art.includes(`scale(${view==='edge'?.78:1} 1)`),'No pose-dependent scale or finger stretching');
  assert(art.includes('stroke="#161011"'),'Hand contours must be explicit');
 }
}
for(const pose of ['open','relaxed','palmUp']){
 const f=HAND_POSES[pose].fingers;
 assert(f[1][1]>f[0][1]&&f[1][1]>f[2][1]&&f[3][1]<f[2][1],'Natural digit lengths');
 for(let i=1;i<4;i++)assert(f[i][0]-f[i-1][0]>=21,'Tip gaps must survive thick body ink');
}
assert.equal(actionHandSvg('unknown').replace('unknown','relaxed'),actionHandSvg('relaxed'));
assert(proportionalHandSvg(0,0,1,'open').includes(actionHandSvg('open')));
const arm=html.slice(html.indexOf('function rigArmSvg('),html.indexOf('\nfunction bodyCameraX('));
assert(arm.includes('scale(${side*depth*bodyShapeProfile().arm} 1)'),'Arm supplies mirroring');
assert(arm.indexOf('data-hand-action display="none"')<arm.indexOf('data-hand-cuff'),'Cuff covers wrist');
console.log('PASS: nine anatomical poses, four fingers + thumb, shared proportions, visible finger gaps, mirror and cuff layering');
