/* Drawable prop catalogue; coordinates belong to art, not quest logic. */
'use strict';
const MissionSprites={
 sofa:()=>ART.sofa,
 table:()=>ART.table,
 cupboard:state=>ART.cupboard(!!state.visible.key),
 cup:()=>'<circle cx="525" cy="443" r="44" fill="transparent" pointer-events="all"/><g transform="translate(525 439)">'+ART.cup+'</g><ellipse class="hover-ring" cx="528" cy="447" rx="42" ry="27"/>',
 key:()=>'<rect x="971" y="345" width="96" height="47" rx="12" fill="transparent" pointer-events="all"/><g transform="translate(1017 369) scale(.85)">'+ART.key+'</g><circle class="hover-ring" cx="1017" cy="369" r="31"/>',
 door:()=>ART.door,
 homeDoor:()=>'<rect x="161" y="200" width="139" height="277" fill="transparent" pointer-events="all"/><g transform="translate(222 171)"><rect x="-41" y="-19" width="82" height="29" rx="6" fill="#f1e6cd"/><text text-anchor="middle" font-size="13" fill="#677359" font-weight="600">← Home</text></g>',
 scooter:()=>ART.scooter,
 go:()=>'<g transform="translate(1080 475)"><rect width="145" height="51" rx="25" fill="#38553f" stroke="#e3d8ad" stroke-width="3"/><text x="72" y="32" text-anchor="middle" fill="#fff7de" font-size="18" font-weight="650">Let’s go →</text></g>'
};
