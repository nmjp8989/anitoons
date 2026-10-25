/* Camera presets in SVG world coordinates. Hit testing uses the same live SVG matrix. */
(function(root){
'use strict';
const W=1280,H=720;
function box(cx,cy,width){const height=width*H/W;return [Math.max(0,Math.min(W-width,cx-width/2)),Math.max(0,Math.min(H-height,cy-height/2)),width,height];}
function preset(name,focus={x:640,y:360}){
 if(name==='detail')return box(focus.x,focus.y,700);
 if(name==='conversation')return box(focus.x,focus.y,900);
 if(name==='follow')return box(focus.x,365,1120);
 if(name==='arrival')return box(650,365,1060);
 if(name==='intro')return box(560,370,1190);
 return [0,0,W,H];
}
class DeliveryCamera{
 constructor(svg){this.svg=svg;this.current=preset('wide');this.from=this.current;this.target=this.current;this.started=0;this.duration=0;this.mode='auto';this.name='wide';}
 to(name,focus,instant=false){if(this.mode==='wide')name='wide';if(this.mode==='follow'&&name!=='wide')name='follow';this.name=name;this.from=[...this.current];this.target=preset(name,focus);this.started=performance.now();this.duration=instant||this.reduceMotion||matchMedia('(prefers-reduced-motion: reduce)').matches?0:650;this.svg.dataset.cameraPreset=name;}
 update(now,hero,paused){if(paused)return;
  if(this.mode==='follow'&&hero){this.svg.dataset.cameraPreset='follow';const target=preset('follow',{x:hero.x,y:365});this.current=this.current.map((v,i)=>v+(target[i]-v)*.12);}
  else{const u=this.duration?Math.min(1,(now-this.started)/this.duration):1,e=u*u*(3-2*u);this.current=this.from.map((v,i)=>v+(this.target[i]-v)*e);}
  this.svg.setAttribute('viewBox',this.current.map(x=>x.toFixed(2)).join(' '));
 }
}
root.DeliveryCamera=DeliveryCamera;
if(typeof module!=='undefined'&&module.exports)module.exports={DeliveryCamera,preset};
})(typeof window!=='undefined'?window:globalThis);
