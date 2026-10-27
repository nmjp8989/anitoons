'use strict';
const assert=require('node:assert/strict');
const Engine=require('../missions/mission-engine.js');
const Runner=require('../missions/sequence-runner.js');
const def=require('../missions/adventures/moon-lantern.json');
const voices=require('../voices.json');
for(const [id,d] of Object.entries(def.dialogues)){
 assert(d.text&&voices[d.speaker],id+' must have readable dialogue and a configured voice');
 if(d.puzzle)assert(def.puzzles[d.puzzle]);
 for(const c of d.choices||[])assert(def.rules.some(r=>r.when===c.event),'Unknown choice '+c.event);
}
for(const r of def.rules){if(r.in)assert(def.scenes[r.in]);for(const a of r.actions){const [k,id]=a.split(':');if(k==='message')assert(def.dialogues[id]);if(k==='sequence')assert(def.sequences[id]);if(k==='scene')assert(def.scenes[id]);}}
function harness(){const e=new Engine(def);e.state.started=true;const a=async event=>{const out=e.trigger(event);for(const action of out.actions){const [kind,id]=action.split(':');if(kind==='sequence')await runner.run(def.sequences[id]);}return out;};const runner=new Runner({walk:async()=>{},camera:()=>{},pose:()=>{},line:async()=>{},sound:()=>{},effect:async()=>{},event:a,ending:()=>e.finish()});return {e,a};}
(async()=>{
 for(const earlySnacks of [true,false]){
 const {e,a}=harness();
 await a('click:door');await a('click:gardenGate');assert.equal(e.state.scene,'courtyard');assert(!(await a('solve:deduction')).ok,'Cannot skip missing clues');
 // A wrong answer keeps the puzzle open and awards nothing.
 await a('click:homeDoor');await a('answer:hooks:0');assert(!e.state.flags.missingCount);assert(!e.state.inventory.includes('ribbon'));
 await a('answer:hooks:1');assert(e.state.inventory.includes('ribbon'));
 if(earlySnacks)await a('answer:snacks:2');
 await a('click:door');await a('answer:trails:0');await a('answer:ribbons:1');
 await a('click:stallDoor');await a('answer:labels:2');
 // Optional math is never a completion gate, and repeated answers do not duplicate rewards.
 if(earlySnacks)await a('answer:flowers:1');
 await a('click:back');await a('guess:street');assert(!e.state.flags.gateOpened);
 await a('solve:deduction');assert.equal(e.state.scene,'garden');await a('click:picnic');assert(!e.state.complete);
 await a('click:moonLantern');assert(e.state.flags.lanternFound);
 if(!earlySnacks){await a('click:picnic');assert(!e.state.complete);await a('click:back');await a('click:homeDoor');await a('answer:snacks:2');await a('click:door');await a('click:gardenGate');}
 await a('drop:snacks:picnic');assert(e.state.complete&&e.state.flags.picnicShared);assert(!e.state.inventory.includes('snacks'));
 assert.equal(!!e.state.flags.flowersCounted,earlySnacks);
 const unique=new Set(e.state.inventory);assert.equal(unique.size,e.state.inventory.length);
 e.reset();assert.deepEqual(e.state.flags,{});assert.equal(e.state.complete,false);
 }
 // Mathematical facts and distractors stay aligned with the visible counters.
 const p=def.puzzles;assert.equal(p.hooks.visual.total-p.hooks.visual.filled,4);assert.equal(p.snacks.visual.groups.reduce((a,b)=>a+b),12);assert(p.trails.visual.groups[0]>p.trails.visual.groups[1]);assert.deepEqual(p.labels.visual.sequence,[11,12,'?',14]);
 console.log('PASS · Mission 004: gentle retries, all clue gates, optional math, both snack routes, deduction, inventory use and ending');
})();
