const assert = require('node:assert/strict');
class FakeAudio {
 constructor(src){this.src=src;this.paused=true;}
 play(){this.paused=false;return Promise.resolve();}
 pause(){this.paused=true;}
}
global.Audio=FakeAudio;
const Voice=require('../missions/voice-player.js');
const voice=new Voice();
voice.lines.hello={text:'Hello',speaker:'hero',src:'audio/delivery/hello-123.mp3'};
voice.play('hello','Hello');
const first=voice.clip;
assert.ok(first);
voice.setMuted(true);assert.equal(first.muted,true);
voice.setHidden(true);assert.equal(first.paused,true);
voice.setHidden(false);assert.equal(first.paused,false);
voice.play('hello','Edited subtitle');
assert.equal(first.paused,true);assert.equal(voice.clip,null);
voice.play('missing','No recording');assert.equal(voice.clip,null);
voice.play('hello','Hello');voice.clip.onended();assert.equal(voice.clip,null);
voice.lines.unsafe={text:'Oops',src:'https://example.com/clip.mp3'};
voice.play('unsafe','Oops');assert.equal(voice.clip,null);
console.log('PASS · voice playback, interruption, mute, pause, stale/missing audio, URL checks');
