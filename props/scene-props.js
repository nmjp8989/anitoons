/* Scene objects and live rig anchors. Character drawing functions stay unchanged. */
(function(){
 'use strict';
 if(new URLSearchParams(location.search).has('missionBridge'))return;
 const A=UmtoAttachments,assets=UMTO_PROPS,NS='http://www.w3.org/2000/svg',KEY='umto-worlds-v1';
 const I=()=>[1,0,0,1,0,0],uid=()=>crypto.randomUUID?crypto.randomUUID():'e-'+Date.now()+'-'+Math.random().toString(36).slice(2);
 let worlds={},active=null,objects={},actors={},seats={},selected=null,drag=null,loading=false;
 try{const saved=JSON.parse(localStorage.getItem(KEY)||'null');if(saved?.version===1&&saved.worlds)worlds=saved.worlds;}catch{}
 const back=document.createElementNS(NS,'g'),front=document.createElementNS(NS,'g'),guides=document.createElementNS(NS,'g');
 back.id='scenePropsBack';front.id='scenePropsFront';guides.id='scenePropGuides';guides.setAttribute('pointer-events','none');
 sceneCanvas.insertBefore(back,document.getElementById('sceneActors'));sceneCanvas.append(front,guides);
 const panel=document.createElement('section');panel.className='prop-panel';panel.innerHTML='<h3>Props & furniture</h3><p class="scene-note">Add an object, then drag it. Drop small objects near a hand or tabletop; drop a character onto a seat.</p><div id="propPicker" class="prop-picker"></div><div id="propInspector"></div><p id="propStatus" class="scene-note" role="status">Choose a prop to get started.</p>';
 scenePanel.insertBefore(panel,scenePanel.querySelector('.scene-controls'));
 const css=document.createElement('style');css.textContent='.prop-panel{margin:18px 0;padding-top:10px;border-top:1px solid #ddd}.prop-picker{display:grid;grid-template-columns:repeat(3,1fr);gap:6px}.prop-picker button,.prop-panel button,.prop-panel select{background:#fff;border:1px solid #ccd5da;border-radius:9px;padding:8px;font-size:12px}.prop-picker svg{width:100%;height:55px;display:block}.prop-inspector{background:#f1f5f4;border-radius:12px;padding:12px;margin-top:12px;display:grid;gap:8px}.prop-inspector label{font-size:12px;display:grid;gap:5px}.prop-inspector select{width:100%}.prop-actions{display:flex;gap:6px;flex-wrap:wrap}#sceneCanvas{touch-action:none}#sceneCanvas [data-entity]{cursor:grab}#sceneCanvas [data-entity]:active{cursor:grabbing}.prop-panel button:focus-visible{outline:3px solid #2476de}';document.head.append(css);
 const status=t=>document.getElementById('propStatus').textContent=t;
 const clone=x=>JSON.parse(JSON.stringify(x));
 const validMatrix=m=>Array.isArray(m)&&m.length===6&&m.every(x=>Number.isFinite(x)&&Math.abs(x)<1e6);
 const matrix=m=>[m.a,m.b,m.c,m.d,m.e,m.f];
 const transform=m=>'matrix('+m.join(' ')+')';
 function relative(node){return sceneCanvas.getScreenCTM().inverse().multiply(node.getScreenCTM());}
 function point(node,x,y){return new DOMPoint(x,y).matrixTransform(relative(node));}
 function actorId(actor){return actor.entityId||(actor.entityId=uid());}
 function metadata(asset){return Object.fromEntries(Object.entries(assets[asset].anchors).map(([k,v])=>[k,v.matrix]));}
 function all(){const e={...objects};for(const actor of scene.cast){const id=actorId(actor);e[id]={transform:I(),anchors:actors[id]?.anchors||{}};}return e;}
 function world(id){try{return A.world(all(),id);}catch{return objects[id]?.transform||I();}}
 function save(){if(loading||!active)return;worlds[active]={cast:clone(scene.cast),objects:clone(objects),actors:clone(actors),seats:clone(seats)};try{localStorage.setItem(KEY,JSON.stringify({version:1,worlds}));}catch{status('Storage is full. Keep this tab open to preserve your scene.');}}
 function normalize(){
  const ids=new Set();for(const a of scene.cast){if(!a.entityId||ids.has(a.entityId))a.entityId=uid();ids.add(a.entityId);actors[a.entityId]||={};}
  const entities=all();for(const [id,o] of Object.entries(objects)){
   try{if(o.parent){if(ids.has(o.parent.entity)){if(!['leftHand','rightHand','shoulder'].includes(o.parent.anchor))throw Error('anchor');}else{A.world(entities,id);}}}catch{o.parent=null;o.transform=validMatrix(o.transform)?o.transform:[1,0,0,1,640,650];}
  }
  for(const id of Object.keys(actors))if(!ids.has(id))delete actors[id];
  for(const [id,parent] of Object.entries(seats))if(!ids.has(id)||!objects[parent]?.anchors?.seat)delete seats[id];
 }
 function loadLocation(){
  if(active===scene.location)return;
  save();active=scene.location;loading=true;selected=null;guides.replaceChildren();
  const w=worlds[active];objects={};actors={};seats={};
  if(w){
   if(Array.isArray(w.cast)&&w.cast.length&&w.cast.length<=4){const cast=w.cast.filter(a=>a&&a.appearance&&sceneActions[a.action]&&Object.hasOwn(cameraDirections,a.view)).map((a,i)=>{const fresh=newSceneActor(a.id,i);for(const [k,v] of Object.entries(a.appearance))if(Object.hasOwn(freshCharacterDefaults,k)&&typeof v===typeof freshCharacterDefaults[k])fresh.appearance[k]=v;return {...fresh,entityId:typeof a.entityId==='string'?a.entityId:uid(),view:a.view,action:a.action,position:Math.max(0,Math.min(100,Number(a.position)||50))};});if(cast.length)scene.cast=cast;}
   for(const [id,o] of Object.entries(w.objects||{}))if(assets[o.asset]&&validMatrix(o.transform))objects[id]={id,asset:o.asset,transform:o.transform,parent:o.parent&&typeof o.parent.entity==='string'?o.parent:null,anchors:metadata(o.asset)};
   for(const a of scene.cast){const old=w.actors?.[actorId(a)]||{};actors[a.entityId]={x:Number.isFinite(old.x)?old.x:null,y:Number.isFinite(old.y)?old.y:null};}
   seats=w.seats&&typeof w.seats==='object'?w.seats:{};
  }else{scene.cast=scene.cast.map(a=>({...a,entityId:uid()}));}
  normalize();loading=false;drawObjects();inspect();
 }
 function drawObjects(){back.replaceChildren();front.replaceChildren();for(const o of Object.values(objects)){
  const group=document.createElementNS(NS,'g');group.dataset.entity=o.id;group.setAttribute('tabindex','0');group.setAttribute('role','button');group.setAttribute('aria-label',assets[o.asset].label+'; select to move or attach');
  const parsed=new DOMParser().parseFromString(assets[o.asset].svg,'image/svg+xml').documentElement;
  for(const child of [...parsed.children])if(child.tagName!=='title')group.append(document.importNode(child,true));
  (assets[o.asset].tags.includes('furniture')?back:front).append(group);
 }renderObjects();}
 function renderObjects(seconds=scene.elapsed){for(const o of Object.values(objects)){
  const g=sceneCanvas.querySelector('[data-entity="'+o.id+'"]');if(!g)continue;g.setAttribute('transform',transform(world(o.id)));
  if(o.asset==='scooter'&&(scene.playing||moving?.prop===o.id)&&Object.values(seats).includes(o.id))for(const el of g.querySelectorAll('[data-wheel-spoke]'))el.setAttribute('transform',`rotate(${(moving?performance.now()/1000:seconds)*240} ${el.dataset.wheelSpoke==='rear'?-135:135} -35)`);
 }selection();}
 function selection(){guides.replaceChildren();if(!selected)return;const node=sceneCanvas.querySelector('[data-entity="'+selected+'"]');if(!node)return;
 try{const box=node.getBBox(),m=relative(node),r=document.createElementNS(NS,'rect');for(const [k,v] of Object.entries({x:box.x-8,y:box.y-8,width:box.width+16,height:box.height+16,rx:8,fill:'none',stroke:'#2785cf','stroke-width':2,'stroke-dasharray':'6 5',transform:transform(matrix(m))}))r.setAttribute(k,v);guides.append(r);}catch{}
 }
 function detach(id){const e=all();try{A.detach(e,id);}catch{objects[id].parent=null;}drawObjects();save();inspect();}
 function compatible(id,parent,anchor){
  const o=objects[id];if(!o||id===parent)return false;
  if(objects[parent]){const rule=assets[objects[parent].asset].anchors[anchor];return !!rule&&assets[o.asset].tags.some(t=>rule.accepts.includes(t))&&Object.values(objects).filter(p=>p.id!==id&&p.parent?.entity===parent&&p.parent.anchor===anchor).length<rule.capacity;}
  return assets[o.asset].tags.includes('handheld')&&['leftHand','rightHand',...(assets[o.asset].tags.includes('wearable')?['shoulder']:[])].includes(anchor)&&!Object.values(objects).some(p=>p.id!==id&&p.parent?.entity===parent&&p.parent.anchor===anchor)&&!seats[parent];
 }
 function attach(id,parent,anchor){
  updateAnchors();if(!compatible(id,parent,anchor)){status('That attachment point is unavailable.');return false;}
  try{A.attach(all(),id,parent,anchor);if(objects[parent]?.asset==='table'){
   const siblings=Object.values(objects).filter(o=>o.id!==id&&o.parent?.entity===parent);objects[id].transform[4]=[-90,-30,30,90][siblings.length%4];
  }paintScene(scene.elapsed);drawObjects();save();inspect();status('Attached. The object follows its attachment point.');return true;}catch(e){status(e.message);return false;}
 }
 function sit(actor,prop){
  if(!objects[prop]?.anchors.seat||Object.entries(seats).some(([id,p])=>id!==actor&&p===prop)){status('That seat is occupied.');return;}
  for(const o of Object.values(objects))if(o.parent?.entity===actor)detach(o.id);
  seats[actor]=prop;const a=scene.cast.find(a=>actorId(a)===actor);if(a){a.action='smile';a.view=objects[prop].asset==='scooter'?'right':'front';}
  rebuildSceneCast();drawSceneCastControls();save();inspect();status(objects[prop].asset==='scooter'?'Riding pose: hands on handlebars, feet on footrest. Drag the scooter to move both.':'Seated. Move the sofa to carry its sitter.');
 }
 function stand(id){const node=scene.nodes[scene.cast.findIndex(a=>actorId(a)===id)];if(node){actors[id]||={};actors[id].x=Number(node.svg.getAttribute('x'));actors[id].y=Number(node.svg.getAttribute('y'));}delete seats[id];rebuildSceneCast();drawSceneCastControls();save();inspect();}
 function remove(id){
  if(!objects[id])return;for(const o of Object.values(objects))if(o.parent?.entity===id)detach(o.id);
  for(const [actor,p] of Object.entries(seats))if(p===id)delete seats[actor];delete objects[id];selected=null;rebuildSceneCast();drawSceneCastControls();drawObjects();save();inspect();
 }
 function add(asset){pauseScene();const id=uid();objects[id]={id,asset,transform:[1,0,0,1,520+(Object.keys(objects).length%4)*80,assets[asset].tags.includes('handheld')?570:700],parent:null,anchors:metadata(asset)};selected=id;drawObjects();save();inspect();status('Drag '+assets[asset].label.toLowerCase()+' or choose an attachment below.');return id;}
 for(const [id,asset] of Object.entries(assets)){const b=document.createElement('button');b.type='button';b.innerHTML=asset.svg+'<span></span>';b.querySelector('span').textContent=asset.label;b.onclick=()=>add(id);document.getElementById('propPicker').append(b);}
 function inspect(){
  const root=document.getElementById('propInspector');root.replaceChildren();if(!selected)return;
  const o=objects[selected],actor=scene.cast.find(a=>actorId(a)===selected);if(!o&&!actor)return;
  const card=document.createElement('div');card.className='prop-inspector';const title=document.createElement('strong');title.textContent=o?assets[o.asset].label:'Character '+(scene.cast.indexOf(actor)+1);card.append(title);
  const buttons=document.createElement('div');buttons.className='prop-actions';
  const button=(text,fn)=>{const b=document.createElement('button');b.type='button';b.textContent=text;b.onclick=fn;buttons.append(b);};
  const chooser=(label,entries,fn)=>{const wrap=document.createElement('label');wrap.textContent=label;const s=document.createElement('select');s.add(new Option('Choose…',''));for(const [v,t] of entries)s.add(new Option(t,v));s.onchange=()=>{if(s.value)fn(s.value);};wrap.append(s);card.append(wrap);};
  if(o){
   const entries=[];for(const [i,a] of scene.cast.entries())for(const anchor of ['leftHand','rightHand','shoulder'])if(compatible(o.id,actorId(a),anchor))entries.push([actorId(a)+'|'+anchor,`Character ${i+1} · ${anchor.replace(/([A-Z])/g,' $1').toLowerCase()}`]);
   for(const p of Object.values(objects))for(const anchor of Object.keys(p.anchors))if(compatible(o.id,p.id,anchor))entries.push([p.id+'|'+anchor,assets[p.asset].label+' · '+anchor]);
   if(entries.length)chooser('Attach to',entries,v=>attach(o.id,...v.split('|')));
   if(o.parent){const p=document.createElement('small');p.textContent='Attached to '+o.parent.anchor;card.append(p);button('Detach',()=>detach(o.id));}
   if(o.anchors.seat)chooser(o.asset==='scooter'?'Rider':'Sitter',scene.cast.map((a,i)=>[actorId(a),'Character '+(i+1)]),id=>sit(id,o.id));
   if(o.asset==='cup'&&o.parent&&!objects[o.parent.entity])button('Drink',()=>drink(o.parent.entity,o.id));
   if(o.asset==='scooter'&&Object.values(seats).includes(o.id))button('Ride across scene',()=>ride(o.id));
   button('Remove',()=>remove(o.id));
  }else{
   if(seats[selected])button('Stand up',()=>stand(selected));
   chooser('Sit or ride',Object.values(objects).filter(o=>o.anchors.seat).map(o=>[o.id,assets[o.asset].label]),id=>sit(selected,id));
  }
  card.append(buttons);root.append(card);
 }
 function updateAnchors(){
  if(!sceneCanvas.getScreenCTM())return;
  scene.nodes.forEach((node,i)=>{const actor=scene.cast[i],id=actorId(actor);actors[id]||={};const anchors={};
   for(const [name,side] of [['leftHand',-1],['rightHand',1]]){const wrist=node.svg.querySelector(`[data-rig-arm="${side}"] [data-rig-wrist]`);if(wrist){const p=point(wrist,0,40);anchors[name]=[1,0,0,1,p.x,p.y];}}
   const shoulder=point(node.svg,820,1030);anchors.shoulder=[1,0,0,1,shoulder.x,shoulder.y];actors[id].anchors=anchors;
  });
 }
 // Two-link arm solver operates in each existing arm's local coordinate system.
 function reach(node,side,target){
  const arm=node.svg.querySelector(`[data-rig-arm="${side}"]`);if(!arm)return [0,0,0];
  const local=new DOMPoint(target.x,target.y).matrixTransform(relative(arm).inverse());
  const x=local.x,y=local.y-48,l1=BODY_RIG.upperArm-48,l2=BODY_RIG.forearm;
  const elbow=-Math.acos(Math.max(-1,Math.min(1,(x*x+y*y-l1*l1-l2*l2)/(2*l1*l2))));
  const shoulder=Math.atan2(y,x)-Math.PI/2-Math.atan2(l2*Math.sin(elbow),l1+l2*Math.cos(elbow));
  return [shoulder*180/Math.PI,elbow*180/Math.PI,-(shoulder+elbow)*180/Math.PI];
 }
 let drinking=null,moving=null,animation=0;
 function drink(actor,prop){pauseScene();drinking={actor,prop,start:performance.now()};animate();}
 function ride(prop){pauseScene();const o=objects[prop];moving={prop,start:performance.now(),x:o.transform[4],y:o.transform[5]};animate();}
 function animate(){if(animation)return;function tick(now){animation=0;paintScene(scene.elapsed);if(drinking||moving)animation=requestAnimationFrame(tick);else save();}animation=requestAnimationFrame(tick);}
 function seatedLegs(node,actor,prop){
  const lower=node.svg.querySelector('[data-lower-body]');if(lower)lower.setAttribute('display','none');
  const pelvis=node.svg.querySelector('[data-rig-pelvis]');if(pelvis)pelvis.setAttribute('display','none');
  const shape=node.svg.querySelector('[data-body-shape] > g');if(!shape)return;
  const group=document.createElementNS(NS,'g');group.dataset.seatedLegs='';
  const riding=prop.asset==='scooter',c=actor.appearance.trouserColour||'#52645b',shoe=actor.appearance.shoeColour||'#e6dfce';
  const art=riding?`<path d="M450 1390H760L990 1510Q1040 1530 1040 1600L1045 1810H925L900 1625L560 1585Q450 1550 450 1390Z" fill="${c}"/><path d="M925 1790H1045L1145 1840Q1160 1875 1120 1880H915Z" fill="${shoe}"/>`:`<path d="M430 1390H824L910 1530Q940 1595 880 1625L840 1860H725L740 1575L660 1510H594L514 1575L529 1860H414L374 1625Q314 1595 344 1530Z" fill="${c}"/><path d="M404 1840H532V1910H365Q345 1880 404 1840Z M722 1840H850L900 1880Q910 1910 880 1910H722Z" fill="${shoe}"/>`;
  // Use the same shared body outline: no per-limb filter changes.
  group.innerHTML=bodySurfaceSvg(art,cameraDirections[actor.view]||0);shape.insertBefore(group,shape.firstChild);
 }
 function poseAttachments(seconds){
  if(drinking&&(!objects[drinking.prop]||objects[drinking.prop].parent?.entity!==drinking.actor||performance.now()-drinking.start>2500))drinking=null;
  if(moving){const t=Math.min(1,(performance.now()-moving.start)/2600),o=objects[moving.prop];if(!o)moving=null;else{o.transform[4]=moving.x+Math.min(260,1040-moving.x)*(t*t*(3-2*t));o.transform[5]=moving.y-Math.sin(t*Math.PI)*3;if(t>=1)moving=null;}}
  scene.nodes.forEach((node,i)=>{const actor=scene.cast[i],id=actorId(actor),meta=actors[id]||{},prop=objects[seats[id]];
   if(Number.isFinite(meta.x))node.svg.setAttribute('x',meta.x);if(Number.isFinite(meta.y))node.svg.setAttribute('y',meta.y);
   sceneWithState(actor,()=>{
    if(prop){
     if(!node.svg.querySelector('[data-seated-legs]'))seatedLegs(node,actor,prop);
     const seat=A.multiply(world(prop.id),prop.anchors.seat),shape=node.svg.querySelector('[data-body-shape]');
     const p=point(shape||node.svg,bodyCameraX(627,cameraDirections[actor.view]||0),1450);
     node.svg.setAttribute('x',Number(node.svg.getAttribute('x'))+seat[4]-p.x);node.svg.setAttribute('y',Number(node.svg.getAttribute('y'))+seat[5]-p.y);
     if(prop.asset==='scooter'){
      // Side-view shoulders converge toward the steering side in this fixed riding pose.
      const near=node.svg.querySelector('[data-rig-arm="1"]'),far=node.svg.querySelector('[data-rig-arm="-1"]');
      if(near&&far){const match=near.getAttribute('transform').match(/translate\(([^ ]+) ([^)]+)\)/);if(match)far.setAttribute('transform',far.getAttribute('transform').replace(/translate\([^)]+\)/,`translate(${Number(match[1])-35} ${match[2]})`));}
      const m=A.multiply(world(prop.id),prop.anchors.handlebar),target={x:m[4],y:m[5]-14};
      setBodyArmPose({left:reach(node,-1,target),right:reach(node,1,{x:target.x+6,y:target.y+3})},{left:{pose:'fist',view:'edge'},right:{pose:'fist',view:'edge'}},node.scope);
      // Match the footrest with a simple seated leg drawing in the existing body space.
      const foot=A.multiply(world(prop.id),prop.anchors.footrest),g=node.svg.querySelector('[data-seated-legs]');if(g){const local=new DOMPoint(foot[4],foot[5]).matrixTransform(relative(g).inverse());const trouser=actor.appearance.trouserColour,shoe=actor.appearance.shoeColour;g.innerHTML=`<path d="M450 1390H760L${local.x-65} 1510Q${local.x+10} 1530 ${local.x} 1600L${local.x+5} ${local.y-40}H${local.x-100}L${local.x-125} 1625L560 1585Q450 1550 450 1390Z" fill="${trouser}"/><path d="M${local.x-105} ${local.y-55}H${local.x+5}L${local.x+70} ${local.y-12}Q${local.x+85} ${local.y+8} ${local.x+40} ${local.y+10}H${local.x-110}Z" fill="${shoe}"/>`;}
     }else {const left=point(node.svg,480,1410),right=point(node.svg,774,1410);setBodyArmPose({left:reach(node,-1,left),right:reach(node,1,right)},{left:{pose:'relaxed',view:'back'},right:{pose:'relaxed',view:'back'}},node.scope);}
    }else{
     const held=Object.values(objects).filter(o=>o.parent?.entity===id);if(held.length){const poses={left:[-3,0,0],right:[-3,0,0]},hands={};for(const o of held){const which=o.parent.anchor==='leftHand'?'left':'right';if(o.parent.anchor==='shoulder')continue;poses[which]=[-10,-95,0];hands[which]={pose:'fist',view:'palm'};
      if(drinking?.actor===id&&drinking.prop===o.id){const t=(performance.now()-drinking.start)/2400,u=Math.sin(Math.min(1,t)*Math.PI);const rect=node.layers.mouthGroup.getBoundingClientRect(),mouth=new DOMPoint(rect.x+rect.width/2,rect.y+rect.height/2).matrixTransform(sceneCanvas.getScreenCTM().inverse());const wrist=node.svg.querySelector(`[data-rig-arm="${which==='left'?-1:1}"] [data-rig-wrist]`),base=point(wrist,0,0);poses[which]=reach(node,which==='left'?-1:1,{x:base.x*(1-u)+(mouth.x+28)*u,y:base.y*(1-u)+(mouth.y+32)*u});if(t>=1)drinking=null;}
     }setBodyArmPose(poses,hands,node.scope);}
    }
    for(const el of node.svg.querySelectorAll('[data-hand-action]'))remapSceneRefs(el,node.prefix);
   });
  });updateAnchors();renderObjects(seconds);
 }
 const basePaint=paintScene;paintScene=function(seconds){basePaint(seconds);if(active)poseAttachments(seconds);};
 const baseLayout=layoutSceneActors;layoutSceneActors=function(){baseLayout();if(active)poseAttachments(scene.elapsed);};
 const baseRebuild=rebuildSceneCast;rebuildSceneCast=function(){normalize();baseRebuild();scene.nodes.forEach((n,i)=>{n.svg.dataset.entity=actorId(scene.cast[i]);n.svg.setAttribute('tabindex','0');});poseAttachments(scene.elapsed);drawObjects();};
 const baseBackground=drawSceneBackground;drawSceneBackground=function(){const changed=active!==scene.location;loadLocation();baseBackground();if(changed&&scene.nodes.length){drawSceneCastControls();rebuildSceneCast();}inspect();};
 const basePersist=persistScene;persistScene=function(){basePersist();save();};
 // Detach children before the old character removal handler drops their rig.
 const baseControls=drawSceneCastControls;drawSceneCastControls=function(){baseControls();for(const [i,card] of [...document.querySelectorAll('.scene-cast-card')].entries()){
  const a=scene.cast[i];actorId(a);const facing=card.querySelector('select[aria-label^="Facing"]');if(facing)facing.disabled=!!seats[a.entityId];const remove=card.querySelector('.scene-cast-top button'),old=remove.onclick;remove.onclick=()=>{for(const o of Object.values(objects))if(o.parent?.entity===a.entityId)detach(o.id);old();};
  const slider=card.querySelector('input[type="range"]'),oldSlide=slider.oninput;slider.oninput=()=>{actors[a.entityId]||={};actors[a.entityId].x=null;actors[a.entityId].y=null;oldSlide();};
 }};
 function showTargets(id){
  const entities=all(),isProp=!!objects[id];
  for(const [parent,en] of Object.entries(entities))for(const [anchor,local] of Object.entries(en.anchors||{})){
   const valid=isProp?compatible(id,parent,anchor):anchor==='seat'&&!Object.values(seats).includes(parent);if(!valid)continue;
   const m=A.multiply(A.world(entities,parent),local),circle=document.createElementNS(NS,'circle');
   for(const [k,v] of Object.entries({cx:m[4],cy:m[5],r:17,fill:'#e9fff2',stroke:'#349b6a','stroke-width':3,opacity:.85}))circle.setAttribute(k,v);guides.append(circle);
  }
 }
 function canvasPoint(e){return new DOMPoint(e.clientX,e.clientY).matrixTransform(sceneCanvas.getScreenCTM().inverse());}
 sceneCanvas.addEventListener('pointerdown',e=>{
  const el=e.target.closest('[data-entity]');if(!el)return;pauseScene();selected=el.dataset.entity;inspect();selection();const p=canvasPoint(e);const o=objects[selected];
  
  const start=o?world(selected):[1,0,0,1,Number(el.getAttribute('x')),Number(el.getAttribute('y'))];drag={id:selected,start,p,moved:false};sceneCanvas.setPointerCapture(e.pointerId);e.preventDefault();
 });
 sceneCanvas.addEventListener('pointermove',e=>{if(!drag)return;const p=canvasPoint(e),dx=p.x-drag.p.x,dy=p.y-drag.p.y;if(Math.hypot(dx,dy)>4&&!drag.moved){drag.moved=true;if(objects[drag.id]?.parent)detach(drag.id);if(seats[drag.id])stand(drag.id);}if(!drag.moved)return;const o=objects[drag.id];
  if(o){o.transform=[...drag.start];o.transform[4]=Math.max(20,Math.min(1260,drag.start[4]+dx));o.transform[5]=Math.max(30,Math.min(780,drag.start[5]+dy));}
  else{actors[drag.id]||={};actors[drag.id].x=drag.start[4]+dx;actors[drag.id].y=drag.start[5]+dy;}
  paintScene(scene.elapsed);showTargets(drag.id);
 });
 function drop(e){if(!drag)return;const d=drag;drag=null;if(sceneCanvas.hasPointerCapture(e.pointerId))sceneCanvas.releasePointerCapture(e.pointerId);if(d.moved){
  if(objects[d.id]){const m=world(d.id);let best=null;for(const [parent,en] of Object.entries(all()))for(const [anchor,local] of Object.entries(en.anchors||{}))if(compatible(d.id,parent,anchor)){const target=A.multiply(A.world(all(),parent),local),distance=Math.hypot(m[4]-target[4],m[5]-target[5]);if(distance<70&&(!best||distance<best.distance))best={parent,anchor,distance};}if(best)attach(d.id,best.parent,best.anchor);}
  else{const node=scene.nodes[scene.cast.findIndex(a=>actorId(a)===d.id)];if(node){const hip=point(node.svg,627,1450);let best=null;for(const o of Object.values(objects))if(o.anchors.seat){const t=A.multiply(world(o.id),o.anchors.seat),distance=Math.hypot(hip.x-t[4],hip.y-t[5]);if(distance<150&&(!best||distance<best.distance))best={id:o.id,distance};}if(best)sit(d.id,best.id);}}
 }save();inspect();selection();}
 sceneCanvas.addEventListener('pointerup',drop);sceneCanvas.addEventListener('pointercancel',()=>{drag=null;save();});
 sceneCanvas.addEventListener('keydown',e=>{const el=e.target.closest('[data-entity]');if(!el)return;selected=el.dataset.entity;if(e.key==='Enter'||e.key===' '){e.preventDefault();inspect();selection();}if(e.key==='Escape'){selected=null;inspect();selection();}if(e.key==='Delete'&&objects[selected])remove(selected);if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key)){e.preventDefault();pauseScene();const dx=e.key==='ArrowLeft'?-10:e.key==='ArrowRight'?10:0,dy=e.key==='ArrowUp'?-10:e.key==='ArrowDown'?10:0;if(objects[selected]){if(objects[selected].parent)detach(selected);objects[selected].transform[4]+=dx;objects[selected].transform[5]+=dy;}else{if(seats[selected])stand(selected);actors[selected]||={};actors[selected].x=Number(el.getAttribute('x'))+dx;actors[selected].y=Number(el.getAttribute('y'))+dy;}paintScene(scene.elapsed);save();}});
 // Selection guides are editor-only and never appear in picture/SVG exports.
 for(const id of ['sceneSaveSvg','sceneSaveImage']){const b=document.getElementById(id),old=b.onclick;b.onclick=()=>{guides.replaceChildren();old();requestAnimationFrame(selection);};}
 window.UmtoSceneProps={add,attach,detach,sit,stand,remove,world,save,drink,ride,getState:()=>({objects,actors,seats,active}),select:id=>{selected=id;inspect();selection();}};
})();
