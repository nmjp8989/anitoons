const assert=require('node:assert/strict'),a=require('../props/attachments.js');
const I=[1,0,0,1,0,0];const e={actor:{transform:[1,0,0,1,100,200],anchors:{hand:[0,1,-1,0,20,30]}},cup:{transform:[1,0,0,1,300,400],anchors:{rim:I}},spoon:{transform:I}};
a.attach(e,'cup','actor','hand');assert.deepEqual(a.world(e,'cup'),[0,1,-1,0,120,230]);
a.attach(e,'spoon','cup','rim');assert.deepEqual(a.world(e,'spoon'),a.world(e,'cup'));
assert.throws(()=>a.attach(e,'cup','spoon','missing'));assert.throws(()=>a.attach(e,'cup','cup','rim'),/cycle/);
const before=a.world(e,'cup');a.detach(e,'cup');assert.deepEqual(a.world(e,'cup'),before);
a.attach(e,'cup','actor','hand',{keepWorld:true});assert.deepEqual(a.world(e,'cup'),before);
e.actor.transform[4]+=50;assert.equal(a.world(e,'spoon')[4],before[4]+50);
console.log('PASS: nested attachments, animated parent movement, cycle rejection, keep-world attach and detach');
