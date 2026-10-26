const assert=require('node:assert/strict'),path=require('node:path');
const {pathToFileURL}=require('node:url');
const {chromium}=require(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES?process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/playwright':'playwright');
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH||undefined,args:['--no-sandbox','--no-zygote','--single-process','--use-gl=angle','--use-angle=swiftshader']});
 const page=await browser.newPage({viewport:{width:1440,height:1100}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(pathToFileURL(path.resolve(__dirname,'../index.html')).href);await page.click('#scenesMode');
 const ids=await page.evaluate(()=>{
  const api=UmtoSceneProps,actor=scene.cast[0].entityId,cup=api.add('cup'),table=api.add('table'),scooter=api.add('scooter'),sofa=api.add('sofa'),bag=api.add('bag');
  if(!api.attach(cup,actor,'rightHand'))throw Error('Cup attachment failed');
  if(!api.attach(bag,actor,'shoulder'))throw Error('Shoulder attachment failed');
  const before=api.world(cup);scene.cast[0].position+=20;layoutSceneActors();const after=api.world(cup);if(after[4]<=before[4])throw Error('Handheld object did not follow actor');
  api.save();return {actor,cup,table,scooter,sofa,bag,location:scene.location};
 });
 await page.reload();await page.click('#scenesMode');
 assert.equal(await page.evaluate(id=>UmtoSceneProps.getState().objects[id].parent.anchor,ids.cup),'rightHand','Held props survive reload');
 await page.evaluate(ids=>{
  const api=UmtoSceneProps;api.detach(ids.cup);api.attach(ids.cup,ids.table,'surface');const before=api.world(ids.cup);api.getState().objects[ids.table].transform[4]+=80;paintScene(scene.elapsed);if(Math.abs(api.world(ids.cup)[4]-before[4]-80)>.01)throw Error('Table child did not follow');
  const matrix=api.world(ids.cup);api.detach(ids.cup);if(JSON.stringify(matrix)!==JSON.stringify(api.world(ids.cup)))throw Error('Detach jumped');
  if(!api.attach(ids.cup,ids.actor,'rightHand'))throw Error('Cup should be held before sitting');
  if(!api.sit(ids.actor,ids.scooter))throw Error('Scooter seating failed');
  if(api.getState().objects[ids.cup].parent?.entity!==ids.actor)throw Error('Sitting dropped an already-held cup');
  if(api.getState().objects[ids.bag].parent?.entity!==ids.actor)throw Error('Sitting dropped a shoulder bag');
  if(!api.getState().seats[ids.actor])throw Error('Rider seat reference missing');
  const rider=scene.nodes[0].svg,x=+rider.getAttribute('x');if(!rider.querySelector('[data-seated-legs]'))throw Error('Seated legs were not drawn');if(!document.getElementById('scenePropsBack').contains(sceneCanvas.querySelector(`[data-entity="${ids.scooter}"]`)))throw Error('Scooter should render behind its rider');const cupX=api.world(ids.cup)[4];api.getState().objects[ids.scooter].transform[4]+=60;paintScene(scene.elapsed);if(Math.abs(+rider.getAttribute('x')-x-60)>.1)throw Error('Rider did not follow scooter');if(Math.abs(api.world(ids.cup)[4]-cupX-60)>3)throw Error('Held cup failed to follow moving rider');
  api.getState().objects[ids.sofa].transform[4]=950;if(!api.sit(scene.cast[1].entityId,ids.sofa))throw Error('Sofa seating failed');if(!scene.nodes[1].svg.querySelector('[data-seated-legs]'))throw Error('Sofa sitter needs bent legs');if(!api.attach(ids.cup,scene.cast[1].entityId,'rightHand'))throw Error('Seated sofa character could not accept a cup');if(api.getState().objects[ids.cup].parent?.entity!==scene.cast[1].entityId)throw Error('Cup attachment not saved on sofa sitter');if(api.sit(scene.cast[1].entityId,ids.scooter)!==false)throw Error('Occupied scooter allowed another rider');api.select(ids.actor);if(![...document.querySelectorAll('#propInspector button')].some(b=>b.textContent==='Ride Scooter'))throw Error('Quick ride button missing');api.save();
  if(sceneCanvas.innerHTML.includes('NaN'))throw Error('Invalid pose geometry');
 },ids);
 await page.locator('#sceneCanvas').screenshot({path:process.env.SCENE_SCREENSHOT||'/tmp/umto-props-tested.png'});
 await page.click('[data-scene-location="park"]');assert.equal(await page.evaluate(()=>Object.keys(UmtoSceneProps.getState().objects).length),0,'Different setting starts without old props');
 await page.click(`[data-scene-location="${ids.location}"]`);assert.equal(await page.evaluate(()=>Object.keys(UmtoSceneProps.getState().objects).length),5,'Scene placements return');
 await page.evaluate(ids=>{const a=UmtoSceneProps;a.remove(ids.scooter);if(a.getState().seats[ids.actor])throw Error('Deleted vehicle retained rider');if(scene.nodes[0].svg.querySelector('[data-seated-legs]'))throw Error('Rider did not stand');a.attach(ids.cup,ids.table,'surface');a.remove(ids.table);if(a.getState().objects[ids.cup].parent)throw Error('Child retained deleted parent');a.select(ids.cup);},ids);
 // Pointer drag, including touch-compatible pointer capture, changes the prop position.
 const hit=await page.evaluate(id=>{const el=sceneCanvas.querySelector(`[data-entity="${id}"]`),r=el.getBoundingClientRect();return{x:r.x+r.width/2,y:r.y+r.height/2,before:UmtoSceneProps.world(id)[4]};},ids.cup);
 await page.mouse.move(hit.x,hit.y);await page.mouse.down();await page.mouse.move(hit.x+35,hit.y+15,{steps:4});await page.mouse.up();
 assert.notEqual(await page.evaluate(id=>UmtoSceneProps.world(id)[4],ids.cup),hit.before,'Dragging moves prop');
 const serialized=await page.evaluate(()=>toSVGString(sceneCanvas));assert(serialized.includes('scenePropsFront')&&serialized.includes('data-entity'),'Export contains scene objects');
 await page.clock.install();await page.clock.pauseAt(new Date());
 await page.evaluate(ids=>{const a=UmtoSceneProps;a.stand(scene.cast[1].entityId);if(!a.sit(ids.actor,ids.sofa))throw Error('Failed to sit down for coffee');if(!a.attach(ids.cup,ids.actor,'rightHand'))throw Error('Could not give coffee to seated actor');a.drink(ids.actor,ids.cup);},ids);
 await page.clock.runFor(1200);
 assert(await page.evaluate(ids=>{const m=UmtoSceneProps.world(ids.cup),r=scene.nodes[0].layers.mouthGroup.getBoundingClientRect(),p=new DOMPoint(r.x+r.width/2,r.y+r.height/2).matrixTransform(sceneCanvas.getScreenCTM().inverse());return Math.hypot(m[4]-28-p.x,m[5]-43-p.y)<35;},ids),'Seated character raises cup to mouth during drink');
 await page.clock.runFor(1500);
 const ride=await page.evaluate(ids=>{const a=UmtoSceneProps,s=a.add('scooter');a.sit(ids.actor,s);const x=a.world(s)[4];a.ride(s);return {id:s,x};},ids);
 await page.clock.runFor(2800);assert(await page.evaluate(r=>UmtoSceneProps.world(r.id)[4]>r.x,ride),'Ride action moves vehicle');
 assert.deepEqual(errors,[]);await browser.close();console.log('PASS: live hand/shoulder anchors, reload, table attachment, detach, rider tracking, scene isolation, deletion, dragging and SVG serialization');
})().catch(e=>{console.error(e);process.exit(1);});
