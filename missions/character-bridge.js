/* Reuse the current Anitoons character rig without exposing studio controls in Play mode. */
(function(){
 if(!new URLSearchParams(location.search).has('missionBridge'))return;
 if(new URLSearchParams(location.search).get('missionBridge')==='delivery'){const script=document.createElement('script');script.src='missions/delivery-bridge.js?v=003.5';document.body.append(script);return;}
 try{
 const original={...state},oldView=cameraView,poses={};
 for(const [i,pose] of ['stand','drink','sit','ride'].entries()){
  const actor=newSceneActor('adult-harpreet',0);actor.view='right';actor.appearance={...actor.appearance,framing:'full',bodyType:'classic',headSize:88,shirt:'button',shirtColour:'#b4ae80',trouserColour:'#65746c',shoeColour:'#e3dac2'};
  const node=createSceneActor(actor,90+i);
  sceneWithState(actor,()=>{
   if(pose==='drink')setBodyArmPose({left:[-12,-145,5],right:[0,0,0]},{left:{pose:'pinch',view:'palm'}},node.scope);
   if(pose==='ride')setBodyArmPose({left:[-15,-70,0],right:[-15,-70,0]},{left:{pose:'fist',view:'edge'},right:{pose:'fist',view:'edge'}},node.scope);
  });
  node.svg.setAttribute('viewBox','160 180 930 2180');node.svg.setAttribute('width','240');node.svg.setAttribute('height','450');
  if(pose==='sit'||pose==='ride'){
   if(pose==='ride')node.svg.querySelectorAll('[data-rig-arm]').forEach(arm=>arm.remove());
   const defs=node.svg.querySelector('defs'),clip=document.createElementNS(sceneNS,'clipPath');clip.id='mission-clip-'+pose;clip.innerHTML='<rect x="-300" y="-300" width="2500" height="1810"/>';defs.append(clip);
   const upper=document.createElementNS(sceneNS,'g');for(const child of [...node.svg.children])if(child.tagName.toLowerCase()!=='defs')upper.append(child);upper.setAttribute('clip-path','url(#'+clip.id+')');
   const legs=document.createElementNS(sceneNS,'g');legs.innerHTML='<path d="M550 1450 825 1480Q895 1490 900 1550L900 1820H823L812 1605 560 1570Z" fill="#52645b" stroke="#262d27" stroke-width="14" stroke-linejoin="round"/><path d="M820 1805H903L972 1843Q990 1870 945 1870H815Z" fill="#cdc9af" stroke="#262d27" stroke-width="13"/><path d="M490 1450Q490 1540 585 1575L840 1610 860 1880 945 1880 950 1565Q945 1505 865 1490L670 1450Z" fill="#65746c" stroke="#262d27" stroke-width="14" stroke-linejoin="round"/><path d="M585 1490 810 1570 825 1850 900 1850" fill="none" stroke="#8c9989" stroke-width="10"/><path d="M854 1860H945L1030 1910Q1047 1940 1000 1940H846Z" fill="#e3dac2" stroke="#262d27" stroke-width="13" stroke-linejoin="round"/>';
   node.svg.append(legs,upper);
   if(pose==='ride'){
    const arm=document.createElementNS(sceneNS,'g');arm.innerHTML='<path d="M775 1030Q833 1008 861 1063L1010 1200 1430 1080 1451 1135 1004 1273Q975 1275 953 1255L785 1120Z" fill="#b4ae80" stroke="#262d27" stroke-width="13" stroke-linejoin="round"/><path d="M1422 1080Q1465 1055 1495 1083Q1510 1116 1477 1142L1440 1138Z" fill="#b4805f" stroke="#262d27" stroke-width="11" stroke-linejoin="round"/><path d="M1470 1084 1480 1113M1454 1091 1464 1124" fill="none" stroke="#73523f" stroke-width="6"/>';node.svg.append(arm);
   }
   node.svg.setAttribute('viewBox','160 180 1000 1880');
  }
  poses[pose]=node.svg.outerHTML;
 }
 Object.assign(state,original);cameraView=oldView;
 parent.postMessage({type:'anitoons-mission-art',poses},location.origin);
 }catch(error){console.warn('Mission uses its built-in character fallback:',error);}
})();

