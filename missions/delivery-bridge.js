/* Pose banks rendered by Anitoons' existing character rig. No separate character drawings. */
(function(){
 if(new URLSearchParams(location.search).get('missionBridge')!=='delivery')return;
 const cast={
  harpreet:{preset:'adult-harpreet',view:'right',colours:{shirt:'rolledShirt',shirtColour:'#d39a39',headwearColour:'#644061',trouserColour:'#263a46',shoeColour:'#342d35',headSize:86,bodyType:'classic'}},
  meena:{preset:'adult-priya',view:'left',colours:{shirt:'kurti',shirtColour:'#188c87',trouserColour:'#27334e',shoeColour:'#573c36',hair:'sideBraid',headSize:88,bodyType:'classic'}},
  kabir:{preset:'kid-amir',view:'left',colours:{shirt:'hoodie',shirtColour:'#dc6653',trouserColour:'#334862',shoeColour:'#e2c484',headSize:92,bodyType:'short'}}
 };
 const bank={};let serial=300;
 try{
 for(const [id,def] of Object.entries(cast)){
  bank[id]={};
  for(const key of ['idle','blink','talkA','talkEE','talkO','reach','gesture','walk0','walk1','walk2','walk3','ride',...(id==='harpreet'?['rideA','rideEE','rideO']:[])]){
   const actor=newSceneActor(def.preset,0);actor.view=def.view;actor.appearance={...actor.appearance,...def.colours,framing:'full',pose:'relaxed'};
   const node=createSceneActor(actor,serial++);
   sceneWithState(actor,()=>{
    const p=reactionPose(key==='gesture'?'explain':'smile',.65);
    p.mouth=key.startsWith('talk')?key.slice(4):key.startsWith('ride')&&key!=='ride'?key.slice(4):'closed';p.eyes=key==='blink'?'closed':'open';
    if(key.startsWith('walk'))poseWalking(Number(key.slice(4))*.3,node.scope);
    else if(key==='reach')setBodyArmPose({left:[-8,-70,0],right:[-12,-75,0]},{left:{pose:'palm',view:'palm'},right:{pose:'palm',view:'palm'}},node.scope);
    else if(key==='gesture')setBodyArmPose(p.arms||restingBodyPose(),p.hands||{},node.scope);
    else if(key.startsWith('ride'))setBodyArmPose({left:[-15,-70,0],right:[-15,-70,0]},{left:{pose:'fist',view:'edge'},right:{pose:'fist',view:'edge'}},node.scope);
    else setBodyArmPose(restingBodyPose(),{},node.scope);
    for(const [part,art] of Object.entries({eyeGroup:animationEyesSvg(p),mouthGroup:`<g transform="translate(627 ${756+state.position}) scale(${state.width/100} 1)">${mouthSvg(p.mouth)}</g>`,beardGroup:jawBeardSvg(p.mouth),moustacheGroup:moustacheSvg(state.moustache)})){
     node.layers[part].innerHTML=cameraMarkup(part,art);remapSceneRefs(node.layers[part],node.prefix);
    }
    for(const el of node.svg.querySelectorAll('[data-hand-action]'))remapSceneRefs(el,node.prefix);
   });
   node.svg.setAttribute('aria-label',{harpreet:'Harpreet',meena:'Meena',kabir:'Kabir'}[id]);node.svg.setAttribute('viewBox','100 100 1080 2300');node.svg.setAttribute('width','100%');node.svg.setAttribute('height','100%');
   if(key.startsWith('ride')){
    node.svg.querySelectorAll('[data-rig-arm]').forEach(e=>e.remove());
    const clip=document.createElementNS(sceneNS,'clipPath');clip.id=node.prefix+'ride-clip';clip.innerHTML='<rect x="-300" y="-300" width="2500" height="1810"/>';node.svg.querySelector('defs').append(clip);
    const upper=document.createElementNS(sceneNS,'g');for(const child of [...node.svg.children])if(child.tagName.toLowerCase()!=='defs')upper.append(child);upper.setAttribute('clip-path','url(#'+clip.id+')');
    const legs=document.createElementNS(sceneNS,'g');legs.innerHTML='<g stroke="#202a36" stroke-width="14" stroke-linejoin="round"><path d="M550 1450 825 1480Q895 1490 900 1550L900 1820H823L812 1605 560 1570Z" fill="#263a46"/><path d="M820 1805H903L972 1843Q990 1870 945 1870H815Z" fill="#342d35"/><path d="M490 1450Q490 1540 585 1575L840 1610 860 1880 945 1880 950 1565Q945 1505 865 1490L670 1450Z" fill="#304957"/><path d="M854 1860H945L1030 1910Q1047 1940 1000 1940H846Z" fill="#342d35"/></g>';
    node.svg.append(legs,upper);
    const arm=document.createElementNS(sceneNS,'g');arm.innerHTML='<g stroke="#202a36" stroke-linejoin="round"><path d="M775 1030Q833 1008 861 1063L1010 1200 1430 1080 1451 1135 1004 1273Q975 1275 953 1255L785 1120Z" fill="#d39a39" stroke-width="13"/><path d="M1422 1080Q1465 1055 1495 1083Q1510 1116 1477 1142L1440 1138Z" fill="#b4805f" stroke-width="11"/><path d="M1470 1084 1480 1113M1454 1091 1464 1124" fill="none" stroke="#73523f" stroke-width="6"/></g>';node.svg.append(arm);node.svg.setAttribute('viewBox','160 180 1000 1880');
   }
   node.svg.querySelectorAll('style').forEach(e=>e.remove());
   bank[id][key]=node.svg.outerHTML;
  }
 }
 parent.postMessage({type:'anitoons-delivery-cast',bank},location.origin);
 }catch(error){console.warn('Delivery rig could not load',error);parent.postMessage({type:'anitoons-delivery-cast-error'},location.origin);}
})();
