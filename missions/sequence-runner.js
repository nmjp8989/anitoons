/* Small sequential/parallel cue runner. Adapters own animation, audio and story state. */
(function(root){
'use strict';
class MissionSequenceRunner{
 constructor(handlers){this.handlers=handlers;this.generation=0;}
 cancel(){this.generation++;}
 async run(cues){const generation=this.generation;for(const cue of cues){if(generation!==this.generation)return false;await this.cue(cue,generation);}return generation===this.generation;}
 async cue(cue,generation){
  if(generation!==this.generation)return;
  if(cue.parallel){await Promise.all(cue.parallel.map(c=>this.cue(c,generation)));return;}
  for(const [kind,value] of Object.entries(cue)){
   if(generation!==this.generation)return;
   if(!this.handlers[kind])throw Error('Unknown sequence cue '+kind);
   await this.handlers[kind](value);
  }
 }
}
root.MissionSequenceRunner=MissionSequenceRunner;
if(typeof module!=='undefined'&&module.exports)module.exports=MissionSequenceRunner;
})(typeof window!=='undefined'?window:globalThis);
