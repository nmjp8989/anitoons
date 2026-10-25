/* A small DOM-independent event runner shared by the mission and its checks. */
(function(root){
'use strict';
class MissionEngine{
 constructor(definition){this.definition=definition;this.reset();}
 reset(){this.state={scene:'home',flags:{},inventory:[],visible:{},pose:'stand',complete:false,ending:false,started:false};}
 finish(){if(this.state.ending){this.state.complete=true;this.state.ending=false;}}
 trigger(event){
  const rule=this.definition.rules.find(r=>r.when===event);
  if(!rule)return {ok:false,reason:'missing',actions:[]};
  if(rule.if&&!rule.if.split('+').every(flag=>flag.startsWith('inventory.')?this.state.inventory.includes(flag.slice(10)):flag.startsWith('visible.')?this.state.visible[flag.slice(8)]:this.state.flags[flag]))return {ok:false,reason:'condition',actions:[]};
  const actions=[...rule.actions];
  for(const action of actions){const [type,value]=action.split(':');
   if(type==='flag')this.state.flags[value]=true;
   if(type==='inventory'&&!this.state.inventory.includes(value))this.state.inventory.push(value);
   if(type==='show')this.state.visible[value]=true;
   if(type==='pose'){this.state.pose=value;if(value==='ride')this.state.flags.mounted=true;}
   if(type==='ending')this.state.ending=true;
  }
  return {ok:true,actions};
 }
}
root.MissionEngine=MissionEngine;
if(typeof module!=='undefined'&&module.exports)module.exports=MissionEngine;
})(typeof window!=='undefined'?window:globalThis);
