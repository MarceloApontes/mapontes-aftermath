// MAPONTES AFTERMATH - ETAPA 024: assets externos GitHub Pages, texturas, música e sombras.
// GLBs carregados do repositório público. Não altera o GitHub.
// MAPONTES: AFTERMATH | primeira vertical slice, sem dependências do jogo antigo.
export const createScene = async function () {
const B = BABYLON;
const canvas = engine.getRenderingCanvas();
// HUD exclusivo do Playground: não depende de index.html.
const hud = document.createElement('div');
hud.style.cssText='position:fixed;inset:0;pointer-events:none;z-index:20;color:white;font:14px Arial,sans-serif';
hud.innerHTML = `<div style="position:absolute;top:12px;left:12px;background:#131a1cdb;padding:10px;border-radius:8px"><b>MAPONTES: AFTERMATH</b><div>ETAPA 024 | Corrige escala gigante e desativa malhas originais</div></div><div id="af-status" style="position:absolute;bottom:15px;left:12px;background:#131a1cdb;padding:12px;border-radius:8px">Carregando...</div><div id="af-banner" style="display:none;position:absolute;top:12%;left:50%;transform:translateX(-50%);background:#131a1ce8;padding:10px;border-radius:8px"></div><div id="af-reticle" style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);font-size:28px;color:#fff;text-shadow:1px 1px 3px #000,0 0 5px #000;transition:color .08s">+</div><div id="af-loading" style="position:absolute;top:40%;left:40%;background:#131a1cde;padding:15px;border-radius:8px">Carregando GLBs...</div>`;
document.body.appendChild(hud);
const ui={status:hud.querySelector('#af-status'),reticle:hud.querySelector('#af-reticle'),banner:hud.querySelector('#af-banner'),loading:hud.querySelector('#af-loading')};
const scene = new B.Scene(engine);
scene.clearColor = B.Color4.FromHexString('#93a4a8ff');
scene.collisionsEnabled = false; // física simplificada neste protótipo; colisões serão implementadas depois.
const camera = new B.FreeCamera('camera-tps',new B.Vector3(0,3,-7),scene);
camera.minZ = .08; camera.fov = .9; scene.activeCamera = camera;
const light = new B.HemisphericLight('luz-ambiente',new B.Vector3(0,1,0),scene);light.intensity=.9;
const sun = new B.DirectionalLight('sol',new B.Vector3(-.5,-1,.4),scene);sun.position=new B.Vector3(10,22,-10);sun.intensity=.85;
const mat = (name,hex)=>{const m=new B.StandardMaterial(name,scene);m.diffuseColor=B.Color3.FromHexString(hex);return m};
const ASSETS='https://marceloapontes.github.io/mapontes-aftermath/assets/';
const PANORAMA_360=ASSETS+'backgrounds/mapa1-panorama-cidade-alta.jpg';
// Quanto maior o valor, mais a cidade sobe no fundo. Ajuste pelas teclas [ e ].
function textured(name,file,tileU,tileV){
 const m=new B.StandardMaterial(name,scene);
 const tex=new B.Texture(ASSETS+'textures/'+file,scene,false,false);
 tex.uScale=tileU;tex.vScale=tileV;
 m.diffuseTexture=tex;
 tex.onError=(message)=>console.warn('[AFTERMATH] Falha ao carregar textura:',file,message);
 return m;
}
const groundMat=textured('asfalto','asfalto.jpg',16,16),
 walkMat=textured('calcada','calcada.jpg',1,4),
 wallMat=textured('predios','paredes.jpg',2,1.5),
 roofMat=mat('telhados','#6c554b'),treeMat=mat('arvores','#546d4a'),stemMat=mat('troncos','#6f503c');
// Sombras simples e leves para o protótipo de navegador.
const shadows=new B.ShadowGenerator(1024,sun);
shadows.usePercentageCloserFiltering=true;
shadows.filteringQuality=B.ShadowGenerator.QUALITY_LOW;
shadows.bias=.0005;shadows.normalBias=.025;
sun.shadowMinZ=1;sun.shadowMaxZ=65;
function castShadow(mesh){shadows.addShadowCaster(mesh,true);return mesh;}
// Músicas são iniciadas somente após interação do usuário (política dos navegadores).
const music=new Audio(ASSETS+'audio/the-stand-at-mapontes.mp3');
music.loop=true;music.preload='auto';music.volume=.05;
const menuMusic=new Audio(ASSETS+'audio/apartment-b.mp3?v=008');
menuMusic.loop=true;menuMusic.preload='auto';menuMusic.volume=.05;
let musicVolume=5,musicMuted=false,musicStarted=false;
menuMusic.addEventListener('error',()=>console.error('[AFTERMATH] Erro ao abrir musica do menu:',menuMusic.currentSrc||menuMusic.src,'codigo:',menuMusic.error?.code));
menuMusic.addEventListener('canplay',()=>console.info('[AFTERMATH] Musica do menu carregada:',menuMusic.currentSrc));
function playAudio(track){
 // Reexecuta play dentro do evento real da tecla P ou do clique.
 if(track.error){console.error('[AFTERMATH] MP3 indisponivel',track.currentSrc||track.src,'codigo',track.error.code);return;}
 const result=track.play();
 if(result?.catch)result.catch(e=>console.warn('[AFTERMATH] Musica nao iniciou:',track.currentSrc||track.src,e.name,e.message));
}
function syncMusic(){music.volume=musicVolume/100;menuMusic.volume=musicVolume/100;music.muted=musicMuted;menuMusic.muted=musicMuted;}
function switchMusic(){
 if(paused){music.pause();if(!musicMuted)playAudio(menuMusic);}
 else{menuMusic.pause();menuMusic.currentTime=0;if(!musicMuted)playAudio(music);}
}

music.addEventListener('error',()=>console.warn('[AFTERMATH] Música indisponível: verifique upload em assets/audio/'));
function unlockMusic(){if(musicStarted)return;musicStarted=true;if(!paused&&!musicMuted)playAudio(music);}

scene.clearColor = new B.Color4(0.73,0.81,0.88,1);
let photoDome=null;
try{
 photoDome=new B.PhotoDome('aftermath-dome',PANORAMA_360,{resolution:32,size:800,useDirectMapping:false},scene);
 photoDome.mesh.rotation.y=Math.PI;
 // ETAPA 024: imagem corrigida na origem. Sem deslocamento UV ou clamp.
 console.info('[AFTERMATH] Panorama carregado:',PANORAMA_360);
}catch(err){
 console.warn('[AFTERMATH] Falha ao criar panorama 360:',err.message||err);
}
const floor=B.MeshBuilder.CreateGround('solo',{width:100,height:100},scene);floor.material=groundMat;floor.receiveShadows=true;
function block(name,x,z,w,d,h,material){const m=B.MeshBuilder.CreateBox(name,{width:w,depth:d,height:h},scene);m.position.set(x,h/2,z);m.material=material;m.receiveShadows=true;if(name.startsWith('casa-'))castShadow(m);return m;}
const arvoresSubstituir=[];
// Cidade cenográfica simples, com rua central, calçadas e prédios.
block('rua',0,0,12,80,.04,groundMat);
for(let i=0;i<6;i++)for(const side of [-1,1]){
 const z=-33+i*13,x=side*16;
 block(`casa-${side}-${i}`,x,z,8,8,4+(i%2),wallMat);
 const r=block('telhado',x,z,8.5,8.5,.3,roofMat);r.position.y=4+(i%2)+.15;
 block('calcada',side*8, z,2,11,.08,walkMat);
 // Cada posição anterior agora recebe uma árvore GLB selecionada aleatoriamente.
 arvoresSubstituir.push({position:new B.Vector3(side*10,0,z+5),index:i});

}
const healthMarker=document.createElement('div');
healthMarker.style.cssText='position:fixed;left:0;top:0;width:112px;transform:translate(-50%,-100%);z-index:30;display:none;pointer-events:none;text-align:center;font:12px Arial;color:white;text-shadow:1px 1px 2px #000';
healthMarker.innerHTML='<div id="af-enemy-name" style="margin-bottom:3px"></div><div style="height:10px;background:#330b0b;border:1px solid #1d0909;border-radius:5px;overflow:hidden"><div id="af-enemy-life" style="height:100%;width:100%;background:#de4848"></div></div>';
document.body.appendChild(healthMarker);
const healthBar=healthMarker.querySelector('#af-enemy-life'),healthName=healthMarker.querySelector('#af-enemy-name');
function projectOverlay(position){
 const viewport=camera.viewport.toGlobal(engine.getRenderWidth(),engine.getRenderHeight());
 const p=B.Vector3.Project(position,B.Matrix.Identity(),scene.getTransformMatrix(),viewport);
 if(p.z<=0 || p.z>=1)return null;
 const rect=canvas.getBoundingClientRect();
 return {x:rect.left+p.x*rect.width/engine.getRenderWidth(),y:rect.top+p.y*rect.height/engine.getRenderHeight()};
}
// Sons externos: primeiro envie os seis MP3 para assets/audio/footsteps/ no GitHub.
const punchAudio=new Audio(ASSETS+'audio/effects/punch.wav');
punchAudio.preload='auto';
function playPunchSound(){const a=punchAudio.cloneNode();a.volume=.576;a.play().catch(err=>console.debug('[AFTERMATH] Som de soco aguardando interação ou arquivo:',err.message));a.addEventListener('ended',()=>{a.removeAttribute('src');a.load();},{once:true});}
// Vozes de morte externas, sorteadas uma vez por morte.
const deathSounds={
 antonio:['antonio-dead-01.mp3','antonio-dead-02.mp3'],
 joao:['joao-dead-01.mp3','joao-dead-02.mp3'],
 maria:['maria-dead-01.mp3','maria-dead-02.mp3']
};
const deathVoices=[];
function playDeathVoice(who){
 const files=deathSounds[who];if(!files)return;
 const path=files[Math.floor(Math.random()*files.length)];
 const audio=new Audio(ASSETS+'audio/deaths/'+path);
 audio.volume=.7;deathVoices.push(audio);
 audio.play().catch(err=>console.warn('[AFTERMATH] voz de morte',path,err.message));
 audio.addEventListener('ended',()=>{deathVoices.splice(deathVoices.indexOf(audio),1);audio.src='';},{once:true});
}
const stepSounds=Array.from({length:6},(_,i)=>{
 const a=new Audio(ASSETS+'audio/footsteps/passo-'+String(i+1).padStart(2,'0')+'.mp3');
 a.preload='auto';
 return a;
});
let stepCursor=0;
function footstep(actor,dt,moving,running,distanceToListener=0){
 if(!actor || paused || actor.dead || !moving){if(actor)actor.stepElapsed=0;return;}
 actor.stepElapsed=(actor.stepElapsed||0)+dt;
 const cadence=running?.255:.41;
 if(actor.stepElapsed<cadence)return;
 actor.stepElapsed%=cadence;
 const base=distanceToListener===0?.276:.204;
 const falloff=distanceToListener===0?1:Math.max(0,1-distanceToListener/18);
 if(falloff<=0)return;
 // Pool de áudio: clona uma das seis variantes para permitir passos sobrepostos.
 const source=stepSounds[stepCursor++%stepSounds.length];
 const sound=source.cloneNode();
 sound.volume=Math.min(1,base*falloff*(running?1.12:.82));
 sound.playbackRate=running?1.1:1;
 sound.play().catch(()=>{});
 sound.addEventListener('ended',()=>{sound.src='';},{once:true});
}
const player={hp:100,pos:new B.Vector3(0,0,-7),model:null,anims:null,state:'idle',dead:false};
const enemies=[];const keys=new Set();let yaw=0,pitch=0,aim=false,shotCooldown=0,attackFlash=0;
let clickTimer=null,lastClickAt=0;const DOUBLE_CLICK_MS=250;
let debugLast=0;
let paused=false;let targetEnemy=null;
const menu=document.createElement("div");
menu.id="af-pause-menu";
menu.style.cssText="position:fixed;inset:0;z-index:60;display:none;align-items:center;justify-content:center;background:rgba(7,12,16,.72);color:white;font:18px Arial,sans-serif;pointer-events:auto";
menu.innerHTML=`<section style="padding:35px 48px;min-width:260px;background:#182124;border:1px solid #536163;border-radius:14px;text-align:center;box-shadow:0 15px 70px #0009"><h2 style="font-size:23px;color:#f5cf6a;margin:0 0 25px">MAPONTES: AFTERMATH</h2><button id="af-continue" style="cursor:pointer;background:#dfc05a;border:0;border-radius:8px;padding:14px;display:block;width:100%;font-weight:bold;margin-bottom:14px">CONTINUAR</button><button id="af-restart" style="cursor:pointer;background:#34484b;border:1px solid #637578;border-radius:8px;color:white;padding:14px;display:block;width:100%;font-weight:bold">RECOMEÇAR</button><div style="text-align:left;margin-top:22px;font-size:13px"><label for="af-music-volume">VOLUME DAS MÚSICAS: <span id="af-volume-label">5%</span></label><input id="af-music-volume" type="range" min="0" max="100" value="5" style="width:100%;accent-color:#dfc05a;margin:12px 0"><label style="display:flex;align-items:center;gap:9px;cursor:pointer"><input id="af-music-mute" type="checkbox"> Silenciar música</label></div></section>`;
document.body.appendChild(menu);
const volumeSlider=menu.querySelector('#af-music-volume'),muteCheckbox=menu.querySelector('#af-music-mute'),volumeLabel=menu.querySelector('#af-volume-label');
volumeSlider.addEventListener('input',()=>{musicVolume=Number(volumeSlider.value);volumeLabel.textContent=musicVolume+'%';syncMusic();unlockMusic();});
muteCheckbox.addEventListener('change',()=>{musicMuted=muteCheckbox.checked;syncMusic();if(musicMuted){music.pause();menuMusic.pause();}else {unlockMusic();switchMusic();}});
function togglePause(force){paused=typeof force==='boolean'?force:!paused;menu.style.display=paused?'flex':'none';if(paused){keys.clear();aim=false;document.exitPointerLock?.();}switchMusic();}
menu.querySelector("#af-continue").addEventListener("click",()=>{togglePause(false);canvas.requestPointerLock?.();});
menu.querySelector("#af-restart").addEventListener("click",()=>{resetGame();togglePause(false);canvas.requestPointerLock?.();});
const vlerp=(a,b,t)=>B.Vector3.Lerp(a,b,t);
const clamp=(n,a,b)=>Math.min(b,Math.max(a,n));
// GLBs com animações nomeadas pelo Tripo. Evitamos pressupor nomes de ossos.
function findAnimation(groups,terms){
 // Busca clipes compatíveis com o GLB mantendo run.001 na corrida.
 for(const term of terms){const exact=groups.find(g=>g.name.toLowerCase().includes(term.toLowerCase()));if(exact)return exact;}
 return null;
}
// Importação modular: só substitui as árvores antigas após confirmar o GLB.
async function substituirArvoresGLB(){
 const nomes=['elm_trees.glb','tree_with_grass_.glb','coconut_tree.glb'];
 const raizes=['tree.003_4','tree_1','coconutTree.obj.cleaner.materialmerger.gles'];
 const alturaAlvo=[5.8,4.8,6.2];
 const MAX_DIM=9.5;
 let seed=1979;
 const rand=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
 const locais=arvoresSubstituir.map((p,i)=>({...p,tipo:i<3?i:Math.floor(rand()*3)}));
 const meshesDe=(node)=>node.getChildMeshes(false).filter(m=>m.getTotalVertices()>0);
 function bounds(meshes){
  let min=new B.Vector3(Infinity,Infinity,Infinity),max=new B.Vector3(-Infinity,-Infinity,-Infinity);
  for(const m of meshes){m.computeWorldMatrix(true);const bb=m.getBoundingInfo().boundingBox;
   min=B.Vector3.Minimize(min,bb.minimumWorld);max=B.Vector3.Maximize(max,bb.maximumWorld);}
  return {min,max,dim:max.subtract(min)};
 }
 let total=0;
 for(let tipo=0;tipo<nomes.length;tipo++){
  const spots=locais.filter(p=>p.tipo===tipo);
  if(!spots.length)continue;
  let imported;
  try{
   imported=await B.SceneLoader.ImportMeshAsync('',ASSETS+'trees/',nomes[tipo],scene);
   const selected=imported.transformNodes.find(n=>n.name===raizes[tipo]);
   if(!selected)throw Error('Nó não encontrado: '+raizes[tipo]);
   // IMPORTANTE: o pivot do arquivo pode ter ancestrais escalados. Ao soltar
   // a árvore, preservamos a transformação mundial antes de clonar.
   selected.computeWorldMatrix(true);
   selected.setParent(null);
   selected.computeWorldMatrix(true);
   const origMeshes=meshesDe(selected);
   if(!origMeshes.length)throw Error('Nó da árvore sem malhas');
   const orig=bounds(origMeshes);
   const largest=Math.max(...orig.dim.asArray());
   if(!Number.isFinite(largest)||largest<=0)throw Error('Dimensões inválidas');
   const fac=alturaAlvo[tipo]/largest;
   console.info('[AFTERMATH] MODELO ORIGINAL',nomes[tipo], 'nó',raizes[tipo],'bounds',orig.dim.asArray(),'fator',fac);
   // Mantém fonte sem renderização; as cópias terão materiais e geometria compartilhados.
   for(let i=0;i<spots.length;i++){
    const spot=spots[i];
    const pivot=new B.TransformNode('arvore020-pivot-'+tipo+'-'+i,scene);
    const copy=selected.clone('arvore020-'+tipo+'-'+i,pivot,false);
    if(!copy)throw Error('clone falhou');
    pivot.rotation.y=rand()*Math.PI*2;
    pivot.scaling.setAll(fac*(.9+.2*rand()));
    pivot.position.copyFrom(spot.position);
    const visible=meshesDe(copy);
    if(!visible.length)throw Error('clone sem malha');
    for(const m of visible){m.setEnabled(true);m.isVisible=true;m.visibility=1;m.isPickable=false;m.receiveShadows=true;}
    let bb=bounds(visible);
    const size=Math.max(...bb.dim.asArray());
    // Proteção efetiva contra o tronco gigante: mede o clone DEPOIS da hierarquia.
    if(size>MAX_DIM){const correction=MAX_DIM/size;pivot.scaling.scaleInPlace(correction);bb=bounds(visible);}
    const mid=bb.min.add(bb.max).scale(.5);
    pivot.position.x+=spot.position.x-mid.x;
    pivot.position.z+=spot.position.z-mid.z;
    pivot.position.y+=spot.position.y-bb.min.y+.04;
    bb=bounds(visible);
    console.info('[AFTERMATH] ÁRVORE 020',nomes[tipo],i,'min',bb.min.asArray(),'max',bb.max.asArray(),'dim',bb.dim.asArray());
    total++;
   }
   // Não deixe NENHUMA malha original renderizável na cena.
   for(const mesh of imported.meshes){mesh.setEnabled(false);mesh.isVisible=false;}
   for(const node of imported.transformNodes){node.setEnabled(false);}
   console.info('[AFTERMATH] FONTE DESLIGADA',nomes[tipo],'instâncias',spots.length);
  }catch(err){
   console.error('[AFTERMATH] ERRO ÁRVORE 020',nomes[tipo],err);
   if(imported){for(const m of imported.meshes){m.setEnabled(false);m.isVisible=false;}}
   // fallback pequeno indica posição sem comprometer cenário
   for(const p of spots){const t=B.MeshBuilder.CreateCylinder('tronco-fallback',{height:2,diameter:.25},scene);t.position.copyFrom(p.position.add(new B.Vector3(0,1,0)));t.material=stemMat;
    const crown=B.MeshBuilder.CreateSphere('copa-fallback',{diameter:1.7},scene);crown.position.copyFrom(p.position.add(new B.Vector3(0,2.6,0)));crown.material=treeMat;}
  }
 }
 console.info('[AFTERMATH] ETAPA 024 árvores instanciadas:',total);
}
// Cada NPC recebe cópia dos materiais, para alterar roupa sem afetar outros personagens.
function colorirNpc(actor,variant){
 if(!variant)return;
 const tint=variant % 3===1?new B.Color3(.72,.83,.98):variant % 3===2?new B.Color3(.96,.75,.65):new B.Color3(.67,.88,.72);
 for(const mesh of actor.body){
  if(!(mesh instanceof B.Mesh)||!mesh.material)continue;
  const original=mesh.material;
  const material=original.clone(original.name+'-npc-'+variant+'-'+mesh.uniqueId);
  if(material.albedoColor)material.albedoColor=material.albedoColor.multiply(tint);
  else if(material.diffuseColor)material.diffuseColor=material.diffuseColor.multiply(tint);
  mesh.material=material;
 }
}
function sorteioPosicoes(){
 // Spawn afastado do Antônio e sem sobreposição inicial entre NPCs.
 const result=[];let seed=150015;const rnd=()=>{seed=(1664525*seed+1013904223)>>>0;return seed/4294967296;};
 for(let n=0;n<8;n++){
  let point,attempts=0;
  do{point=new B.Vector3(-4.8+rnd()*9.6,0,-34+rnd()*69);attempts++;}
  while(attempts<80&&(point.subtract(player.pos).length()<9||result.some(p=>p.subtract(point).length()<5)));
  result.push(point);
 }
 return result;
}
async function loadActor(filename,pos,scale=1){
 const result=await B.SceneLoader.ImportMeshAsync('','https://marceloapontes.github.io/mapontes-aftermath/assets/characters/',filename,scene);
 const root=new B.TransformNode('ator-'+filename,scene);
 const roots=result.meshes.filter(m=>!m.parent);
 roots.forEach(m=>m.parent=root);
 result.meshes.forEach(mesh=>{if(mesh instanceof B.AbstractMesh && mesh.getTotalVertices()>0){castShadow(mesh);mesh.receiveShadows=true;}});
 root.position.copyFrom(pos);root.scaling.setAll(scale);
 // Desabilitar clips carregados até iniciar a animação escolhida.
 result.animationGroups.forEach(g=>g.stop());
 const groups=result.animationGroups;
 console.info('[AFTERMATH] GLB carregado',filename,'clips:',groups.map(g=>g.name));
 const actor={root,groups,active:null,body:result.meshes,name:filename,dead:false,lockUntil:0};createContactShadow(actor);syncContactShadow(actor,pos);return actor;
}
// Todos os nomes foram conferidos diretamente nos arquivos GLB fornecidos.
const CLIPS={
 idle:['ficar parado em pé','standing pose','look_around','angry_02','greet_01'],
 walk:['walk.001','andar pra frente.001'],
 run:['run.001','run.','run'],
 punch:['box_01.001','box_03.001','hit_to_body_01.001'],
 kick:['front_kick_01.001','box_03.001','hit_to_body_01.001'],
 hit:['hit_to_body_01.001','afraid.001','fall.001'],
 death:['realistic third-person video game death animation','fall.001']
};
function animate(actor,type,once=false){
 if(!actor)return;
 const now=performance.now();
 if(actor.dead && type!=='death')return;
 if((type==='idle'||type==='walk'||type==='run') && now<(actor.lockUntil||0))return;
 const group=findAnimation(actor.groups,CLIPS[type]||CLIPS.idle);
 if(!group){if(!actor.missing?.has(type)){(actor.missing??=new Set()).add(type);console.warn('[AFTERMATH] animação ausente',actor.name,type,actor.groups.map(g=>g.name));}return;}
 if(actor.active===group && group.isPlaying && !once)return;
 const previous=actor.active;
 const locomotion=['idle','walk','run'];
 const blend=previous && previous!==group && locomotion.includes(actor.motionType) && locomotion.includes(type);
 // Sobreposição ponderada por 0,22 segundo para não dar trancos andando->correndo.
 if(actor.transition?.previous && actor.transition.previous!==previous)actor.transition.previous.stop();
 for(const g of actor.groups)if(g!==group && g!==previous)g.stop();
 if(!blend && previous && previous!==group)previous.stop();
 actor.active=group;actor.motionType=type;
 if(type==='death'){actor.dead=true;actor.lockUntil=Infinity;}
 else if(type==='punch'||type==='kick')actor.lockUntil=now+(type==='kick'?900:650);
 else if(type==='hit')actor.lockUntil=now+580;
 else actor.lockUntil=0;
 if(!group.isPlaying || once)group.start(!once,1,group.from,group.to,false);
 group.speedRatio=type==='run'?1.07:1;
 if(blend){
  group.setWeightForAllAnimatables(0);
  previous.setWeightForAllAnimatables(1);
  actor.transition={previous,next:group,elapsed:0,duration:.22};
 }else{group.setWeightForAllAnimatables(1);actor.transition=null;}
 if(actor.lastLog!==type){console.info('[AFTERMATH] ANIMAÇÃO',actor.name,type,group.name);actor.lastLog=type;}
}
function updateAnimationBlend(actor,dt){
 const t=actor?.transition;if(!t)return;
 t.elapsed+=dt;const k=Math.min(1,t.elapsed/t.duration);
 t.previous.setWeightForAllAnimatables(1-k);
 t.next.setWeightForAllAnimatables(k);
 if(k>=1){t.previous.stop();t.next.setWeightForAllAnimatables(1);actor.transition=null;}
}
function say(message,ms=2300){ui.banner.textContent=message;ui.banner.style.display='block';clearTimeout(say.timer);say.timer=setTimeout(()=>ui.banner.style.display='none',ms);}
function inBounds(p){p.x=clamp(p.x,-6,6);p.z=clamp(p.z,-39,39);}
function spinTo(root,direction,dt){const ang=Math.atan2(direction.x,direction.z);let delta=Math.atan2(Math.sin(ang-root.rotation.y),Math.cos(ang-root.rotation.y));root.rotation.y+=delta*clamp(dt*11,0,1);}
function aliveEnemy(e){return e.hp>0;}
// Sombra de contato sutil, independente de compatibilidade das malhas skinned com sombras reais.
const contactTex=new B.DynamicTexture('sombra-contato-textura',{width:128,height:128},scene,false);
const contactCtx=contactTex.getContext();
const gradient=contactCtx.createRadialGradient(64,64,3,64,64,63);
gradient.addColorStop(0,'rgba(0,0,0,.47)');gradient.addColorStop(.55,'rgba(0,0,0,.23)');gradient.addColorStop(1,'rgba(0,0,0,0)');
contactCtx.fillStyle=gradient;contactCtx.fillRect(0,0,128,128);contactTex.update();
const contactMat=new B.StandardMaterial('sombra-contato',scene);contactMat.diffuseTexture=contactTex;
contactMat.opacityTexture=contactTex;contactMat.useAlphaFromDiffuseTexture=true;
contactMat.disableLighting=true;contactMat.specularColor=B.Color3.Black();contactMat.backFaceCulling=false;
function createContactShadow(actor){
 const shadow=B.MeshBuilder.CreateGround('sombra-pes-'+actor.name,{width:1.25,height:.85},scene);
 shadow.material=contactMat;shadow.position.y=.092;shadow.isPickable=false;shadow.receiveShadows=false;
 actor.contactShadow=shadow;
}
function syncContactShadow(actor,position){if(actor?.contactShadow){actor.contactShadow.position.x=position.x;actor.contactShadow.position.z=position.z;actor.contactShadow.setEnabled(!actor.dead);}}
async function start(){
 substituirArvoresGLB().catch(console.warn);
 try{
  const actor=await loadActor('antonio.glb',player.pos);player.model=actor;animate(actor,'idle');camera.position.set(player.pos.x,1.48,player.pos.z-2.7);camera.setTarget(player.pos.add(new B.Vector3(0,1.25,1.6)));
  // João + 3 variações, Maria + 3 variações: oito civis ao total.
  const pontos=sorteioPosicoes();
  for(let n=0;n<8;n++){
   const isJoao=n<4,kind=isJoao?'joao':'maria',variant=n%4;
   const file=kind+'.glb',name=(isJoao?'João':'Maria')+(variant?' '+(variant+1):'');
   const pos=pontos[n];
   const model=await loadActor(file,pos);
   colorirNpc(model,variant);
   // Variações sutis de altura/largura sem alterar a hierarquia dos ossos.
   // O rig e animações permanecem intactos; muda apenas a escala do root.
   const perfis=[
    [1,1,1],        // original
    [.83,1.12,.83], // alto e magro
    [1.16,.96,1.16],// mais robusto
    [.91,.84,.91]   // baixo
   ];
   const perfil=perfis[variant];
   model.root.scaling.set(perfil[0],perfil[1],perfil[2]);
   const e={kind,name,model,pos:pos.clone(),origin:pos.clone(),hp:100,phase:n*.87,attackTime:0,hitTime:0};
   enemies.push(e);animate(model,'idle');
  }
  ui.loading.style.display='none';say('Bem-vindo ao Condomínio!\nJoão e Maria estão patrulhando.',3500);
 }catch(err){ui.loading.innerHTML=`<div id="error">Erro ao carregar os GLBs.<p>${String(err.message||err)}</p><p>Abra por um servidor HTTP local, não pelo arquivo file://.</p></div>`;console.error(err);}
}
canvas.addEventListener('contextmenu',e=>e.preventDefault());
window.addEventListener('keydown',e=>{if(!paused && ['KeyW','KeyA','KeyS','KeyD','Space'].includes(e.code))unlockMusic();if(e.code==='KeyP'){e.preventDefault();if(!e.repeat){musicStarted=true;togglePause();}return;}if(['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code))e.preventDefault();if(paused)return;keys.add(e.code);if(e.code==='KeyR')resetGame();});
window.addEventListener('keyup',e=>keys.delete(e.code));
window.addEventListener('blur',()=>{keys.clear();aim=false;});
// Mousedown em fase capture: recebe clique esquerdo mesmo com direito mantido.
// O listener anterior de pointerdown podia perder o evento ao mudar pointer lock.
let leftHeld=false;
window.addEventListener('mousedown',e=>{
 if(paused)return;
 const inside=(e.target===canvas || document.pointerLockElement===canvas || aim);
 if(!inside)return;
 unlockMusic();
 if(e.button===2){aim=true;e.preventDefault();return;}
 if(e.button!==0||leftHeld)return;
 leftHeld=true;e.preventDefault();
 if(document.pointerLockElement!==canvas)canvas.requestPointerLock?.().catch(()=>{});
 const now=performance.now();
 if(clickTimer && now-lastClickAt<=DOUBLE_CLICK_MS){
  clearTimeout(clickTimer);clickTimer=null;lastClickAt=0;attack('kick');
 } else {
  if(clickTimer)clearTimeout(clickTimer);
  lastClickAt=now;
  clickTimer=setTimeout(()=>{clickTimer=null;attack('punch');},DOUBLE_CLICK_MS);
 }
},true);
window.addEventListener('mouseup',e=>{
 if(e.button===2)aim=false;
 if(e.button===0)leftHeld=false;
},true);
window.addEventListener('blur',()=>{leftHeld=false;aim=false;});
window.addEventListener('mousemove',e=>{if(paused||document.pointerLockElement!==canvas)return;yaw+=e.movementX*.0025;pitch=clamp(pitch+e.movementY*.0016,-.18,.23);});
function resetGame(){healthMarker.style.display='none';
 if(clickTimer){clearTimeout(clickTimer);clickTimer=null;}
 keys.clear();yaw=0;pitch=0;aim=false;shotCooldown=0;attackFlash=0;targetEnemy=null;if(player.model)player.model.stepElapsed=0;
 player.hp=100;player.dead=false;player.pos.set(0,0,-7);
 if(player.model){player.model.dead=false;player.model.lockUntil=0;player.model.active=null;player.model.groups.forEach(g=>g.stop());player.model.root.rotation.y=0;player.model.root.position.copyFrom(player.pos);animate(player.model,'idle');}
 enemies.forEach(e=>{e.hp=100;e.attackTime=0;e.hitTime=0;e.phase=0;e.pos.copyFrom(e.origin);e.model.dead=false;e.model.lockUntil=0;e.model.active=null;e.model.groups.forEach(g=>g.stop());e.model.root.position.copyFrom(e.pos);animate(e.model,'idle');});
 if(player.model){camera.position.copyFrom(player.pos.add(new B.Vector3(0,1.17,-1.20)));camera.setTarget(player.pos.add(new B.Vector3(0,1.15,7)));syncContactShadow(player.model,player.pos);enemies.forEach(e=>syncContactShadow(e.model,e.pos));}
 say('Nova partida! Boa sorte, Antônio.',2300);
}
// Alvo válido: à frente de Antônio e no alcance do ataque corpo a corpo.
function findMeleeTarget(kind='punch'){
 const f=new B.Vector3(Math.sin(yaw),0,Math.cos(yaw));
 let winner=null,score=Infinity;
 for(const e of enemies){
  if(!aliveEnemy(e))continue;
  const v=e.pos.subtract(player.pos),dist=v.length();
  if(dist<.1||dist>(kind==='kick'?2.90:2.60))continue;
  const facing=B.Vector3.Dot(v.scale(1/dist),f);
  if(facing<(aim?-.1:.32))continue;
  const metric=dist+(1-facing)*2;
  if(metric<score){score=metric;winner=e;}
 }
 return winner;
}
function attack(kind='punch'){
 if(paused||!player.model||player.dead||shotCooldown>0)return;
 shotCooldown=kind==='kick'?.85:.5;attackFlash=kind==='kick'?.95:.7;
 if(aim)player.model.root.rotation.y=yaw;animate(player.model,kind,true);
 if(kind==='punch')setTimeout(()=>{if(!paused&&!player.dead)playPunchSound();},100);
 const chosen=findMeleeTarget(kind);
 // Pequeno atraso para fazer o dano acontecer durante o movimento do golpe.
 if(chosen){
  const actorRef=chosen;
  setTimeout(()=>{
   if(paused||player.dead||!aliveEnemy(actorRef)||!player.model)return;
   // Revalida o alvo caso Antônio tenha se afastado durante o golpe.
   // Permite terminar o golpe contra o alvo selecionado, desde que ainda esteja próximo.
   if(actorRef.pos.subtract(player.pos).length()>(kind==='kick'?3.1:2.8))return;
   actorRef.hp=Math.max(0,actorRef.hp-(kind==='kick'?45:25));
   if(actorRef.hp<=0){playDeathVoice(actorRef.kind);animate(actorRef.model,'death',true);say(`${actorRef.name} derrotado(a)!`,1600);}
   else {animate(actorRef.model,'hit',true);say(`${actorRef.name} sofreu ${kind==='kick'?'um chute':'um soco'}!`,750);}
  },kind==='kick'?350:220);
 }
}
function update(dt){if(!player.model||paused)return;
 updateAnimationBlend(player.model,dt);
 for(const enemy of enemies)updateAnimationBlend(enemy.model,dt);
 shotCooldown=Math.max(0,shotCooldown-dt);attackFlash=Math.max(0,attackFlash-dt);
 const f=new B.Vector3(Math.sin(yaw),0,Math.cos(yaw));const r=new B.Vector3(Math.cos(yaw),0,-Math.sin(yaw));
 const x=Number(keys.has('KeyD'))-Number(keys.has('KeyA'));const z=Number(keys.has('KeyW'))-Number(keys.has('KeyS'));
 const move=f.scale(z).add(r.scale(x));const moving=move.lengthSquared()>.001;
 if(aim && !player.dead)spinTo(player.model.root,f,dt*1.6);
 if(!player.dead){
  if(moving){move.normalize();const running=keys.has('ShiftLeft')||keys.has('ShiftRight');player.pos.addInPlace(move.scale((running?3.65:2.05)*dt));inBounds(player.pos);if(aim)spinTo(player.model.root,f,dt*1.6);else spinTo(player.model.root,move,dt);if(attackFlash<=0)animate(player.model,running?'run':'walk');footstep(player.model,dt,true,running);}
  else {spinTo(player.model.root,f,dt);if(attackFlash<=0)animate(player.model,'idle');footstep(player.model,dt,false,false);}
 }
 player.model.root.position.copyFrom(player.pos);syncContactShadow(player.model,player.pos);
 for(const e of enemies){if(!aliveEnemy(e))continue;
  e.phase+=dt;e.attackTime=Math.max(0,e.attackTime-dt);
  const toward=player.pos.subtract(e.pos);const distance=toward.length();let direction=null;
  if(distance<12&&!player.dead){if(distance>1.65)direction=toward.normalize();else if(e.attackTime===0 && performance.now() >= (e.model.lockUntil||0)){e.attackTime=1.3;animate(e.model,'punch',true);player.hp=Math.max(0,player.hp-8);if(player.hp===0){player.dead=true;playDeathVoice('antonio');animate(player.model,'death',true);say('Antônio foi derrotado. Pressione R para reiniciar.',6500);}}}
  else {const target=e.origin.add(new B.Vector3(Math.sin(e.phase*.5)*2,0,Math.cos(e.phase*.5)*2));const delta=target.subtract(e.pos);if(delta.length()>.35)direction=delta.normalize();}
  if(direction){const isChasing=distance<12;e.pos.addInPlace(direction.scale((isChasing?1.85:.8)*dt));inBounds(e.pos);spinTo(e.model.root,direction,dt);animate(e.model,isChasing?'run':'walk');footstep(e.model,dt,true,isChasing,e.pos.subtract(player.pos).length());}else{animate(e.model,'idle');footstep(e.model,dt,false,false);}
  e.model.root.position.copyFrom(e.pos);syncContactShadow(e.model,e.pos);
 }
 // Câmera terceira pessoa atrás de Antônio, sempre alinhada ao yaw da visão.
 // Mira: câmera baixa e ligeiramente mais recuada, com Antônio visível à esquerda.
 // Câmera atrás do personagem na altura do torso, sem vista aérea.
 // Ao mirar, câmera desliza para o ombro direito e a cruz aponta para frente.
 // TPS: ângulo baixo e enquadramento da coxa para cima; foco próximo à linha do horizonte.
 const viewDist=aim?1.82:1.38, height=aim?1.23:1.16, shoulder=aim?.38:0;
 const desired=player.pos.subtract(f.scale(viewDist)).add(r.scale(shoulder)).add(new B.Vector3(0,height+Math.sin(pitch)*.40,0));
 camera.position.copyFrom(vlerp(camera.position,desired,clamp(dt*11,0,1)));
 const target=camera.position.add(f.scale(10)).add(new B.Vector3(0,-Math.sin(pitch)*10,0));
 // Ao mirar, Antônio aponta o tronco para o mesmo yaw da câmera. O retículo fica no centro.
 camera.setTarget(target);
 camera.fov+=((aim?.78:.89)-camera.fov)*clamp(dt*12,0,1);
 if(performance.now()-debugLast>2000){debugLast=performance.now();console.debug('[AFTERMATH] fps',engine.getFps().toFixed(0),'player',player.model.active?.name,'joao',enemies[0]?.model.active?.name,'maria',enemies[1]?.model.active?.name);}
 // Retículo: aparece no combate e marca em vermelho um inimigo ao alcance.
 targetEnemy=findMeleeTarget('punch');
 ui.reticle.style.display='block';
 ui.reticle.style.color=targetEnemy?'#ff5555':'#fff';
 ui.reticle.textContent=targetEnemy?'⊕':'+';
 // A cruz da mira fica sempre no centro. Só a barra segue o inimigo.
 ui.reticle.style.left='50%';ui.reticle.style.top='50%';
 const nearEnemy=targetEnemy || findMeleeTarget('kick');
 // Indicador perto do reticulo, NUNCA projetado muito acima dos personagens.
 // So aparece enquanto o inimigo estiver vivo, a frente e ao alcance.
 healthMarker.style.display=nearEnemy?'block':'none';
 if(nearEnemy){
  const rect=canvas.getBoundingClientRect();
  healthMarker.style.left=(rect.left+rect.width/2)+'px';
  healthMarker.style.top=(rect.top+rect.height/2-20)+'px';
  healthName.textContent=nearEnemy.name;
  healthBar.style.width=Math.max(0,nearEnemy.hp)+'%';
 }
 ui.status.innerHTML=`<strong>ANTÔNIO</strong> · Vida: ${player.hp}/100<br>Inimigos vivos: ${enemies.filter(aliveEnemy).length}/${enemies.length}<br>Modo: ${aim?'MIRA SOBRE O OMBRO':'EXPLORAÇÃO'} · ${player.dead?'DERROTADO':'SOBREVIVENDO'}`;
}
scene.onBeforeRenderObservable.add(()=>update(Math.min(engine.getDeltaTime()/1000,.05)));await start();scene.onDisposeObservable.add(()=>{if(clickTimer)clearTimeout(clickTimer);music.pause();music.src='';menuMusic.pause();menuMusic.src='';shadows.dispose();contactTex.dispose();contactMat.dispose();punchAudio.pause();punchAudio.src='';deathVoices.forEach(a=>{a.pause();a.src='';});healthMarker.remove();menu.remove();hud.remove();});return scene;
};