/* Stored dialogue playback; optional manifests keep unvoiced missions playable. */
(function(root){
'use strict';
class MissionVoicePlayer{
 constructor(){this.lines={};this.clip=null;this.muted=false;this.volume=.9;this.hidden=false;}
 async load(id){
  this.stop();this.lines={};
  if(!/^[A-Za-z0-9][A-Za-z0-9_-]{0,79}$/.test(id))return;
  try{
   const response=await fetch('audio/'+id+'.json?updated='+Date.now(),{cache:'no-store'});
   if(response.ok){const manifest=await response.json();if(manifest.mission===id)this.lines=manifest.lines||{};}
  }catch{/* Subtitles remain available when audio is absent/offline. */}
 }
 stop(){
  if(!this.clip)return;
  const clip=this.clip;this.clip=null;clip.pause();clip.onended=null;clip.onerror=null;
  root.dispatchEvent?.(new CustomEvent('mission-voice-end'));
 }
 play(id,text){
  this.stop();
  const line=this.lines[id];
  // Never play a cached line whose words differ from the current subtitle.
  if(!line||line.text!==text||!/^audio\/[A-Za-z0-9_-]+\/[A-Za-z0-9_-]+\.mp3$/.test(line.src))return;
  const clip=new Audio(line.src);this.clip=clip;clip.muted=this.muted;clip.volume=this.volume;
  clip.onended=clip.onerror=()=>{if(this.clip===clip)this.stop();};
  clip.onplay=()=>{if(this.clip===clip)root.dispatchEvent?.(new CustomEvent('mission-voice-start',{detail:{id,speaker:line.speaker,audio:clip}}));};
  if(!this.hidden)clip.play().catch(()=>{if(this.clip===clip)this.stop();});
 }
 setMuted(muted){this.muted=muted;if(this.clip)this.clip.muted=muted;}
 setHidden(hidden){
  this.hidden=hidden;
  if(!this.clip)return;
  const clip=this.clip;
  if(hidden)clip.pause();else clip.play().catch(()=>{if(this.clip===clip)this.stop();});
 }
}
root.MissionVoicePlayer=MissionVoicePlayer;
if(typeof module!=='undefined'&&module.exports)module.exports=MissionVoicePlayer;
})(typeof window!=='undefined'?window:globalThis);
