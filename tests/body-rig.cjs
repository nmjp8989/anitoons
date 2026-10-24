const assert=require('node:assert/strict');
const {chromium}=require(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES?process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/playwright':'playwright');
const {pathToFileURL}=require('node:url');const path=require('node:path');
(async()=>{const browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{}),args:['--no-sandbox']});const p=await browser.newPage();const errors=[];p.on('pageerror',e=>errors.push(e.message));await p.goto(pathToFileURL(path.resolve(__dirname,'../index.html')).href);
const result=await p.evaluate(()=>{
 // Verify support, forward knee bend, opposite steps, and seamless loop boundaries.
 for(const side of [-1,1])for(let i=0;i<=120;i++){
  const t=i/100,g=walkingStep(t,side),next=walkingStep(t+.00001,side);
  if(g.stance&&g.lift!==0)throw Error('Supporting foot lifted');
  if(g.kneeForward<g.forward/2)throw Error('Knee bent backwards');
  if(Math.abs(next.forward-g.forward)>1||Math.abs(next.lift-g.lift)>1)throw Error('Gait discontinuity');
  const loop=walkingStep(t+1.2,side);if(Math.abs(loop.forward-g.forward)>1e-8)throw Error('Loop seam');
  if(!g.stance&&!walkingStep(t,-side).stance)throw Error('Both feet airborne');
 }
 state.gazeX=0;state.gazeY=0;
 for(const view of ['left','front','right']){cameraView=view;const g=eyeGaze('open');if(g.x!==cameraDirections[view]*.8)throw Error('Gaze does not follow face');for(const style of Object.keys(eyeStyles)){state.eyeStyle=style;render();if(document.querySelector('#eyeGroup').innerHTML.includes('NaN'))throw Error('Invalid eye geometry');}if(eyeGaze('left').x!==-1||eyeGaze('right').x!==1)throw Error('Explicit look lost');}
 const styles=Object.keys(WARDROBE);let checks=0;
 for(const shirt of styles)for(const view of ['front','left','right'])for(const framing of ['head','full']){
  state.shirt=shirt;cameraView=view;state.framing=framing;render();
  const geometry=()=>JSON.stringify([...document.querySelectorAll('#torso path')].map(n=>n.getAttribute('d')));
  const original=geometry();const nodes=[...document.querySelectorAll('#torso [data-rig-arm]')];
  for(const time of [0,.2,1,2.8,3.5]){poseHeadshotArms(reactionPose('wave',time));if(geometry()!==original)throw Error('Geometry changed '+shirt);if(nodes.some(n=>!n.isConnected))throw Error('Rig replaced mid-animation');checks++;}
  if(framing==='full'){for(const time of [0,.3,.6,.9]){poseWalking(time);if(document.getElementById('torso').innerHTML.includes('NaN'))throw Error('Invalid gait');}render();if(document.querySelector('#torso [data-rig-hip]').hasAttribute('transform'))throw Error('Gait reset failed');}
  if(nodes.length!==2)throw Error('Expected exactly two arms');
  if(framing==='full'&&document.querySelectorAll('#torso [data-rig-knee]').length!==2)throw Error('Leg joint missing');
 }
 WARDROBE.testDesign={label:'Test',template:'short',neck:'v',pocket:true};state.shirt='testDesign';render();if(!document.querySelector('[data-garment="testDesign"]'))throw Error('Registry addition failed');delete WARDROBE.testDesign;render();if(!document.querySelector('[data-garment="crew"]'))throw Error('Removed design fallback failed');
 return {styles:styles.length,checks,templates:Object.keys(GARMENT_TEMPLATES).length};
});assert.deepEqual(errors,[]);console.log('PASS',result);await browser.close();})().catch(e=>{console.error(e);process.exit(1)});
