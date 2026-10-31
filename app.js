const SESSION_VERSION=4,MAX_VOTES=10;
const KEEPSAKE_PROFILE={"nickname": "Aragakey.", "avatar": "assets/profile/avatar-v25.png", "source": "用户提供录屏2023结果页50秒"};
const CARDS=[
 {
  "id": "curiosity",
  "name": "好奇",
  "label": "好奇",
  "description": "换个角度，日常也能遇见新鲜。",
  "balloon": "G2",
  "fill": "#a4e5cb",
  "ink": "#198963",
  "quote": [
   "把好奇，",
   "带到",
   "下个十年。"
  ],
  "blessing": "点子新鲜，让好奇有了新的去处",
  "sky": [
   "#b5e7ef",
   "#c2efd6",
   "#fff0b8"
  ]
 },
 {
  "id": "resonance",
  "name": "共鸣",
  "label": "共鸣",
  "description": "有些故事，刚好说中了心里的话。",
  "balloon": "R1",
  "fill": "#f4bec8",
  "ink": "#ca718e",
  "quote": [
   "愿每份心意，",
   "都有",
   "温柔的回应。"
  ],
  "blessing": "故事动人，让心意有了温柔回应",
  "sky": [
   "#f6ccdb",
   "#d7cef1",
   "#bce9ed"
  ]
 },
 {
  "id": "imagination",
  "name": "想象",
  "label": "想象",
  "description": "让想象多飞一会儿，世界就多一种可能。",
  "balloon": "P3",
  "fill": "#d1c5ee",
  "ink": "#8a73b3",
  "quote": [
   "让想象，",
   "再多飞",
   "一会儿。"
  ],
  "blessing": "脑洞大开，让想象多飞一会儿",
  "sky": [
   "#d6c9f2",
   "#c6e5f5",
   "#e9d7ef"
  ]
 },
 {
  "id": "passion",
  "name": "热爱",
  "label": "热爱",
  "description": "把喜欢放在心上，日常也会发光。",
  "balloon": "O6",
  "fill": "#ffdab3",
  "ink": "#bc8957",
  "quote": [
   "让喜欢，",
   "继续",
   "发光。"
  ],
  "blessing": "喜欢发光，让好创意继续被看见",
  "sky": [
   "#ffe1bb",
   "#f5d1d3",
   "#caedef"
  ]
 }
];
const CARD_IDS=new Set(CARDS.map(card=>card.id));
const COLLECTED_IDS=new Set([...CARD_IDS,'cleverness','surprise','authenticity','warmth']);
const VOTE_EFFECTS=[
 {id:'mint',cardId:'curiosity',name:'薄荷云朵',image:'vote-feedback',mini:['G2','G4','G1'],duration:3200},
 {id:'peach',cardId:'resonance',name:'蜜桃心动',image:'vote-peach-v2',mini:['R2','R1','R4'],duration:3400},
 {id:'lilac',cardId:'imagination',name:'淡紫流光',image:'vote-lilac-v2',mini:['P3','P4','P1'],duration:3600},
 {id:'champagne',cardId:'passion',name:'香槟飘带',image:'vote-champagne-v2',mini:['O6','O2','O4'],duration:3600}
];
function earnedCardIds(session,allowedIds){
 const earned=new Set(session.votes.map(vote=>allowedIds.indexOf(vote.id)).filter(index=>index>=0).map(index=>VOTE_EFFECTS[index%VOTE_EFFECTS.length].cardId));
 return CARDS.filter(card=>earned.has(card.id)).map(card=>card.id);
}
function normalizeSession(raw,allowedIds){
 const valid=raw?.version===SESSION_VERSION,votes=[];
 if(valid&&Array.isArray(raw.votes))for(const vote of raw.votes){const id=typeof vote==='string'?vote:vote?.id;if(typeof id==='string'&&allowedIds.includes(id)&&!votes.some(item=>item.id===id)&&votes.length<MAX_VOTES)votes.push({id})}
 const earned=earnedCardIds({votes},allowedIds);
 return {version:SESSION_VERSION,round:valid&&Number.isSafeInteger(raw.round)&&raw.round>=0?raw.round:0,votes,index:valid&&Number.isInteger(raw.index)?Math.max(0,Math.min(Math.max(0,allowedIds.length-1),raw.index)):0,collected:valid&&Array.isArray(raw.collected)?[...new Set(raw.collected.filter(id=>COLLECTED_IDS.has(id)))]:[],currentCard:valid&&earned.includes(raw.currentCard)?raw.currentCard:earned[0]||null};
}
function collectCard(session,id,allowedIds){return earnedCardIds(session,allowedIds).includes(id)?{...session,collected:[...new Set([...session.collected,id])]}:session}
function mergeSession(local,incoming,allowedIds){
 if(incoming.round<local.round)return local;
 if(incoming.round>local.round)return normalizeSession({...incoming,index:local.index,currentCard:local.currentCard},allowedIds);
 return normalizeSession({...local,votes:[...local.votes,...incoming.votes.filter(vote=>!local.votes.some(item=>item.id===vote.id))].slice(0,MAX_VOTES),collected:[...new Set([...local.collected,...incoming.collected])]},allowedIds);
}
function normalizeCapture(raw){
 if(!raw||!['x','y','width','height','sourceWidth','sourceHeight'].every(key=>typeof raw[key]==='number'&&Number.isFinite(raw[key])))return null;
 const {x,y,width,height,sourceWidth,sourceHeight}=raw;
 return x>=0&&y>=0&&width>0&&height>0&&sourceWidth>0&&sourceHeight>0&&x+width<=sourceWidth&&y+height<=sourceHeight?{x,y,width,height,sourceWidth,sourceHeight}:null;
}
function safeSource(value){try{const url=new URL(value);return ['https:','http:'].includes(url.protocol)?url.href:''}catch{return ''}}
function escapeHTML(value){return String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function localAdAsset(value){if(typeof value!=='string'||!value)return '';if(value.startsWith('data:image/'))return value;if(value.includes('..')||/^[a-z]+:/i.test(value)||value.startsWith('/'))return '';return value.startsWith('assets/')?value:'assets/ads/'+value}
function normalizeAds(manifest){
 const input=Array.isArray(manifest)?manifest:manifest?.ads,used=new Set();
 return Array.from({length:4},(_,i)=>{const a=Array.isArray(input)&&input[i]&&typeof input[i]==='object'?input[i]:{};let id=typeof a.id==='string'&&a.id?a.id:'ad'+(i+1);if(used.has(id)){id='work-'+(i+1);while(used.has(id))id+='-'}used.add(id);return {id,title:typeof a.title==='string'&&a.title?a.title:'作品 '+(i+1),brand:typeof a.brand==='string'?a.brand:'',votes:typeof a.votes==='number'&&Number.isFinite(a.votes)&&a.votes>=0?Math.floor(a.votes):null,votesLabel:typeof a.votesLabel==='string'?a.votesLabel:'',image:localAdAsset(a.image),avatar:localAdAsset(a.avatar),caption:typeof a.caption==='string'?a.caption:'',sourceUrl:safeSource(a.sourceUrl),sourceLabel:typeof a.sourceLabel==='string'?a.sourceLabel:'',capture:normalizeCapture(a.capture)}});
}
function previousPage(pages,session){while(pages.length){const page=pages.pop();if(['choose','card'].includes(page.view)&&!session.votes.length)continue;return page}return {view:'landing',index:session.index,currentCard:session.currentCard}}
function snapshotDownload(id,round,assets={}){const card=CARDS.find(item=>item.id===id);if(!card)return null;const mapped=assets[id],source=typeof mapped==='string'&&(/^(data:image\/(?:png|svg\+xml)[;,]|blob:)/i.test(mapped)||/^assets\/(?:cards|letters-v32)\/[\w.-]+\.(?:png|svg)$/.test(mapped))?mapped:'assets/letters-v32/'+id+'.svg';return {id:card.id,name:card.name,round,source,filename:'心意升空-2026-'+card.name+'-腾讯十周年心意卡.png'}}
if(typeof module!=='undefined')module.exports={CARDS,VOTE_EFFECTS,earnedCardIds,normalizeSession,collectCard,mergeSession,normalizeCapture,safeSource,normalizeAds,previousPage,snapshotDownload};
if(typeof document==='undefined'&&typeof require!=='undefined'&&require.main===module){
 const assert=require('node:assert/strict'),ads=normalizeAds(null),ids=ads.map(ad=>ad.id);
 assert.equal(ads.length,4);assert.ok(ads.every(ad=>ad.votes===null));assert.deepEqual(VOTE_EFFECTS.map(effect=>effect.cardId),CARDS.map(card=>card.id));
 for(let mask=0;mask<16;mask++){
  const votes=ids.filter((_,i)=>mask&(1<<i)).map(id=>({id})),earned=CARDS.filter((_,i)=>mask&(1<<i)).map(card=>card.id);
  const restored=normalizeSession({version:4,round:8,votes:[...votes,...votes,{id:'unknown'}],selectionMode:'creative-reasons-v2',bouquet:['passion','cleverness'],collected:['resonance','warmth','warmth'],currentCard:'passion'},ids);
  assert.deepEqual(restored.votes,votes);assert.deepEqual(earnedCardIds(restored,ids),earned);assert.deepEqual(restored.collected,['resonance','warmth']);assert.equal(restored.round,8);assert.equal(restored.currentCard,earned.includes('passion')?'passion':earned[0]||null);assert.ok(!('bouquet' in restored));
  assert.deepEqual(normalizeSession(JSON.parse(JSON.stringify(restored)),ids),restored);
  for(const card of CARDS){const collected=collectCard(restored,card.id,ids);if(earned.includes(card.id)){assert.ok(collected.collected.includes(card.id));assert.equal(snapshotDownload(card.id,8).source,'assets/letters-v32/'+card.id+'.svg')}else assert.equal(collected,restored)}
 }
 const legacy=normalizeSession({version:4,round:42,votes:ids.map(id=>({id})),selectionMode:'creative-reasons-v2',bouquet:['curiosity'],collected:['passion'],currentCard:'resonance',index:3},ids);assert.equal(legacy.votes.length,4);assert.equal(legacy.currentCard,'resonance');assert.deepEqual(earnedCardIds(legacy,ids),CARDS.map(card=>card.id));
 const oneVote=normalizeSession({version:4,round:42,votes:['ad1','bad','ad1'],currentCard:'passion',index:99},ids);assert.deepEqual(oneVote.votes,[{id:'ad1'}]);assert.equal(oneVote.currentCard,'curiosity');assert.equal(oneVote.index,3);assert.equal(collectCard(oneVote,'unknown',ids),oneVote);
 const incoming=normalizeSession({version:4,round:42,votes:[{id:'ad2'}],collected:['resonance'],index:0},ids),merged=mergeSession(oneVote,incoming,ids);assert.equal(merged.index,3);assert.equal(merged.currentCard,'curiosity');assert.deepEqual(earnedCardIds(merged,ids),['curiosity','resonance']);assert.deepEqual(merged.collected,['resonance']);
 assert.equal(mergeSession(legacy,{...incoming,round:41},ids),legacy);const restarted=mergeSession(legacy,normalizeSession({version:4,round:43,votes:[{id:'ad3'}]},ids),ids);assert.equal(restarted.currentCard,'imagination');assert.deepEqual(restarted.collected,[]);assert.equal(restarted.index,3);
 const empty=normalizeSession({version:4,bouquet:['passion'],currentCard:'passion'},ids);assert.deepEqual(earnedCardIds(empty,ids),[]);assert.equal(empty.currentCard,null);assert.equal(collectCard(empty,'passion',ids),empty);assert.deepEqual(normalizeSession({version:3,votes:[{id:'ad1'}]},ids).votes,[]);
 const reordered=['ad4','ad2','ad1','ad3'];assert.deepEqual(earnedCardIds({votes:[{id:'ad1'}]},reordered),['imagination']);
 for(const inputIds of [['ad2','ad2','ad2','ad2'],['ad2','ad2','work-2','work-2'],['work-2','work-2','work-2-','work-2-']])assert.equal(new Set(normalizeAds({ads:inputIds.map(id=>({id}))}).map(ad=>ad.id)).size,4);
 const capture={x:10,y:20,width:200,height:300,sourceWidth:400,sourceHeight:800};assert.deepEqual(normalizeCapture(capture),capture);assert.equal(normalizeCapture({...capture,x:300}),null);assert.equal(safeSource('javascript:alert(1)'),'');assert.equal(normalizeAds({ads:[{image:'../secret'}]})[0].image,'');
 const assets={curiosity:'data:image/png;base64,original'},snapshot=snapshotDownload('curiosity',1,assets);assets.curiosity='changed';assert.equal(snapshot.source,'data:image/png;base64,original');assert.ok(snapshot.filename.includes('好奇'));assert.equal(snapshotDownload('unknown',1),null);assert.equal(snapshotDownload('passion',1,{passion:'assets/letters-v32/passion.svg'}).source,'assets/letters-v32/passion.svg');
 const source=require('node:fs').readFileSync(__filename,'utf8'),nodes=new Map(),node=selector=>{if(!nodes.has(selector))nodes.set(selector,{dataset:{},listeners:{},addEventListener(name,listener){this.listeners[name]=listener},setAttribute(name,value){this[name]=value}});return nodes.get(selector)},stage=node('#heart-choices');
 Object.assign(stage,{slides:[],animate(){},getBoundingClientRect:()=>({width:402}),querySelectorAll(){return this.slides}});Object.defineProperty(stage,'innerHTML',{set(value){this.slides=[...value.matchAll(/class="choice-slide is-(\w+)" data-card="([\w-]+)"/g)].map(([,position,id])=>({dataset:{card:id},classList:{contains:name=>name==='is-'+position},getBoundingClientRect:()=>({left:position==='current'?87:position==='previous'?-110:322,top:position==='current'?0:41,width:position==='current'?228:190}),animate(){}}))}});
 const storage={data:JSON.stringify({...legacy,currentCard:'curiosity'}),getItem(){return this.data},setItem(key,value){this.data=value}},context={CARDS,earnedCardIds,normalizeSession,mergeSession,escapeHTML,ads:ids.map(id=>({id})),session:JSON.parse(storage.data),STORE:'selfcheck',localStorage:storage,$:node,view:'choose',pendingChoice:null,reduced:()=>false,refreshVoteCounts(){},positionMailScene(){},getComputedStyle:slide=>({opacity:slide.classList.contains('is-current')?'1':'.5',transform:slide.classList.contains('is-current')?'matrix(1,0,0,1,-114,0)':'none'}),availableCards(){return CARDS.filter(card=>earnedCardIds(context.session,ids).includes(card.id))}};
 const browserSource=source.slice(source.lastIndexOf("if(typeof document!=='undefined'){"));require('node:vm').runInNewContext(browserSource.slice(browserSource.indexOf(' function save('),browserSource.indexOf(' function currentAd('))+browserSource.slice(browserSource.indexOf(' function updateChoiceCarousel('),browserSource.indexOf(' function renderChoices('))+browserSource.slice(browserSource.indexOf(' function chooseCard('),browserSource.indexOf(" $('#make-cards').addEventListener")),context);context.updateChoiceCarousel();
 for(const expected of ['resonance','imagination','passion','curiosity']){node('#choice-next').listeners.click();assert.equal(context.session.currentCard,expected);assert.equal(JSON.parse(storage.data).currentCard,expected);assert.equal(stage.slides.find(slide=>slide.classList.contains('is-current')).dataset.card,expected);assert.ok(node('#make-cards').innerHTML.includes(CARDS.find(card=>card.id===expected).name))}
 console.log('PASS: 16 earned subsets, legacy migration, collection/merge/reset, safe downloads, and actual next-choice handler through persistence, carousel DOM, CTA, and FLIP rendering.');
}
if(typeof document!=='undefined'){
 const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)],STORE='xinyi-shengkong-2026-v4-reasons2';
 const reduced=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;
 let ads=normalizeAds(null),session=normalizeSession(null,ads.map(ad=>ad.id)),view='landing',displayedIndex=0,displayedCard=CARDS[0].id,history=[],motionTimer,entryTimer,toastTimer,pendingFlightId=null,pendingChoice=null,manifestReady=false,downloading=false,savedRaw=null;
 const failedCards=new Set();
 let adCarouselBusy=false,adCarouselTimer,adTransitionCleanup=null,adPointer=null,adDragOffset=0,adSlideToken=0,entryFinished=false;
 try{savedRaw=JSON.parse(localStorage.getItem(STORE)||localStorage.getItem('xinyi-shengkong-2026-v4')||'null')}catch{}
 const coverAssets={'cover-annual-a-v16':'annual','cover-awards-a-v16':'awards','cover-top-a-v16':'top'},balloonColors={G:'#c5efd5',R:'#f2cdd6',P:'#dcd2f1',O:'#f5dec2'},balloonSource=id=>globalThis.BALLOON_ASSETS?.[id]||(coverAssets[id]?'assets/cover-a-v16/'+coverAssets[id]+'.png':'assets/balloons/'+id+'.png');
 const letterCardSource=id=>globalThis.LETTER_CARD_ASSETS?.[id]||'assets/letters-v32/'+id+'-paper.svg';
 const letterBlessings=Object.fromEntries(CARDS.map(card=>[card.id,card.blessing])),letterPreloads=new Map();
 function preloadLetter(id){if(!letterPreloads.has(id)){const img=new Image();img.src=letterCardSource(id);letterPreloads.set(id,img.decode().then(()=>img).catch(error=>{letterPreloads.delete(id);throw error}))}return letterPreloads.get(id)}
 window.openHeartLetter=async id=>{
  if(view!=='choose'||pendingChoice||!availableCards().some(card=>card.id===id))return;
  session.currentCard=id;save();pendingChoice=id;$('#heart-choices').dataset.opening=id;updateChoiceCarousel();
  try{await Promise.all([preloadLetter(id),$('#mail-flow>.mailbox img').decode().catch(()=>null)])}catch{if(view==='choose'&&pendingChoice===id){pendingChoice=null;delete $('#heart-choices').dataset.opening;updateChoiceCarousel();toast('信纸还没准备好，轻点再试一次。')}return}
  if(view!=='choose'||pendingChoice!==id)return;
  window.scrollTo({top:0,behavior:'instant'});positionMailScene();$('#mail-flow').classList.add('letter-is-unsealing');show('card');
 };
 const flight=$('#vote-flight');
 const themeLabel=document.createElement('span');themeLabel.className='flight-theme';$('.flight-surface').append(themeLabel);
 flight.insertAdjacentHTML('afterbegin',`<div class="effect-ornaments" aria-hidden="true"><svg class="effect-lines" viewBox="0 0 360 450" fill="none"><defs><linearGradient id="ribbon-light" x1="80" y1="400" x2="290" y2="60" gradientUnits="userSpaceOnUse"><stop stop-color="#edc79c" stop-opacity="0"/><stop offset=".35" stop-color="#edb375" stop-opacity=".8"/><stop offset=".65" stop-color="#fff0d0"/><stop offset="1" stop-color="#efd5bc" stop-opacity="0"/></linearGradient></defs><g class="effect-rings"><ellipse cx="180" cy="326" rx="72" ry="19"/><ellipse cx="180" cy="326" rx="72" ry="19"/></g><g class="effect-orbit"><path d="M86 346C274 324 316 174 127 188C-9 204 84 292 276 234"/><path d="M96 357C269 329 322 188 140 197"/></g><g class="effect-ribbons" stroke="url(#ribbon-light)"><path d="M91 420C-9 345 265 348 272 284S52 278 77 213 290 161 256 80"/><path d="M268 416C333 330 101 346 104 278S295 253 271 185 95 123 124 65"/></g></svg><div class="effect-sparks">${Array.from({length:12},(_,i)=>`<i style="--spark-x:${8+(i*37)%85}%;--spark-y:${20+(i*23)%68}%;--spark-delay:${i%4*.13}s;--spark-size:${i%3===0?12:6}px"></i>`).join('')}</div></div>`);
 function styleVoteHeart(button,index){
  const card=CARDS[index%CARDS.length],art=button.querySelector('.vote-heart-image'),key=['green','pink','purple','orange'][index%CARDS.length];
  button.style.setProperty('--vote-ink','#fff');button.style.setProperty('--vote-soft',balloonColors[card.balloon[0]]);
  if(!art||art.dataset.heart===key)return;delete art.dataset.balloon;art.classList.remove('asset-missing');art.dataset.heart=key;
  const image=new Image();image.alt='';image.draggable=false;
  image.addEventListener('error',()=>{if(!image.dataset.fallback){image.dataset.fallback='1';image.src=globalThis.VOTE_HEART_ASSETS?.green||'assets/vote-hearts/green.png'}});
  image.src=globalThis.VOTE_HEART_ASSETS?.[key]||'assets/vote-hearts/'+key+'.png';art.replaceChildren(image);
 }
 function prepareFlight(){
  const effect=VOTE_EFFECTS[session.index%VOTE_EFFECTS.length];themeLabel.textContent=CARDS.find(card=>card.id===effect.cardId).name+' · 为好创意升空';flight.dataset.effect=effect.id;flight.style.setProperty('--flight-duration',effect.duration+'ms');
  styleVoteHeart($('#vote-button'),session.index);
  styleVoteHeart($('#already-voted'),session.index);
  const hero=$('.flight-surface>.balloon-image');if(hero.dataset.balloon!==effect.image){hero.dataset.balloon=effect.image;const img=new Image();img.alt='';img.draggable=false;let fallback=0;img.addEventListener('error',()=>{if(fallback===0){fallback++;img.src=balloonSource('vote-feedback')}else if(fallback===1){fallback++;img.src=balloonSource('G2');hero.closest('.flight-surface').classList.add('feedback-fallback')}});img.addEventListener('load',()=>hero.closest('.flight-surface').classList.toggle('feedback-fallback',fallback>1));img.src=balloonSource(effect.image);hero.replaceChildren(img)}
  $$('.flight-mini').forEach((el,i)=>{const id=effect.mini[i%effect.mini.length];el.dataset.balloon=id;const img=el.querySelector('img');if(img)img.src=balloonSource(id)});
  return effect;
 }
 function launchFlight(){
  if(pendingFlightId||view!=='vote')return;
  const effect=prepareFlight();if(reduced()){toast('喜欢，收到啦。');return}
  pendingFlightId=currentAd().id;flight.hidden=false;
  const button=$('#vote-button'),anchor=$('.flight-anchor'),start=button.getBoundingClientRect(),target=anchor.getBoundingClientRect();
  flight.style.setProperty('--launch-x',(start.x+start.width/2-target.x-target.width/2)+'px');
  flight.style.setProperty('--launch-y',(start.y+start.height/2-target.y-target.height/2)+'px');
  flight.style.setProperty('--launch-scale',Math.min(.44,115/target.width));
  $('#vote-scene').classList.add('vote-is-flying');button.disabled=true;flight.classList.add('active');$('#next-step').disabled=true;$('#previous-ad').disabled=true;$('#next-ad').disabled=true;
  motionTimer=setTimeout(()=>completeFlight(pendingFlightId),effect.duration+100);
 }
 $('.flight-balloon').addEventListener('animationend',event=>{if(event.target===$('.flight-balloon'))completeFlight(pendingFlightId)});

 function hydrateBalloons(scope=document){for(const el of scope.querySelectorAll('[data-balloon]')){if(el.querySelector(':scope > img'))continue;const key=el.dataset.balloon,img=new Image();el.style.setProperty('--balloon-color',balloonColors[key[0]]||balloonColors.G);img.alt='';img.draggable=false;img.addEventListener('error',()=>{if(key==='vote-feedback'&&!img.dataset.usedFallback){img.dataset.usedFallback='1';el.closest('.flight-surface')?.classList.add('feedback-fallback');img.src=balloonSource('G2');return}el.classList.add('asset-missing')});img.addEventListener('load',()=>{el.classList.remove('asset-missing');if(key==='vote-feedback')el.closest('.flight-surface')?.classList.toggle('feedback-fallback',!!img.dataset.usedFallback)});img.src=balloonSource(key);el.append(img)}}
 function toast(message){clearTimeout(toastTimer);$('#toast').textContent=message;$('#toast').classList.add('visible');toastTimer=setTimeout(()=>$('#toast').classList.remove('visible'),2500)}
 function refreshVoteCounts(){$$('.vote-count').forEach(el=>el.textContent=session.votes.length)}
 function save({reset=false}={}){try{if(!reset)session=mergeSession(session,normalizeSession(JSON.parse(localStorage.getItem(STORE)||'null'),ads.map(ad=>ad.id)),ads.map(ad=>ad.id));localStorage.setItem(STORE,JSON.stringify(session))}catch{}refreshVoteCounts()}
 function currentAd(){return ads[session.index]}
 function currentVote(){return session.votes.find(vote=>vote.id===currentAd().id)}
 function closeAllDialogs(){$$('dialog[open]').forEach(dialog=>dialog.close());document.body.style.overflow=''}
 function stopMotion({keepLetters=false}={}){cancelAdCarousel();clearTimeout(entryTimer);clearTimeout(motionTimer);pendingFlightId=null;pendingChoice=null;$('#mail-flow').classList.remove('letter-is-switching');$('#card-view').classList.remove('card-return');$('#vote-flight').hidden=true;$('#vote-flight').classList.remove('active');$('#vote-scene').classList.remove('vote-is-flying');if(!keepLetters){$('#mail-flow')?.classList.remove('letter-is-unsealing');const letters=$('#heart-choices');letters.classList.remove('letter-in-flight');delete letters.dataset.opening;$$('.heart-choice.opening,.heart-choice.letter-sending').forEach(el=>el.classList.remove('opening','letter-sending'));if(view==='choose')updateChoiceCarousel();if(view==='card'&&availableCards().length){$('#card-view').classList.remove('card-reveal');updateCardPosition()}}$('#vote-button').disabled=false}
 function show(next,{replace=false}={}){
  if(next!=='landing'&&!manifestReady)return;
  if(next==='card'&&!availableCards().length)next='choose';
  if(['choose','card'].includes(next)&&!session.votes.length){toast('先为一个喜欢的好创意投票吧');next='vote'}
  stopMotion({keepLetters:next==='card'&&view==='choose'&&!!pendingChoice});closeAllDialogs();$('#vote-view').classList.remove('vote-entry');if(next!==view&&!replace)history.push({view,index:displayedIndex,currentCard:displayedCard});
  const previousView=view;view=next;displayedIndex=session.index;displayedCard=session.currentCard;const mailFlow=$('#mail-flow');mailFlow.hidden=!['choose','card'].includes(next);mailFlow.classList.toggle('letter-is-open',next==='card');$('#choose-view').inert=next==='card';$('#choose-view').setAttribute('aria-hidden',String(next==='card'));$$('.view').forEach(el=>el.hidden=el.id!==next+'-view'&&!(next==='card'&&el.id==='choose-view'));
  if(next==='vote')renderAd();if(next==='choose')renderChoices();if(next==='card')renderCards({reveal:previousView!=='card'});
  if(!['choose','card'].includes(next)||!['choose','card'].includes(previousView))window.scrollTo({top:0,behavior:'instant'});const title=$('#'+next+'-view h1');if(title){title.tabIndex=-1;title.focus({preventScroll:true})}
  $('#back-button').textContent=next==='landing'?'×':'‹';$('#back-button').setAttribute('aria-label',next==='landing'?'返回封面顶部':'返回上一页');
 }
 function completeFlight(adId){if(!adId||pendingFlightId!==adId)return;stopMotion();if(view==='vote')renderAd()}
 function openDialog(id){if(pendingFlightId)completeFlight(pendingFlightId);else stopMotion();closeAllDialogs();$(id).showModal();document.body.style.overflow='hidden'}
 $$('dialog').forEach(dialog=>{dialog.querySelector('.close-dialog').addEventListener('click',()=>dialog.close());dialog.addEventListener('close',()=>document.body.style.overflow='');dialog.addEventListener('click',event=>{const r=dialog.getBoundingClientRect();if(event.target===dialog&&(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom))dialog.close()})});
 function restart(){session=normalizeSession(null,ads.map(ad=>ad.id));session.round=Date.now();savedRaw=session;history=[];save({reset:true});show('landing',{replace:true});$('#showcase').classList.remove('revealed')}
 $('#back-button').addEventListener('click',()=>{if(view==='landing'){window.scrollTo({top:0,behavior:reduced()?'instant':'smooth'});return}const previous=previousPage(history,session);session.index=previous.index;session.currentCard=previous.currentCard||session.currentCard;save();show(previous.view,{replace:true})});
 $('#menu-button').addEventListener('click',()=>openDialog('#menu-dialog'));$('#menu-cover').addEventListener('click',()=>show('landing'));$('#menu-results').addEventListener('click',()=>show('choose'));
 $('#menu-restart').addEventListener('click',()=>openDialog('#restart-dialog'));$('#restart-button').addEventListener('click',()=>openDialog('#restart-dialog'));$('#confirm-restart').addEventListener('click',restart);$('.close-restart').addEventListener('click',()=>$('#restart-dialog').close());$$('.rules-trigger').forEach(button=>button.addEventListener('click',()=>openDialog('#rules-dialog')));
 $('#cover-start').addEventListener('click',()=>{$('#showcase').scrollIntoView({behavior:reduced()?'instant':'smooth'});$('#showcase').classList.add('revealed')});
 function completeEntry(){const rect=$('#showcase').getBoundingClientRect();if(view==='landing'&&manifestReady&&!$('dialog[open]')&&rect.top<innerHeight*.4&&rect.bottom>innerHeight*.6){session.index=0;save();show('vote');$('#vote-view').classList.add('vote-entry')}}
 function scheduleEntry(){clearTimeout(entryTimer);if(view!=='landing'||!manifestReady)return;$('#showcase').classList.add('entry-running');if(reduced()){entryFinished=true;completeEntry()}}
 $('#showcase').addEventListener('animationend',event=>{if(event.animationName!=='recording-ad-procession')return;entryFinished=true;completeEntry()});
 document.addEventListener('close',()=>{if(entryFinished&&view==='landing')completeEntry()},true);
 const observer=new IntersectionObserver(entries=>{for(const entry of entries){if(entry.isIntersecting){$('#showcase').classList.add('revealed');scheduleEntry()}else{clearTimeout(entryTimer);entryFinished=false;$('#showcase').classList.remove('entry-running')}}},{threshold:.6});observer.observe($('#showcase'));$('#begin-voting').addEventListener('click',()=>show('vote'));
 function captureStyle(capture){return capture?`--capture-width:${capture.sourceWidth/capture.width*100}%;--capture-height:${capture.sourceHeight/capture.height*100}%;--capture-left:${-capture.x/capture.width*100}%;--capture-top:${-capture.y/capture.height*100}%;--capture-ratio:${capture.width/capture.height};`:''}
 function adThumbnail(ad,className='work-thumb'){return ad.image?`<span class="${className} ${ad.capture?'capture-media':''}" style="${captureStyle(ad.capture)}">${ad.capture?'<span class="capture-clip">':''}<img src="${escapeHTML(ad.image)}" alt="${escapeHTML(ad.title)}" draggable="false">${ad.capture?'</span>':''}</span>`:`<span class="${className} empty-thumb"></span>`}
 function renderShowcase(){const ordered=[...ads.slice(1),ads[0]];$('#showcase-deck').innerHTML='<div class="showcase-track">'+ordered.map((ad,i)=>`<div class="showcase-card" style="--order:${i}">${adThumbnail(ad,'showcase-image')}</div>`).join('')+'</div>'}
 function sourceSummary(ad){const match=ad.sourceLabel.match(/(20\d{2}).*?([\d.]+)秒/);return match?match[1]+' 案例录屏 · '+match[2]+'秒':ad.sourceLabel}
 function renderAd(){
  const ad=currentAd(),vote=currentVote(),wrap=$('.ad-image-wrap');$('#ad-index').textContent=String(session.index+1).padStart(2,'0');$('#ad-title').textContent=ad.title;$('#ad-votes').innerHTML=ad.votes===null?'喜欢，由你来决定':`<span>╲ 参考票数 <b>${ad.votes.toLocaleString('zh-CN')}</b> ╱</span><small class="votes-snapshot">${escapeHTML(ad.votesLabel||'录屏票数快照')}</small>`;
  $('#ad-brand').textContent=ad.brand||ad.title;$('#brand-avatar').textContent=(ad.brand||'创')[0];if(ad.avatar){const avatar=new Image();avatar.alt='';avatar.src=ad.avatar;avatar.addEventListener('error',()=>avatar.remove());$('#brand-avatar').replaceChildren(avatar)}
  $('.moment-ad').classList.toggle('captured-ad',!!ad.capture);wrap.classList.toggle('capture-media',!!ad.capture);wrap.style.cssText=captureStyle(ad.capture);$('#ad-image').hidden=!ad.image;$('#ad-image-placeholder').hidden=!!ad.image;
  if(ad.image){const adId=ad.id;$('#ad-image').onerror=()=>{if(currentAd().id===adId){$('#ad-image').hidden=true;$('#ad-image-placeholder').hidden=false}};$('#ad-image').onload=()=>{if(currentAd().id===adId)$('#ad-image-placeholder').hidden=true};$('#ad-image').src=ad.image;$('#ad-image').alt=ad.title}
  $('#ad-caption').textContent=ad.caption;$('.ad-card-bottom>span').textContent=sourceSummary(ad)||'广告';$('#ad-source').hidden=!ad.sourceUrl;prepareFlight();$('#vote-button').hidden=!!vote;$('#vote-button').disabled=!!pendingFlightId;$('#already-voted').hidden=!vote;$('#vote-brand-label').textContent=ad.brand.split(/\s/).slice(-1)[0]||'';
  $('.vote-progress').innerHTML='已投 <b class="vote-count">'+session.votes.length+'</b> / 10 票';$('#next-step').innerHTML='下一步 <span>↓</span>';$('#next-step').disabled=!session.votes.length||!!pendingFlightId;$('#previous-ad').disabled=session.index===0||!!pendingFlightId;$('#next-ad').disabled=session.index===ads.length-1||!!pendingFlightId;refreshVoteCounts();if(!adCarouselBusy)syncAdNeighbors();
 }
 function carouselStep(){return $('#vote-scene').getBoundingClientRect().width+18}
 function cloneAdScene(index){
  const ad=ads[index],copy=$('#vote-scene').cloneNode(true);copy.querySelector('#vote-flight')?.remove();
  for(const el of [copy,...copy.querySelectorAll('[id]')])el.removeAttribute('id');
  copy.className='ad-carousel-slide';copy.setAttribute('aria-hidden','true');copy.inert=true;copy.dataset.previewIndex=String(index);
  copy.querySelectorAll('[tabindex]').forEach(el=>el.removeAttribute('tabindex'));copy.querySelectorAll('button,a').forEach(el=>el.tabIndex=-1);
  const moment=copy.querySelector('.moment-ad'),wrap=copy.querySelector('.ad-image-wrap'),image=copy.querySelector('.ad-capture-frame>img');
  moment.classList.toggle('captured-ad',!!ad.capture);wrap.classList.toggle('capture-media',!!ad.capture);wrap.style.cssText=captureStyle(ad.capture);
  copy.querySelector('.moment-profile b').textContent=ad.brand||ad.title;const avatar=copy.querySelector('.brand-avatar');avatar.textContent=(ad.brand||'创')[0];if(ad.avatar){const img=new Image();img.alt='';img.src=ad.avatar;avatar.replaceChildren(img)}
  if(image){image.hidden=!ad.image;if(ad.image){image.src=ad.image;image.alt=''}image.draggable=false}
  const placeholder=copy.querySelector('.ad-image-placeholder');if(placeholder)placeholder.hidden=!!ad.image;
  copy.querySelector('.ad-caption').textContent=ad.caption;copy.querySelector('.ad-card-bottom>span').textContent=sourceSummary(ad)||'广告';
  const hasVote=session.votes.some(vote=>vote.id===ad.id);copy.querySelector('.heart-vote').hidden=hasVote;copy.querySelector('.heart-vote').disabled=false;copy.querySelector('.already-voted').hidden=!hasVote;copy.querySelector('.vote-button-copy small').textContent=ad.brand.split(/\s/).slice(-1)[0]||'';
  styleVoteHeart(copy.querySelector('.heart-vote'),index);
  styleVoteHeart(copy.querySelector('.already-voted'),index);
  return copy;
 }
 function placeAdSlide(slide,x){const progress=Math.min(1,Math.abs(x)/carouselStep());slide.style.transform=`translate3d(${x}px,0,0) rotateY(${-Math.sign(x)*progress*4}deg) scale(${1-progress*.018})`}
 function syncAdNeighbors(){
  const carousel=$('#ad-carousel');if(!carousel||adCarouselBusy)return;carousel.querySelectorAll('.ad-carousel-slide').forEach(el=>el.remove());
  for(const direction of [-1,1]){const index=session.index+direction;if(index<0||index>=ads.length)continue;const copy=cloneAdScene(index);copy.dataset.direction=String(direction);carousel.append(copy);placeAdSlide(copy,direction*carouselStep())}
 }
 function cancelAdCarousel(){
  adSlideToken++;clearTimeout(adCarouselTimer);if(adTransitionCleanup){adTransitionCleanup();adTransitionCleanup=null}adCarouselBusy=false;adPointer=null;adDragOffset=0;
  const carousel=$('#ad-carousel'),scene=$('#vote-scene');if(!carousel||!scene)return;carousel.classList.remove('is-dragging','is-switching');carousel.querySelectorAll('.ad-carousel-slide').forEach(el=>el.remove());carousel.style.removeProperty('min-height');scene.style.removeProperty('transform');scene.style.removeProperty('transition');scene.style.removeProperty('pointer-events');
  const heading=$('.vote-heading');heading.style.removeProperty('opacity');heading.style.removeProperty('transition');if(view==='vote'&&manifestReady){$('#previous-ad').disabled=session.index===0||!!pendingFlightId;$('#next-ad').disabled=session.index===ads.length-1||!!pendingFlightId;$('#next-step').disabled=!session.votes.length||!!pendingFlightId}
 }
 function finishAdSlide(token){if(token!==adSlideToken)return;cancelAdCarousel();if(view==='vote')renderAd()}
 function paintAdDrag(offset){
  adDragOffset=offset;const scene=$('#vote-scene');placeAdSlide(scene,offset);$('#ad-carousel').querySelectorAll('.ad-carousel-slide').forEach(slide=>placeAdSlide(slide,Number(slide.dataset.direction)*carouselStep()+offset));$('.vote-heading').style.opacity=String(1-Math.min(.7,Math.abs(offset)/carouselStep()*.8));
 }
 function settleAdDrag(){
  if(!adDragOffset){adPointer=null;return}adCarouselBusy=true;const token=++adSlideToken,scene=$('#vote-scene'),carousel=$('#ad-carousel'),duration=reduced()?0:260;carousel.classList.remove('is-dragging');carousel.classList.add('is-switching');
  for(const el of [scene,...carousel.querySelectorAll('.ad-carousel-slide')])el.style.transition=`transform ${duration}ms cubic-bezier(.2,.7,.25,1)`;
  $('.vote-heading').style.transition=`opacity ${duration}ms ease`;requestAnimationFrame(()=>{if(token!==adSlideToken)return;paintAdDrag(0);$('.vote-heading').style.opacity='1'});adCarouselTimer=setTimeout(()=>finishAdSlide(token),duration+35);
 }
 function moveAd(direction){
  if(!manifestReady||view!=='vote'||pendingFlightId||adCarouselBusy)return;const index=session.index+direction;
  if(index<0||index>=ads.length){settleAdDrag();return}
  if(reduced()){cancelAdCarousel();session.index=index;displayedIndex=index;save();renderAd();return}
  $('#vote-view').classList.remove('vote-entry');const scene=$('#vote-scene'),carousel=$('#ad-carousel'),offset=adDragOffset,step=carouselStep(),outgoing=cloneAdScene(session.index),token=++adSlideToken;
  adCarouselBusy=true;adPointer=null;carousel.classList.remove('is-dragging');carousel.classList.add('is-switching');carousel.style.minHeight=scene.offsetHeight+'px';carousel.querySelectorAll('.ad-carousel-slide').forEach(el=>el.remove());outgoing.classList.add('ad-outgoing');carousel.append(outgoing);placeAdSlide(outgoing,offset);
  session.index=index;displayedIndex=index;save();renderAd();scene.style.transition='none';scene.style.pointerEvents='none';placeAdSlide(scene,direction*step+offset);$('.vote-heading').style.opacity='.15';$('#previous-ad').disabled=true;$('#next-ad').disabled=true;$('#next-step').disabled=true;
  const duration=Math.max(220,Math.round(420*(1-Math.min(Math.abs(offset)/step,.65))));
  const end=event=>{if(event.target===scene&&event.propertyName==='transform')finishAdSlide(token)};scene.addEventListener('transitionend',end);adTransitionCleanup=()=>scene.removeEventListener('transitionend',end);
  requestAnimationFrame(()=>requestAnimationFrame(()=>{if(token!==adSlideToken||view!=='vote')return;scene.style.transition=`transform ${duration}ms cubic-bezier(.2,.7,.25,1)`;outgoing.style.transition=scene.style.transition;$('.vote-heading').style.transition=`opacity ${Math.min(duration,210)}ms ease`;placeAdSlide(scene,0);placeAdSlide(outgoing,-direction*step);$('.vote-heading').style.opacity='1'}));
  adCarouselTimer=setTimeout(()=>finishAdSlide(token),duration+100);
 }
 function bindAdDrag(){
  const carousel=$('#ad-carousel');carousel.addEventListener('dragstart',event=>event.preventDefault());
  carousel.addEventListener('pointerdown',event=>{if(view!=='vote'||!manifestReady||pendingFlightId||adCarouselBusy||event.target.closest('button,a'))return;adPointer={id:event.pointerId,x:event.clientX,y:event.clientY,time:performance.now(),dragging:false};adDragOffset=0});
  carousel.addEventListener('pointermove',event=>{if(!adPointer||adPointer.id!==event.pointerId)return;const dx=event.clientX-adPointer.x,dy=event.clientY-adPointer.y;if(!adPointer.dragging){if(Math.abs(dy)>9&&Math.abs(dy)>Math.abs(dx)*1.15){adPointer=null;return}if(Math.abs(dx)<8||Math.abs(dx)<Math.abs(dy)*1.15)return;adPointer.dragging=true;carousel.classList.add('is-dragging');try{carousel.setPointerCapture(event.pointerId)}catch{}}
   if(event.cancelable)event.preventDefault();let offset=dx;if((offset>0&&session.index===0)||(offset<0&&session.index===ads.length-1))offset*=.23;paintAdDrag(Math.max(-carouselStep()*.94,Math.min(carouselStep()*.94,offset)));
  });
  function release(event,cancelled=false){if(!adPointer||adPointer.id!==event.pointerId)return;const drag=adPointer,offset=adDragOffset;adPointer=null;if(!drag.dragging)return;try{carousel.releasePointerCapture(event.pointerId)}catch{}const distance=Math.abs(offset),quick=performance.now()-drag.time<300&&distance>27;if(!cancelled&&(distance>Math.min(76,carouselStep()*.2)||quick)){moveAd(offset<0?1:-1)}else settleAdDrag()}
  carousel.addEventListener('pointerup',event=>release(event));carousel.addEventListener('pointercancel',event=>release(event,true));
 }
 bindAdDrag();
 $('#previous-ad').addEventListener('click',()=>moveAd(-1));$('#next-ad').addEventListener('click',()=>moveAd(1));$('#next-step').addEventListener('click',()=>{if(!pendingFlightId)show('choose')});$('#ad-source').addEventListener('click',()=>{if(currentAd().sourceUrl)window.open(currentAd().sourceUrl,'_blank','noopener,noreferrer')});
 function bindSwipe(element,move,enabled=()=>true,includeButtons=false){let start=null;element.addEventListener('pointerdown',event=>{if(!enabled()||(!includeButtons&&event.target.closest('button,a')))return;start={x:event.clientX,y:event.clientY,id:event.pointerId}});element.addEventListener('pointerup',event=>{if(!start||start.id!==event.pointerId)return;const dx=event.clientX-start.x,dy=event.clientY-start.y;start=null;if(enabled()&&Math.abs(dx)>45&&Math.abs(dx)>Math.abs(dy)*1.5){if(includeButtons){const suppress=event=>{event.preventDefault();event.stopPropagation()};element.addEventListener('click',suppress,{once:true,capture:true});setTimeout(()=>element.removeEventListener('click',suppress,true),300)}move(dx<0?1:-1)}});element.addEventListener('pointercancel',()=>start=null)}
 bindSwipe($('#card-carousel'),moveCard,()=>view==='card');
 bindSwipe($('#heart-choices'),moveChoice,()=>view==='choose'&&!pendingChoice,true);
 $('#heart-choices').addEventListener('dragstart',event=>event.preventDefault());
 window.addEventListener('keydown',event=>{if($('dialog[open]')||pendingFlightId||pendingChoice)return;if(event.key==='ArrowRight'||event.key==='ArrowLeft'){const direction=event.key==='ArrowRight'?1:-1;if(view==='vote'){event.preventDefault();moveAd(direction)}else if(view==='choose'){event.preventDefault();moveChoice(direction)}else if(view==='card'){event.preventDefault();moveCard(direction)}}});
 $('#vote-button').addEventListener('click',()=>{if(!manifestReady||view!=='vote'||currentVote()||pendingFlightId||session.votes.length>=MAX_VOTES)return;const adId=currentAd().id;session.votes.push({id:adId});save();if(!session.votes.some(vote=>vote.id===adId)){renderAd();return}if(reduced()){renderAd();return}launchFlight()});
 function availableCards(){const earned=earnedCardIds(session,ads.map(ad=>ad.id));return CARDS.filter(card=>earned.includes(card.id))}
 function votedBrandNames(){return [...new Set(session.votes.map(vote=>ads.find(ad=>ad.id===vote.id)?.brand).filter(Boolean).map(name=>name.match(/[\u3400-\u9fff][\u3400-\u9fff·-]*/g)?.join('')||name))]}
 function positionMailScene(){
  const flow=$('#mail-flow');if(!flow||!flow.clientWidth)return;
  const width=flow.clientWidth,u=width/402,frameWidth=width*.88,frameX=(width-frameWidth)/2,frameY=47*u;
  // Paper and export share the same 1000×1600 frame; no second paper scale.
  const envelopeY=frameY+frameWidth*.83,envelopeHeight=frameWidth*.70,paperY=frameY;
  for(const [key,value] of Object.entries({'--mailbox-x':frameX+frameWidth*.5,'--mailbox-y':envelopeY,'--mailbox-width':frameWidth*.9,'--mailbox-height':envelopeHeight,'--letter-paper-x':frameX,'--letter-paper-y':paperY,'--letter-paper-width':frameWidth,'--letter-paper-height':frameWidth*1.6,'--letter-emerge-distance':envelopeY+envelopeHeight*.40-paperY,'--letter-actions-y':frameY+frameWidth*1.6+10*u,'--letter-frame-x':frameX,'--letter-frame-y':frameY,'--letter-frame-width':frameWidth}))flow.style.setProperty(key,value+'px');
 }
 function updateChoiceCarousel({animate=false}={}){
  const cards=availableCards(),stage=$('#heart-choices'),opening=!!stage.dataset.opening,motion=animate&&!reduced()&&typeof stage.animate==='function',previous=motion?[...stage.querySelectorAll('.choice-slide')].map(slide=>({id:slide.dataset.card,current:slide.classList.contains('is-current'),rect:slide.getBoundingClientRect(),opacity:getComputedStyle(slide).opacity})):[];let index=cards.findIndex(card=>card.id===session.currentCard);
  if(index<0){index=0;session.currentCard=cards[0]?.id||null}const card=cards[index],offsets=cards.length>1?[-1,0,1]:cards.length?[0]:[];
  stage.innerHTML=offsets.map(offset=>{const item=cards[(index+offset+cards.length)%cards.length],position=offset<0?'previous':offset>0?'next':'current',src=globalThis.CHOICE_BALLOON_ASSETS?.[item.id]||'assets/choice-balloons-v32/'+item.id+'.png';return `<button type="button" class="choice-slide is-${position}" data-card="${item.id}" style="--ink:${item.ink}" aria-label="${offset?'切换到':'打开'}${item.name}心意卡" aria-current="${!offset}" ${opening?'disabled':''}><img src="${escapeHTML(src)}" alt="${item.name}" draggable="false"><svg class="choice-thread" viewBox="0 0 32 48" aria-hidden="true"><path d="M16 1C28 14 6 18 13 29S22 39 9 47"/></svg></button>`}).join('');
  if(motion){const options={duration:420,easing:'cubic-bezier(.2,.7,.25,1)'},width=stage.getBoundingClientRect().width;for(const slide of stage.querySelectorAll('.choice-slide')){
   const rect=slide.getBoundingClientRect(),style=getComputedStyle(slide),candidates=previous.filter(item=>item.id===slide.dataset.card&&!item.used),old=candidates.find(item=>item.current)||candidates.sort((a,b)=>Math.abs(a.rect.left-rect.left)-Math.abs(b.rect.left-rect.left))[0],wrapped=old&&!old.current&&!slide.classList.contains('is-current')&&Math.abs(old.rect.left-rect.left)>width/2;
   if(!old||wrapped||!rect.width){slide.animate([{opacity:0},{opacity:style.opacity}],options);continue}old.used=true;
   const base=style.transform==='none'?'':style.transform;slide.animate([{transform:`translate(${old.rect.left-rect.left}px,${old.rect.top-rect.top}px) ${base} scale(${old.rect.width/rect.width})`,transformOrigin:'0 0',opacity:old.opacity},{transform:base||'none',transformOrigin:'0 0',opacity:style.opacity}],options);
  }}
  $('#choice-vote-count').textContent=session.votes.length;$('#choice-description').textContent=card?.description||'先为喜欢的好创意投票，收获一份心意。';$('#choose-vote-summary').textContent='本次投票获得 '+cards.length+' 份心意';
  $('#make-cards').disabled=opening||!card;$('#make-cards').innerHTML=opening?'心意来信，正在展开…':card?'带走「'+card.name+'」心意卡 <span aria-hidden="true">→</span>':'先去投票，收获心意';
  $('#choice-previous').disabled=opening||cards.length<2;$('#choice-next').disabled=opening||cards.length<2;stage.setAttribute('aria-label','本次投票获得'+cards.length+'份心意，左右滑动选择');positionMailScene();
 }
 function renderChoices(){
  const stage=$('#heart-choices');stage.classList.remove('letter-in-flight');delete stage.dataset.opening;
  const flow=$('#mail-flow');if(!flow.querySelector(':scope > .mailbox'))flow.insertAdjacentHTML('beforeend',`<div class="mailbox" aria-hidden="true"><span class="mailbox-back"></span><span class="mailbox-lid"></span><span class="mailbox-front"><i class="mailbox-mark"><img src="${globalThis.ANNIVERSARY_MARK||'assets/anniversary-mark-v22.png'}" alt=""></i></span></div>`);
  updateChoiceCarousel();availableCards().forEach(card=>preloadLetter(card.id).catch(()=>{}));
 }
 function chooseCard(id,{focus=false}={}){
  if(view!=='choose'||pendingChoice||$('#heart-choices').dataset.opening||!availableCards().some(card=>card.id===id))return;
  session.currentCard=id;save();updateChoiceCarousel({animate:true});if(focus)$('#heart-choices .is-current')?.focus({preventScroll:true});
 }
 function moveChoice(direction){const cards=availableCards();if(view!=='choose'||cards.length<2)return;const index=cards.findIndex(card=>card.id===session.currentCard);chooseCard(cards[(index+direction+cards.length)%cards.length].id)}
 $('#heart-choices').addEventListener('click',event=>{
  const button=event.target.closest('.choice-slide');if(!button||button.disabled)return;
  if(button.classList.contains('is-current'))window.openHeartLetter(button.dataset.card);else chooseCard(button.dataset.card,{focus:true});
 });
 $('#choice-previous').addEventListener('click',()=>moveChoice(-1));$('#choice-next').addEventListener('click',()=>moveChoice(1));
 $('#make-cards').addEventListener('click',()=>window.openHeartLetter(session.currentCard));
 window.addEventListener('resize',()=>{if(view==='choose')updateChoiceCarousel();else if(view==='card')positionMailScene()});
 $('#choose-voting').addEventListener('click',()=>show('vote'));
 function renderCards({reveal=true}={}){
  if(!reveal){clearTimeout(motionTimer);pendingChoice=null;$('#mail-flow').classList.remove('letter-is-switching');$('#card-view').classList.remove('card-return')}
  const cards=availableCards();if(!cards.length){show('choose',{replace:true});return}if(!cards.some(card=>card.id===session.currentCard))session.currentCard=cards[0].id;
  $('#card-track').innerHTML=cards.map(card=>`<figure class="keepsake-slide" aria-label="${card.name}心意卡"><img src="${escapeHTML(letterCardSource(card.id))}" alt="${card.name} · 腾讯十周年心意纪念卡" data-card-art="${card.id}" draggable="false"></figure>`).join('');
  $$('[data-card-art]').forEach(img=>{img.addEventListener('error',()=>{failedCards.add(img.dataset.cardArt);if(view==='card')updateCardPosition()});img.addEventListener('load',()=>{failedCards.delete(img.dataset.cardArt);if(view==='card')updateCardPosition()})});
  $('#card-dots').innerHTML=cards.map(card=>`<button data-card-dot="${card.id}" aria-label="查看${card.name}心意卡"></button>`).join('');$('#card-view').classList.remove('card-reveal');positionMailScene();if(reveal&&!reduced()){$('#card-view').classList.add('card-reveal');motionTimer=setTimeout(finishLetterReveal,2500)}else $('#mail-flow').classList.remove('letter-is-unsealing');updateCardPosition();
 }
 function updateCardPosition(){
  const cards=availableCards();if(!cards.length){show('choose',{replace:true});return}let index=cards.findIndex(card=>card.id===session.currentCard);if(index<0){index=0;session.currentCard=cards[0].id}const card=cards[index],flow=$('#mail-flow');card.sky.forEach((color,i)=>flow.style.setProperty(['--sky-a','--sky-b','--sky-c'][i],color));flow.style.setProperty('--letter-ink',card.ink);$('#letter-vote-summary').innerHTML='为好创意投下 <b class="letter-vote-count">'+session.votes.length+'</b> 份喜欢';const brands=votedBrandNames();$('#letter-vote-brands').innerHTML=[brands.slice(0,2),brands.slice(2,4)].filter(row=>row.length).map(row=>'<span>'+escapeHTML(row.join(' · '))+'</span>').join('');$('#card-track').style.transform=`translateX(-${index*100}%)`;$('#card-title').textContent=card.name+'心意卡';$('#card-name').textContent=card.name;$$('.keepsake-slide').forEach((slide,i)=>slide.classList.toggle('active',i===index));$('#card-collected').textContent=session.collected.includes(card.id)?'✓ 这份心意，已收下':'';$('#card-position').textContent=(index+1)+' / '+cards.length;$('#card-carousel').setAttribute('aria-label',cards.length+'张心意卡，左右滑动可切换');$('#card-view').dataset.cardCount=String(cards.length);$('#card-view').dataset.letter=card.id;$('#letter-blessing').textContent=letterBlessings[card.id];
  $$('[data-card-dot]').forEach(button=>{const active=button.dataset.cardDot===card.id;button.classList.toggle('active',active);button.setAttribute('aria-current',active?'true':'false')});const revealing=$('#card-view').classList.contains('card-reveal')||!!pendingChoice||downloading;$$('[data-card-dot]').forEach(button=>button.disabled=revealing);$('#card-prev').disabled=revealing||index===0;$('#card-next').disabled=revealing||index===cards.length-1;$('#save-card').disabled=revealing||downloading||failedCards.has(card.id);$('#card-load-note').hidden=!failedCards.has(card.id);$('#save-card').innerHTML=downloading?'正在准备这份心意…':'收下这封心意 <span>↓</span>';displayedCard=session.currentCard;
 }
 async function switchCard(id){
  const card=availableCards().find(item=>item.id===id);if(view!=='card'||!card||id===session.currentCard||pendingChoice||downloading||$('#card-view').classList.contains('card-reveal'))return;
  pendingChoice=id;updateCardPosition();try{await preloadLetter(id)}catch{if(view==='card'&&pendingChoice===id){pendingChoice=null;updateCardPosition();toast('这封来信还没准备好，请再试一次。')}return}
  if(view!=='card'||pendingChoice!==id)return;
  window.scrollTo({top:0,behavior:reduced()?'instant':'smooth'});const flow=$('#mail-flow');flow.classList.add('letter-is-switching');$('#card-view').classList.add('card-return');
  motionTimer=setTimeout(()=>{if(view!=='card'||pendingChoice!==id)return;session.currentCard=id;save();flow.classList.remove('letter-is-open','letter-is-unsealing','letter-is-switching');$('#card-view').classList.remove('card-return');void flow.offsetWidth;flow.classList.add('letter-is-open','letter-is-unsealing');pendingChoice=null;renderCards()},reduced()?0:680);
 }
 function moveCard(direction){if(view!=='card'||pendingChoice||$('#card-view').classList.contains('card-reveal'))return;const cards=availableCards(),index=cards.findIndex(card=>card.id===session.currentCard),next=Math.max(0,Math.min(cards.length-1,index+direction));switchCard(cards[next].id)}
 $('#card-prev').addEventListener('click',()=>moveCard(-1));$('#card-next').addEventListener('click',()=>moveCard(1));$('#card-dots').addEventListener('click',event=>{const button=event.target.closest('[data-card-dot]');if(!button||button.disabled||!availableCards().some(card=>card.id===button.dataset.cardDot))return;switchCard(button.dataset.cardDot)});
 function backToChoices(){if(history.at(-1)?.view==='choose')history.pop();show('choose',{replace:true});window.scrollTo({top:0,behavior:'instant'})}
 function finishLetterReveal(){clearTimeout(motionTimer);$('#card-view').classList.remove('card-reveal');$('#mail-flow').classList.remove('letter-is-unsealing');if(view==='card')updateCardPosition()}
 $('#card-view').addEventListener('animationend',event=>{if(event.animationName==='letter-emerge')finishLetterReveal()});
 $('#card-back-to-choose').addEventListener('click',backToChoices);$('#card-back-bottom').addEventListener('click',backToChoices);
 async function downloadLetterPNG(snapshot){
  const response=await fetch(snapshot.source,{cache:'no-store'});if(!response.ok)throw new Error('card asset');let blob=await response.blob();if(blob.type.includes('svg')){const xml=new DOMParser().parseFromString(await blob.text(),'image/svg+xml');const profileName=xml.querySelector('[data-dynamic="profile-name"]');if(profileName)profileName.textContent=snapshot.profileName;const count=xml.querySelector('[data-dynamic="vote-count"]');if(count)count.textContent=snapshot.voteCount;for(let i=0;i<2;i++){const row=xml.querySelector('[data-dynamic="vote-brands-'+(i+1)+'"]');if(row)row.textContent=snapshot.voteBrands.slice(i*2,i*2+2).join(' · ')}const recipient=xml.querySelector('[data-dynamic="letter-index"]');if(recipient)recipient.textContent='收信人';blob=new Blob([new XMLSerializer().serializeToString(xml)],{type:'image/svg+xml;charset=utf-8'})}const url=URL.createObjectURL(blob);let output;
  try{const image=new Image();image.src=url;await image.decode();const canvas=document.createElement('canvas');canvas.width=1000;canvas.height=1600;canvas.getContext('2d').drawImage(image,0,0,1000,1600);output=await new Promise(resolve=>canvas.toBlob(resolve,'image/png'));if(!output)throw new Error('export');}finally{URL.revokeObjectURL(url)}
  const fileURL=URL.createObjectURL(output),link=document.createElement('a');link.href=fileURL;link.download=snapshot.filename;document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(fileURL),30000);
 }
 $('#save-card').addEventListener('click',async()=>{
  if(downloading||view!=='card'||!availableCards().some(card=>card.id===session.currentCard)||failedCards.has(session.currentCard))return;const snapshot=snapshotDownload(session.currentCard,session.round,globalThis.CARD_ASSETS||{});if(!snapshot)return;Object.assign(snapshot,{profileName:KEEPSAKE_PROFILE.nickname,voteCount:session.votes.length,voteBrands:votedBrandNames(),ordinal:availableCards().findIndex(card=>card.id===snapshot.id)+1,total:availableCards().length});downloading=true;updateCardPosition();
  try{await downloadLetterPNG(snapshot);if(session.round===snapshot.round){session=collectCard(session,snapshot.id,ads.map(ad=>ad.id));save()}toast('这张'+snapshot.name+'心意卡，已为你准备好。')}
  catch{toast('这张心意卡暂时没能保存，请再试一次')}
  finally{downloading=false;if(view==='card')updateCardPosition();if(view==='choose')renderChoices()}
 });
 function renderWorks(){ $('#works-dialog h2').textContent='今年的好创意';$('#works-list').innerHTML=ads.map((ad,i)=>`<button class="work-choice" data-work-index="${i}">${adThumbnail(ad)}<span>${escapeHTML(ad.title)}<small>${escapeHTML(ad.brand)}</small></span><i>${session.votes.some(vote=>vote.id===ad.id)?'已票选':'查看'}</i></button>`).join('')}
 $('#open-works').addEventListener('click',()=>{renderWorks();openDialog('#works-dialog')});$('#works-list').addEventListener('click',event=>{const button=event.target.closest('[data-work-index]');if(!button)return;session.index=Number(button.dataset.workIndex);save();show('vote')});
 window.addEventListener('storage',event=>{if(event.key!==STORE)return;try{const raw=JSON.parse(event.newValue||'null');if(!manifestReady){savedRaw=raw;return}session=mergeSession(session,normalizeSession(raw,ads.map(ad=>ad.id)),ads.map(ad=>ad.id));refreshVoteCounts();if(pendingFlightId&&!session.votes.some(vote=>vote.id===pendingFlightId))stopMotion();if(['choose','card'].includes(view)&&!session.votes.length){show('vote',{replace:true});return}if(view==='choose')renderChoices();if(view==='card')renderCards({reveal:false});if(view==='vote')renderAd()}catch{}});
 async function loadManifest(){try{const manifest=globalThis.AD_MANIFEST||await fetch('assets/ads/manifest.json',{cache:'no-cache'}).then(response=>{if(!response.ok)throw new Error('manifest');return response.json()});ads=normalizeAds(manifest)}catch{ads=normalizeAds(null)}session=normalizeSession(savedRaw,ads.map(ad=>ad.id));if(!session.round)session.round=Date.now();displayedIndex=session.index;displayedCard=session.currentCard;manifestReady=true;$('#begin-voting').disabled=false;renderShowcase();save();const rect=$('#showcase').getBoundingClientRect();if(rect.top<innerHeight*.4&&rect.bottom>innerHeight*.6)scheduleEntry()}
 hydrateBalloons();renderShowcase();loadManifest();
}
