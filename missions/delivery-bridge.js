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
  for(const key of ['idle','blink','talkA','talkEE','talkO','reach','gesture','walk0','walk1','walk2','walk3','ride']){
   const actor=newSceneActor(def.preset,0);actor.view=def.view;actor.appearance={...actor.appearance,...def.colours,framing:'full',pose:'relaxed'};
   const node=createSceneActor(actor,serial++);
   sceneWithState(actor,()=>{
    const p=reactionPose(key==='gesture'?'explain':'smile',.65);
    p.mouth=key.startsWith('talk')?key.slice(4):'closed';p.eyes=key==='blink'?'closed':'open';
    if(key.startsWith('walk'))poseWalking(Number(key.slice(4))*.3,node.scope);
    else if(key==='reach')setBodyArmPose({left:[-8,-70,0],right:[-12,-75,0]},{left:{pose:'palm',view:'palm'},right:{pose:'palm',view:'palm'}},node.scope);
    else if(key==='gesture')setBodyArmPose(p.arms||restingBodyPose(),p.hands||{},node.scope);
    else if(key==='ride')setBodyArmPose({left:[-15,-70,0],right:[-15,-70,0]},{left:{pose:'fist',view:'edge'},right:{pose:'fist',view:'edge'}},node.scope);
    else setBodyArmPose(restingBodyPose(),{},node.scope);
    for(const [part,art] of Object.entries({eyeGroup:animationEyesSvg(p),mouthGroup:`<g transform="translate(627 ${756+state.position}) scale(${state.width/100} 1)">${mouthSvg(p.mouth)}</g>`,beardGroup:jawBeardSvg(p.mouth),moustacheGroup:moustacheSvg(state.moustache)})){
     node.layers[part].innerHTML=cameraMarkup(part,art);remapSceneRefs(node.layers[part],node.prefix);
    }
    for(const el of node.svg.querySelectorAll('[data-hand-action]'))remapSceneRefs(el,node.prefix);
   });
   node.svg.setAttribute('viewBox','100 100 1080 2300');node.svg.setAttribute('width','100%');node.svg.setAttribute('height','100%');
   node.svg.querySelectorAll('style').forEach(e=>e.remove());
   bank[id][key]=node.svg.outerHTML;
  }
 }
 parent.postMessage({type:'anitoons-delivery-cast',bank},location.origin);
 }catch(error){console.warn('Delivery rig could not load',error);parent.postMessage({type:'anitoons-delivery-cast-error'},location.origin);}
})();
