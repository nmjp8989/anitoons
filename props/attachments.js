/* Scene entity transforms. SVG art and UI remain independent of this model. */
(function(root){
 const identity=[1,0,0,1,0,0];
 function multiply(a,b){return [a[0]*b[0]+a[2]*b[1],a[1]*b[0]+a[3]*b[1],a[0]*b[2]+a[2]*b[3],a[1]*b[2]+a[3]*b[3],a[0]*b[4]+a[2]*b[5]+a[4],a[1]*b[4]+a[3]*b[5]+a[5]];}
 function inverse(m){const d=m[0]*m[3]-m[1]*m[2];if(Math.abs(d)<1e-9)throw Error('Anchor is side-on; retry attachment after turning');return [m[3]/d,-m[1]/d,-m[2]/d,m[0]/d,(m[2]*m[5]-m[3]*m[4])/d,(m[1]*m[4]-m[0]*m[5])/d];}
 function world(entities,id,seen=new Set()){
  if(seen.has(id))throw Error('Attachment cycle');seen.add(id);
  const e=entities[id];if(!e)throw Error('Missing entity: '+id);
  if(!e.parent)return e.transform||identity.slice();
  const p=entities[e.parent.entity],anchor=p?.anchors?.[e.parent.anchor];if(!anchor)throw Error('Missing anchor');
  return multiply(multiply(world(entities,e.parent.entity,seen),anchor),e.transform||identity);
 }
 function attach(entities,id,parent,anchor,{keepWorld=false}={}){
  const e=entities[id],p=entities[parent];if(!e||!p?.anchors?.[anchor])throw Error('Missing entity or anchor');
  const before=world(entities,id),oldParent=e.parent,oldTransform=e.transform;
  try{e.parent={entity:parent,anchor};e.transform=keepWorld?multiply(inverse(multiply(world(entities,parent),p.anchors[anchor])),before):identity.slice();world(entities,id);}
  catch(error){e.parent=oldParent;e.transform=oldTransform;throw error;}
 }
 function detach(entities,id){const matrix=world(entities,id);entities[id].parent=null;entities[id].transform=matrix;}
 const api={multiply,inverse,world,attach,detach};if(typeof module!=='undefined')module.exports=api;else root.UmtoAttachments=api;
})(globalThis);
