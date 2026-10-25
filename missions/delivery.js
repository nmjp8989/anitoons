'use strict';
const $=id=>document.getElementById(id),NS='http://www.w3.org/2000/svg';
const voice=new MissionVoicePlayer(),saveKey='anitoons-last-delivery-v3';
let mission,engine,S,bank={},actors={},selected=null,busy=false,paused=false,started=false,epoch=0,sceneName='home',heldProps={},drag=null,ignoreClick=0,skipLine=null,speakerId=null,voiceAnalyzer=null,walkSerial=0,frameTime=0,firstCourtyard=true;
const sound={ctx:null,gain:null,timer:null,beat:0,level:.45,
 async start(){try{this.ctx||=new(window.AudioContext||window.webkitAudioContext)();if(!this.gain){this.gain=this.ctx.createGain();this.gain.gain.value=this.level;this.gain.connect(this.ctx.destination);}await this.ctx.resume();this.timer||=setInterval(()=>this.tick(),420);}catch{/* Silent play still works. */}},
 tone(f,d=.25,vol=.09,type='sine',delay=0){if(!this.ctx||this.ctx.state!=='running')return;const t=this.ctx.currentTime+delay,o=this.ctx.createOscillator(),g=this.ctx.createGain();o.type=type;o.frequency.value=f;g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(vol,t+.02);g.gain.exponentialRampToValueAtTime(.0001,t+d);o.connect(g);g.connect(this.gain);o.start(t);o.stop(t+d+.05);},
 noise(d=.3,v=.08,frequency=1000){if(!this.ctx||this.ctx.state!=='running')return;const b=this.ctx.createBuffer(1,this.ctx.sampleRate*d,this.ctx.sampleRate),a=b.getChannelData(0);for(let i=0;i<a.length;i++)a[i]=(Math.random()*2-1)*(1-i/a.length);const s=this.ctx.createBufferSource(),g=this.ctx.createGain(),filter=this.ctx.createBiquadFilter();filter.type='lowpass';filter.frequency.value=frequency;g.gain.value=v;s.buffer=b;s.connect(filter);filter.connect(g);g.connect(this.gain);s.start();},
 tick(){if(!started||paused||document.hidden||S?.complete)return;const music=sceneName==='home'?[146.83,0,220,0,174.61,0,164.81,0]:sceneName==='stall'?[196,0,246.94,293.66,0,246.94,220,0]:[146.83,0,164.81,0,196,0,130.81,0];const f=music[this.beat%8];if(f)this.tone(f,1.1,speakerId?.018:.055,'triangle');if(this.beat%12===0){this.tone(sceneName==='stall'?98:73.42,3,.045);if(sceneName==='courtyard')this.noise(.9,.018,700);}this.beat++;},
 fx(id){if(id==='engine'){for(let i=0;i<10;i++)this.tone(45+i*3,.2,.06,'sawtooth',i*.12);this.noise(.6,.06,300);}else if(id==='metal'||id==='click'){this.tone(950,.16,.12,'triangle');this.noise(.12,.13,2400);}else if(id==='paper'){this.noise(.4,.06,2400);}else if(id==='step'){this.noise(.09,.06,480);}else if(id==='complete'){[293.66,369.99,440,587.33].forEach((f,i)=>this.tone(f,1.1,.09,'triangle',i*.18));}},
 watch(clip){voiceAnalyzer=null;if(!this.ctx||!clip)return;try{const source=this.ctx.createMediaElementSource(clip),analyzer=this.ctx.createAnalyser();analyzer.fftSize=256;source.connect(analyzer);analyzer.connect(this.ctx.destination);voiceAnalyzer={analyzer,data:new Uint8Array(256)};}catch{}},
 mouth(){if(!voiceAnalyzer)return null;voiceAnalyzer.analyzer.getByteTimeDomainData(voiceAnalyzer.data);const power=Math.sqrt(voiceAnalyzer.data.reduce((s,x)=>s+((x-128)/128)**2,0)/256);return power<.018?'idle':power>.11?'talkA':power>.045?'talkO':'talkEE';}
};
function sleep(ms){const token=epoch;return new Promise(resolve=>{let left=ms,last=performance.now();const timer=setInterval(()=>{const now=performance.now();if(!paused&&!document.hidden)left-=now-last;last=now;if(left<=0||token!==epoch){clearInterval(timer);resolve();}},35);});}
function announceError(text){$('error').textContent=text;$('error').hidden=false;}
function save(){if(!S?.started)return;try{localStorage.setItem(saveKey,JSON.stringify({version:3,state:S}));$('saveStatus').textContent='SAVED';}catch{$('saveStatus').textContent='SESSION ONLY';}}
function saved(){try{const data=JSON.parse(localStorage.getItem(saveKey));if(data?.version!==3||!data.state||!mission.scenes[data.state.scene])return null;return data.state;}catch{return null;}}
function restore(){const data=saved();if(!data)return false;Object.assign(S,{scene:data.scene,flags:data.flags||{},inventory:(data.inventory||[]).filter(id=>mission.inventoryItems[id]),complete:!!data.complete,started:true,ending:false,pose:'stand'});firstCourtyard=false;return true;}
function setBusy(value){busy=value;$('game').classList.toggle('busy',busy);}
function clearSelection(){$('tooltip').style.opacity='0';selected=null;document.querySelectorAll('.selected').forEach(n=>n.classList.remove('selected'));$('selection').textContent='Explore the neighbourhood';}
function select(id){clearSelection();selected=id;document.querySelector(`[data-item="${id}"]`)?.classList.add('selected');$('selection').textContent=mission.inventoryItems[id]?.label+' → choose a target';}
function goal(){if(S.complete)return 'Delivered. Just in time.';if(!S.flags.labelRead)return 'Find out where this parcel belongs.';return 'Reach the Old Picture House before the lights go out.';}
function renderInventory(){const list=$('inventory');list.replaceChildren();for(const id of S.inventory){const item=mission.inventoryItems[id];if(!item)continue;const button=document.createElement('button');button.className='inventory-item'+(selected===id?' selected':'');button.dataset.item=id;button.setAttribute('aria-label',item.label+' — select or drag');button.innerHTML=`<svg viewBox="0 0 90 90" aria-hidden="true">${DeliveryArt.icons[item.icon]}</svg><span>${item.label}</span>`;list.append(button);}if(!S.inventory.length)list.innerHTML='<span class="inventory-empty">A little room for possibilities.</span>';}
function makeActor(id,x,y,height){return {id,x,y,height,action:'idle',frame:'',walkTime:0,walkFrom:0,walkTo:0,direction:id==='harpreet'?1:-1};}
function render(scene=S.scene){
 sceneName=scene;heldProps={};$('tooltip').style.opacity='0';
 const scenic=DeliveryArt[scene];$('scenery').innerHTML=typeof scenic==='function'?scenic.call(DeliveryArt):'';
 $('props').replaceChildren();$('cast').replaceChildren();$('foreground').replaceChildren();$('effects').replaceChildren();
 const def=mission.scenes[scene];
 if(def){
  for(const o of def.objects){if(!engine.has(o.if))continue;
   const g=document.createElementNS(NS,'g');g.dataset.target=o.id;g.setAttribute('role','button');g.setAttribute('tabindex','0');g.setAttribute('aria-label',o.name);
   g.innerHTML=`<rect x="${o.x}" y="${o.y}" width="${o.w}" height="${o.h}" fill="transparent" pointer-events="all"/>${DeliveryArt.prop(o,S)}<rect class="focus-ring" x="${o.x-4}" y="${o.y-4}" width="${o.w+8}" height="${o.h+8}" rx="12" pointer-events="none"/>`;
   $('props').append(g);
  }
  actors={harpreet:makeActor('harpreet',def.heroX,610,332)};
  if(scene==='courtyard')actors.kabir=makeActor('kabir',1094,588,255);
  if(scene==='stall')actors.meena=makeActor('meena',951,553,320);
  $('chapter').textContent=def.chapter;$('location').textContent=def.name;
 }else if(scene==='cinema'){
  actors={harpreet:makeActor('harpreet',515,635,302),kabir:makeActor('kabir',845,625,235)};
  $('chapter').textContent='04 / JUST IN TIME';$('location').textContent='The Old Picture House';
 }else{actors={};$('chapter').textContent='THE HIGH ROAD';$('location').textContent='Clocktower Hill';}
 for(const actor of Object.values(actors)){
  const group=document.createElementNS(NS,'g');group.id='actor-'+actor.id;group.classList.add('actor');group.innerHTML='<ellipse class="actor-shadow" cx="0" cy="-2" rx="47" ry="9"/><g class="actor-sprite"></g><g class="held-prop" pointer-events="none"></g>';$('cast').append(group);
 }
 if(scene==='stall')$('foreground').innerHTML='<path d="M632 479H1232V568H632Z" fill="#894c43" stroke="#1a2a39" stroke-width="6"/><path d="M643 494H1222M643 520H1222M643 546H1222" stroke="#b77755" stroke-width="3"/>';
 $('objective').textContent=goal();renderInventory();paintActors(performance.now());
}
function paintActors(now){for(const actor of Object.values(actors)){
 const node=$('actor-'+actor.id);if(!node)continue;
 let frame='idle';
 if(actor.action==='ride'){const mouth=speakerId===actor.id?(sound.mouth()||['talkA','talkEE','idle','talkO'][Math.floor((voice.clip?.currentTime||now/1000)*7)%4]):'idle';frame=mouth==='idle'?'ride':'ride'+mouth.slice(4);}
 else if(actor.action==='walk')frame='walk'+Math.floor(now/150)%4;
 else if(actor.action==='talk')frame=voice.clip?.paused?'idle':sound.mouth()||['talkA','talkEE','idle','talkO','talkEE'][Math.floor((voice.clip?.currentTime||now/1000)*7)%5];
 else if(['reach','gesture','ride'].includes(actor.action))frame=actor.action;
 else if(Math.floor(now/160)%29===0)frame='blink';
 if(actor.frame!==frame){actor.frame=frame;node.querySelector('.actor-sprite').innerHTML=`<svg x="${-actor.height*(actor.action==='ride'?.34:.245)}" y="${-actor.height}" width="${actor.height*(actor.action==='ride'?.68:.49)}" height="${actor.height}" overflow="visible">${bank[actor.id]?.[frame]||bank[actor.id]?.idle||DeliveryArt.fallback(actor.id)}</svg>`;}
 const hand=node.querySelector('.held-prop'),item=heldProps[actor.id]||'';
 if(hand.dataset.item!==item){hand.dataset.item=item;const size={chai:36,fuse:24,wrench:40,parcel:58,pinwheel:54}[item]||44;hand.innerHTML=item?`<svg x="${actor.direction>0?8:-size-9}" y="${-actor.height*(item==='chai'?.38:.44)}" width="${size}" height="${size}" viewBox="0 0 90 90">${DeliveryArt.icons[item]||''}</svg>`:'';}
 node.setAttribute('transform',`translate(${actor.x} ${actor.y})`);
 node.classList.toggle('walking',actor.action==='walk');node.classList.toggle('talking',actor.action==='talk');node.classList.toggle('riding',actor.action==='ride');
 // The ¾ rig faces right for Harpreet and left for both neighbours.
 const flip=actor.id==='harpreet'?actor.direction<0:actor.direction>0;
 node.querySelector('.actor-sprite').setAttribute('transform',flip?'scale(-1 1)':'');
 }}
function animate(now){if(now-frameTime>110&&!paused&&!document.hidden){paintActors(now);frameTime=now;}requestAnimationFrame(animate);}
async function walkTo(x){const hero=actors.harpreet;if(!hero)return;const serial=++walkSerial,token=epoch,from=hero.x,to=Math.max(195,Math.min(1080,x)),duration=Math.abs(to-from)*3.2;hero.direction=to>=from?1:-1;hero.action='walk';const begin=performance.now();let elapsed=0,last=begin,step=0;while(elapsed<duration&&token===epoch&&serial===walkSerial){const now=performance.now();if(!paused&&!document.hidden)elapsed+=now-last;last=now;hero.x=from+(to-from)*Math.min(1,elapsed/Math.max(1,duration));if(elapsed-step>300){sound.fx('step');step=elapsed;}await sleep(25);}if(token===epoch&&serial===walkSerial){hero.x=to;hero.action='idle';paintActors(performance.now());}}
function stopLine(){if(skipLine)skipLine();else voice.stop();}
function showDialogue(id,waitForEnd=false){
 stopLine();const d=mission.dialogues[id];if(!d)throw Error('Unknown dialogue '+id);
 const who=mission.cast[d.speaker]||mission.cast.harpreet;speakerId=d.speaker;
 $('dialogue').hidden=false;$('dialogue').style.setProperty('--speaker-colour',who.colour);$('speaker').textContent=who.name;$('speakerRole').textContent=who.role;$('subtitle').textContent=d.text;$('choices').replaceChildren();
 if(actors[d.speaker]&&actors[d.speaker].action!=='ride')actors[d.speaker].action='talk';
 for(const c of d.choices||[]){const b=document.createElement('button');b.textContent=c.label;b.onclick=()=>{if(!busy&&!paused)dispatch(c.event);};$('choices').append(b);}
 voice.play(id,d.text);const clip=voice.clip;if(clip)sound.watch(clip);
 $('skip').textContent=waitForEnd?'Continue ↵':d.choices?.length?'Skip voice ↵':'Close ↵';
 const token=epoch;
 return new Promise(resolve=>{
  let settled=false,timer,last=performance.now(),elapsed=0;const voiceEnd=()=>{if(voice.clip!==clip)finish();};const finish=()=>{if(settled)return;settled=true;clearInterval(timer);window.removeEventListener('mission-voice-end',voiceEnd);if(skipLine===finish)skipLine=null;if(actors[d.speaker]?.action==='talk')actors[d.speaker].action='idle';speakerId=null;voiceAnalyzer=null;voice.stop();resolve();};
  skipLine=finish;
  const limit=clip?45000:Math.max(2200,Math.min(10000,d.text.split(/\s+/).length*250));
  timer=setInterval(()=>{const now=performance.now();if(!paused&&!document.hidden)elapsed+=now-last;last=now;if(elapsed>=limit||token!==epoch)finish();},50);
  if(clip){window.addEventListener('mission-voice-end',voiceEnd);clip.addEventListener('ended',finish,{once:true});clip.addEventListener('error',finish,{once:true});}
 });
}
async function changeScene(scene){stopLine();clearSelection();$('dialogue').hidden=true;$('transition').classList.add('dark');await sleep(240);render(scene);$('transition').classList.remove('dark');sound.beat=0;}
function pose({actor,action,facing}){if(actors[actor]){actors[actor].action=action;if(facing)actors[actor].direction=facing;if(action==='ride'){actors[actor].direction=1;actors[actor].x=775;actors[actor].y=533;actors[actor].height=270;}paintActors(performance.now());}}
async function effect(kind){
 if(kind==='dry'){$('effects').innerHTML='<g class="dry-effect" fill="none" stroke="#ffe1a3" stroke-width="3"><path d="M365 403Q345 380 363 360M390 406Q410 380 390 359M414 410Q400 390 417 373"/></g>';await sleep(1200);$('effects').replaceChildren();}
 if(kind==='headlight'&&S.flags.cableFixed){$('effects').innerHTML='<circle cx="925" cy="423" r="65" fill="url(#d-glow)"/>';await sleep(500);}
 if(kind==='loadParcel'){$('delivery-scooter')?.insertAdjacentHTML('beforeend',`<svg x="30" y="20" width="85" height="85" viewBox="0 0 90 90">${DeliveryArt.icons.parcel}</svg>`);}
 if(kind==='depart')$('game').classList.add('departing');
 if(kind==='flood'){$('effects').innerHTML='<path d="M240 447Q315 420 390 451T550 448" fill="none" stroke="#77aeb8" stroke-width="6" opacity=".65"/>';await sleep(500);}
 if(kind==='door')$('game').classList.add('door-open');
 if(kind==='projector'){$('game').classList.add('projector-on');sound.fx('complete');}
}
const sequence=new MissionSequenceRunner({
 prop:({actor,item})=>{heldProps[actor]=item;paintActors(performance.now());},
 walk:walkTo,pose,line:id=>showDialogue(id,true),sound:id=>sound.fx(id),wait:sleep,effect,
 event:event=>applyRule(event),message:id=>{showDialogue(id);},scene:scene=>changeScene(scene),camera:value=>$('game').classList.toggle('intro-camera',value==='intro'),ending:()=>finish()
});
async function applyRule(event){
 const result=engine.trigger(event);if(!result.ok){if(event.startsWith('drop:'))showDialogue('cantCombine');return false;}
 for(const action of result.actions){const colon=action.indexOf(':'),kind=action.slice(0,colon),value=action.slice(colon+1);
  if(kind==='sequence'){const cues=mission.sequences[value];if(!cues)throw Error('Unknown sequence '+value);await sequence.run(cues);}
  else if(kind==='scene'){await changeScene(value);if(value==='courtyard'&&firstCourtyard){firstCourtyard=false;showDialogue('courtyardFirst');}}
  else if(kind==='message')showDialogue(value);
  else if(kind==='sound')sound.fx(value);
  else if(kind==='event')await applyRule(value);
  else if(kind==='ending')engine.finish();
 }
 // Keep actor positions during state-only updates.
 if(mission.scenes[sceneName]){for(const o of mission.scenes[sceneName].objects){const node=$('props').querySelector(`[data-target="${o.id}"]`);if(node&&!engine.has(o.if))node.remove();}
 if(sceneName==='courtyard'){
  const node=$('props').querySelector('[data-target="scooter"]');
  if(node){node.querySelector('#delivery-scooter')?.remove();node.insertAdjacentHTML('afterbegin',DeliveryArt.scooter(S.flags));}
  const depart=mission.scenes.courtyard.objects.find(o=>o.id==='depart');if(engine.has(depart.if)&&!$('props').querySelector('[data-target="depart"]')){const group=document.createElementNS(NS,'g');group.dataset.target='depart';group.setAttribute('role','button');group.setAttribute('tabindex','0');group.setAttribute('aria-label',depart.name);group.innerHTML=DeliveryArt.prop(depart,S);$('props').append(group);}
 }}
 $('objective').textContent=goal();renderInventory();return true;
}
async function dispatch(event){if(!started||busy||paused||S.complete)return;const token=epoch;setBusy(true);clearSelection();stopLine();try{await applyRule(event);if(token===epoch)save();}catch(error){console.error(error);announceError('That action could not finish. Your last saved progress is available after a refresh.');}finally{if(token===epoch)setBusy(false);}}
async function interact(id){if(!started||busy||paused||S.complete)return;if(selected&&selected!==id){const item=selected;await dispatch('drop:'+item+':'+id);return;}
 const o=mission.scenes[S.scene]?.objects.find(o=>o.id===id);if(!o)return;
 if(!['door','homeDoor','stallDoor','back','depart'].includes(id)&&id!=='scooter'){setBusy(true);await walkTo(Math.max(200,Math.min(1000,o.x-55)));setBusy(false);}
 await dispatch('click:'+id);
}
function worldPoint(e){const matrix=$('world').getScreenCTM();return matrix?new DOMPoint(e.clientX,e.clientY).matrixTransform(matrix.inverse()):{x:0,y:0};}
function finish(){stopLine();S.complete=true;engine.finish();save();$('dialogue').hidden=true;$('tradeStat').textContent=S.flags.pinwheelTraded?'A wind-powered trade':'Warm chai, warm hearts';$('ending').showModal();}
function setPaused(value){paused=value;$('game').classList.toggle('paused',value);voice.setHidden(value||document.hidden);if(value){$('pauseMenu').showModal();}else if($('pauseMenu').open)$('pauseMenu').close();}
async function toggleFullscreen(){try{if(document.fullscreenElement)await document.exitFullscreen();else await $('game').requestFullscreen();}catch{$('fullscreen').title='Fullscreen is unavailable; the game still fills this window.';}}
async function begin(fresh=false){
 epoch++;sequence.cancel();walkSerial++;stopLine();setBusy(true);started=true;S.started=true;
 if(fresh){engine.reset();S=engine.state;S.started=true;firstCourtyard=true;try{localStorage.removeItem(saveKey);}catch{}}
 else restore();
 $('opening').hidden=true;$('game').classList.remove('departing','door-open','projector-on');$('error').hidden=true;render();await sound.start();
 if(S.complete){await changeScene('cinema');$('game').classList.add('projector-on');finish();setBusy(false);return;}
 if(fresh||!saved()){await sequence.run(mission.sequences.opening);}else showDialogue('saveResume');
 setBusy(false);save();
}
$('start').onclick=()=>{if(!document.fullscreenElement)$('game').requestFullscreen?.().catch(()=>{});begin(false);};
$('newGame').onclick=()=>begin(true);
$('fullscreen').onclick=toggleFullscreen;$('pause').onclick=()=>setPaused(true);$('resume').onclick=()=>setPaused(false);
$('pauseMenu').addEventListener('cancel',e=>{e.preventDefault();setPaused(false);});
$('restart').onclick=()=>{setPaused(false);begin(true);};$('playAgain').onclick=()=>{$('ending').close();begin(true);};$('stay').onclick=()=>$('ending').close();
$('replayFinale').onclick=async()=>{const token=++epoch;sequence.cancel();stopLine();$('ending').close();$('game').classList.remove('departing','door-open','projector-on');setBusy(true);try{await changeScene('courtyard');await sequence.run(mission.sequences.departure);}finally{if(token===epoch)setBusy(false);}};
$('skip').onclick=()=>{stopLine();if(!busy&&!$('choices').children.length)$('dialogue').hidden=true;};
$('musicVolume').oninput=e=>{sound.level=e.target.value/100;if(sound.gain&&sound.ctx)sound.gain.gain.setTargetAtTime(sound.level,sound.ctx.currentTime,.05);};
$('voiceVolume').oninput=e=>{voice.volume=e.target.value/100;if(voice.clip)voice.clip.volume=voice.volume;};
$('reduceMotion').onchange=e=>$('game').classList.toggle('reduced-motion',e.target.checked);
$('pocketToggle').onclick=()=>{const hidden=!$('inventory').hidden;$('inventory').hidden=hidden;$('pocketToggle').setAttribute('aria-expanded',String(!hidden));};
$('hint').onclick=()=>{if(!started||busy||paused||S.complete)return;clearSelection();stopLine();const hint=mission.hints.find(h=>engine.has(h.if));$('dialogue').hidden=false;$('speaker').textContent='A LITTLE NUDGE';$('speakerRole').textContent='TAKE YOUR TIME';$('subtitle').textContent=hint.text;$('choices').replaceChildren();$('skip').textContent='Close ↵';};
document.addEventListener('click',e=>{if(performance.now()<ignoreClick)return;const item=e.target.closest('[data-item]');if(item){if(busy||paused)return;if(selected&&selected!==item.dataset.item)dispatch('drop:'+selected+':'+item.dataset.item);else if(selected===item.dataset.item)clearSelection();else select(item.dataset.item);return;}const target=e.target.closest('[data-target]');if(target){interact(target.dataset.target);return;}if(e.target.closest('#world')&&started&&!busy&&!paused&&!S.complete){const p=worldPoint(e);if(p.y>520){clearSelection();setBusy(true);walkTo(p.x).finally(()=>setBusy(false));}}});
document.addEventListener('pointerdown',e=>{if(busy||paused||!started||e.button!==0)return;const node=e.target.closest('[data-item],[data-target]');if(!node)return;const id=node.dataset.item||node.dataset.target;if(!mission.inventoryItems[id])return;drag={id,x:e.clientX,y:e.clientY,moved:false,pointer:e.pointerId};});
document.addEventListener('pointermove',e=>{
 const target=e.target.closest('[data-target]'),item=e.target.closest('[data-item]');if(target&&!busy){const o=mission.scenes[S.scene]?.objects.find(o=>o.id===target.dataset.target);if(o){$('tooltip').textContent=o.name;$('tooltip').style.left=Math.max(90,Math.min(innerWidth-100,e.clientX))+'px';$('tooltip').style.top=Math.max(135,e.clientY-12)+'px';$('tooltip').style.opacity='1';}}else $('tooltip').style.opacity='0';
 if(!drag||e.pointerId!==drag.pointer)return;if(Math.hypot(e.clientX-drag.x,e.clientY-drag.y)>9)drag.moved=true;if(!drag.moved)return;e.preventDefault();$('dragGhost').hidden=false;$('dragGhost').innerHTML=`<svg viewBox="0 0 90 90">${DeliveryArt.icons[drag.id]}</svg>`;$('dragGhost').style.left=e.clientX-30+'px';$('dragGhost').style.top=e.clientY-35+'px';document.querySelectorAll('.drop-target').forEach(n=>n.classList.remove('drop-target'));if(target)target.classList.add('drop-target');
},{passive:false});
document.addEventListener('pointerup',async e=>{if(!drag||e.pointerId!==drag.pointer)return;const current=drag;drag=null;$('dragGhost').hidden=true;document.querySelectorAll('.drop-target').forEach(n=>n.classList.remove('drop-target'));if(!current.moved)return;ignoreClick=performance.now()+400;const node=document.elementFromPoint(e.clientX,e.clientY)?.closest('[data-target],[data-item]'),target=node?.dataset.target||node?.dataset.item;if(!target||current.id===target)return;if(!S.inventory.includes(current.id))await dispatch('click:'+current.id);await dispatch('drop:'+current.id+':'+target);});
document.addEventListener('pointercancel',()=>{drag=null;$('dragGhost').hidden=true;document.querySelectorAll('.drop-target').forEach(n=>n.classList.remove('drop-target'));});
document.addEventListener('keydown',e=>{if(e.key==='Escape'){if($('ending').open)return;e.preventDefault();if(selected)clearSelection();else if(started)setPaused(!paused);return;}if(e.target.matches('input,button,a,select,textarea'))return;if((e.key==='Enter'||e.key===' ')&&skipLine){e.preventDefault();stopLine();return;}if(e.key==='Enter'&&e.target.closest('[data-target]')){e.preventDefault();interact(e.target.closest('[data-target]').dataset.target);}});
document.addEventListener('visibilitychange',()=>{voice.setHidden(document.hidden||paused);if(document.hidden)save();});
window.addEventListener('message',e=>{if(e.source!==$('rigBridge').contentWindow||e.origin!==location.origin)return;if(e.data?.type==='anitoons-delivery-cast'){bank=e.data.bank;for(const actor of Object.values(actors))actor.frame='';paintActors(performance.now());}});
window.addEventListener('mission-voice-start',e=>{$('dialogue').dataset.voiceState='playing';$('dialogue').dataset.voiceSpeaker=e.detail?.speaker||'';});
window.addEventListener('mission-voice-end',()=>{$('dialogue').dataset.voiceState='idle';});
$('artDefs').innerHTML=DeliveryArt.defs;
fetch('adventures/last-delivery.json?v=003.4',{cache:'no-cache'}).then(r=>{if(!r.ok)throw Error('Mission missing');return r.json();}).then(async def=>{mission=def;engine=new MissionEngine(mission);S=engine.state;render();await voice.load(def.id);const hasSave=!!saved();$('start').disabled=false;$('start').textContent=hasSave?'Continue delivery →':'Begin the delivery →';$('newGame').hidden=!hasSave;$('voiceStatus').textContent=Object.keys(voice.lines).length?'Three voices. One neighbourhood.':'Three neighbours. One last delivery.';requestAnimationFrame(animate);}).catch(e=>{console.error(e);announceError('The mission could not load. Please refresh or return to the mission list.');$('start').textContent='Could not load mission';});
