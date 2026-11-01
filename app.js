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
function wheelOffset(slot,position,size){return ((slot-position+size/2)%size+size)%size-size/2}
function previousPage(pages,session){while(pages.length){const page=pages.pop();if(['choose','card'].includes(page.view)&&!session.votes.length)continue;return page}return {view:'landing',index:session.index,currentCard:session.currentCard}}
function snapshotDownload(id,round,assets={}){const card=CARDS.find(item=>item.id===id);if(!card)return null;const mapped=assets[id],source=typeof mapped==='string'&&(/^(data:image\/(?:png|svg\+xml)[;,]|blob:)/i.test(mapped)||/^assets\/(?:cards|letters-v32)\/[\w.-]+\.(?:png|svg)$/.test(mapped))?mapped:'assets/letters-v32/'+id+'.svg';return {id:card.id,name:card.name,round,source,filename:'心意升空-2026-'+card.name+'-腾讯十周年心意卡.png'}}
if(typeof module!=='undefined')module.exports={CARDS,VOTE_EFFECTS,earnedCardIds,normalizeSession,collectCard,mergeSession,normalizeCapture,safeSource,normalizeAds,previousPage,snapshotDownload};
if(typeof document==='undefined'&&typeof require!=='undefined'&&require.main===module){
 const assert=require('node:assert/strict'),ads=normalizeAds(null),ids=ads.map(ad=>ad.id);
 const shell=require('node:fs').readFileSync(require('node:path').join(__dirname,'index.html'),'utf8'),hostScript=shell.match(/<script id="host-detection">([\s\S]*?)<\/script>/)[1];
 for(const [ua,host] of [['Mozilla/5.0 iPhone Safari/604.1',undefined],['Mozilla/5.0 Android Chrome/130.0',undefined],['Mozilla/5.0 iPhone MicroMessenger/8.0.55','wechat'],['Mozilla/5.0 Android MicroMessenger/8.0.55','wechat']]){const root={dataset:{}};require('node:vm').runInNewContext(hostScript,{navigator:{userAgent:ua},document:{documentElement:root}});assert.equal(root.dataset.host,host)}
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
 // A loop may recycle only offscreen nodes; visible positions stay continuous.
 for(const count of [2,3,4]){const size=count*3;for(let position=count;position<count*3;position+=.125){
  const visible=p=>Array.from({length:size},(_,slot)=>({id:slot%count,x:wheelOffset(slot,p,size)})).filter(item=>Math.abs(item.x)<2).sort((a,b)=>a.x-b.x).map(item=>[item.id,Math.round(item.x*1000)]);
  assert.deepEqual(visible(position),visible(position+count));
  for(let slot=0;slot<size;slot++){const before=wheelOffset(slot,position,size),after=wheelOffset(slot,position+.01,size);if(Math.abs(before)<2&&Math.abs(after)<2)assert.ok(Math.abs(after-before+.01)<1e-8)}
 }}
 console.log('PASS: WeChat/browser host bootstrap, continuous 2/3/4-card wheel seams, 16 earned subsets, collection/reset and safe downloads.');
}
if(typeof document!=='undefined'){
 const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
 const reduced=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;
 let ads=normalizeAds(null),session=normalizeSession(null,ads.map(ad=>ad.id)),view='landing',displayedIndex=0,displayedCard=CARDS[0].id,history=[],motionTimer,entryTimer,toastTimer,pendingFlightId=null,pendingChoice=null,manifestReady=false,downloading=false;
 const failedCards=new Set();
 let adCarouselBusy=false,adPointer=null,adPosition=0,adTarget=0,adLiveSlot=0,adFrame=0,adMotion=null,adGeometry=null,adPreviews=[],adPreviewSignature='',adHandingOff=false,adHandoffToken=0,entryFinished=false;
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
  const effect=VOTE_EFFECTS[session.index%VOTE_EFFECTS.length],pageWash={mint:'#e0ffed',peach:'#fff0f3',lilac:'#f1eaff',champagne:'#fff9e6'},pageInk={mint:'#27bc78',peach:'#e27f98',lilac:'#9c83d2',champagne:'#e4b16d'};$('#vote-view').style.setProperty('--vote-page-wash',pageWash[effect.id]);$('.phone-app').style.setProperty('--vote-page-wash',pageWash[effect.id]);$('#vote-view').style.setProperty('--vote-page-ink',pageInk[effect.id]);themeLabel.textContent=CARDS.find(card=>card.id===effect.cardId).name+' · 为好创意升空';flight.dataset.effect=effect.id;flight.style.setProperty('--flight-duration',effect.duration+'ms');
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
  $('#vote-scene').classList.add('vote-is-flying');$('#ad-carousel').classList.add('vote-feedback-active');button.disabled=true;flight.classList.add('active');$('#next-step').disabled=true;$('#previous-ad').disabled=true;$('#next-ad').disabled=true;
  motionTimer=setTimeout(()=>completeFlight(pendingFlightId),effect.duration+100);
 }
 $('.flight-balloon').addEventListener('animationend',event=>{if(event.target===$('.flight-balloon'))completeFlight(pendingFlightId)});

 function hydrateBalloons(scope=document){for(const el of scope.querySelectorAll('[data-balloon]')){if(el.querySelector(':scope > img'))continue;const key=el.dataset.balloon,img=new Image();el.style.setProperty('--balloon-color',balloonColors[key[0]]||balloonColors.G);img.alt='';img.draggable=false;img.addEventListener('error',()=>{if(key==='vote-feedback'&&!img.dataset.usedFallback){img.dataset.usedFallback='1';el.closest('.flight-surface')?.classList.add('feedback-fallback');img.src=balloonSource('G2');return}el.classList.add('asset-missing')});img.addEventListener('load',()=>{el.classList.remove('asset-missing');if(key==='vote-feedback')el.closest('.flight-surface')?.classList.toggle('feedback-fallback',!!img.dataset.usedFallback)});img.src=balloonSource(key);el.append(img)}}
 function toast(message){clearTimeout(toastTimer);$('#toast').textContent=message;$('#toast').classList.add('visible');toastTimer=setTimeout(()=>$('#toast').classList.remove('visible'),2500)}
 function refreshVoteCounts(){$$('.vote-count').forEach(el=>el.textContent=session.votes.length)}
 // Keep progress only for this open page; a new visit always starts empty.
 function save(){refreshVoteCounts()}
 function currentAd(){return ads[session.index]}
 function currentVote(){return session.votes.find(vote=>vote.id===currentAd().id)}
 function closeAllDialogs(){$$('dialog[open]').forEach(dialog=>dialog.close());document.body.style.overflow=''}
 function stopMotion({keepLetters=false}={}){cancelChoiceMotion();cancelAdCarousel();clearTimeout(entryTimer);clearTimeout(motionTimer);pendingFlightId=null;pendingChoice=null;$('#mail-flow').classList.remove('letter-is-switching');$('#card-view').classList.remove('card-return');$('#vote-flight').hidden=true;$('#vote-flight').classList.remove('active');$('#vote-scene').classList.remove('vote-is-flying','vote-is-returning');$('#ad-carousel').classList.remove('vote-feedback-active','vote-feedback-returning');if(!keepLetters){$('#mail-flow')?.classList.remove('letter-is-unsealing');const letters=$('#heart-choices');letters.classList.remove('letter-in-flight');delete letters.dataset.opening;$$('.heart-choice.opening,.heart-choice.letter-sending').forEach(el=>el.classList.remove('opening','letter-sending'));if(view==='choose')updateChoiceCarousel();if(view==='card'&&availableCards().length){$('#card-view').classList.remove('card-reveal');updateCardPosition()}}$('#vote-button').disabled=false}
 function show(next,{replace=false}={}){
  if(next!=='landing'&&!manifestReady)return;
  if(next==='card'&&!availableCards().length)next='choose';
  if(['choose','card'].includes(next)&&!session.votes.length){toast('先为一个喜欢的好创意投票吧');next='vote'}
  stopMotion({keepLetters:next==='card'&&view==='choose'&&!!pendingChoice});closeAllDialogs();$('#vote-view').classList.remove('vote-entry');$('#landing-view').classList.remove('landing-entering');$('#showcase').classList.remove('entry-running');entryFinished=false;if(next!==view&&!replace)history.push({view,index:displayedIndex,currentCard:displayedCard});
  const previousView=view;$('#choose-view').classList.remove('choice-enter');view=next;displayedIndex=session.index;displayedCard=session.currentCard;const mailFlow=$('#mail-flow');mailFlow.hidden=!['choose','card'].includes(next);mailFlow.classList.toggle('letter-is-open',next==='card');$('#choose-view').inert=next==='card';$('#choose-view').setAttribute('aria-hidden',String(next==='card'));$$('.view').forEach(el=>el.hidden=el.id!==next+'-view'&&!(next==='card'&&el.id==='choose-view'));
  if(next==='vote')renderAd();if(next==='choose')renderChoices();if(next==='card')renderCards({reveal:previousView!=='card'});
  if(!['choose','card'].includes(next)||!['choose','card'].includes(previousView))window.scrollTo({top:0,behavior:'instant'});const title=$('#'+next+'-view h1');if(title){title.tabIndex=-1;title.focus({preventScroll:true})}
  $('#back-button').textContent=next==='landing'?'×':'‹';$('#back-button').setAttribute('aria-label',next==='landing'?'返回封面顶部':'返回上一页');
 }
 function completeFlight(adId){
  if(!adId||pendingFlightId!==adId||$('#ad-carousel').classList.contains('vote-feedback-returning'))return;
  clearTimeout(motionTimer);flight.hidden=true;flight.classList.remove('active');$('#vote-scene').classList.replace('vote-is-flying','vote-is-returning');$('#ad-carousel').classList.replace('vote-feedback-active','vote-feedback-returning');updateAdVoteState();
  motionTimer=setTimeout(()=>{if(pendingFlightId!==adId||view!=='vote')return;pendingFlightId=null;$('#vote-scene').classList.remove('vote-is-returning');$('#ad-carousel').classList.remove('vote-feedback-returning');updateAdVoteState()},reduced()?0:800);
 }
 function openDialog(id){if(pendingFlightId)completeFlight(pendingFlightId);else stopMotion();closeAllDialogs();$(id).showModal();document.body.style.overflow='hidden'}
 $$('dialog').forEach(dialog=>{dialog.querySelector('.close-dialog').addEventListener('click',()=>dialog.close());dialog.addEventListener('close',()=>document.body.style.overflow='');dialog.addEventListener('click',event=>{const r=dialog.getBoundingClientRect();if(event.target===dialog&&(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom))dialog.close()})});
 function restart(){session=normalizeSession(null,ads.map(ad=>ad.id));session.round=Date.now();downloading=false;history=[];save();show('landing',{replace:true});$('#showcase').classList.remove('revealed')}
 $('#back-button').addEventListener('click',()=>{if(view==='landing'){window.scrollTo({top:0,behavior:reduced()?'instant':'smooth'});return}const previous=previousPage(history,session);session.index=previous.index;session.currentCard=previous.currentCard||session.currentCard;save();show(previous.view,{replace:true})});
 $('#menu-button').addEventListener('click',()=>openDialog('#menu-dialog'));$('#menu-cover').addEventListener('click',()=>show('landing'));$('#menu-results').addEventListener('click',()=>show('choose'));
 $('#menu-restart').addEventListener('click',()=>openDialog('#restart-dialog'));$('#restart-button').addEventListener('click',()=>openDialog('#restart-dialog'));$('#confirm-restart').addEventListener('click',restart);$('.close-restart').addEventListener('click',()=>$('#restart-dialog').close());$$('.rules-trigger').forEach(button=>button.addEventListener('click',()=>openDialog('#rules-dialog')));
 function startEntry(){
  if(view!=='landing'||!manifestReady||$('#landing-view').classList.contains('landing-entering')||$('dialog[open]'))return;
  $('#cover-start').blur();window.scrollTo({top:0,behavior:'instant'});$('#landing-view').classList.add('landing-entering');$('#showcase').classList.add('revealed','entry-running');
  if(reduced()){entryFinished=true;completeEntry();return}
  entryTimer=setTimeout(()=>{entryFinished=true;completeEntry()},4350);
 }
 $('#cover-start').addEventListener('click',startEntry);
 let coverPointer=null;
 $('#cover').addEventListener('pointerdown',event=>{coverPointer={x:event.clientX,y:event.clientY,id:event.pointerId}});
 $('#cover').addEventListener('pointerup',event=>{if(!coverPointer||coverPointer.id!==event.pointerId)return;const dx=event.clientX-coverPointer.x,dy=event.clientY-coverPointer.y;coverPointer=null;if(dy < -45&&Math.abs(dy)>Math.abs(dx)*1.3)startEntry()});
 $('#cover').addEventListener('pointercancel',()=>coverPointer=null);
 $('#cover').addEventListener('wheel',event=>{if(event.deltaY>16)startEntry()},{passive:true});
 function completeEntry(){if(view==='landing'&&manifestReady&&!$('dialog[open]')&&$('#landing-view').classList.contains('landing-entering')){session.index=0;save();show('vote');$('#vote-view').classList.add('vote-entry')}}
 $('#showcase').addEventListener('animationend',event=>{if(event.animationName!=='recording-ad-procession')return;entryFinished=true;completeEntry()});
 document.addEventListener('close',()=>{if(entryFinished&&view==='landing')completeEntry()},true);
 $('#begin-voting').addEventListener('click',startEntry);
 function captureStyle(capture){return capture?`--capture-width:${capture.sourceWidth/capture.width*100}%;--capture-height:${capture.sourceHeight/capture.height*100}%;--capture-left:${-capture.x/capture.width*100}%;--capture-top:${-capture.y/capture.height*100}%;--capture-ratio:${capture.width/capture.height};`:''}
 function adThumbnail(ad,className='work-thumb'){return ad.image?`<span class="${className} ${ad.capture?'capture-media':''}" style="${captureStyle(ad.capture)}">${ad.capture?'<span class="capture-clip">':''}<img src="${escapeHTML(ad.image)}" alt="${escapeHTML(ad.title)}" draggable="false">${ad.capture?'</span>':''}</span>`:`<span class="${className} empty-thumb"></span>`}
 const adModules={
  '2025-boucheron':{name:'Boucheron宝诗龙',avatar:[214,810,70,84],media:[324,879,618,513],detail:[324,1400,618,94],caption:'Boucheron宝诗龙：即刻探索全新#宝诗龙 Quatre Classique系列Tube作品。'},
  '2025-lays':{name:'范丞丞',avatar:[177,808,96,96],media:[305,882,678,508],detail:[305,1400,678,310],caption:'范丞丞：新年就吃乐事有乐事！2026年祝大家好运连连，乐事不断！'},
  '2025-mercedes':{name:'王楚钦',avatar:[190,810,96,96],media:[315,882,675,507],detail:[315,1400,675,110],caption:''},
  '2025-tiffany':{name:'Tiffany蒂芙尼',avatar:[185,810,96,96],media:[311,882,674,507],detail:[311,1400,674,340],caption:''}
 };
 function moduleRect(rect){return {x:rect[0],y:rect[1],width:rect[2],height:rect[3],sourceWidth:1206,sourceHeight:2622}}
 function moduleCapture(ad){return adModules[ad.id]?moduleRect(adModules[ad.id].media):ad.capture}
 function moduleAsset(ad,rect,cls){return `<span class="module-asset ${cls}" style="${captureStyle(moduleRect(rect))}"><img src="${escapeHTML(ad.image)}" alt="" draggable="false"></span>`}
 function paintAdModule(moment,ad,live=false){
  const spec=adModules[ad.id];if(!spec)return;const frame=ad.capture,percent=(value)=>value/frame.width*100+'%';moment.style.setProperty('--module-media-left',percent(spec.media[0]-frame.x));moment.style.setProperty('--module-media-width',percent(spec.media[2]));moment.style.setProperty('--module-avatar-left',percent(spec.avatar[0]-frame.x));const ident=id=>live?' id="'+id+'"':'';
  moment.classList.add('native-ad-module');moment.innerHTML=`<div class="moment-profile"><span${ident('brand-avatar')} class="brand-avatar">${moduleAsset(ad,spec.avatar,'module-avatar')}</span><div><b${ident('ad-brand')}>${escapeHTML(spec.name)}</b></div></div><div class="ad-image-wrap capture-media" style="${captureStyle(moduleCapture(ad))}"><div class="ad-capture-frame"><img${ident('ad-image')} src="${escapeHTML(ad.image)}" alt="${live?escapeHTML(ad.title):''}" draggable="false"><div${ident('ad-image-placeholder')} class="ad-image-placeholder" hidden>好创意，正在与你相遇</div></div></div>${moduleAsset(ad,spec.detail,'module-detail')}<p${ident('ad-caption')} class="ad-caption">${escapeHTML(spec.caption)}</p><div class="ad-card-bottom"><span></span><button${ident('ad-source')} class="text-button" hidden>查看来源</button></div>`;
 }
 function renderShowcase(){const ordered=[ads[0],...ads.slice(1),ads[0],ads[1]];$('#showcase-deck').innerHTML='<div class="showcase-track" aria-hidden="true">'+ordered.map((ad,i)=>`<div class="showcase-card" data-entry-id="${escapeHTML(ad.id)}" style="--panel-angle:${(i-1)*5.85}deg"><article class="moment-ad"></article></div>`).join('')+'</div>';for(const panel of $$('.showcase-card')){const ad=ordered.find(item=>item.id===panel.dataset.entryId);if(adModules[ad.id])paintAdModule(panel.querySelector('article'),ad);else panel.querySelector('article').innerHTML=adThumbnail(ad,'showcase-image')}}

 function sourceSummary(ad){const match=ad.sourceLabel.match(/(20\d{2}).*?([\d.]+)秒/);return match?match[1]+' 案例录屏 · '+match[2]+'秒':ad.sourceLabel}
 function renderAd(){
  const ad=currentAd();paintAdModule($('#vote-scene .moment-ad'),ad,true);const wrap=$('#vote-scene .ad-image-wrap');$('#ad-index').textContent=String(session.index+1).padStart(2,'0');$('#ad-title').textContent=ad.title;$('#ad-votes').innerHTML=ad.votes===null?'喜欢，由你来决定':`<span>╲ 参考票数 <b>${ad.votes.toLocaleString('zh-CN')}</b> ╱</span><small class="votes-snapshot">${escapeHTML(ad.votesLabel||'录屏票数快照')}</small>`;

  $('#vote-scene .moment-ad').classList.toggle('captured-ad',!!ad.capture);wrap.classList.toggle('capture-media',!!ad.capture);wrap.style.cssText=captureStyle(moduleCapture(ad));$('#ad-image').hidden=!ad.image;$('#ad-image-placeholder').hidden=!!ad.image;
  if(ad.image){const adId=ad.id;$('#ad-image').onerror=()=>{if(currentAd().id===adId){$('#ad-image').hidden=true;$('#ad-image-placeholder').hidden=false}};$('#ad-image').onload=()=>{if(currentAd().id===adId)$('#ad-image-placeholder').hidden=true};$('#ad-image').src=ad.image;$('#ad-image').alt=ad.title}
  $('#ad-caption').textContent=adModules[ad.id]?.caption||ad.caption;$('#vote-scene .ad-card-bottom>span').textContent=sourceSummary(ad)||'广告';$('#ad-source').hidden=!ad.sourceUrl;prepareFlight();$('#vote-brand-label').textContent=ad.brand.split(/\s/).slice(-1)[0]||'';updateAdVoteState();
 }
 function updateAdVoteState(){
  const vote=currentVote();$('#vote-button').hidden=!!vote;$('#vote-button').disabled=adCarouselBusy||!!pendingFlightId;$('#already-voted').hidden=!vote;
  $('.vote-progress').innerHTML='已投 <b class="vote-count">'+session.votes.length+'</b> / 10 票';$('#next-step').textContent=session.votes.length?'下一步':'快去投票';$('#next-step').disabled=adCarouselBusy||!session.votes.length||!!pendingFlightId;$('#previous-ad').disabled=ads.length<2||!!pendingFlightId;$('#next-ad').disabled=ads.length<2||!!pendingFlightId;refreshVoteCounts();if(!adCarouselBusy)syncAdNeighbors();
 }
 function carouselStep(){return $('#ad-carousel').getBoundingClientRect().width+$('#vote-view').clientWidth/402*24}
 function cloneAdScene(index){
  const ad=ads[index],copy=$('#vote-scene').cloneNode(true);copy.querySelector('#vote-flight')?.remove();
  for(const el of [copy,...copy.querySelectorAll('[id]')])el.removeAttribute('id');
  copy.className='ad-carousel-slide';copy.style.cssText='';copy.setAttribute('aria-hidden','true');copy.inert=true;copy.dataset.previewIndex=String(index);
  copy.querySelectorAll('[tabindex]').forEach(el=>el.removeAttribute('tabindex'));copy.querySelectorAll('button,a').forEach(el=>el.tabIndex=-1);paintAdModule(copy.querySelector('.moment-ad'),ad);
  copy.querySelector('.vote-button-copy small').textContent=ad.brand.split(/\s/).slice(-1)[0]||'';styleVoteHeart(copy.querySelector('.heart-vote'),index);styleVoteHeart(copy.querySelector('.already-voted'),index);return copy;
 }
 function setAdBusy(busy){
  adCarouselBusy=busy;$('#ad-carousel').classList.toggle('is-switching',busy);$('#vote-scene').style.pointerEvents=busy?'none':'';$('#vote-button').disabled=busy||!!pendingFlightId;
  $('#previous-ad').disabled=ads.length<2||!!pendingFlightId;$('#next-ad').disabled=ads.length<2||!!pendingFlightId;$('#next-step').disabled=busy||!session.votes.length||!!pendingFlightId;
 }
 function syncAdNeighbors(){
  const carousel=$('#ad-carousel'),signature=ads.map(ad=>ad.id).join('|');
  if(signature!==adPreviewSignature){adPreviews.forEach(el=>el.remove());adPreviews=Array.from({length:ads.length*3},(_,slot)=>{const copy=cloneAdScene(slot%ads.length);copy.dataset.slot=String(slot);carousel.append(copy);return copy});adPreviewSignature=signature;adPosition=adTarget=adLiveSlot=ads.length+session.index}
  const step=carouselStep();adGeometry={step,radius:step/Math.sin(5.85*Math.PI/180)};
  for(const copy of adPreviews){const hasVote=session.votes.some(vote=>vote.id===ads[Number(copy.dataset.previewIndex)].id);copy.querySelector('.heart-vote').hidden=hasVote;copy.querySelector('.already-voted').hidden=!hasVote}
  paintAdWheel();
 }
 function paintAdWheel(){
  if(!adGeometry||!adPreviews.length)return;const size=adPreviews.length,live=((adLiveSlot%size)+size)%size,origin=`50% ${adGeometry.radius}px`;
  for(let slot=0;slot<size;slot++){const slide=adPreviews[slot],relative=wheelOffset(slot,adPosition,size);slide.style.transformOrigin=origin;slide.style.transform=`rotateZ(${relative*5.85}deg)`;slide.style.visibility=Math.abs(relative)<2.25&&(adHandingOff||slot!==live)?'visible':'hidden';slide.style.zIndex=String(Math.round(30-Math.abs(relative)*5))}
  const scene=$('#vote-scene'),relative=wheelOffset(adLiveSlot,adPosition,size);scene.style.transformOrigin=origin;scene.style.transform=relative===0?'none':`rotateZ(${relative*5.85}deg)`;scene.style.willChange=relative===0&&!adMotion&&!adPointer?.dragging?'auto':'transform';scene.style.visibility=adHandingOff||Math.abs(relative)>2.25?'hidden':'visible';scene.style.zIndex=String(Math.round(30-Math.abs(relative)*5));
  $('.vote-heading').style.opacity=String(1-Math.min(.7,Math.abs(adPosition-Math.round(adPosition))*.9));
 }
 function cancelAdCarousel(){
  cancelAnimationFrame(adFrame);adFrame=0;adMotion=null;adPointer=null;adHandingOff=false;adHandoffToken++;adPosition=adTarget=adLiveSlot=ads.length+session.index;
  $('#ad-carousel').classList.remove('is-dragging');setAdBusy(false);paintAdWheel();
 }
 function requestAdPaint(){if(!adFrame)adFrame=requestAnimationFrame(paintAdFrame)}
 function paintAdFrame(time){
  adFrame=0;if(adMotion){const progress=Math.min(1,(time-adMotion.start)/adMotion.duration);adPosition=adMotion.from+(adMotion.to-adMotion.from)*(1-Math.pow(1-progress,3));if(progress===1){adPosition=adMotion.to;adMotion=null;commitAdWheel();return}}
  paintAdWheel();if(adMotion)requestAdPaint();
 }
 function commitAdWheel(){
  if(view!=='vote')return;adLiveSlot=Math.round(adTarget);session.index=((adLiveSlot%ads.length)+ads.length)%ads.length;displayedIndex=session.index;save();
  // Hold the already-decoded preview at center until the interactive module is ready.
  adHandingOff=true;const token=++adHandoffToken;renderAd();setAdBusy(true);syncAdNeighbors();
  Promise.all([...$('#vote-scene .moment-ad').querySelectorAll('img')].map(img=>img.decode().catch(()=>null))).then(()=>requestAnimationFrame(()=>{if(token!==adHandoffToken||view!=='vote')return;adHandingOff=false;setAdBusy(!!adMotion||!!adPointer?.dragging);paintAdWheel()}));
 }
 function animateAdWheel(target){
  cancelAnimationFrame(adFrame);adFrame=0;adTarget=target;$('#vote-view').classList.remove('vote-entry');$('#ad-carousel').classList.remove('is-dragging');
  if(reduced()||Math.abs(target-adPosition)<.001){adPosition=target;adMotion=null;if(session.index!==((target%ads.length)+ads.length)%ads.length)commitAdWheel();else{setAdBusy(adHandingOff);paintAdWheel()}return}
  setAdBusy(true);adMotion={from:adPosition,to:target,start:performance.now(),duration:Math.min(560,230+Math.abs(target-adPosition)*160)};requestAdPaint();
 }
 function moveAd(direction){if(!manifestReady||view!=='vote'||pendingFlightId||ads.length<2)return;adPointer=null;animateAdWheel(Math.round(adTarget)+direction)}
 function bindAdDrag(){
  const carousel=$('#ad-carousel');carousel.addEventListener('dragstart',event=>event.preventDefault());
  carousel.addEventListener('pointerdown',event=>{if(view!=='vote'||!manifestReady||pendingFlightId||event.target.closest('button,a'))return;cancelAnimationFrame(adFrame);adFrame=0;adMotion=null;adPointer={id:event.pointerId,x:event.clientX,y:event.clientY,position:adPosition,lastX:event.clientX,time:performance.now(),velocity:0,dragging:false}});
  carousel.addEventListener('pointermove',event=>{
   if(!adPointer||adPointer.id!==event.pointerId)return;const dx=event.clientX-adPointer.x,dy=event.clientY-adPointer.y;
   if(!adPointer.dragging){if(Math.abs(dy)>9&&Math.abs(dy)>Math.abs(dx)*1.15){adPointer=null;animateAdWheel(adTarget);return}if(Math.abs(dx)<8||Math.abs(dx)<Math.abs(dy)*1.15)return;adPointer.dragging=true;setAdBusy(true);carousel.classList.add('is-dragging');try{carousel.setPointerCapture(event.pointerId)}catch{}}
   if(event.cancelable)event.preventDefault();const now=performance.now(),elapsed=now-adPointer.time;if(elapsed>0)adPointer.velocity=adPointer.velocity*.45+(event.clientX-adPointer.lastX)/elapsed*.55;adPointer.lastX=event.clientX;adPointer.time=now;adPosition=adPointer.position-dx/adGeometry.step;requestAdPaint();
  });
  function release(event,cancelled=false){
   if(!adPointer||adPointer.id!==event.pointerId)return;const pointer=adPointer;adPointer=null;if(!pointer.dragging){animateAdWheel(adTarget);return}try{carousel.releasePointerCapture(event.pointerId)}catch{}
   const velocity=cancelled||performance.now()-pointer.time>100?0:pointer.velocity,momentum=Math.max(-.65,Math.min(.65,-velocity*150/adGeometry.step));let target=Math.round(adPosition+momentum);const distance=adPosition-pointer.position;if(!cancelled&&Math.abs(distance)>.2&&target===Math.round(pointer.position))target+=Math.sign(distance);animateAdWheel(target);
  }
  carousel.addEventListener('pointerup',event=>release(event));carousel.addEventListener('pointercancel',event=>release(event,true));
 }
 bindAdDrag();
 $('#previous-ad').addEventListener('click',()=>moveAd(-1));$('#next-ad').addEventListener('click',()=>moveAd(1));$('#next-step').addEventListener('click',()=>{if(!pendingFlightId&&!adCarouselBusy)show('choose')});$('#ad-source').addEventListener('click',()=>{if(currentAd().sourceUrl)window.open(currentAd().sourceUrl,'_blank','noopener,noreferrer')});
 function bindSwipe(element,move,enabled=()=>true,includeButtons=false){let start=null;element.addEventListener('pointerdown',event=>{if(!enabled()||(!includeButtons&&event.target.closest('button,a')))return;start={x:event.clientX,y:event.clientY,id:event.pointerId}});element.addEventListener('pointerup',event=>{if(!start||start.id!==event.pointerId)return;const dx=event.clientX-start.x,dy=event.clientY-start.y;start=null;if(enabled()&&Math.abs(dx)>45&&Math.abs(dx)>Math.abs(dy)*1.5){if(includeButtons){const suppress=event=>{event.preventDefault();event.stopPropagation()};element.addEventListener('click',suppress,{once:true,capture:true});setTimeout(()=>element.removeEventListener('click',suppress,true),300)}move(dx<0?1:-1)}});element.addEventListener('pointercancel',()=>start=null)}
 bindSwipe($('#card-carousel'),moveCard,()=>view==='card');
 const choiceStage=$('#heart-choices');
 let choiceCards=[],choiceNodes=[],choiceSignature='',choicePosition=0,choiceTarget=0,choiceFrame=0,choiceMotion=null,choicePointer=null,choiceGeometry=null,choiceVisualCenter=null;
 function cancelChoiceMotion(){cancelAnimationFrame(choiceFrame);choiceFrame=0;choiceMotion=null;choicePointer=null}
 function requestChoicePaint(){if(!choiceFrame)choiceFrame=requestAnimationFrame(paintChoiceFrame)}
 function paintChoiceFrame(time){
  choiceFrame=0;
  if(choiceMotion){const progress=Math.min(1,(time-choiceMotion.start)/choiceMotion.duration);choicePosition=choiceMotion.from+(choiceMotion.to-choiceMotion.from)*(1-Math.pow(1-progress,3));if(progress===1){choicePosition=choiceMotion.to;choiceMotion=null}}
  paintChoiceWheel();if(choiceMotion)requestChoicePaint();
 }
 function paintChoiceWheel(){
  if(!choiceNodes.length||!choiceGeometry)return;const {center,step,width,rise}=choiceGeometry,size=choiceNodes.length,nearest=((Math.round(choicePosition)%size)+size)%size,opening=!!choiceStage.dataset.opening,changeCenter=choiceVisualCenter!==nearest;
  for(let slot=0;slot<size;slot++){
   const node=choiceNodes[slot],relative=wheelOffset(slot,choicePosition,size),distance=Math.abs(relative),visible=distance<2.15;
   node.style.visibility=visible?'visible':'hidden';
   if(visible){const depth=Math.min(distance,1),scale=1-depth/6;node.style.transform=`translate3d(${center+step*relative-width/2}px,${rise*depth}px,0) scale(${scale})`;node.style.opacity=String(1-depth*.5);node.style.zIndex=String(Math.round(30-distance*5))}
   node.disabled=opening;
   if(changeCenter){const offset=wheelOffset(slot,Math.round(choicePosition),size),active=offset===0;node.classList.toggle('is-current',active);node.classList.toggle('is-previous',offset===-1);node.classList.toggle('is-next',offset===1);node.dataset.offset=String(offset);node.inert=Math.abs(offset)>1;node.setAttribute('aria-hidden',String(Math.abs(offset)>1));node.setAttribute('aria-current',String(active));node.setAttribute('aria-label',(active?'打开':'切换到')+choiceCards[slot%choiceCards.length].name+'心意卡')}
  }
  choiceVisualCenter=nearest;
 }
 function refreshChoiceUI(){
  const card=choiceCards.find(card=>card.id===session.currentCard),opening=!!choiceStage.dataset.opening;
  $('#choice-vote-count').textContent=session.votes.length;$('#choice-description').textContent=card?.description||'先为喜欢的好创意投票，收获一份心意。';$('#choose-vote-summary').textContent='本次投票获得 '+choiceCards.length+' 份心意';
  $('#make-cards').disabled=opening||!card;$('#make-cards').innerHTML=opening?'心意来信，正在展开…':card?'带走「'+card.name+'」心意卡 <span aria-hidden="true">→</span>':'先去投票，收获心意';
  $('#choice-previous').disabled=opening||choiceCards.length<2;$('#choice-next').disabled=opening||choiceCards.length<2;choiceStage.setAttribute('aria-label','本次投票获得'+choiceCards.length+'份心意，左右滑动选择');
 }
 function animateChoiceWheel(target){
  cancelAnimationFrame(choiceFrame);choiceFrame=0;choiceTarget=target;
  const count=choiceCards.length;if(!count)return;session.currentCard=choiceCards[((Math.round(target)%count)+count)%count].id;save();refreshChoiceUI();
  if(reduced()||Math.abs(target-choicePosition)<.001){choicePosition=target;choiceMotion=null;paintChoiceWheel();return}
  choiceMotion={from:choicePosition,to:target,start:performance.now(),duration:Math.min(560,220+Math.abs(target-choicePosition)*160)};requestChoicePaint();
 }
 choiceStage.addEventListener('pointerdown',event=>{
  if(view!=='choose'||pendingChoice||choiceCards.length<2)return;cancelAnimationFrame(choiceFrame);choiceFrame=0;choiceMotion=null;
  choicePointer={id:event.pointerId,x:event.clientX,y:event.clientY,position:choicePosition,lastX:event.clientX,time:performance.now(),velocity:0,dragging:false};
 });
 choiceStage.addEventListener('pointermove',event=>{
  if(!choicePointer||choicePointer.id!==event.pointerId)return;const dx=event.clientX-choicePointer.x,dy=event.clientY-choicePointer.y;
  if(!choicePointer.dragging){if(Math.abs(dy)>9&&Math.abs(dy)>Math.abs(dx)*1.15){choicePointer=null;animateChoiceWheel(choiceTarget);return}if(Math.abs(dx)<7||Math.abs(dx)<Math.abs(dy)*1.15)return;choicePointer.dragging=true;$('#choose-view').classList.remove('choice-enter');$('#make-cards').disabled=true;try{choiceStage.setPointerCapture(event.pointerId)}catch{}}
  if(event.cancelable)event.preventDefault();const now=performance.now(),elapsed=now-choicePointer.time;if(elapsed>0)choicePointer.velocity=choicePointer.velocity*.45+(event.clientX-choicePointer.lastX)/elapsed*.55;choicePointer.lastX=event.clientX;choicePointer.time=now;
  choicePosition=choicePointer.position-dx/choiceGeometry.step;requestChoicePaint();
 });
 function releaseChoiceDrag(event,cancelled=false){
  if(!choicePointer||choicePointer.id!==event.pointerId)return;const pointer=choicePointer;choicePointer=null;
  if(!pointer.dragging){if(view==='choose')animateChoiceWheel(choiceTarget);return}try{choiceStage.releasePointerCapture(event.pointerId)}catch{}
  const suppress=event=>{event.preventDefault();event.stopPropagation()};choiceStage.addEventListener('click',suppress,{once:true,capture:true});setTimeout(()=>choiceStage.removeEventListener('click',suppress,true),300);
  if(view!=='choose'||pendingChoice)return;
  const velocity=cancelled||performance.now()-pointer.time>100?0:pointer.velocity,momentum=Math.max(-.65,Math.min(.65,-velocity*180/choiceGeometry.step));let target=Math.round(choicePosition+momentum);const distance=choicePosition-pointer.position;if(!cancelled&&Math.abs(distance)>.25&&target===Math.round(pointer.position))target+=Math.sign(distance);animateChoiceWheel(target);
 }
 choiceStage.addEventListener('pointerup',event=>releaseChoiceDrag(event));choiceStage.addEventListener('pointercancel',event=>releaseChoiceDrag(event,true));
 $('#heart-choices').addEventListener('dragstart',event=>event.preventDefault());
 window.addEventListener('keydown',event=>{if($('dialog[open]')||pendingFlightId||pendingChoice)return;if(event.key==='ArrowRight'||event.key==='ArrowLeft'){const direction=event.key==='ArrowRight'?1:-1;if(view==='vote'){event.preventDefault();moveAd(direction)}else if(view==='choose'){event.preventDefault();$('#choose-view').classList.remove('choice-enter');moveChoice(direction)}else if(view==='card'){event.preventDefault();moveCard(direction)}}});
 $('#vote-button').addEventListener('click',()=>{if(!manifestReady||view!=='vote'||adCarouselBusy||currentVote()||pendingFlightId||session.votes.length>=MAX_VOTES)return;const adId=currentAd().id;session.votes.push({id:adId});save();if(!session.votes.some(vote=>vote.id===adId)){renderAd();return}if(reduced()){updateAdVoteState();return}launchFlight()});
 function availableCards(){const earned=earnedCardIds(session,ads.map(ad=>ad.id));return CARDS.filter(card=>earned.includes(card.id))}
 function votedBrandNames(){return [...new Set(session.votes.map(vote=>ads.find(ad=>ad.id===vote.id)?.brand).filter(Boolean).map(name=>name.match(/[\u3400-\u9fff][\u3400-\u9fff·-]*/g)?.join('')||name))]}
 function positionMailScene(){
  const flow=$('#mail-flow');if(!flow||!flow.clientWidth)return;
  const width=flow.clientWidth,u=Math.min(width/402,flow.clientHeight/815),frameWidth=402*u*.88,frameX=(width-frameWidth)/2,frameY=47*u;
  // Paper and export share the same 1000×1600 frame; no second paper scale.
  const envelopeY=frameY+frameWidth*.83,envelopeHeight=frameWidth*.70,paperY=frameY;
  for(const [key,value] of Object.entries({'--mailbox-x':frameX+frameWidth*.5,'--mailbox-y':envelopeY,'--mailbox-width':frameWidth*.9,'--mailbox-height':envelopeHeight,'--letter-paper-x':frameX,'--letter-paper-y':paperY,'--letter-paper-width':frameWidth,'--letter-paper-height':frameWidth*1.6,'--letter-emerge-distance':envelopeY+envelopeHeight*.40-paperY,'--letter-actions-y':frameY+frameWidth*1.6+10*u,'--letter-frame-x':frameX,'--letter-frame-y':frameY,'--letter-frame-width':frameWidth}))flow.style.setProperty(key,value+'px');
 }
 function updateChoiceCarousel({animate=false,direction=0,slot=null,snap=false}={}){
  const cards=availableCards(),signature=cards.map(card=>card.id).join('|');let index=cards.findIndex(card=>card.id===session.currentCard);
  if(index<0){index=0;session.currentCard=cards[0]?.id||null}
  const rebuild=signature!==choiceSignature;choiceCards=cards;choiceSignature=signature;
  if(rebuild){cancelChoiceMotion();choiceStage.classList.add('choice-wheel');const copies=cards.length>1?3:1;
   choiceStage.innerHTML=Array.from({length:cards.length*copies},(_,slot)=>{const item=cards[slot%cards.length],src=globalThis.CHOICE_BALLOON_ASSETS?.[item.id]||'assets/choice-balloons-v32/'+item.id+'.png';return `<button type="button" class="choice-slide" data-card="${item.id}" data-slot="${slot}" style="--ink:${item.ink}"><img src="${escapeHTML(src)}" alt="${item.name}" draggable="false"><svg class="choice-thread" viewBox="0 0 32 48" aria-hidden="true"><path d="M16 1C28 14 6 18 13 29S22 39 9 47"/></svg></button>`}).join('');choiceNodes=[...choiceStage.querySelectorAll('.choice-slide')];choiceVisualCenter=null;
  }
  const width=choiceStage.clientWidth,u=Math.min(width/402,$('#mail-flow').clientHeight/815);choiceGeometry={center:width/2,step:width/2+15*u,width:228*u,rise:41*u};
  if(rebuild||snap){cancelChoiceMotion();choicePosition=choiceTarget=(cards.length>1?cards.length:0)+index;choiceVisualCenter=null}
  if(animate&&cards.length){let target;if(slot!==null)target=Math.round(choicePosition+wheelOffset(slot,choicePosition,choiceNodes.length));else{const base=Math.round(choiceTarget),baseIndex=((base%cards.length)+cards.length)%cards.length;let delta=index-baseIndex;if(direction>0)delta=(delta+cards.length)%cards.length;else if(direction<0)delta=-((-delta+cards.length)%cards.length);else if(Math.abs(delta)>cards.length/2)delta-=Math.sign(delta)*cards.length;target=base+delta}animateChoiceWheel(target)}
  else{paintChoiceWheel();refreshChoiceUI()}
  positionMailScene();
 }
 function renderChoices(){
  const stage=$('#heart-choices');stage.classList.remove('letter-in-flight');delete stage.dataset.opening;
  const flow=$('#mail-flow');if(!flow.querySelector(':scope > .mailbox'))flow.insertAdjacentHTML('beforeend',`<div class="mailbox" aria-hidden="true"><span class="mailbox-back"></span><span class="mailbox-lid"></span><span class="mailbox-front"><i class="mailbox-mark"><img src="${globalThis.ANNIVERSARY_MARK||'assets/anniversary-mark-v22.png'}" alt=""></i></span></div>`);
  updateChoiceCarousel({snap:true});void stage.offsetWidth;$('#choose-view').classList.add('choice-enter');availableCards().forEach(card=>preloadLetter(card.id).catch(()=>{}));
 }
 function chooseCard(id,{focus=false,direction=0,slot=null}={}){
  if(view!=='choose'||pendingChoice||$('#heart-choices').dataset.opening||!availableCards().some(card=>card.id===id))return;
  session.currentCard=id;save();updateChoiceCarousel({animate:true,direction,slot});if(focus)$('#heart-choices .is-current')?.focus({preventScroll:true});
 }
 function moveChoice(direction){const cards=availableCards();if(view!=='choose'||cards.length<2)return;const index=cards.findIndex(card=>card.id===session.currentCard);chooseCard(cards[(index+direction+cards.length)%cards.length].id,{direction})}
 $('#heart-choices').addEventListener('click',event=>{
  const button=event.target.closest('.choice-slide');if(!button||button.disabled)return;
  if(button.classList.contains('is-current'))window.openHeartLetter(button.dataset.card);else chooseCard(button.dataset.card,{focus:true,direction:button.classList.contains('is-previous')?-1:1,slot:Number(button.dataset.slot)});
 });
 $('#choice-previous').addEventListener('click',()=>moveChoice(-1));$('#choice-next').addEventListener('click',()=>moveChoice(1));
 $('#make-cards').addEventListener('click',()=>window.openHeartLetter(session.currentCard));
 $('#choose-view').addEventListener('animationend',event=>{if(event.target===$('#choose-voting'))$('#choose-view').classList.remove('choice-enter')});
 $('#choose-view').addEventListener('pointerdown',()=>$('#choose-view').classList.remove('choice-enter'));
 window.addEventListener('resize',()=>{if(view==='choose')updateChoiceCarousel();else if(view==='card')positionMailScene();else if(view==='vote')syncAdNeighbors()});
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
 window.addEventListener('pageshow',event=>{if(event.persisted&&manifestReady)restart()});
 async function loadManifest(){try{const manifest=globalThis.AD_MANIFEST||await fetch('assets/ads/manifest.json',{cache:'no-cache'}).then(response=>{if(!response.ok)throw new Error('manifest');return response.json()});ads=normalizeAds(manifest)}catch{ads=normalizeAds(null)}session=normalizeSession(null,ads.map(ad=>ad.id));if(!session.round)session.round=Date.now();displayedIndex=session.index;displayedCard=session.currentCard;manifestReady=true;$('#begin-voting').disabled=false;renderShowcase();save()}
 hydrateBalloons();renderShowcase();loadManifest();
}
