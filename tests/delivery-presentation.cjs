const assert=require('node:assert/strict');
const {preset}=require('../missions/delivery-camera.js');
const {notes}=require('../missions/delivery-score.js');
for(const name of ['wide','detail','conversation','follow','arrival','intro'])for(const focus of [{x:0,y:0},{x:1280,y:720},{x:600,y:450}]){
 const [x,y,w,h]=preset(name,focus);assert(x>=0&&y>=0&&x+w<=1280.01&&y+h<=720.01,'Camera must stay inside world');assert(Math.abs(w/h-16/9)<.001,'Camera must preserve geometry');
}
assert.notDeepEqual(preset('conversation',{x:300,y:400}),preset('conversation',{x:1050,y:400}),'Conversation framing must follow the cast');
for(let beat=0;beat<128;beat++){
 const full=notes(beat,'home'),duck=notes(beat,'home',true);assert(full.length&&full.length<=6);
 for(const [i,n] of full.entries()){assert(n.frequency>30&&n.frequency<1500&&n.duration>0);assert(n.volume>0&&n.volume<.06);assert(duck[i].volume<n.volume,'Speech must duck the score');}
}
assert.notDeepEqual(notes(0,'home'),notes(8,'home'),'Score must change harmony');
assert.notDeepEqual(notes(0,'home'),notes(0,'stall'),'Areas need distinct score colours');
console.log('PASS · camera bounds/aspect/framing; original score harmony, scene variation and voice ducking');
