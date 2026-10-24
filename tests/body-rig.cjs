const assert=require('node:assert/strict');
const {chromium}=require(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES?process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/playwright':'playwright');
const {pathToFileURL}=require('node:url');const path=require('node:path');
(async()=>{const browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{}),args:['--no-sandbox']});const p=await browser.newPage();const errors=[];p.on('pageerror',e=>errors.push(e.message));await p.goto(pathToFileURL(path.resolve(__dirname,'../index.html')).href);
const result=await p.evaluate(()=>{
 const styles=Object.keys(WARDROBE);let checks=0;
 for(const shirt of styles)for(const view of ['front','left','right'])for(const framing of ['head','full']){
  state.shirt=shirt;cameraView=view;state.framing=framing;render();
  const geometry=()=>JSON.stringify([...document.querySelectorAll('#torso path')].map(n=>n.getAttribute('d')));
  const original=geometry();const nodes=[...document.querySelectorAll('#torso [data-rig-arm]')];
  for(const time of [0,.2,1,2.8,3.5]){poseHeadshotArms(reactionPose('wave',time));if(geometry()!==original)throw Error('Geometry changed '+shirt);if(nodes.some(n=>!n.isConnected))throw Error('Rig replaced mid-animation');checks++;}
  if(nodes.length!==2)throw Error('Expected exactly two arms');
  if(framing==='full'&&document.querySelectorAll('#torso [data-rig-knee]').length!==2)throw Error('Leg joint missing');
 }
 WARDROBE.testDesign={label:'Test',template:'short',neck:'v',pocket:true};state.shirt='testDesign';render();if(!document.querySelector('[data-garment="testDesign"]'))throw Error('Registry addition failed');delete WARDROBE.testDesign;render();if(!document.querySelector('[data-garment="crew"]'))throw Error('Removed design fallback failed');
 return {styles:styles.length,checks,templates:Object.keys(GARMENT_TEMPLATES).length};
});assert.deepEqual(errors,[]);console.log('PASS',result);await browser.close();})().catch(e=>{console.error(e);process.exit(1)});
