(() => {
"use strict";
const D=window.GAME_DATA;
const $=id=>document.getElementById(id);
const names=["Mom","Sister","Brother","Dog","Neighbor"];
const symbols=["⚀","⚁","⚂","⚃","⚄","⚅"];
const moodNames=["Curious","Depressed","Concerned","Worried","Paranoid","Panicked"];
const moodColors=["#4e9058","#98ad52","#ddc648","#e48c34","#c14e32","#921d26"];
const forkMap={8:"A",18:"B",27:"C",36:"D"}, branchExit={A:16,B:18,C:34,D:36},branchStart={A:8,B:18,C:27,D:36};
const soundMap=[
 [/PUNCH CLOCK|DAD STOMPS|STOMPS IN/i,"heavy_footsteps"],[/DOOR SLAM|DAD GETS HOME/i,"heavy_door_slam"],[/RELAX, DEAR/i,"heavy_sigh"],
 [/DOG|SPARKY/i,"dog_bark"],[/COCKTAIL|MARTINI|GIN|WHISKEY|GLASS|LIQUOR/i,"cocktail_glass"],
 [/SMELL|SMOKE|ASHTRAY|ROAST|PANTRY|OILY|FURNACE/i,"sniffing"],
 [/BOSS|PRINCIPAL|TELEPHONE|CALL/i,"telephone"],[/TV STATIC|NEWS AT SIX/i,"television_static"],
 [/WRENCH|ENGINE|MOWER|TOOLS|GARAGE/i,"tool_clank"],[/RECIPE-BOX|NOTE|BILL/i,"paper_reveal"],
 [/SCHOOL|HOMEWORK|MATH/i,"school_bell"],[/DINNER EXPLODES|ARGUMENT/i,"argument"],
 [/MELTDOWN|COLD WAR PANIC/i,"meltdown"],[/MYSTERY SOLVED/i,"reveal_fanfare"],[/LOCKED DOOR|BASEMENT|CREAK/i,"door_creak"]
];
let selected=new Set(["Mom","Brother"]),g=null,soundOn=localStorage.getItem("dadSound")!=="off",zoomed=false,modalOpen=false,rolling=false;
const soundCache={};
function sound(file) {
 if(!soundOn||!file)return;
 const path="assets/"+file+".wav";
 try {
  const a=new Audio(path);a.volume=.9;a.play().catch(()=>{});
 }catch(e){console.warn("Sound unavailable",file,e)}
}
function eventSound(title){const found=soundMap.find(([pattern])=>pattern.test(title));if(found)sound(found[1]);}
function escapeHTML(v){return String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
function rand(n){return Math.floor(Math.random()*n)}
function newPlayer(name,id){return {name,id,position:0,route:null,branchIndex:0,score:0,evidence:[],visited:[],bonus:false,nerve:2,lastAbilityRound:0};}
function cur(){return g.players[g.current];}
function start(){
 g={players:[...selected].map(newPlayer),current:0,mystery:D.mysteries[rand(D.mysteries.length)],clock:0,heat:0,trust:2,round:1,adjust:0,die:0,phase:"playing",message:"Dad has locked himself downstairs. What is he doing?",pending:null};
 $("setup").hidden=true;$("game").hidden=false;
 zoomed=false;setZoom(false);render();arrival();
}
function arrival(){
 sound("car_arrival");setTimeout(()=>sound("car_door"),1050);setTimeout(()=>sound("heavy_door_slam"),5100);
}
function render(){
 if(!g)return;
 $("moodLabel").textContent=moodNames[Math.min(5,g.heat)];
 $("clockLabel").textContent=g.clock+" / 12";
 $("moodbar").innerHTML=moodColors.map((c,i)=>`<div class="${i===Math.min(5,g.heat)?"current":""}" style="background:${c};opacity:${i<=g.heat?1:.55}"></div>`).join("");
 $("roundLabel").textContent=g.round;
 $("turnTitle").textContent=cur().name+"'s turn";
 $("abilityLabel").textContent=({Mom:"Keep the Peace: Heat −1",Sister:"Eavesdrop: discover a new clue",Brother:"Shortcut: +1 Nerve Token",Dog:"Sniff Out: discover a Smell clue",Neighbor:"Gossip: discover a Behavior clue"})[cur().name];
 $("nerveLabel").textContent=cur().nerve+" Nerve Token"+(cur().nerve===1?"":"s");
 $("adjustLabel").textContent=(g.adjust>0?"+":"")+g.adjust;
 $("minusBtn").disabled=rolling||modalOpen||g.adjust<=-2||Math.abs(g.adjust-1)>cur().nerve;
 $("plusBtn").disabled=rolling||modalOpen||g.adjust>=2||Math.abs(g.adjust+1)>cur().nerve;
 $("rollBtn").disabled=rolling||modalOpen||g.phase!=="playing";
 $("abilityBtn").disabled=rolling||modalOpen||cur().lastAbilityRound===g.round;
 $("drawBtn").disabled=rolling||modalOpen;
 $("die").setAttribute("aria-label",g.die?`Die showing ${g.die}`:"Die ready to roll");
 $("turnMessage").textContent=g.message;
 $("spaceLabel").textContent=cur().route?D.branches[cur().route][cur().branchIndex].title:(cur().position===0?"START — THE HOUSE":D.tiles[cur().position-1]?.title||"BASEMENT");
 $("scoreRows").innerHTML=g.players.map((p,i)=>`<div class="score-row ${i===g.current?"active":""}"><img src="assets/pawn-${p.name.toLowerCase()}.png" alt=""><strong>${escapeHTML(p.name)}</strong><span>${p.evidence.length}/4 clues · ${p.nerve} nerve</span><span class="points">${p.score} pts</span></div>`).join("");
 $("clueRows").innerHTML=["sound","sight","smell","behavior"].map(k=>`<div class="clue"><strong>${k.toUpperCase()}</strong> — ${cur().evidence.includes(k)?escapeHTML(g.mystery.clues[k]):"Not yet discovered"}</div>`).join("");
 renderPawns();
}
function stopPoint(p){
 if(p.route){
  const origins={A:[.22,.67],B:[.22,.81],C:[.66,.68],D:[.49,.78]},a=origins[p.route],i=p.branchIndex+1;
  return [a[0]+(p.route==="A"||p.route==="B"?-.024:.023)*i,a[1]+(p.route==="A"||p.route==="C"?-.030:.028)*i];
 }
 return p.position===0?[.27,.89]:D.waypoints[Math.max(0,Math.min(47,p.position-1))];
}
function renderPawns(){
 $("pawns").innerHTML=g.players.map((p,i)=>{
  const [x,y]=stopPoint(p);
  return `<img class="pawn ${i===g.current?"current":""}" src="assets/pawn-${p.name.toLowerCase()}.png" alt="${p.name}" title="${p.name}" style="left:${x*100+(i%3)*.6-.6}%;top:${y*100+Math.floor(i/3)*.8-.4}%">`;
 }).join("");
 if(zoomed)centerPawn();
}
function centerPawn(){
 const vp=$("boardViewport"),canvas=$("boardCanvas");
 if(!zoomed)return;
 const [x,y]=stopPoint(cur());
 requestAnimationFrame(()=>{vp.scrollLeft=Math.max(0,canvas.offsetWidth*x-vp.clientWidth/2);vp.scrollTop=Math.max(0,canvas.offsetHeight*y-vp.clientHeight/2);});
}
function setZoom(value){
 zoomed=value;
 $("boardViewport").classList.toggle("zoom",zoomed);
 $("fitBtn").classList.toggle("active",!zoomed);$("zoomBtn").classList.toggle("active",zoomed);
 if(!zoomed){$("boardViewport").scrollLeft=0;$("boardViewport").scrollTop=0;}
 else centerPawn();
}
function effectDescription(kind){
 const [k,n]=kind;
 if(k==="heat")return `Household Heat ${n>0?"+":""}${n}`;
 if(k==="trust")return `Family Harmony +${n}; Heat −1`;
 if(k==="points")return `Detective Points ${n>0?"+":""}${n}`;
 if(k==="evidence")return `Discover ${n.toUpperCase()} clue`;
 return k==="door"?"Requires three different clues":k==="fork"?"Choose a route":"A surprise awaits";
}
function score(n){cur().score=Math.max(0,cur().score+n);}
function evidence(type,tileId=null){
 const p=cur(),fresh=!p.evidence.includes(type);
 if(tileId!==null&&p.visited.includes(tileId))return false;
 if(tileId!==null)p.visited.push(tileId);
 if(fresh){p.evidence.push(type);score(2);p.nerve=Math.min(5,p.nerve+1);}
 if(p.evidence.length>=3&&!p.bonus){p.bonus=true;score(3);}
 return fresh;
}
function apply(kind){
 const [type,n]=kind;
 if(type==="heat")g.heat=Math.max(0,g.heat+n);
 if(type==="trust"){g.trust=Math.min(6,g.trust+n);g.heat=Math.max(0,g.heat-1);}
 if(type==="points")score(n);
 if(type==="evidence")evidence(n);
 if(type==="clock"){g.clock+=n;if(g.clock>=12){g.clock=0;g.heat++;}}
}
function show(title,body,after){
 g.message=body;render();eventSound(title);
 openModal(`<div class="eyebrow">THE HOUSE HAS SPOKEN</div><h2>${escapeHTML(title)}</h2><p>${escapeHTML(body)}</p><div class="options"><button id="continueBtn" class="primary">CONTINUE</button></div>`);
 $("continueBtn").onclick=()=>{closeModal();if(after)after();else endTurn();};
}
function openModal(html){modalOpen=true;$("overlay").hidden=false;$("modal").innerHTML=html;render();}
function closeModal(){modalOpen=false;$("overlay").hidden=true;$("modal").innerHTML="";render();}
function endTurn(){
 if(g.phase==="finished"){render();return;}
 g.adjust=0;g.current=(g.current+1)%g.players.length;if(g.current===0)g.round++;
 g.die=0;g.message=cur().name+"'s turn. Choose an ability or adjust your roll.";
 render();
}
function meltdown(){
 g.heat=2;
 for(const p of g.players){
  p.score=Math.max(0,p.score-2);
  if(p.route){p.position=branchStart[p.route];p.route=null;p.branchIndex=0;}
  else p.position=Math.max(0,p.position-2);
 }
 show("FAMILY MELTDOWN!","The entire household loses its cool! Everyone loses 2 points and retreats 2 spaces. Household Heat resets to 2.");
}
function resolve(tile,id){
 const [kind,type]=tile.kind;
 if(kind==="drama"){drawDrama();return;}
 if(kind==="evidence"){
  const fresh=evidence(type,id);
  show(tile.title,`${tile.subtitle}\n\n${type.toUpperCase()} CLUE: ${fresh?g.mystery.clues[type]:"You've already seen this kind of evidence."}\n${fresh?"+2 points and +1 Nerve":"No new category bonus"}`);
  return;
 }
 if(kind==="fork"||kind==="door"){show(tile.title,tile.subtitle);return;}
 apply(tile.kind);
 if(g.heat>=6){meltdown();return;}
 show(tile.title,tile.subtitle+"\n\n"+effectDescription(tile.kind));
}
function branchChoice(branch){
 const descriptions={A:"Neighbors: gossip clues, but the block watch may cost points.",B:"Telephone: sight and sound clues, but a dangerous dead end.",C:"Garage: engine and smell clues; risk a noisy disaster.",D:"Fallout Shelter: unusual clues and a costly detour."};
 openModal(`<div class="eyebrow">A FORK IN THE ROAD</div><h2>Take the detour?</h2><p>${descriptions[branch]}</p><div class="options two"><button id="stayBtn">STAY ON PATH</button><button id="branchBtn" class="primary">TAKE DETOUR</button></div>`);
 $("stayBtn").onclick=()=>{closeModal();resolve(D.tiles[cur().position-1],cur().position);};
 $("branchBtn").onclick=()=>{closeModal();cur().route=branch;cur().branchIndex=0;resolve(D.branches[branch][0],D.branches[branch][0].id);};
}
function move(n){
 const p=cur();
 if(p.route){
  const next=p.branchIndex+n;
  if(next>=4){
   const branch=p.route;p.route=null;p.branchIndex=0;p.position=branchExit[branch];
   if(branch==="B"||branch==="D"){score(-3);show("DETOUR COMPLETE","A disastrous dead end. −3 Detective Points.");}
   else show("DETOUR COMPLETE",`Shortcut! Rejoin the main route at space ${p.position}.`);
  }else{p.branchIndex=next;resolve(D.branches[p.route][next],D.branches[p.route][next].id);}
  return;
 }
 const old=p.position,dest=Math.min(48,old+n);
 const fork=Object.keys(forkMap).map(Number).sort((a,b)=>a-b).find(k=>k>old&&k<=dest);
 if(fork){p.position=fork;branchChoice(forkMap[fork]);return;}
 p.position=dest;
 if(dest>=42&&old<42&&p.evidence.length<3){p.position=33;show("LOCKED DOOR","You need three different clue types to enter the basement. Return to space 33.");return;}
 if(dest===48){
  if(p.evidence.length>=3){accuse();return;}
  p.position=33;show("NOT ENOUGH CLUES","Collect three different clue categories before confronting Dad.");return;
 }
 resolve(D.tiles[dest-1],dest);
}
function roll(){
 if(rolling||modalOpen)return;
 rolling=true;
 const die=1+rand(6),movement=Math.max(1,Math.min(8,die+g.adjust));
 cur().nerve-=Math.abs(g.adjust);g.adjust=0;g.clock++;
 if(g.clock>=12){g.clock=0;g.heat++;}
 const cube=$("die");
 cube.classList.remove("rolling");
 cube.style.transition="none";
 cube.style.transform="translateY(-5px) rotateX(-18deg) rotateY(0deg)";
 void cube.offsetWidth; // Restart the tumble on repeated rolls.
 cube.classList.add("rolling");sound("dice_roll");
 setTimeout(()=>{
  cube.classList.remove("rolling");
  // Each orientation presents the matching pip face toward the player.
  const orientations={1:[0,0],2:[0,-90],3:[90,0],4:[-90,0],5:[0,90],6:[0,180]};
  const [x,y]=orientations[die];
  cube.style.transform=`translateY(-5px) rotateX(${x}deg) rotateY(${y}deg)`;
  cube.style.transition="transform 220ms ease-out";
  g.die=die;rolling=false;g.message=`Rolled ${die}. Move ${movement} spaces.`;
  if(g.heat>=6){meltdown();return;}
  move(movement);render();
 },950);
 render();
}
function useAbility(){
 if(rolling||modalOpen||cur().lastAbilityRound===g.round)return;
 const p=cur();p.lastAbilityRound=g.round;
 if(p.name==="Mom"){g.heat=Math.max(0,g.heat-1);show("KEEP THE PEACE","Mom calms the family. Household Heat −1.",()=>render());return;}
 if(p.name==="Brother"){p.nerve=Math.min(5,p.nerve+1);show("SHORTCUT","Brother knows a shortcut. +1 Nerve Token.",()=>render());return;}
 let type=p.name==="Dog"?"smell":p.name==="Neighbor"?"behavior":["sound","sight","smell","behavior"].find(t=>!p.evidence.includes(t));
 if(!type){p.nerve=Math.min(5,p.nerve+1);show("EAVESDROP","All clue categories known. +1 Nerve Token.",()=>render());return;}
 evidence(type);
 show(({Sister:"EAVESDROP",Dog:"SNIFF OUT",Neighbor:"NEIGHBOR GOSSIP"})[p.name],g.mystery.clues[type],()=>render());
}
function drawDrama(){
 if(modalOpen)return;
 const card=D.cards[rand(D.cards.length)];
 sound("paper_reveal");
 openModal(`<div class="eyebrow">A CARD FROM THE DECK</div><div class="card-stage"><div id="cardRotator" class="card-rotator"><div class="card-face card-back"><img src="assets/cardback.png" alt="Family Drama card back"></div><div class="card-face card-front"><div class="eyebrow">FAMILY DRAMA</div><h3>${escapeHTML(card.title)}</h3><p>${escapeHTML(card.text)}</p><div class="card-effect"><strong>CARD EFFECT</strong><p>${escapeHTML(effectDescription(card.kind))}</p></div></div></div></div><div class="options"><button id="playCardBtn" class="primary" disabled>PLAY CARD & APPLY EFFECT</button></div>`);
 const flip=()=>{const rot=$("cardRotator");if(rot)rot.classList.add("flipped");const btn=$("playCardBtn");if(btn)btn.disabled=false;};
 if(window.matchMedia("(prefers-reduced-motion: reduce)").matches)flip();else setTimeout(flip,450);
 $("playCardBtn").onclick=()=>{
  closeModal();apply(card.kind);
  if(g.heat>=6){meltdown();return;}
  if(card.kind[0]==="evidence")show(card.title,card.text+"\n\n"+g.mystery.clues[card.kind[1]]);
  else show(card.title,card.text+"\n\n"+effectDescription(card.kind));
 };
}
function accuse(){
 const buttons=D.mysteries.map(m=>`<button data-guess="${m.id}">${escapeHTML(m.title)}</button>`).join("");
 openModal(`<div class="eyebrow">THE FINAL ACCUSATION</div><h2>What is Dad doing?</h2><p>Choose carefully. A wrong accusation costs 5 points, one clue, and sends you back.</p><div class="options">${buttons}</div>`);
 $("modal").querySelectorAll("[data-guess]").forEach(btn=>btn.onclick=()=>{
  const guess=Number(btn.dataset.guess);closeModal();
  if(guess===g.mystery.id){score(12);g.phase="finished";show("MYSTERY SOLVED!",`${cur().name} was right! Dad was ${g.mystery.title.toLowerCase()}. +12 Detective Points!`,()=>{openModal(`<h2>THE MYSTERY IS SOLVED!</h2><p>${escapeHTML(cur().name)} wins with ${cur().score} Detective Points.</p><div class="options"><button id="restartWin" class="primary">PLAY AGAIN</button></div>`);$("restartWin").onclick=()=>{closeModal();reset();};});}
  else{score(-5);cur().evidence.shift();cur().position=33;show("WRONG ACCUSATION!","Not quite! −5 points, lose one clue category, and return to space 33.");}
 });
}
function cases(){
 openModal(`<div class="eyebrow">THE DETECTIVE'S NOTEBOOK</div><h2>Possible Basement Secrets</h2><p class="small-note">Use the clues you've collected to make your deduction.</p><div style="text-align:left;font-size:13px">${D.mysteries.map(m=>`<p><strong>${m.id}.</strong> ${escapeHTML(m.title)}</p>`).join("")}</div><div class="options"><button id="closeCases">CLOSE NOTEBOOK</button></div>`);
 $("closeCases").onclick=closeModal;
}
function rules(){
 openModal(`<div class="eyebrow">THE HOUSE RULES</div><h2>How to Play</h2><p style="text-align:left"><strong>1.</strong> Select 1–5 detectives and take turns on the same device.<br><br><strong>2.</strong> Roll a six-sided die to move. Spend Nerve Tokens to adjust movement by up to ±2 before rolling.<br><br><strong>3.</strong> Use each character's special ability once per round.<br><br><strong>4.</strong> Collect Sound, Sight, Smell and Behavior clues. New categories earn points and Nerve Tokens.<br><br><strong>5.</strong> Choose whether to take detours. Family Drama cards have immediate effects.<br><br><strong>6.</strong> At Heat 6, everyone loses points and retreats.<br><br><strong>7.</strong> Reach the basement with at least three clue categories and correctly identify Dad's secret to win. Wrong guesses cost points and evidence.</p><div class="options"><button id="closeRules">LET'S PLAY</button></div>`);
 $("closeRules").onclick=closeModal;
}
function reset(){g=null;$("game").hidden=true;$("setup").hidden=false;renderPicker();}
function renderPicker(){
 $("characterPicker").innerHTML=names.map(name=>`<button class="character ${selected.has(name)?"selected":""}" data-name="${name}" aria-pressed="${selected.has(name)}"><img src="assets/pawn-${name.toLowerCase()}.png" alt=""><span>${name}</span></button>`).join("");
 $("characterPicker").querySelectorAll("button").forEach(btn=>btn.onclick=()=>{
  const name=btn.dataset.name;if(selected.has(name)){if(selected.size>1)selected.delete(name);}else selected.add(name);renderPicker();
 });
}
$("startBtn").onclick=start;
$("rollBtn").onclick=roll;
$("abilityBtn").onclick=useAbility;
$("drawBtn").onclick=drawDrama;
$("minusBtn").onclick=()=>{if(g&&g.adjust>-2&&Math.abs(g.adjust-1)<=cur().nerve){g.adjust--;render();}};
$("plusBtn").onclick=()=>{if(g&&g.adjust<2&&Math.abs(g.adjust+1)<=cur().nerve){g.adjust++;render();}};
$("fitBtn").onclick=()=>setZoom(false);$("zoomBtn").onclick=()=>setZoom(true);
$("casesBtn").onclick=cases;$("rulesBtn").onclick=rules;
$("newGameBtn").onclick=()=>{if(confirm("Start a new game? Your current progress will be lost."))reset();};
$("soundToggle").onclick=()=>{soundOn=!soundOn;localStorage.setItem("dadSound",soundOn?"on":"off");$("soundToggle").textContent=soundOn?"♪ Sound On":"♪ Sound Off";};
$("soundToggle").textContent=soundOn?"♪ Sound On":"♪ Sound Off";
renderPicker();
})();
