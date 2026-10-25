/* Anitoons Missions: reusable, DOM-free story state and rule execution. */
(function(root){
'use strict';
class MissionEngine{
 constructor(definition){
  if(!definition||typeof definition!=='object'||!definition.scenes||!Array.isArray(definition.rules))throw Error('Invalid mission definition');
  this.definition=definition;this.reset();
 }
 reset(){
  this.state={scene:this.definition.startScene||Object.keys(this.definition.scenes)[0],flags:{},inventory:[],visible:{},pose:'stand',complete:false,ending:false,started:false};
  return this.state;
 }
 has(test){
  if(!test)return true;
  if(Array.isArray(test))return test.every(part=>this.has(part));
  if(typeof test!=='string')return false;
  return test.split('+').every(token=>{
   token=token.trim();
   if(!token)return true;
   const negate=token.startsWith('!');
   if(negate)token=token.slice(1);
   let value;
   if(token.startsWith('inventory.'))value=this.state.inventory.includes(token.slice(10));
   else if(token.startsWith('visible.'))value=!!this.state.visible[token.slice(8)];
   else if(token.startsWith('scene.'))value=this.state.scene===token.slice(6);
   else if(token.startsWith('pose.'))value=this.state.pose===token.slice(5);
   else if(token==='complete'||token==='started'||token==='ending')value=!!this.state[token];
   else value=!!this.state.flags[token];
   return negate?!value:value;
  });
 }
 trigger(event){
  const matches=this.definition.rules.filter(rule=>rule.when===event);
  const rule=matches.find(r=>(!r.in||r.in===this.state.scene)&&this.has(r.if));
  if(!rule)return {ok:false,reason:matches.length?'condition':'missing',actions:[]};
  const actions=rule.actions||[];
  for(const action of actions){
   const colon=action.indexOf(':');if(colon<1)continue;
   const type=action.slice(0,colon),value=action.slice(colon+1);
   if(type==='flag')this.state.flags[value]=true;
   else if(type==='unflag')delete this.state.flags[value];
   else if(type==='inventory'&&!this.state.inventory.includes(value))this.state.inventory.push(value);
   else if(type==='remove')this.state.inventory=this.state.inventory.filter(id=>id!==value);
   else if(type==='show')this.state.visible[value]=true;
   else if(type==='hide')delete this.state.visible[value];
   else if(type==='pose'){
    this.state.pose=value;
    if(value==='ride')this.state.flags.mounted=true;
    else this.state.flags.mounted=false;
   }else if(type==='scene'){
    if(!this.definition.scenes[value])throw Error('Unknown scene '+value);
    this.state.scene=value;this.state.pose='stand';this.state.flags.mounted=false;
   }else if(type==='ending')this.state.ending=true;
  }
  return {ok:true,actions:[...actions]};
 }
 finish(){if(this.state.ending){this.state.complete=true;this.state.ending=false;return true;}return false;}
}
root.MissionEngine=MissionEngine;
if(typeof module!=='undefined'&&module.exports)module.exports=MissionEngine;
})(typeof window!=='undefined'?window:globalThis);
