'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const Engine=require('../missions/mission-engine.js');
const mission=require('../missions/mission.json');
const engine=new Engine(mission);
const p=()=>engine.state;
function fire(event){const out=engine.trigger(event);assert.equal(out.ok,true,event+' should work');return out;}
function shows(when, action){const out=engine.trigger(when);assert(out.actions.includes(action),when+' should contain '+action);}

// Validate all mission-data references before browser rendering.
assert.equal(mission.version,2);
assert.ok(mission.scenes[mission.startScene]);
assert.ok(mission.dialogues[mission.startMessage]);
const renderers=new Set(['sofa','table','cupboard','cup','key','door','homeDoor','scooter','go']);
for(const [scene,description] of Object.entries(mission.scenes)){
 assert.ok(description.name&&description.music&&description.art);
 for(const object of description.objects){
  assert.ok(renderers.has(object.type),scene+' has unknown sprite '+object.type);
  assert.ok(object.id&&object.name);
 }
}
for(const rule of mission.rules){
 assert.ok(Array.isArray(rule.actions));
 if(rule.in)assert.ok(mission.scenes[rule.in],'Unknown scene in '+rule.when);
 for(const a of rule.actions){
  const [type,...bits]=a.split(':'),val=bits.join(':');
  if(type==='message')assert.ok(mission.dialogues[val],'Missing dialogue '+val);
  if(type==='scene')assert.ok(mission.scenes[val],'Missing scene '+val);
  if(type==='cutscene')assert.ok(mission.cutscenes[val],'Missing cutscene '+val);
 }
}
for(const [id,dialogue] of Object.entries(mission.dialogues)){
 for(const choice of dialogue.choices||[]){
  if(choice.message)assert.ok(mission.dialogues[choice.message],id+' missing choice message');
  if(choice.scene)assert.ok(mission.scenes[choice.scene],id+' missing choice scene');
  if(choice.event)assert.ok(mission.rules.some(rule=>rule.when===choice.event),id+' missing choice event');
 }
}
for(const scene of Object.keys(mission.scenes)){
 assert.ok(mission.rules.some(rule=>rule.when==='navigate:'+scene)||scene===mission.startScene,'Scene not navigable '+scene);
}
for(const [id,cut] of Object.entries(mission.cutscenes)){
 assert.ok(cut.frames?.length,id+' has no frames');
 if(cut.after)assert.ok(mission.dialogues[cut.after]);
}
assert.ok(fs.readFileSync(path.join(__dirname,'../missions/index.html'),'utf8').includes('src="player.js"'));

// First mission: incorrect actions cannot advance the key puzzle.
assert.equal(p().scene,'home');
assert.equal(engine.has('!tea+scene.home'),true);
assert.equal(engine.has('tea'),false);
assert.equal(engine.trigger('click:go').ok,false);
shows('click:cupboard','message:cupboardBlocked');
assert.equal(p().visible.key,undefined);
fire('drop:character:sofa');assert.equal(p().pose,'sit');
fire('click:character');assert.equal(p().pose,'stand');
fire('drop:cup:character');assert.equal(p().flags.tea,true);
fire('click:cupboard');assert.equal(p().visible.key,true);
fire('click:key');fire('click:key');assert.deepEqual(p().inventory,['key']);
fire('navigate:yard');assert.equal(p().scene,'yard');
assert.equal(engine.trigger('click:go').ok,false,'Cannot leave without unlocking');
assert.equal(engine.trigger('drop:character:scooter').ok,false,'Cannot mount a locked scooter');
fire('drop:key:scooter');assert.equal(p().flags.unlocked,true);
assert.equal(engine.trigger('click:go').ok,false,'Cannot leave without mounting');
fire('drop:character:scooter');assert.equal(p().flags.mounted,true);
const ending=fire('click:go');
assert.equal(p().complete,false,'Await cutscene');
assert(ending.actions.indexOf('cutscene:departure')<ending.actions.indexOf('ending:complete'));
assert.equal(engine.finish(),true);assert.equal(p().complete,true);
engine.reset();
assert.equal(p().scene,'home');
assert.equal(p().complete,false);
assert.deepEqual(p().inventory,[]);
assert.deepEqual(p().flags,{});

// Data portability: a completely different mission works with the SAME engine.
const sample={
 id:'tiny-library-quest',
 scenes:{library:{name:'Library',objects:[]},garden:{name:'Garden',objects:[]}},
 startScene:'library',
 rules:[
  {when:'click:book',in:'library',actions:['show:note']},
  {when:'click:note',in:'library',if:'visible.note',actions:['inventory:note','flag:read']},
  {when:'click:gate',in:'library',if:'read',actions:['scene:garden']},
  {when:'click:bell',in:'garden',if:'inventory.note',actions:['ending:complete']}
 ]
};
const another=new Engine(sample);
assert.equal(another.trigger('click:gate').ok,false);
assert.equal(another.trigger('click:note').ok,false);
assert.equal(another.trigger('click:book').ok,true);
assert.equal(another.trigger('click:note').ok,true);
assert.equal(another.trigger('click:gate').ok,true);
assert.equal(another.state.scene,'garden');
assert.equal(another.trigger('click:bell').ok,true);
assert.equal(another.state.complete,false);
another.finish();assert.equal(another.state.complete,true);
console.log('PASS · JSON references, art registry, chai/key/scooter end-to-end, reset, independent mission');
