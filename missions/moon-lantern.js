/* Visual math workbench and a clue notebook; story state stays in MissionEngine. */
'use strict';
(function(root){
let currentMission,currentEngine;
const byId=id=>document.getElementById(id);
function element(tag,cls,text){const el=document.createElement(tag);if(cls)el.className=cls;if(text!==undefined)el.textContent=text;return el;}
function clear(){byId('mathWorkbench')?.remove();}
function tokens(count,label,kind){const group=element('section','counter-group');group.append(element('span','counter-label',label));const frame=element('div','counting-frame');for(let i=0;i<count;i++){const b=element('button','counter '+kind,String(i+1));b.type='button';b.setAttribute('aria-label',label+', counter '+(i+1));b.setAttribute('aria-pressed','false');b.onclick=()=>{const marked=b.getAttribute('aria-pressed')!=='true';b.setAttribute('aria-pressed',String(marked));b.classList.toggle('counted',marked);};frame.append(b);}group.append(frame);return group;}
function dialogue(d,mission,engine){
 clear();currentMission=mission;currentEngine=engine;
 const puzzle=mission.puzzles[d.puzzle];byId('dialogue').classList.toggle('math-dialogue',!!puzzle);if(!puzzle)return;
 const panel=element('div','math-workbench');panel.id='mathWorkbench';const v=puzzle.visual;
 panel.append(element('p','math-instruction','Touch a counter to mark it. Take your time.'));
 const visuals=element('div','math-visuals');
 if(v.type==='hooks'){
  const g=element('div','hook-frame');g.setAttribute('aria-label','Ten hooks: six with lanterns, four empty');
  for(let i=0;i<v.total;i++){const b=element('button','hook-counter '+(i<v.filled?'filled':'empty'),i<v.filled?'▰':'∪');b.type='button';b.setAttribute('aria-label','Hook '+(i+1)+(i<v.filled?', has a lantern':', empty'));b.setAttribute('aria-pressed','false');b.onclick=()=>{const marked=b.getAttribute('aria-pressed')!=='true';b.setAttribute('aria-pressed',String(marked));b.classList.toggle('counted',marked);};g.append(b);}visuals.append(g);
 }else if(v.groups){v.groups.forEach((n,i)=>{if(i&&v.type==='addition')visuals.append(element('span','math-operator','+'));visuals.append(tokens(n,v.labels[i],v.type==='compare'?'print':i?'cracker':'apple'));});}
 else if(v.sequence){const seq=element('div','math-sequence');seq.setAttribute('aria-label',v.sequence.join(', '));v.sequence.forEach(n=>{seq.append(element('span','sequence-card '+(n==='?'?'unknown':String(n)),n==='blue'?'Blue':n==='gold'?'Gold':String(n)));});visuals.append(seq);}
 panel.append(visuals);byId('choices').before(panel);
}
function progress(mission,engine){currentMission=mission;currentEngine=engine;const count=mission.clues.filter(c=>engine.has(c.if)).length;byId('notebookButton').setAttribute('aria-label','Clue notebook, '+count+' discoveries');byId('notebookButton').classList.toggle('has-clues',count>0);}
function notebook(mission=currentMission,engine=currentEngine){
 if(!mission||!engine)return;const list=byId('clueList');list.replaceChildren();const clues=mission.clues.filter(c=>engine.has(c.if));
 if(!clues.length)list.append(element('p','','Our first clue is waiting by the lantern hooks.'));
 for(const clue of clues){const card=element('article','clue-card');card.append(element('h3','',clue.title),element('p','',clue.text));list.append(card);}
 const solved=Object.values(mission.puzzles).filter(p=>engine.has(p.solvedIf)).length;byId('mathProgress').textContent=solved+' math discoveries. Counting, adding, comparing, patterns and number order.';byId('notebook').showModal();
}
byId('notebookButton').onclick=()=>{if(byId('opening').hidden&&!byId('game').classList.contains('busy'))notebook();};
byId('closeNotebook').onclick=()=>byId('notebook').close();
// Modal keys stay inside the notebook instead of triggering a hidden answer.
byId('notebook').addEventListener('keydown',e=>e.stopPropagation());
root.MysteryUI={dialogue,clear,notebook,progress};
})(window);
