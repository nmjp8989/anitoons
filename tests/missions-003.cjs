'use strict';
const assert=require('node:assert/strict');
const Engine=require('../missions/mission-engine.js');
const Runner=require('../missions/sequence-runner.js');
const def=require('../missions/adventures/last-delivery.json');
const voices=require('../voices.json');
assert.equal(def.number,'003');assert.equal(Object.keys(def.scenes).length,3);
for(const [id,d] of Object.entries(def.dialogues)){
 assert(d.text&&voices[d.speaker],id+' needs text and a configured voice');
 for(const c of d.choices||[])assert(def.rules.some(r=>r.when===c.event),'Unresolved choice '+c.event);
}
for(const r of def.rules){
 if(r.in)assert(def.scenes[r.in]);
 for(const a of r.actions){const [kind,id]=a.split(':');if(kind==='message')assert(def.dialogues[id]);if(kind==='sequence')assert(def.sequences[id]);if(kind==='scene')assert(def.scenes[id]);}
}
for(const steps of Object.values(def.sequences))for(const cue of steps){if(cue.line)assert(def.dialogues[cue.line]);if(cue.event)assert(def.rules.some(r=>r.when===cue.event));}
function harness(){
 const engine=new Engine(def);
 const apply=async event=>{const out=engine.trigger(event);for(const a of out.actions){const k=a.indexOf(':'),type=a.slice(0,k),value=a.slice(k+1);if(type==='sequence')await runner.run(def.sequences[value]);if(type==='ending')engine.finish();}return out;};
 const runner=new Runner({prop:()=>{},walk:async()=>{},pose:()=>{},line:async()=>{},sound:()=>{},wait:async()=>{},effect:async()=>{},event:apply,message:()=>{},scene:()=>{},camera:()=>{},ending:()=>{engine.finish();}});
 return {engine,apply};
}
(async()=>{
 for(const trade of ['pinwheel','chai']){
  const {engine:e,apply:a}=harness();e.state.started=true;
  await a('click:door');await a('route:hill');assert(!e.state.complete,'Cannot leave without requirements');
  await a('click:stallDoor');await a('click:tools');assert(e.state.inventory.includes('wrench'));
  if(trade==='chai')await a('click:chai');
  await a('click:back');await a('drop:wrench:scooter');assert(e.state.flags.cableFixed);
  await a('click:homeDoor');await a('click:parcel');await a('drop:parcel:lamp');assert(e.state.flags.labelRead);
  if(trade==='pinwheel'){await a('click:paper');await a('click:pencil');await a('drop:paper:pencil');assert(e.state.inventory.includes('pinwheel'));}
  await a('click:door');await a('drop:'+trade+':kabir');assert(e.state.inventory.includes('fuse'));
  await a('click:scooter');assert(!e.state.complete,'Fuse must be installed');
  await a('drop:fuse:scooter');assert(e.state.flags.fuseInstalled);
  assert((await a('click:scooter')).actions.includes('message:ready'),'A repaired scooter must not describe old damage');
  await a('route:underpass');assert(!e.state.complete,'Flood allows another choice');
  const snapshot=JSON.parse(JSON.stringify(e.state));assert(snapshot.inventory.includes('parcel'));
  await a('route:hill');assert(e.state.complete&&e.state.flags.delivered);assert(!e.state.inventory.includes('parcel'));
  assert.equal(!!e.state.flags.pinwheelTraded,trade==='pinwheel');
  e.reset();assert.deepEqual(e.state.inventory,[]);assert.deepEqual(e.state.flags,{});
 }
 const calls=[];const runner=new Runner({one:async()=>calls.push(1),two:async()=>calls.push(2)});await runner.run([{parallel:[{one:1},{two:2}]},{one:1}]);assert.deepEqual(calls,[1,2,1]);
 const cancellable=new Runner({stop:()=>cancellable.cancel(),bad:()=>{throw Error('Cancelled sequence continued');}});assert.equal(await cancellable.run([{stop:true},{bad:true}]),false);
 console.log('PASS · Mission 003 references, both trades, independent task order, route retry, departure guards, completion/reset, sequence parallel/cancel');
})().catch(e=>{console.error(e);process.exit(1)});
