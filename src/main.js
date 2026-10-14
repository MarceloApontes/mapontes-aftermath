// MAPONTES: AFTERMATH | primeira vertical slice, sem dependências do jogo antigo.
const B = window.BABYLON;
const canvas = document.querySelector('#game');
const ui = { status: document.querySelector('#status'), reticle: document.querySelector('#reticle'), banner: document.querySelector('#banner'), loading: document.querySelector('#loading') };
const engine = new B.Engine(canvas, true, { antialias: true, stencil: true });
const scene = new B.Scene(engine);
scene.clearColor = B.Color4.FromHexString('#93a4a8ff');
scene.collisionsEnabled = false; // física simplificada neste protótipo; colisões serão implementadas depois.
const camera = new B.FreeCamera('camera-tps',new B.Vector3(0,3,-7),scene);
camera.minZ = .08; camera.fov = .9; scene.activeCamera = camera;
const light = new B.HemisphericLight('luz-ambiente',new B.Vector3(0,1,0),scene);light.intensity=.9;
const sun = new B.DirectionalLight('sol',new B.Vector3(-.5,-1,.4),scene);sun.position=new B.Vector3(10,22,-10);sun.intensity=.85;
const mat = (name,hex)=>{const m=new B.StandardMaterial(name,scene);m.diffuseColor=B.Color3.FromHexString(hex);return m};
const groundMat=mat('asfalto','#666962'),walkMat=mat('calcada','#999b88'),wallMat=mat('predios','#aaa795'),roofMat=mat('telhados','#6c554b'),treeMat=mat('arvores','#546d4a'),stemMat=mat('troncos','#6f503c');
const floor=B.MeshBuilder.CreateGround('solo',{width:100,height:100},scene);floor.material=groundMat;
function block(name,x,z,w,d,h,material){const m=B.MeshBuilder.CreateBox(name,{width:w,depth:d,height:h},scene);m.position.set(x,h/2,z);m.material=material;return m;}
// Cidade cenográfica simples, com rua central, calçadas e prédios.
block('rua',0,0,12,80,.04,groundMat);
for(let i=0;i<6;i++)for(const side of [-1,1]){
 const z=-33+i*13,x=side*16;
 block(`casa-${side}-${i}`,x,z,8,8,4+(i%2),wallMat);
 const r=block('telhado',x,z,8.5,8.5,.3,roofMat);r.position.y=4+(i%2)+.15;
 block('calcada',side*8, z,2,11,.08,walkMat);
 const trunk=B.MeshBuilder.CreateCylinder('arvore',{height:2,diameter:.38},scene);trunk.position.set(side*10,1,z+5);trunk.material=stemMat;
 const leaves=B.MeshBuilder.CreateSphere('copa',{diameter:2.4},scene);leaves.position.set(side*10,2.7,z+5);leaves.material=treeMat;
}
const player={hp:100,pos:new B.Vector3(0,0,-7),model:null,anims:null,state:'idle',dead:false};
const enemies=[];const keys=new Set();let yaw=0,pitch=.12,aim=false,shotCooldown=0,attackFlash=0;
let clickTimer=null,lastClickAt=0;const DOUBLE_CLICK_MS=260;
const vlerp=(a,b,t)=>B.Vector3.Lerp(a,b,t);
const clamp=(n,a,b)=>Math.min(b,Math.max(a,n));
// GLBs com animações nomeadas pelo Tripo. Evitamos pressupor nomes de ossos.
function findAnimation(groups,terms){return groups.find(g=>terms.some(t=>g.name.toLowerCase().includes(t)))||null;}
async function loadActor(filename,pos,scale=1){
 const result=await B.SceneLoader.ImportMeshAsync('','./assets/characters/',filename,scene);
 const root=new B.TransformNode('ator-'+filename,scene);
 const roots=result.meshes.filter(m=>!m.parent);
 roots.forEach(m=>m.parent=root);
 root.position.copyFrom(pos);root.scaling.setAll(scale);
 // Desabilitar clips carregados até iniciar a animação escolhida.
 result.animationGroups.forEach(g=>g.stop());
 const groups=result.animationGroups;
 return {root,groups,active:null,body:result.meshes};
}
function animate(actor,type,once=false){
 if(!actor)return;
 const picks={
  idle:['ficar parado em pé','standing pose','look_around','standing glance'],
  walk:['walk.','andar pra frente'],
  run:['run.','correr.'],
  punch:['box_','hit_to_body'],
  kick:['front_kick','chute_frontal'],
  death:['realistic third-person video game death','death animation']
 };
 const now=performance.now();
 if(type!=='death' && actor.lockUntil && now<actor.lockUntil && type!=='punch' && type!=='kick')return;
 const group=findAnimation(actor.groups,picks[type]||picks.idle);
 if(!group || (actor.active===group && !once && group.isPlaying))return;
 actor.groups.forEach(g=>g.stop());
 actor.active=group;
 if(type==='death')actor.lockUntil=Infinity;
 else if(type==='punch')actor.lockUntil=now+620;
 else if(type==='kick')actor.lockUntil=now+850;
 else actor.lockUntil=0;
 group.start(!once,1,group.from,group.to,false);
}
function say(message,ms=2300){ui.banner.textContent=message;ui.banner.style.display='block';clearTimeout(say.timer);say.timer=setTimeout(()=>ui.banner.style.display='none',ms);}
function inBounds(p){p.x=clamp(p.x,-6,6);p.z=clamp(p.z,-39,39);}
function spinTo(root,direction,dt){const ang=Math.atan2(direction.x,direction.z);let delta=Math.atan2(Math.sin(ang-root.rotation.y),Math.cos(ang-root.rotation.y));root.rotation.y+=delta*clamp(dt*11,0,1);}
function aliveEnemy(e){return e.hp>0;}
async function start(){
 try{
  const actor=await loadActor('antonio.glb',player.pos);player.model=actor;animate(actor,'idle');
  for(const [file,name,x,z] of [['joao.glb','João',3,12],['maria.glb','Maria',-3,22]]){
   const model=await loadActor(file,new B.Vector3(x,0,z));
   const e={name,model,pos:new B.Vector3(x,0,z),origin:new B.Vector3(x,0,z),hp:100,phase:Math.random()*6,attackTime:0,hitTime:0};
   enemies.push(e);animate(model,'idle');
  }
  ui.loading.style.display='none';say('Bem-vindo ao Condomínio!\nJoão e Maria estão patrulhando.',3500);
 }catch(err){ui.loading.innerHTML=`<div id="error">Erro ao carregar os GLBs.<p>${String(err.message||err)}</p><p>Abra por um servidor HTTP local, não pelo arquivo file://.</p></div>`;console.error(err);}
}
canvas.addEventListener('contextmenu',e=>e.preventDefault());
window.addEventListener('keydown',e=>{if(['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code))e.preventDefault();keys.add(e.code);if(e.code==='KeyR')location.reload();});
window.addEventListener('keyup',e=>keys.delete(e.code));
window.addEventListener('blur',()=>{keys.clear();aim=false;});
canvas.addEventListener('pointerdown',e=>{
 if(e.button===2){aim=true;return;}
 if(e.button!==0)return;
 if(document.pointerLockElement!==canvas)canvas.requestPointerLock?.();
 const now=performance.now();
 if(clickTimer && now-lastClickAt<=DOUBLE_CLICK_MS){
  clearTimeout(clickTimer);clickTimer=null;lastClickAt=0;attack('kick');
 } else {
  if(clickTimer)clearTimeout(clickTimer);
  lastClickAt=now;
  clickTimer=setTimeout(()=>{clickTimer=null;attack('punch');},DOUBLE_CLICK_MS);
 }
});
window.addEventListener('pointerup',e=>{if(e.button===2)aim=false;});
window.addEventListener('mousemove',e=>{if(document.pointerLockElement!==canvas)return;yaw-=e.movementX*.0025;pitch=clamp(pitch+e.movementY*.002,-.4,.7);});
function attack(kind='punch'){
 if(!player.model||player.dead||shotCooldown>0)return;
 shotCooldown=kind==='kick'?.8:.52;
 attackFlash=kind==='kick'?.85:.65;
 animate(player.model,kind,true);
 const forward=new B.Vector3(Math.sin(yaw),0,Math.cos(yaw));
 let chosen=null,best=Infinity;
 for(const e of enemies){
  if(!aliveEnemy(e))continue;
  const toward=e.pos.subtract(player.pos);
  const distance=toward.length();
  if(distance> (kind==='kick'?2.65:2.25) || distance<.01)continue;
  const facing=B.Vector3.Dot(toward.scale(1/distance),forward);
  if(facing<.28)continue;
  if(distance<best){chosen=e;best=distance;}
 }
 if(chosen){
  chosen.hp-=kind==='kick'?45:25;chosen.hitTime=.28;
  say(`${kind==='kick'?'Chute':'Soco'} em ${chosen.name}!`,650);
  if(chosen.hp<=0){
   animate(chosen.model,'death',true);
   say(`${chosen.name} derrotad${chosen.name==='Maria'?'a':'o'}!`,1500);
  }
 }
}
function update(dt){if(!player.model)return;
 shotCooldown=Math.max(0,shotCooldown-dt);attackFlash=Math.max(0,attackFlash-dt);
 const f=new B.Vector3(Math.sin(yaw),0,Math.cos(yaw));const r=new B.Vector3(Math.cos(yaw),0,-Math.sin(yaw));
 const x=Number(keys.has('KeyD'))-Number(keys.has('KeyA'));const z=Number(keys.has('KeyW'))-Number(keys.has('KeyS'));
 const move=f.scale(z).add(r.scale(x));const moving=move.lengthSquared()>.001;
 if(!player.dead){
  if(moving){move.normalize();const running=keys.has('ShiftLeft')||keys.has('ShiftRight');player.pos.addInPlace(move.scale((running?6.1:3.2)*dt));inBounds(player.pos);spinTo(player.model.root,f,dt);if(attackFlash<=0)animate(player.model,running?'run':'walk');}
  else {spinTo(player.model.root,f,dt);if(attackFlash<=0)animate(player.model,'idle');}
 }
 player.model.root.position.copyFrom(player.pos);
 for(const e of enemies){if(!aliveEnemy(e))continue;
  e.phase+=dt;e.attackTime=Math.max(0,e.attackTime-dt);
  const toward=player.pos.subtract(e.pos);const distance=toward.length();let direction=null;
  if(distance<12&&!player.dead){if(distance>1.65)direction=toward.normalize();else if(e.attackTime===0){e.attackTime=1.3;animate(e.model,'attack',true);player.hp=Math.max(0,player.hp-8);if(player.hp===0){player.dead=true;animate(player.model,'death',true);say('Antônio foi derrotado. Pressione R para reiniciar.',6500);}}}
  else {const target=e.origin.add(new B.Vector3(Math.sin(e.phase*.5)*2,0,Math.cos(e.phase*.5)*2));const delta=target.subtract(e.pos);if(delta.length()>.35)direction=delta.normalize();}
  if(direction){e.pos.addInPlace(direction.scale((distance<12?2.6:1.05)*dt));inBounds(e.pos);spinTo(e.model.root,direction,dt);if(e.attackTime===0)animate(e.model,distance<12?'run':'walk');}else if(e.attackTime===0)animate(e.model,'idle');
  e.model.root.position.copyFrom(e.pos);
 }
 // Câmera suavizada: mais afastada ao explorar; próxima ao ombro ao mirar.
 const viewDist=aim?2.15:3.15, height=aim?1.58:1.85,shoulder=aim?.62:0;
 const desired=player.pos.subtract(f.scale(viewDist)).add(r.scale(shoulder)).add(new B.Vector3(0,height+Math.sin(pitch)*viewDist*.45,0));
 camera.position.copyFrom(vlerp(camera.position,desired,clamp(dt*12,0,1)));
 const target=player.pos.add(f.scale(aim?3.8:1.5)).add(r.scale(aim?.42:0)).add(new B.Vector3(0,1.42-Math.sin(pitch)*2,0));
 camera.setTarget(target);
 camera.fov+=( (aim?.65:.9)-camera.fov)*clamp(dt*10,0,1);
 ui.reticle.style.display=aim?'block':'none';
 ui.status.innerHTML=`<strong>ANTÔNIO</strong> · Vida: ${player.hp}/100<br>João: ${Math.max(0,enemies[0]?.hp??100)} HP · Maria: ${Math.max(0,enemies[1]?.hp??100)} HP<br>Modo: ${aim?'MIRA SOBRE O OMBRO':'EXPLORAÇÃO'} · ${player.dead?'DERROTADO':'SOBREVIVENDO'}`;
}
let last=performance.now();engine.runRenderLoop(()=>{const now=performance.now(),dt=Math.min((now-last)/1000,.05);last=now;update(dt);scene.render()});window.addEventListener('resize',()=>engine.resize());start();
