'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const MissionEngine=require('../missions/mission-engine.js');
const def=require('../missions/adventures/rooftop-kite.json');
const content=file=>fs.readFileSync(path.resolve(__dirname,'../missions',file),'utf8');
assert.equal(def.id,'rooftop-kite');
assert.equal(def.version,2);
assert.equal(def.number,'002');
assert.equal(def.startScene,'workshop');
assert.deepEqual(Object.keys(def.scenes),['workshop','rooftop']);
for(const scene of Object.values(def.scenes)) {
 assert(scene.name&&scene.music&&scene.art);
 for(const item of scene.objects)assert(item.id&&item.type&&item.name,'All objects require typed art and a label');
}
const messages=new Set(Object.keys(def.dialogues)),scenes=new Set(Object.keys(def.scenes));
for(const rule of def.rules){
 if(rule.in)assert(scenes.has(rule.in),'Unknown scene in rule '+rule.when);
 for(const action of rule.actions){
  if(action.startsWith('message:'))assert(messages.has(action.slice(8)),'Undefined dialogue '+action);
  if(action.startsWith('scene:'))assert(scenes.has(action.slice(6)),'Undefined scene '+action);
  if(action.startsWith('cutscene:'))assert(def.cutscenes[action.slice(9)],'Undefined cutscene '+action);
 }
}
for(const [name,dialogue] of Object.entries(def.dialogues)){
 assert.equal(typeof dialogue.text,'string',name+' needs text');
 for(const choice of dialogue.choices||[]){
  if(choice.message)assert(messages.has(choice.message),name+' refers to undefined message');
  if(choice.scene)assert(scenes.has(choice.scene),name+' refers to undefined scene');
  if(choice.event)assert(def.rules.some(rule=>rule.when===choice.event),name+' refers to undefined event '+choice.event);
 }
}
const art=content('kite-art.js'),player=content('player.js'),page=content('index.html');
assert(page.includes('kite-art.js')&&page.includes('player.js'));
assert(page.includes('?mission=rooftop-kite'));
assert(player.includes("missionSlug")&&player.includes("'adventures/'+missionSlug+'.json'"));
for(const type of new Set(Object.values(def.scenes).flatMap(scene=>scene.objects.map(o=>o.type)))){
 assert(art.includes(type+':'),'No illustration registered for '+type);
}
const first=new MissionEngine(def),event=(engine,name,ok=true)=>{
 const result=engine.trigger(name);
 assert.equal(result.ok,ok,name+' result');
 return result;
};
assert.equal(first.state.scene,'workshop');
event(first,'click:launch',false);
event(first,'click:roofDoor');
assert.equal(first.state.scene,'rooftop');
event(first,'click:weatherVane');
event(first,'click:launch',false);
event(first,'click:stairs');
assert.equal(first.state.scene,'workshop');
event(first,'drop:spool:kite');assert(!first.state.flags.tied,'Thread must not tie before patch');
event(first,'click:paper');assert.deepEqual(first.state.inventory,['paper']);
event(first,'drop:paper:kite');assert(first.state.flags.patched);
assert.deepEqual(first.state.inventory,[]);
event(first,'click:spool');assert.deepEqual(first.state.inventory,['spool']);
event(first,'drop:spool:kite');assert(first.state.flags.tied);
assert.deepEqual(first.state.inventory,[]);
event(first,'click:roofDoor');
event(first,'click:kite');
event(first,'drop:kite:launchPad');assert(first.state.flags.positioned);
event(first,'choose:west');assert(!first.state.flags.steady,'Wrong wind must allow retry');
event(first,'choose:east');assert(first.state.flags.steady);
const finale=event(first,'click:launch');
assert(finale.actions.includes('cutscene:kiteFlight'));
assert.equal(first.state.complete,false);
assert(first.finish());assert(first.state.complete);
assert.equal(first.state.scene,'rooftop');
first.reset();
assert.deepEqual(first.state.flags,{});
assert.deepEqual(first.state.inventory,[]);
assert.equal(first.state.scene,'workshop');

// Alternative interaction flow: direct drag from art, with no inventory tap.
event(first,'drop:paper:kite');event(first,'drop:spool:kite');
event(first,'navigate:rooftop');
event(first,'drop:kite:launchPad');
event(first,'choose:east');
event(first,'click:launch');
first.finish();
assert(first.state.complete);
console.log('PASS · Mission 002 art references, early roof, patch, spool, wind branch, cutscene, reset and direct drags');
