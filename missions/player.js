/* Anitoons Missions Player: reusable browser adapter for JSON-defined adventures. */
'use strict';
const $=id=>document.getElementById(id), NS='http://www.w3.org/2000/svg';
let mission,engine,S,selected=null,busy=false,epoch=0,characterArt={},drag=null,ignoreClickUntil=0;
const audio={ctx:null,master:null,muted:false,timer:null,scene:'home',beat:0,
 async start(){try{if(!this.ctx){this.ctx=new (window.AudioContext||window.webkitAudioContext)();this.master=this.ctx.createGain();this.master.gain.value=this.muted?0:.36;this.master.connect(this.ctx.destination);}await this.ctx.resume();$('sound').dataset.audioState=this.ctx.state;if(!this.timer)this.timer=setInterval(()=>this.tick(),250);}catch{ $('sound').setAttribute('aria-label','Audio unavailable');$('sound').querySelector('span').textContent='Audio unavailable';}},
 tone(freq,time=.15,type='sine',volume=.12,delay=0,endFreq=null){if(!this.ctx||this.ctx.state!=='running')return;const t=this.ctx.currentTime+delay,o=this.ctx.createOscillator(),g=this.ctx.createGain();o.type=type;o.frequency.setValueAtTime(freq,t);if(endFreq)o.frequency.exponentialRampToValueAtTime(endFreq,t+time);g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(Math.max(volume,.0002),t+.012);g.gain.exponentialRampToValueAtTime(.0001,t+time);o.connect(g);g.connect(this.master);o.start(t);o.stop(t+time+.03);},
 noise(time=.2,volume=.1,filter=1000,delay=0){if(!this.ctx||this.ctx.state!=='running')return;const count=Math.ceil(this.ctx.sampleRate*time),buffer=this.ctx.createBuffer(1,count,this.ctx.sampleRate),d=buffer.getChannelData(0);for(let i=0;i<count;i++)d[i]=(Math.random()*2-1)*(1-i/count);const src=this.ctx.createBufferSource(),f=this.ctx.createBiquadFilter(),g=this.ctx.createGain();src.buffer=buffer;f.type='lowpass';f.frequency.value=filter;g.gain.value=volume;src.connect(f);f.connect(g);g.connect(this.master);src.start(this.ctx.currentTime+delay);},
 tick(){if(document.hidden||!S?.started||S.complete||busy&&this.scene==='cutscene')return;const home=this.scene==='home',notes=home?[293.66,369.99,440,493.88,440,369.99,329.63,0,293.66,0,440,369.99,329.63,0,246.94,0]:[392,493.88,587.33,659.25,587.33,493.88,440,0,392,440,493.88,587.33,440,0,329.63,0];const n=notes[this.beat%notes.length];if(n)this.tone(n,home?.6:.28,'sine',home?.07:.075);if(this.beat%8===0){this.tone(home?146.83:196,1.8,'triangle',.045);this.tone(home?220:293.66,1.8,'sine',.02);}if(!home&&this.beat%2===0)this.noise(.07,.025,650);this.beat++;},
 music(scene){this.scene=scene;this.beat=0;},
 fx(name){if(name==='sip'){this.noise(.65,.2,650);this.tone(480,.35,'sine',.04,0,250);}else if(name==='creak'){this.tone(160,.55,'sawtooth',.035,0,95);this.noise(.35,.05,550);}else if(name==='discover'||name==='unlock'){[587.33,739.99,880,1174.66].forEach((n,i)=>this.tone(n,.45,'sine',.14,i*.09));if(name==='unlock')this.noise(.08,.23,3500);}else if(name==='engine'){for(let i=0;i<15;i++){this.tone(55+i*5,.2,'sawtooth',.06,i*.13);this.noise(.12,.09,250+i*70,i*.13);}}else if(name==='soft'){this.noise(.15,.12,400);}else if(name==='locked'){this.tone(100,.13,'triangle',.2);this.tone(83,.17,'triangle',.12,.16);this.noise(.07,.15,2000);}else if(name==='step'){this.noise(.09,.12,600);}else if(name==='complete'){[392,493.88,587.33,783.99,987.77,1174.66].forEach((n,i)=>this.tone(n,.7,'triangle',.1,i*.12));}else{this.tone(650,.08,'sine',.07);}},
 mute(){this.muted=!this.muted;if(this.master&&this.ctx)this.master.gain.setTargetAtTime(this.muted?0:.36,this.ctx.currentTime,.04);$('sound').setAttribute('aria-pressed',String(this.muted));$('sound').setAttribute('aria-label',this.muted?'Unmute sound':'Mute sound');$('sound').querySelector('span').textContent=this.muted?'Sound off':'Sound on';}
};

function esc(text){return String(text).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function say(text,options=[]){
 $('speech').textContent=text;
 $('choices').replaceChildren();
 for(const option of options){
  if(option.if&&!engine.has(option.if))continue;
  const button=document.createElement('button');button.textContent=option.label;
  button.onclick=()=>{
   if(busy)return;
   audio.fx('tap');
   if(option.message)message(option.message);
   else if(option.event)dispatch(option.event);
   else if(option.scene)dispatch('choice:scene:'+option.scene);
  };
  $('choices').append(button);
 }
}
function message(id){
 const d=mission.dialogues[id];
 if(!d)throw Error('Unknown dialogue: '+id);
 say(d.text,d.choices||[]);
}
function sprite(pose){return characterArt[pose]||characterArt.stand||ART.fallback(pose);}
function actorMarkup(){
 const h=mission.hero||{},pos=h.layout?.[S.pose]||h.layout?.[S.scene]||[665,128,220,394];
 const [x,y,w,height]=pos;
 return `<g transform="translate(${x} ${y})"><rect width="${w}" height="${height}" fill="transparent" pointer-events="all"/><svg width="${w}" height="${height}" viewBox="0 0 240 450" overflow="visible">${sprite(S.pose)}</svg></g>`;
}
function target(id,name,art,hitbox){
 const box=hitbox?`<rect x="${hitbox[0]}" y="${hitbox[1]}" width="${hitbox[2]}" height="${hitbox[3]}" fill="transparent" pointer-events="all"/>`:'';
 return `<g id="obj-${esc(id)}" data-object="${esc(id)}" class="interactive${selected===id?' selected':''}" role="button" tabindex="0" aria-label="${esc(name)}">${box}${art}</g>`;
}
function artFor(prop){
 const make=MissionSprites[prop.type];
 if(typeof make!=='function')return '';
 let result=make(S);
 if(prop.badge){
  const [text,x,y,w]=prop.badge;
  result+=ART.label(prop.id==='scooter'&&S.flags.unlocked?'Your ride awaits':text,x,y,w);
 }
 return result;
}
function paint(){
 if(!S||!mission)return;
 const scene=mission.scenes[S.scene];
 $('scenery').innerHTML=ART[scene.art]||'';
 $('objects').innerHTML=(scene.objects||[]).filter(p=>engine.has(p.if)).map(p=>
  p.interactive===false?artFor(p):target(p.id,p.name,artFor(p),p.hitbox)).join('');
 const h=mission.hero||{},pos=h.label?.[S.pose]||h.label?.[S.scene]||[773,105,150];
 const shadow=h.shadow?.[S.pose]||h.shadow?.[S.scene];
 const shade=shadow&&S.pose!=='ride'?`<ellipse cx="${shadow[0]}" cy="${shadow[1]}" rx="63" ry="12" fill="#6a7057" opacity=".15"/>`:'';
 $('actors').innerHTML=shade+target(h.id||'character',h.name||mission.character||'Character',actorMarkup()+ART.label(S.pose==='ride'?'Ready, neighbour!':h.name||'Character',...pos));
 $('location').textContent=(scene.icon||'⌂')+' '+scene.name;
 const goal=(mission.objectives||[]).find(item=>engine.has(item.if));
 $('objective').textContent=goal?.text||'Explore the scene';
 const count=(mission.progress||[]).filter(step=>engine.has(step.if)).length;
 const steps=$('steps');if(steps.children.length!==(mission.progress||[]).length)steps.replaceChildren(...(mission.progress||[]).map(()=>document.createElement('i')));
 [...steps.children].forEach((el,i)=>el.classList.toggle('done',i<count));
 const progressText=(mission.progressLabels||[]).find(p=>engine.has(p.if));
 $('progressLabel').textContent=progressText?.text||(S.complete?'MISSION COMPLETE':'FIND THE CLUE');
 $('inventory').replaceChildren();
 for(const id of S.inventory){
  const item=mission.inventoryItems?.[id]||{label:id};
  const used=engine.has(item.usedIf);
  const button=document.createElement('button');button.type='button';
  button.className='inventory-item'+(selected===id?' selected':'');button.dataset.object=id;
  button.setAttribute('aria-label',item.label);
  if(item.sprite==='key')button.innerHTML=`<svg viewBox="-35 -20 85 45">${ART.key}</svg><span>${esc(used?item.usedLabel||item.label:item.label)}</span>`;
  else{const span=document.createElement('span');span.textContent=used?item.usedLabel||item.label:item.label;button.append(span)}
  $('inventory').append(button);
 }
 if(!S.inventory.length)$('inventory').innerHTML='<span class="empty">Nothing yet. Every adventure starts somewhere.</span>';
}
function clearSelected(){
 selected=null;
 document.querySelectorAll('.selected').forEach(el=>el.classList.remove('selected'));
}
function select(id){
 clearSelected();selected=id;
 document.querySelectorAll('[data-object]').forEach(el=>{if(el.dataset.object===id)el.classList.add('selected')});
}
function cut(){
 $('world').classList.remove('cutaway');
 void $('world').getBoundingClientRect();
 $('world').classList.add('cutaway');
}
const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function drink(token){
 message('teaDone');
 const fx=$('fx');
 const x=S.scene==='home'?790:575;
 fx.innerHTML=`<g transform="translate(${x} 282) scale(.8)">${ART.cup}</g>`;
 cut();await wait(1100);
 if(token!==epoch)return;
 fx.replaceChildren();S.pose='stand';paint();
}
async function cutscene(id,token){
 const def=mission.cutscenes?.[id];if(!def)throw Error('Unknown cutscene '+id);
 if(def.music)audio.music(def.music);
 if(def.message)message(def.message);
 $('choices').replaceChildren();$('caption').hidden=false;
 for(const frame of def.frames||[]){
  if(token!==epoch)return;
  $('caption').textContent=frame.caption||'';
  if(frame.sound)audio.fx(frame.sound);
  if(frame.style==='riding')$('obj-scooter')?.classList.add('riding');
  if(frame.style==='depart'){
   const group=document.createElementNS(NS,'g');group.id='departure';
   for(const objId of ['scooter',mission.hero?.id||'character']){
    const obj=$('obj-'+objId);if(obj)group.append(obj);
   }
   $('actors').append(group);group.classList.add('depart');
  }
  await wait(Math.max(0,Math.min(12000,frame.duration||0)));
 }
 if(token!==epoch)return;
 $('caption').hidden=true;
 if(def.after)message(def.after);
 paint();
}
async function enact(event,token){
 const outcome=engine.trigger(event);
 if(!outcome.ok)return false;
 paint();
 for(const action of outcome.actions){
  if(token!==epoch)return false;
  const split=action.indexOf(':');if(split<0)continue;
  const type=action.slice(0,split),value=action.slice(split+1);
  if(type==='sound')audio.fx(value);
  else if(type==='select')select(value);
  else if(type==='pose'){
   if(value==='drink')await drink(token);
   else if(value==='sit'||value==='ride'||value==='stand')cut();
  }
  else if(type==='message')message(value);
  else if(type==='scene'){
   clearSelected();$('fx').replaceChildren();
   audio.fx('step');audio.music(mission.scenes[value].music);
   paint();cut();
   await enact('enter:'+value,token);
  }
  else if(type==='event')await enact(value,token);
  else if(type==='cutscene')await cutscene(value,token);
  else if(type==='ending'&&token===epoch){
   if(engine.finish()){
    paint();audio.fx('complete');
    if(!$('complete').open)$('complete').showModal();
   }
  }
  if(token!==epoch)return false;
 }
 paint();
 return true;
}
async function dispatch(event){
 if(!S?.started||busy||S.complete)return false;
 const token=epoch;busy=true;clearSelected();
 try{
  let ok;
  if(event.startsWith('choice:scene:')){
   const scene=event.slice('choice:scene:'.length);
   if(!mission.scenes[scene])return false;
   // Scene navigation is a declarative rule, not a UI-only mutation.
   ok=await enact('navigate:'+scene,token);
  }else ok=await enact(event,token);
  if(!ok&&event.startsWith('drop:'))message('cantCombine');
  return ok;
 }finally{if(token===epoch)busy=false;}
}
function interact(id){
 if(!S?.started||busy||S.complete)return;
 if(selected&&selected!==id){const item=selected;dispatch('drop:'+item+':'+id);return;}
 dispatch('click:'+id);
}
function hint(){
 if(!S?.started)return;
 clearSelected();
 const hint=(mission.hints||[]).find(h=>engine.has(h.if));
 if(hint)say(hint.text);
}
function dragArt(id){
 if(id==='character')return sprite('stand');
 if(id==='cup')return `<svg viewBox="-50 -55 100 100">${ART.cup}</svg>`;
 if(id==='key')return `<svg viewBox="-40 -35 95 70">${ART.key}</svg>`;
 return '<span>✦</span>';
}
function pointerDown(e){
 const node=e.target.closest('[data-object]');
 if(!node||!S?.started||busy||S.complete||e.button!==0)return;
 const id=node.dataset.object;
 if(!(mission.draggable||[]).includes(id))return;
 if((mission.inventoryItems||{})[id]&&!S.inventory.includes(id)&&!engine.has('visible.'+id))return;
 drag={id,startX:e.clientX,startY:e.clientY,moved:false,pointer:e.pointerId};
}
function pointerMove(e){
 if(!drag||e.pointerId!==drag.pointer)return;
 if(!drag.moved&&Math.hypot(e.clientX-drag.startX,e.clientY-drag.startY)>9){
  drag.moved=true;$('pointerItem').innerHTML=dragArt(drag.id);$('pointerItem').hidden=false;
 }
 if(drag.moved){
  e.preventDefault();
  $('pointerItem').style.left=(e.clientX-30)+'px';$('pointerItem').style.top=(e.clientY-35)+'px';
  document.querySelectorAll('.drop-target').forEach(el=>el.classList.remove('drop-target'));
  const dest=document.elementFromPoint(e.clientX,e.clientY)?.closest('[data-object]');
  if(dest&&dest.dataset.object!==drag.id)dest.classList.add('drop-target');
 }
}
function pointerUp(e){
 if(!drag||e.pointerId!==drag.pointer)return;
 const current=drag;drag=null;$('pointerItem').hidden=true;
 document.querySelectorAll('.drop-target').forEach(el=>el.classList.remove('drop-target'));
 if(current.moved){
  ignoreClickUntil=performance.now()+350;
  const dest=document.elementFromPoint(e.clientX,e.clientY)?.closest('[data-object]');
  if(dest&&dest.dataset.object!==current.id)dispatch('drop:'+current.id+':'+dest.dataset.object);
  else message('badDrop');
 }
}
function hydrate(){
 document.title='Anitoons Missions · '+mission.title;
 document.querySelector('.heading h1').textContent=mission.title+'.';
 document.querySelector('.heading p').textContent=mission.subtitle||mission.intro||'';
 document.querySelector('.start-card h2').textContent=mission.title;
 document.querySelector('.start-card p').textContent=mission.intro;
 document.querySelector('.start-card small').textContent=Object.keys(mission.scenes).length+' locations · Interactive story · Your own pace';
 $('speaker').firstChild.textContent=(mission.hero?.name||mission.character||'CHARACTER').toUpperCase()+' ';
 $('avatar').textContent=(mission.hero?.name||mission.character||'A').charAt(0).toUpperCase();
 $('complete').querySelector('h2').textContent=mission.completion?.title||'Mission complete';
 $('complete').querySelector('p').textContent=mission.completion?.text||'Well played!';
 const stats=$('complete').querySelector('.complete-stats');
 stats.replaceChildren(...(mission.completion?.stats||[]).map(s=>{const span=document.createElement('span');span.textContent='✓ '+s;return span}));
 const cards=$('flow').querySelector('.flow-cards');
 cards.replaceChildren(...Object.entries(mission.scenes).map(([key,scene],index)=>{
  const card=document.createElement('article'),heading=document.createElement('b'),description=document.createElement('p');
  heading.textContent=String(index+1).padStart(2,'0')+' · '+scene.name;description.textContent=(scene.objects||[]).filter(x=>x.interactive!==false).map(x=>x.name.split(' — ')[0]).join(' · ');
  card.append(heading,description);return card;
 }));
}
function reset(){
 epoch++;busy=false;engine.reset();S=engine.state;
 selected=null;drag=null;$('pointerItem').hidden=true;$('caption').hidden=true;$('fx').replaceChildren();
 if($('complete').open)$('complete').close();
 $('startCover').hidden=false;$('start').disabled=false;
 audio.music(mission.scenes[S.scene].music);paint();
 message(mission.startMessage||'welcome');
}
window.addEventListener('message',e=>{
 if(e.source!==$('characterBridge').contentWindow||e.origin!==location.origin||e.data?.type!=='anitoons-mission-art')return;
 characterArt=e.data.poses;if(S)paint();
});
$('start').onclick=()=>{
 if(!engine)return;S.started=true;$('startCover').hidden=true;audio.start();
 message(mission.startMessage||'welcome');paint();
};
$('sound').onclick=()=>{audio.mute();if(S?.started)audio.start();};
$('restart').onclick=()=>{if(S)reset();};
$('again').onclick=()=>{reset();$('start').focus();};
$('review').onclick=()=>$('complete').close();
$('hint').onclick=hint;
$('howto').onclick=()=>$('help').showModal();
$('closeHelp').onclick=$('helpDone').onclick=()=>$('help').close();
$('flowToggle').onclick=()=>{
 $('flow').hidden=!$('flow').hidden;
 $('flowToggle').setAttribute('aria-expanded',String(!$('flow').hidden));
};
document.addEventListener('click',e=>{
 if(performance.now()<ignoreClickUntil)return;
 const node=e.target.closest('[data-object]');if(node)interact(node.dataset.object);
});
document.addEventListener('keydown',e=>{
 if(e.key==='Escape'){clearSelected();drag=null;$('pointerItem').hidden=true;}
 if((e.key==='Enter'||e.key===' ')&&e.target.matches('g[data-object]')){
  e.preventDefault();interact(e.target.dataset.object);
 }
});
document.addEventListener('pointerdown',pointerDown);
document.addEventListener('pointermove',pointerMove,{passive:false});
document.addEventListener('pointerup',pointerUp);
document.addEventListener('pointercancel',()=>{drag=null;$('pointerItem').hidden=true;});
document.addEventListener('visibilitychange',()=>{
 if(audio.ctx){
  if(document.hidden)audio.ctx.suspend().catch(()=>{});
  else if(S?.started)audio.ctx.resume().catch(()=>{});
 }
});
$('start').disabled=true;
fetch('mission.json').then(r=>{if(!r.ok)throw Error('Mission unavailable');return r.json();}).then(def=>{
 mission=def;engine=new MissionEngine(def);hydrate();reset();
}).catch(error=>{
 console.error(error);say('This mission could not load. Please refresh to try again.');
 $('start').textContent='Please refresh';
});
function fitScene(){
 $('world').setAttribute('preserveAspectRatio',matchMedia('(max-width:760px)').matches?'xMidYMid meet':'xMidYMid slice');
}
fitScene();window.addEventListener('resize',fitScene);
