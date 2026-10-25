/* Original, quiet score: changing chords, soft plucked arpeggios, melody and bass. */
(function(root){
'use strict';
const chords=[[146.83,174.61,220,293.66],[130.81,164.81,196,261.63],[116.54,146.83,174.61,233.08],[130.81,164.81,196,261.63],[146.83,174.61,220,293.66],[174.61,220,261.63,349.23],[130.81,164.81,196,261.63],[110,138.59,164.81,220]];
const melody=[0,587.33,0,523.25,440,0,349.23,0,392,0,440,0,329.63,0,0,0,0,349.23,440,0,523.25,0,440,392,349.23,0,293.66,0,0,0,0,0];
function notes(beat,scene,duck=false){
 const chord=chords[Math.floor(beat/8)%chords.length],factor=scene==='stall'?1.12246:scene==='cinema'?1.33484:1,volume=duck?.3:1;
 const result=[{frequency:chord[[0,2,1,3,2,1,3,2][beat%8]]*factor,duration:1.1,volume:.033*volume,voice:'pluck'}];
 if(beat%8===0){for(const f of chord.slice(0,3))result.push({frequency:f*factor,duration:3.5,volume:.013*volume,voice:'pad'});result.push({frequency:chord[0]*factor/2,duration:2.7,volume:.026*volume,voice:'bass'});}
 const lead=melody[beat%melody.length];if(lead&&Math.floor(beat/32)%2===0)result.push({frequency:lead*factor,duration:1.4,volume:.025*volume,voice:'melody'});
 return result;
}
root.DeliveryScore={notes};if(typeof module!=='undefined'&&module.exports)module.exports={notes};
})(typeof window!=='undefined'?window:globalThis);
