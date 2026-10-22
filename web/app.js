/* Гараж R nineT: интерфейс вокруг 3D-движка r9t (engine.js). Сайт и Telegram Mini App, один код. */
(function(){
"use strict";
const CFG=window.GARAGE_CONFIG||{};
const H=window.R9T_HOOKS=window.R9T_HOOKS||{};
const E=window.R9T;
const store=window.store;
const $=id=>document.getElementById(id);
const app=$('app');
const esc=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const nf=n=>Math.round(n).toLocaleString('ru-RU').replace(/ | /g,' ');
const S=()=>store.state;
const todayISO=()=>{const d=new Date();return new Date(d.getTime()-d.getTimezoneOffset()*6e4).toISOString().slice(0,10);};
const fmtDate=iso=>{if(!iso)return '';const [y,m,d]=iso.split('-');return d&&m&&y?`${d}.${m}.${y}`:iso;};
const uid=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,6);
const DAY=864e5;
const URLQ=new URLSearchParams(location.search);

/* ================= Telegram ================= */
const TG=(window.Telegram&&Telegram.WebApp)||null;
const inTG=!!(TG&&TG.initData);
const tgv=v=>{try{return !TG.isVersionAtLeast||TG.isVersionAtLeast(v);}catch(e){return false;}};
function tgTheme(){if(!inTG)return;const p=TG.themeParams||{},r=document.documentElement.style;
  const set=(k,v)=>{if(v)r.setProperty(k,v);};
  set('--panel',p.bg_color);set('--bg',p.secondary_bg_color||p.bg_color);set('--sunk',p.secondary_bg_color);set('--ink',p.text_color);set('--muted',p.hint_color);
  if(p.section_separator_color)set('--line',p.section_separator_color);
  document.documentElement.setAttribute('data-theme',TG.colorScheme==='dark'?'dark':'light');
  try{if(tgv('6.1')){TG.setHeaderColor(p.bg_color||(TG.colorScheme==='dark'?'#1A1D21':'#F3F4F5'));TG.setBackgroundColor(p.secondary_bg_color||p.bg_color||'#121417');}}catch(e){}
  try{if(tgv('7.10')&&TG.setBottomBarColor)TG.setBottomBarColor(p.bg_color||'#1A1D21');}catch(e){}}
if(inTG){try{TG.ready();TG.expand();if(tgv('7.7')&&TG.disableVerticalSwipes)TG.disableVerticalSwipes();}catch(e){}
  tgTheme();try{TG.onEvent('themeChanged',tgTheme);}catch(e){}
  try{if(tgv('6.1'))TG.BackButton.onClick(()=>back());}catch(e){}
  app.classList.add('tg');}
function haptic(kind){if(!inTG||!tgv('6.1'))return;try{if(kind==='ok')TG.HapticFeedback.notificationOccurred('success');else if(kind==='sel')TG.HapticFeedback.selectionChanged();else TG.HapticFeedback.impactOccurred('light');}catch(e){}}
document.addEventListener('click',e=>{const b=e.target.closest('button');if(b&&!b.disabled)haptic();},true);
const tgUser=()=>{try{return inTG&&TG.initDataUnsafe&&TG.initDataUnsafe.user||null;}catch(e){return null;}};

/* ================= analytics ================= */
const EVENTS=['bike_added','mileage_set','service_logged','op_opened','op_done','cat_show','pro_wanted','card_shared','opened_in_telegram','custom_wanted'];
if(CFG.metrika){try{(function(m,e,t,r,i,k,a){m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};m[i].l=1*new Date();k=e.createElement(t),a=e.getElementsByTagName(t)[0];k.async=1;k.src=r;a.parentNode.insertBefore(k,a)})(window,document,'script','https://mc.yandex.ru/metrika/tag.js','ym');
  ym(CFG.metrika,'init',{clickmap:false,trackLinks:true,accurateTrackBounce:true});}catch(e){}}
function track(ev,params){params=Object.assign({tg:inTG?1:0},params||{});
  if(EVENTS.indexOf(ev)<0)console.warn('track: unknown event',ev);
  try{if(CFG.metrika&&window.ym)ym(CFG.metrika,'reachGoal',ev,params);}catch(e){}
  try{const k='garage-ev',a=JSON.parse(localStorage.getItem(k)||'[]');a.push([Date.now(),ev,params]);localStorage.setItem(k,JSON.stringify(a.slice(-100)));}catch(e){}
  try{(window.__garageEvents=window.__garageEvents||[]).push(ev);}catch(e){}
  console.info('[track]',ev,params);}
window.track=track;

/* ================= Pro & trial ================= */
const TRIAL=(CFG.trialDays||14)*DAY;
function trialLeft(){const t=S().pro.trialStart;if(!t)return null;return Math.max(0,Math.ceil((t+TRIAL-Date.now())/DAY));}
function isPro(){if(URLQ.get('pro')==='1')return true;const p=S().pro;if(p.paid)return true;if(p.wanted)return true;const l=trialLeft();return l!=null&&l>0;}
function proLabel(){if(URLQ.get('pro')==='1')return 'Pro (тест ?pro=1)';const p=S().pro;if(p.paid)return 'Pro';if(p.wanted)return 'Триал продлён до запуска оплаты';
  const l=trialLeft();if(l==null)return 'Бесплатный. Триал Pro 14 дней начнётся, когда укажешь пробег';return l>0?`Триал Pro: осталось ${l} ${plural(l,'день','дня','дней')}`:'Бесплатный: триал закончился';}
function plural(n,a,b,c){n=Math.abs(n)%100;const n1=n%10;if(n>10&&n<20)return c;if(n1>1&&n1<5)return b;if(n1===1)return a;return c;}
const FREE_OP='oilLevel';
const FREE_HISTORY=3;
const canOp=id=>id===FREE_OP||isPro();

/* ================= service data (only what r9t has) ================= */
/* zones: g = проверь сам, y = сам с инструментом и динамометрическим ключом, r = не суйся, в сервис. При сомнении красная. */
const ZONE={oilLevel:'g',brakes:'g',clutch:'g',oilChange:'y',spark:'y',fd:'y',coilSwap:'y',deadCyl:'y',valves:'r'};
const ZT={g:'Проверь сам',y:'Сам, с инструментом',r:'Не суйся, в сервис'};
const zoneChip=z=>`<span class="zone ${z}"><i></i>${ZT[z]}</span>`;
/* регламент из r9t (вкладка «Обслуживание», раздел «Регламент»): 10 000 км / год: масло + фильтр, зазоры; 20 000 км: свечи, возд. фильтр, редуктор;
   2 года: тормозная жидкость, редуктор; 6 лет / 40 000: ремень генератора. Окно «скоро»: за месяц или примерно за 1000 км, как индикатор SERV. */
const DUE=[
  {id:'oil',t:'Масло и фильтр',km:10000,mo:12,op:'oilChange',to:true},
  {id:'valves',t:'Зазоры клапанов',km:10000,op:'valves',to:true},
  {id:'spark',t:'Свечи',km:20000,op:'spark'},
  {id:'air',t:'Воздушный фильтр',km:20000},
  {id:'fd',t:'Масло в главной передаче',km:20000,mo:24,op:'fd'},
  {id:'brakefluid',t:'Тормозная жидкость',mo:24},
  {id:'belt',t:'Ремень генератора',km:40000,mo:72}];
const OPDUE={oilChange:'oil',valves:'valves',spark:'spark',fd:'fd'};
const SOON_KM=1000,SOON_D=30;
function addMonths(iso,mo){const d=new Date(iso+'T12:00:00');d.setMonth(d.getMonth()+mo);return d;}
function lastDone(it){let best=null;
  S().history.forEach(h=>{const hit=(h.items||[]).indexOf(it.id)>=0||(h.opId&&OPDUE[h.opId]===it.id);
    if(hit&&(!best||(h.km||0)>(best.km||0)||((h.km||0)===(best.km||0)&&h.date>best.date)))best={km:h.km,date:h.date,src:'h'};});
  const lt=S().bike.lastTo;if(it.to&&(lt.km!=null||lt.date)){const c={km:lt.km,date:lt.date,src:'to'};if(!best||(c.km||0)>(best.km||0))best=c;}
  return best;}
function dueOf(it){const km=S().bike.km,ld=lastDone(it);const r={it,ld,st:'na',txt:''};
  let leftKm=null,dueDate=null;
  if(it.km&&km!=null){if(ld&&ld.km!=null)leftKm=ld.km+it.km-km;else{leftKm=Math.ceil((km+1)/it.km)*it.km-km;r.sched=true;}}
  if(it.mo&&ld&&ld.date)dueDate=addMonths(ld.date,it.mo);
  const leftD=dueDate?Math.ceil((dueDate-Date.now())/DAY):null;
  const over=(leftKm!=null&&leftKm<=0)||(leftD!=null&&leftD<=0),soon=(leftKm!=null&&leftKm<=SOON_KM)||(leftD!=null&&leftD<=SOON_D);
  const parts=[];if(leftKm!=null)parts.push(leftKm<=0?`просрочено на ${nf(-leftKm)} км`:`через ${nf(leftKm)} км`);
  if(leftD!=null)parts.push(leftD<=0?'срок прошёл':`до ${fmtDate(dueDate.toISOString().slice(0,10))}`);
  if(leftKm==null&&leftD==null){r.st='na';r.txt=km==null?'укажи пробег':'нет записи. Уточни по сервисной книжке BMW';}
  else{r.st=over?'over':soon?'soon':'ok';r.txt=parts.join(' · ');
    if(it.mo&&!dueDate)r.txt+=` · по сроку: раз в ${it.mo>=12?it.mo/12+' '+plural(it.mo/12,'год','года','лет'):it.mo+' мес'}, нет даты`;
    if(r.sched&&!ld)r.txt+=' (по регламенту, записи нет)';}
  r.leftKm=leftKm;r.leftD=leftD;return r;}
function dueAll(){const rank={over:0,soon:1,ok:2,na:3};return DUE.map(dueOf).sort((a,b)=>rank[a.st]-rank[b.st]||((a.leftKm==null?1e9:a.leftKm)-(b.leftKm==null?1e9:b.leftKm)));}
function nextTo(){const r=dueOf(DUE[0]);return r;}

/* ================= toast ================= */
let toastT=null;
function toast(msg,ms){const t=$('toast');t.textContent=msg;t.hidden=false;clearTimeout(toastT);toastT=setTimeout(()=>t.hidden=true,ms||2600);}

/* ================= sheet ================= */
const panelEl=$('panel'),sideEl=$('side');
let sheetKind=null,sheetClose=null;
function openSheet(content,o){o=o||{};const sh=$('sheet'),b=$('sbody');
  if(sheetKind)closeSheet(true);
  b.innerHTML='';if(typeof content==='string')b.innerHTML=content;else b.appendChild(content);
  sh.className='sheet'+(o.size?' '+o.size:'');sh.hidden=false;b.scrollTop=0;sheetKind=o.kind||'sheet';sheetClose=o.onClose||null;
  sh.setAttribute('aria-label',o.label||'');syncBack();requestAnimationFrame(syncInset);return b;}
function closeSheet(silent){const sh=$('sheet');if(!sheetKind)return;const k=sheetKind,cb=sheetClose;sheetKind=null;sheetClose=null;
  if(panelEl.parentNode!==sideEl)sideEl.appendChild(panelEl);
  sh.hidden=true;$('sbody').innerHTML='';if(cb)cb(silent);syncBack();syncInset();return k;}
/* mobile: keep the bike in the part of the 3D that the sheet does not cover */
const mqDesk=window.matchMedia('(min-width:900px)');
function syncInset(){const sh=$('sheet');let px=0;if(!sh.hidden&&!mqDesk.matches&&view==='garage'){const bay=$('bay').getBoundingClientRect(),r=sh.getBoundingClientRect();px=Math.max(0,bay.bottom-r.top);px=Math.min(px,bay.height*0.6);}try{E.setInset(px);}catch(e){}}
new ResizeObserver(()=>syncInset()).observe($('sheet'));mqDesk.addEventListener('change',syncInset);
$('sheetX').onclick=()=>{if(sheetKind==='step')exitOp();else closeSheet();};
/* swipe the sheet down to close (mobile) */
(function(){const g=$('grab');let y0=null;const sh=$('sheet');
  const start=e=>{y0=e.touches?e.touches[0].clientY:e.clientY;};
  const end=e=>{if(y0==null)return;const y=(e.changedTouches?e.changedTouches[0].clientY:e.clientY);if(y-y0>50){if(sheetKind==='step')exitOp();else closeSheet();}y0=null;};
  g.addEventListener('touchstart',start,{passive:true});g.addEventListener('touchend',end);
  sh.addEventListener('touchstart',e=>{if(e.target.closest('.sbody')&&$('sbody').scrollTop>0)return;if(e.target.closest('input,textarea,select,button,a,table'))return;start(e);},{passive:true});
  sh.addEventListener('touchend',e=>{if(y0!=null)end(e);});})();

/* ================= navigation + back ================= */
let view='garage',sec='bike',opMode=false;
const SCREENS={service:$('scr-service'),catalog:$('scr-catalog'),custom:$('scr-custom'),cabinet:$('scr-cabinet')};
function setView(v,opts){opts=opts||{};if(v!=='garage'&&sheetKind&&sheetKind!=='keep')closeSheet(true);
  if(opMode&&v!=='garage')exitOp(true);
  view=v;app.dataset.view=v;E.setPaused(v!=='garage');
  Object.keys(SCREENS).forEach(k=>{SCREENS[k].hidden=k!==v;});
  document.querySelectorAll('#tabbar button').forEach(b=>{if(b.dataset.view===v)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current');});
  if(v==='service')renderService();else if(v==='catalog')renderCatalog(opts);else if(v==='custom')renderCustom();else if(v==='cabinet')renderCabinet();
  if(SCREENS[v])SCREENS[v].scrollTop=0;
  syncBack();}
document.querySelectorAll('#tabbar button').forEach(b=>b.onclick=()=>{if(b.dataset.view===view&&view==='garage'){E.homeView();return;}setView(b.dataset.view);});
function back(){if(sheetKind){if(sheetKind==='step'){exitOp();return true;}closeSheet();return true;}
  if(opMode){exitOp();return true;}
  if(view!=='garage'){setView('garage');return true;}
  if(E.tab==='cat'){catOff();return true;}
  return false;}
function syncBack(){if(!inTG||!tgv('6.1'))return;const need=!!sheetKind||opMode||view!=='garage'||E.tab==='cat';try{need?TG.BackButton.show():TG.BackButton.hide();}catch(e){}}
document.addEventListener('keydown',e=>{if(e.key==='Escape'){if(back())e.preventDefault();}});

/* ================= header ================= */
function renderHeader(){const b=S().bike;
  $('hPlate').textContent=b.plate?b.plate.toUpperCase():'R nineT';
  $('hKm').textContent=b.km!=null?nf(b.km)+' км':'пробег ?';
  const t=$('hTo');t.classList.remove('due');
  if(b.km==null){t.textContent='до ТО: укажи пробег';return;}
  const r=nextTo();
  if(r.leftKm==null){t.textContent='до ТО: укажи последнее ТО';return;}
  if(r.st==='over'){t.textContent=r.leftKm<=0?`ТО просрочено на ${nf(-r.leftKm)} км`:'ТО: срок прошёл';t.classList.add('due');}
  else{t.textContent=`до ТО ${nf(r.leftKm)} км`+(r.leftD!=null&&r.leftD<=60?` или ${r.leftD} дн.`:'');if(r.st==='soon')t.classList.add('due');}}
$('who').onclick=()=>setView('cabinet');

/* ================= garage: sections, buttons, gestures ================= */
const SEC_LABEL={bike:'Контуры и цифры',engine:'Такты и передачи',drive:'Передачи и привод',brakes:'Из чего состоят',elec:'Из чего состоит',dash:'Сигналы приборки'};
function setSec(s){sec=s;app.dataset.sec=s;document.querySelectorAll('#secs button').forEach(b=>b.setAttribute('aria-pressed',b.dataset.sec===s));
  const btn=document.querySelector(`#secs [data-sec="${s}"]`);if(btn)btn.scrollIntoView({block:'nearest',inline:'nearest',behavior:'smooth'});
  $('catPill').hidden=true;if(sheetKind==='part'||sheetKind==='info')closeSheet(true);
  E.select(null);E.setTab(s);$('infoLbl').textContent=SEC_LABEL[s]||'О разделе';$('infoBtn').hidden=false;syncFabs();syncBack();}
document.querySelectorAll('#secs button').forEach(b=>b.onclick=()=>{if(b.dataset.sec===sec&&E.tab===sec){E.homeView();return;}setSec(b.dataset.sec);});
$('infoBtn').onclick=()=>{const b=openSheet(document.createDocumentFragment(),{kind:'info',size:sec==='dash'?'tall':'',label:SEC_LABEL[sec]});b.appendChild(panelEl);};

function syncFabs(){$('fabRot').setAttribute('aria-pressed',E.autoRot);$('fabXray').setAttribute('aria-pressed',E.xray);
  const ex=E.explode>0.01;$('fabEx').setAttribute('aria-pressed',ex);$('fabEx').setAttribute('aria-label',ex?'Собрать. Долгое нажатие: ползунок':'Разобрать. Долгое нажатие: ползунок');$('exRange').value=Math.round(E.explode*100);}
H.autoRot=()=>syncFabs();
$('fabRot').onclick=()=>{E.setAutoRot(!E.autoRot);syncFabs();};
$('fabXray').onclick=()=>{E.setXray(!E.xray);syncFabs();};
(function(){const b=$('fabEx'),sl=$('exSlider');let t=null,long=false,hideT=null;
  const hideLater=()=>{clearTimeout(hideT);hideT=setTimeout(()=>sl.hidden=true,5000);};
  b.addEventListener('pointerdown',()=>{long=false;clearTimeout(t);t=setTimeout(()=>{long=true;sl.hidden=false;haptic('sel');hideLater();},450);});
  ['pointerup','pointerleave','pointercancel'].forEach(ev=>b.addEventListener(ev,()=>clearTimeout(t)));
  b.addEventListener('contextmenu',e=>e.preventDefault());
  b.onclick=e=>{if(long){long=false;e.preventDefault();return;}sl.hidden=true;E.setExplode(E.explode>0.01?0:1);syncFabs();};
  $('exRange').oninput=e=>{E.setExplode(e.target.value/100);syncFabs();hideLater();};})();

/* tap = what is this part, double tap = back to the section's overall view */
let tapT=null,lastTap=0;
H.tap=(x,y)=>{if(view!=='garage')return;const now=Date.now();
  if(now-lastTap<330){clearTimeout(tapT);tapT=null;lastTap=0;$('exSlider').hidden=true;if(sheetKind==='part')closeSheet();E.select(null);E.homeView();return;}
  lastTap=now;clearTimeout(tapT);tapT=setTimeout(()=>{tapT=null;onTap(x,y);},280);};
function onTap(x,y){$('exSlider').hidden=true;if(opMode)return;
  const id=E.pickAt(x,y);if(!id){E.select(null);if(sheetKind==='part')closeSheet();return;}
  E.select(id);openPart(id);}
const PNRE=/\b\d{2} \d{2} \d \d{3} \d{3}\b/;
function partDiags(id){try{return E.CAT.partFor(id)||[];}catch(e){return [];}}
function openPart(id){const p=E.P[id];if(!p)return;
  const diags=partDiags(id),num=(p.desc.match(PNRE)||[])[0];
  const ops=(p.ops||[]).map(o=>E.OPS.find(x=>x.id===o)).filter(Boolean);
  const short=p.desc.length>240?p.desc.slice(0,236).replace(/\s+\S*$/,'')+'...':p.desc;
  const b=openSheet(`<div class="kicker">${esc(p.sys||'Деталь')}</div><h3 class="t">${esc(p.name)}</h3>
    <dl class="kv"><dt>Номер BMW</dt><dd>${num?`<span class="pn">${esc(num)}</span>`:diags.length?`см. схему <span class="pn">${esc(diags[0].id)}</span>${diags.length>1?` и ещё ${diags.length-1}`:''}`:'<span class="muted">нет в каталоге K23</span>'}</dd></dl>
    <p class="small" id="pdesc">${esc(short)}${short!==p.desc?' <button class="linkbtn" id="pmore">ещё</button>':''}</p>
    <div class="row"><button class="btn" id="pcat" ${diags.length?'':'disabled'}>В каталоге${diags.length?` (${diags.length})`:''}</button><button class="btn primary" id="pops" ${ops.length?'':'disabled'}>Операции${ops.length?` (${ops.length})`:''}</button></div>
    <div id="popsl" hidden><h2>Операции с этой деталью</h2><ul class="list">${ops.map(opItem).join('')}</ul></div>`,{kind:'part',size:'low',label:p.name,onClose:()=>E.select(null)});
  const m=b.querySelector('#pmore');if(m)m.onclick=()=>{b.querySelector('#pdesc').textContent=p.desc;};
  b.querySelector('#pcat').onclick=()=>{if(diags.length===1)setView('catalog',{open:diags[0].id});else setView('catalog',{part:id});};
  b.querySelector('#pops').onclick=()=>{const l=b.querySelector('#popsl');l.hidden=!l.hidden;if(!l.hidden)l.scrollIntoView({block:'nearest',behavior:'smooth'});};
  bindOps(b);}

/* ================= operations ================= */
function opItem(o){const z=ZONE[o.id]||'r',locked=!canOp(o.id);
  return `<li><button class="item" data-op="${o.id}"><span class="dot" style="background:var(--z-${z})"></span><b>${esc(o.t)}</b><span class="sub">${esc(o.when)} · ${esc(o.time)}</span><span class="end">${locked?'<span class="lock">PRO</span>':''}<svg viewBox="0 0 24 24" width="18" height="18"><path d="M9 5l7 7-7 7" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg></span></button></li>`;}
function bindOps(root){root.querySelectorAll('[data-op]').forEach(b=>b.onclick=()=>startOp(b.dataset.op));}
H.openOp=id=>startOp(id);
H.openDiag=id=>setView('catalog',{open:id});
function startOp(id){const o=E.OPS.find(x=>x.id===id);if(!o)return;
  if(!canOp(id)){openPro('op');return;}
  if(view!=='garage')setView('garage');closeSheet(true);
  opMode=true;app.classList.add('op');$('opbar').hidden=false;$('opTitle').textContent=o.t;
  $('catPill').hidden=true;E.select(null);E.opOpen(id);track('op_opened',{id});renderStep();syncBack();}
function renderStep(){const o=E.op;if(!o)return;const i=E.step,s=o.steps[i],z=ZONE[o.id]||'r',last=i===o.steps.length-1;
  const html=`<div class="stepno">ШАГ ${i+1} ИЗ ${o.steps.length} · ${esc(o.time)}</div>
   <div class="step"><h4>${esc(s.h)}</h4>
   ${i===0?`<p>${zoneChip(z)}</p><div class="need"><b>Понадобится</b><ul>${o.need.map(n=>`<li>${esc(n)}</li>`).join('')}</ul>${(o.flags||[]).map(f=>`<p class="fact flag" style="display:block;margin-top:8px;font-family:var(--f-body)">Сверить: ${esc(f)}</p>`).join('')}</div>`:''}
   <p>${esc(s.x)}</p>
   ${s.facts?`<div class="facts">${s.facts.map(f=>`<span class="fact ${f[2]||''}">${esc(f[0])}: ${esc(f[1])}${f[2]==='flag'?' · сверить':''}</span>`).join('')}</div>`:''}
   ${s.w?`<div class="warn">${esc(s.w)}</div>`:''}</div>
   <div class="dots">${o.steps.map((_,k)=>`<i class="${k<=i?'on':''}"></i>`).join('')}</div>
   <div class="stepnav"><div class="row"><button class="btn" id="sPrev" ${i?'':'disabled'}>Назад</button>${last?'<button class="btn primary" id="sDone">Сделал</button>':'<button class="btn dark" id="sNext">Дальше</button>'}</div>
   <p class="disc">Совет, не замена сервиса BMW. Сомневаешься, едь в сервис.</p></div>`;
  const b=sheetKind==='step'?$('sbody'):openSheet('',{kind:'step',size:'low',label:o.t});b.innerHTML=html;b.scrollTop=0;
  b.querySelector('#sPrev').onclick=()=>{E.opStep(i-1);renderStep();};
  const n=b.querySelector('#sNext');if(n)n.onclick=()=>{E.opStep(i+1);renderStep();};
  const d=b.querySelector('#sDone');if(d)d.onclick=()=>opDone(o);}
function opDone(o){const ok=addHistory({date:todayISO(),km:S().bike.km,what:o.t,opId:o.id,where:'Сам',items:OPDUE[o.id]?[OPDUE[o.id]]:[]},'op');
  if(!ok)return;track('op_done',{id:o.id});haptic('ok');exitOp(true);setView('service');toast('Записали в историю');}
function exitOp(silent){if(!opMode)return;opMode=false;app.classList.remove('op');$('opbar').hidden=true;E.opClose();if(sheetKind==='step')closeSheet(true);
  E.setTab(sec);syncFabs();if(!silent&&view==='garage')setView('service');syncBack();}
$('opExit').onclick=()=>exitOp();

/* ================= history ================= */
function addHistory(rec,source){const h=S().history;
  if(!isPro()&&h.length>=FREE_HISTORY){openPro('history');return false;}
  rec.id=rec.id||uid();store.set(st=>{st.history.push(rec);if(rec.km!=null&&(st.bike.km==null||rec.km>st.bike.km))st.bike.km=rec.km;});
  track('service_logged',{source:source||'manual',op:rec.opId||''});renderHeader();return true;}

/* ================= service screen ================= */
function renderService(){const el=SCREENS.service,b=S().bike,pro=isPro();
  const due=b.km==null?[]:dueAll();
  const dueRow=r=>`<li><button class="item" data-due="${r.it.id}"><span class="dot" style="background:${r.st==='over'?'var(--z-r)':r.st==='soon'?'var(--z-y)':r.st==='ok'?'var(--z-g)':'var(--line)'}"></span><b>${esc(r.it.t)}</b><span class="sub st ${r.st}">${esc(r.txt)}</span><span class="end"><svg viewBox="0 0 24 24" width="18" height="18"><path d="M9 5l7 7-7 7" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg></span></button></li>`;
  el.innerHTML=`<div class="wrap"><h1>Обслуживание</h1>
   <h2>Что пора сделать</h2>
   ${b.km==null?`<div class="card"><p style="margin:0 0 10px">Укажи пробег и последнее ТО: посчитаю, что пора делать по регламенту BMW.</p><button class="btn primary block" id="setKm">Указать пробег</button></div>`:
     pro?`<ul class="list due">${due.map(dueRow).join('')}</ul>`:
     `<ul class="list due">${due.slice(0,1).map(dueRow).join('')}</ul><div class="blur" style="margin-top:8px"><ul class="list due">${due.slice(1,4).map(dueRow).join('')}</ul><div class="gate"><button class="btn primary" id="dueGate">Весь план в Pro</button></div></div>`}
   <p class="small muted">Интервалы из регламента BMW для Scrambler: 10 000 км или год, 20 000 км, 2 года, 6 лет или 40 000 км. Чего нет в книге, уточни по сервисной книжке BMW.</p>
   <h2>Операции</h2>
   <div class="legend">${zoneChip('g')}${zoneChip('y')}${zoneChip('r')}</div>
   <ul class="list" id="opl">${E.OPS.map(opItem).join('')}</ul>
   <p class="disc">Совет, не замена сервиса BMW. Сомневаешься, едь в сервис.</p></div>`;
  bindOps(el);
  const k=el.querySelector('#setKm');if(k)k.onclick=()=>openBike();
  const g=el.querySelector('#dueGate');if(g)g.onclick=()=>openPro('due');
  el.querySelectorAll('[data-due]').forEach(x=>x.onclick=()=>openDue(x.dataset.due));}
function openDue(id){const it=DUE.find(d=>d.id===id),r=dueOf(it),o=it.op&&E.OPS.find(x=>x.id===it.op);
  const ld=r.ld;
  const b=openSheet(`<div class="kicker">Регламент</div><h3 class="t">${esc(it.t)}</h3>
   <dl class="kv"><dt>Интервал</dt><dd>${[it.km?`${nf(it.km)} км`:'',it.mo?(it.mo>=12?`${it.mo/12} ${plural(it.mo/12,'год','года','лет')}`:`${it.mo} мес`):''].filter(Boolean).join(' или ')}</dd>
   <dt>Последний раз</dt><dd>${ld?[ld.date?fmtDate(ld.date):'',ld.km!=null?nf(ld.km)+' км':''].filter(Boolean).join(', ')+(ld.src==='to'?' (последнее ТО)':''):'нет записи'}</dd>
   <dt>Статус</dt><dd class="st ${r.st}">${esc(r.txt)}</dd></dl>
   ${o?`<p>${zoneChip(ZONE[o.id]||'r')}</p><ul class="list">${opItem(o)}</ul>`:`<p>${zoneChip('r')}</p><p class="small">В книге нет пошаговой операции. Это работа для сервиса BMW: объём, моменты и запчасти уточни по сервисной книжке BMW.</p>`}
   <div class="row" style="margin-top:12px"><button class="btn" id="dueLog">Записать, что сделал</button></div>`,{kind:'due',label:it.t});
  bindOps(b);b.querySelector('#dueLog').onclick=()=>openHistoryForm({items:[it.id],what:it.t});}

/* ================= catalog ================= */
let CATDATA=null,catQ='',catOpen=null,catPart=null;
const CGROUPS={'02':'Сервис и жидкости','11':'Двигатель','12':'Электрика двигателя','13':'Впуск и впрыск','16':'Топливо','17':'Маслорадиатор','18':'Выпуск',
 '21':'Сцепление','23':'Коробка передач','31':'Вилка','32':'Руль и органы управления','33':'Маятник, кардан, редуктор','34':'Тормоза и ABS','35':'Педали',
 '36':'Колёса и шины','46':'Рама и кузов','51':'Замки, зеркала, окраска','52':'Сиденье','61':'Электрика и жгуты','62':'Приборная панель','63':'Свет','65':'Сигнализация','71':'Наклейки','77':'Аксессуары BMW'};
const norm=s=>String(s).toLowerCase().replace(/[\s\-_.]+/g,'');
function renderCatalog(o){o=o||{};const el=SCREENS.catalog;
  if(o.open){catOpen=o.open;catQ='';catPart=null;}if(o.part){catPart=o.part;catQ='';catOpen=null;}
  if(!CATDATA){el.innerHTML='<div class="wrap"><h1>Каталог BMW</h1><p class="lead">Загружаю каталог...</p></div>';
    E.CAT.load().then(d=>{CATDATA=d||[];if(view==='catalog')renderCatalog();});return;}
  el.innerHTML=`<div class="wrap"><h1>Каталог BMW</h1><p class="lead">${CATDATA.length} схем официального каталога R nineT Scrambler K23 с номерами деталей. Ищи по названию по-английски или по номеру.</p>
   <div class="search"><input id="catq" type="search" inputmode="search" enterkeyhint="search" placeholder="например 11 42 или OIL FILTER" value="${esc(catQ)}" aria-label="Поиск по каталогу" autocomplete="off"></div>
   <div id="catl"></div></div>`;
  const inp=el.querySelector('#catq');let t=null;inp.oninput=()=>{clearTimeout(t);t=setTimeout(()=>{catQ=inp.value;catPart=null;catList();},120);};
  catList();
  if(catOpen){const d=el.querySelector(`[data-d="${catOpen}"]`);if(d)setTimeout(()=>d.scrollIntoView({block:'start'}),30);}}
function catList(){const el=SCREENS.catalog.querySelector('#catl');const q=norm(catQ);
  let hits=CATDATA;
  if(catPart){const ids=new Set(partDiags(catPart).map(d=>d.id));hits=CATDATA.filter(d=>ids.has(d.id));}
  else if(q)hits=CATDATA.filter(d=>norm(d.id+d.t).includes(q)||d.r.some(r=>norm(r[1]+r[2]).includes(q)));
  const numQ=/^\d{3,}$/.test(q);
  const by={};hits.forEach(d=>{(by[d.id.slice(0,2)]=by[d.id.slice(0,2)]||[]).push(d);});
  const head=catPart?`<div class="card row" style="justify-content:space-between"><span>Схемы для: <b>${esc(E.P[catPart]?E.P[catPart].name:catPart)}</b></span><button class="btn" id="catAll">Все схемы</button></div>`:(q?`<p class="small muted">Нашлось: ${hits.length}</p>`:'');
  el.innerHTML=head+(Object.keys(by).sort().map(g=>`<div class="cgroup">${g} · ${esc(CGROUPS[g]||'')}</div><ul class="list">${by[g].map(d=>diagHTML(d,q,numQ&&hits.length<=3)).join('')}</ul>`).join('')||'<p class="lead">Ничего не нашлось. Попробуй номер без пробелов или английское название.</p>');
  const a=el.querySelector('#catAll');if(a)a.onclick=()=>{catPart=null;catList();};
  el.querySelectorAll('[data-d]').forEach(b=>b.onclick=()=>{catOpen=catOpen===b.dataset.d?null:b.dataset.d;catList();});
  el.querySelectorAll('[data-show]').forEach(b=>b.onclick=()=>catShow(b.dataset.show));}
function diagHTML(d,q,auto){const open=catOpen===d.id||auto,link=E.CAT.linkOf(d);
  const hl=t=>{if(!q)return esc(t);const n=norm(t);return n.includes(q)?`<mark>${esc(t)}</mark>`:esc(t);};
  return `<li class="diag"><button data-d="${d.id}" aria-expanded="${open}"><b>${esc(d.t)}</b><span>${d.id} · ${d.r.length} поз.${link?' · есть на 3D':''}</span></button>
   ${open?`<div class="body"><div class="row">${link?`<button class="btn primary" data-show="${d.id}">Показать на мотоцикле${isPro()?'':' · PRO'}</button>`:'<span class="small muted">Этой детали нет на модели (аксессуар или расходник).</span>'}</div>
   <table class="cat"><thead><tr><th>№</th><th>Номер BMW</th><th>Деталь</th><th>Шт</th></tr></thead><tbody>${d.r.map(r=>`<tr><td>${esc(r[0])}</td><td class="pn">${hl(r[1])}</td><td>${hl(r[2])}${r[4]?`<small>${esc(r[4])}</small>`:''}</td><td>${esc(r[3])}</td></tr>`).join('')}</tbody></table>
   ${d.n&&d.n.length?`<p class="small muted">${d.n.map(esc).join('<br>')}</p>`:''}</div>`:''}</li>`;}
function catShow(id){const d=CATDATA.find(x=>x.id===id);if(!d)return;if(!isPro()){openPro('cat');return;}
  setView('garage');closeSheet(true);E.setTab('cat');E.CAT.show(d);document.querySelectorAll('#secs button').forEach(b=>b.setAttribute('aria-pressed','false'));
  $('catLbl').textContent=`Подсветка: ${d.id} ${d.t}`;$('catPill').hidden=false;$('infoBtn').hidden=true;track('cat_show',{id});syncBack();}
function catOff(){E.CAT.show(null);setSec(sec);}
$('catOff').onclick=catOff;

/* ================= custom ================= */
const ICON_LOCK='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>';
const SIL={
 bars:'<svg viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"><path d="M10 38c8 0 14 2 20 10h40c6-8 12-10 20-10"/><path d="M30 48l-6 6M70 48l6 6"/><rect x="44" y="44" width="12" height="10" rx="2"/><path d="M50 54v22"/></svg>',
 exhaust:'<svg viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"><path d="M10 30c14 0 20 10 22 22"/><rect x="30" y="46" width="52" height="18" rx="9"/><path d="M82 52h8M82 58h8"/><path d="M44 46v18M56 46v18" stroke-width="3"/></svg>',
 mirrors:'<svg viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"><circle cx="28" cy="34" r="14"/><circle cx="72" cy="34" r="14"/><path d="M34 46l8 26M66 46l-8 26M34 76h32"/></svg>'};
function renderCustom(){const el=SCREENS.custom,w=S().customWanted;
  el.innerHTML=`<div class="wrap"><h1>Кастомайзинг скоро</h1>
   <p class="lead">Оцифровываем кастомные детали для R nineT от производителей. Примеришь их на свой байк в 3D до покупки.</p>
   <div class="cgrid">${[['bars','Руль'],['exhaust','Выхлоп'],['mirrors','Зеркала']].map(([k,n])=>`<div class="ccard"><span class="lk">${ICON_LOCK}</span>${SIL[k]}<div>${n}</div></div>`).join('')}</div>
   <button class="btn primary block" id="wantCustom" ${w?'disabled':''}>${w?'Записали, позовём первым':'Хочу кастом'}</button></div>`;
  el.querySelector('#wantCustom').onclick=()=>{store.set(s=>s.customWanted=true);track('custom_wanted');haptic('ok');toast('Записали, позовём первым');renderCustom();};}

/* ================= cabinet ================= */
const PALETTE=[['#5a5e5f','Графит матовый'],['#1b1c1e','Чёрный'],['#e4e4de','Белый'],['#9e1b1b','Красный'],['#1f3f73','Синий'],['#59613f','Оливковый']];
const MODELS=[['scrambler','Scrambler',true],['ninet','R nineT',false],['pure','Pure',false],['racer','Racer',false],['urban','Urban G/S',false]];
const colorName=c=>{const p=PALETTE.find(x=>x[0].toLowerCase()===String(c).toLowerCase());return p?p[1]:'Свой цвет';};
function renderCabinet(){const el=SCREENS.cabinet,st=S(),b=st.bike,u=tgUser(),pro=isPro();
  const hist=st.history.slice().sort((a,c)=>(c.date||'').localeCompare(a.date||'')||(c.km||0)-(a.km||0));
  el.innerHTML=`<div class="wrap"><h1>${u&&u.first_name?'Привет, '+esc(u.first_name):'Кабинет'}</h1>
   <h2>Мой байк</h2>
   <div class="card"><div class="row" style="justify-content:space-between;align-items:flex-start;flex-wrap:nowrap">
     <div><div class="kicker" style="margin:0 0 4px;text-transform:none">BMW R nineT Scrambler</div>
      <dl class="kv" style="margin:6px 0 0"><dt>Номер</dt><dd class="pn">${b.plate?esc(b.plate.toUpperCase()):'<span class="muted">нет</span>'}</dd>
      <dt>Цвет</dt><dd><span style="display:inline-block;width:14px;height:14px;border-radius:50%;background:${esc(b.color)};vertical-align:-2px;border:1px solid var(--line)"></span> ${esc(colorName(b.color))}</dd>
      <dt>Пробег</dt><dd>${b.km!=null?nf(b.km)+' км':'<span class="muted">не указан</span>'}</dd>
      <dt>Последнее ТО</dt><dd>${b.lastTo.date||b.lastTo.km!=null?[fmtDate(b.lastTo.date),b.lastTo.km!=null?nf(b.lastTo.km)+' км':''].filter(Boolean).join(', '):'<span class="muted">не указано</span>'}</dd></dl></div></div>
     <div class="row" style="margin-top:12px"><button class="btn" id="editBike">Изменить</button><button class="btn primary" id="mkCard">Карточка</button></div></div>
   <h2>История ТО</h2>
   <button class="btn block" id="addH" style="margin-bottom:10px">Добавить запись</button>
   ${hist.length?`<ul class="list hist">${hist.map(h=>{const ph=h.photo&&store.getPhoto(h.id);return `<li><button class="item" data-h="${h.id}">${ph?`<img class="thumb" src="${ph}" alt="">`:`<span class="ico"><svg viewBox="0 0 24 24"><path d="M14.5 6.5a4 4 0 0 0 5 5L21 13l-8 8-2-2 7-7-1.5-1.5a4 4 0 0 0-5-5l2.5 2.5-2 2z"/><path d="M3 21l6-6"/></svg></span>`}<b>${esc(h.what||'Обслуживание')}</b><span class="sub">${[fmtDate(h.date),h.km!=null?nf(h.km)+' км':'',h.where].filter(Boolean).map(esc).join(' · ')}</span></button></li>`;}).join('')}</ul>`:'<p class="lead">Пока пусто. Отметь операцию кнопкой «Сделал» или добавь запись сам.</p>'}
   ${pro?'':`<p class="small muted">Бесплатно до ${FREE_HISTORY} записей, у тебя ${st.history.length}.</p>`}
   <h2>Pro</h2>
   <div class="card"><p style="margin:0 0 10px"><span class="badge ${pro?'':'off'}">${pro?'PRO':'FREE'}</span> ${esc(proLabel())}</p><button class="btn block" id="proMore">Что даёт Pro</button></div>
   <p class="small muted">Данные хранятся ${store.kind==='telegram'?'в облаке Telegram и открываются на любом твоём устройстве':'в этом браузере'}.${store.photosAllowed?'':' Фото заказ-нарядов скоро.'}</p></div>`;
  el.querySelector('#editBike').onclick=()=>openBike();
  el.querySelector('#mkCard').onclick=()=>makeCard();
  el.querySelector('#addH').onclick=()=>openHistoryForm();
  el.querySelector('#proMore').onclick=()=>openPro('cabinet');
  el.querySelectorAll('[data-h]').forEach(x=>x.onclick=()=>openRecord(x.dataset.h));}

function openRecord(id){const h=S().history.find(x=>x.id===id);if(!h)return;const ph=h.photo&&store.getPhoto(h.id);
  const b=openSheet(`<div class="kicker">${esc(fmtDate(h.date))}</div><h3 class="t">${esc(h.what||'Обслуживание')}</h3>
   <dl class="kv"><dt>Пробег</dt><dd>${h.km!=null?nf(h.km)+' км':'-'}</dd><dt>Где</dt><dd>${esc(h.where||'-')}</dd>${h.note?`<dt>Заметка</dt><dd>${esc(h.note)}</dd>`:''}</dl>
   ${ph?`<img class="cardimg" src="${ph}" alt="Фото заказ-наряда">`:''}
   <button class="btn block" id="delH">Удалить запись</button>`,{kind:'rec',label:h.what});
  b.querySelector('#delH').onclick=()=>{store.set(s=>{s.history=s.history.filter(x=>x.id!==id);});store.delPhoto(id);closeSheet();renderCabinet();renderHeader();toast('Удалили');};}

function openHistoryForm(pre){pre=pre||{};const b0=S().bike;let photo=null;
  const b=openSheet(`<h2>Запись в историю</h2>
   <div class="f2"><div class="f"><label for="hD">Дата</label><input id="hD" type="date" value="${pre.date||todayISO()}"></div>
   <div class="f"><label for="hK">Пробег, км</label><input id="hK" type="number" inputmode="numeric" min="0" step="1" value="${pre.km!=null?pre.km:(b0.km!=null?b0.km:'')}"></div></div>
   <div class="f"><span>Что сделано</span><div class="chips" id="hItems">${DUE.map(d=>`<button class="chip" data-it="${d.id}" aria-pressed="${(pre.items||[]).indexOf(d.id)>=0}">${esc(d.t)}</button>`).join('')}</div></div>
   <div class="f"><label for="hW">Своими словами</label><input id="hW" type="text" maxlength="120" placeholder="например: ТО-10 000, масло 15W-50" value="${esc(pre.what||'')}"></div>
   <div class="f"><label for="hP">Где</label><input id="hP" type="text" maxlength="80" list="hPl" placeholder="Сам, дилер BMW, сервис" value="${esc(pre.where||'')}"><datalist id="hPl"><option value="Сам"><option value="Дилер BMW"><option value="Сервис"></datalist></div>
   <div class="f"><span>Фото заказ-наряда</span>${store.photosAllowed?`<input id="hF" type="file" accept="image/*"><img id="hFi" class="cardimg" alt="" hidden>`:'<p class="small muted" style="margin:0">Фото скоро.</p>'}</div>
   <button class="btn primary block" id="hSave">Сохранить</button>`,{kind:'hform',size:'tall',label:'Запись в историю'});
  b.querySelectorAll('[data-it]').forEach(c=>c.onclick=()=>c.setAttribute('aria-pressed',c.getAttribute('aria-pressed')!=='true'));
  const f=b.querySelector('#hF');if(f)f.onchange=async()=>{const file=f.files&&f.files[0];if(!file)return;try{photo=await shrink(file,640,.6);const i=b.querySelector('#hFi');i.src=photo;i.hidden=false;}catch(e){toast('Не получилось прочитать фото');}};
  b.querySelector('#hSave').onclick=()=>{const items=[...b.querySelectorAll('[data-it][aria-pressed="true"]')].map(x=>x.dataset.it);
    const km=b.querySelector('#hK').value===''?null:Math.max(0,Math.round(+b.querySelector('#hK').value));
    let what=b.querySelector('#hW').value.trim();if(!what)what=items.map(i=>DUE.find(d=>d.id===i).t).join(', ')||'Обслуживание';
    const rec={id:uid(),date:b.querySelector('#hD').value||todayISO(),km,what,where:b.querySelector('#hP').value.trim(),items,photo:!!photo};
    if(!addHistory(rec,'manual'))return;
    if(photo&&!store.putPhoto(rec.id,photo)){store.set(s=>{const r=s.history.find(x=>x.id===rec.id);if(r)r.photo=false;});toast('Фото не влезло в память браузера, запись сохранена');}
    haptic('ok');closeSheet();if(view==='cabinet')renderCabinet();else if(view==='service')renderService();toast('Записали в историю');};}
function shrink(file,max,q){return new Promise((res,rej)=>{const u=URL.createObjectURL(file),i=new Image();i.onload=()=>{const k=Math.min(1,max/Math.max(i.width,i.height)),c=document.createElement('canvas');
  c.width=Math.round(i.width*k);c.height=Math.round(i.height*k);c.getContext('2d').drawImage(i,0,0,c.width,c.height);URL.revokeObjectURL(u);res(c.toDataURL('image/jpeg',q));};i.onerror=e=>{URL.revokeObjectURL(u);rej(e);};i.src=u;});}

/* ================= my bike form (first run «Это твой?» and editing) ================= */
function openBike(first){const b=S().bike;let color=b.color,saved=false;
  const sh=openSheet(`<h2>${first?'Это твой?':'Мой байк'}</h2>
   ${first?'<p class="lead">Настрой под себя: цвет и номер сразу появятся на модели. Можно пропустить и вернуться в кабинете.</p>':''}
   <div class="f"><span>Модель</span><div class="chips">${MODELS.map(([k,n,ok])=>`<button class="chip" ${ok?'aria-pressed="true"':'disabled'}>${n}${ok?'':' <small>скоро</small>'}</button>`).join('')}</div></div>
   <div class="f"><span>Цвет бака</span><div class="swatches" id="sws">${PALETTE.map(([c,n])=>`<button class="sw" data-c="${c}" style="background:${c}" aria-label="${n}" title="${n}" aria-pressed="${c.toLowerCase()===String(color).toLowerCase()}"></button>`).join('')}<label class="sw own" title="Свой цвет" aria-pressed="${PALETTE.every(p=>p[0].toLowerCase()!==String(color).toLowerCase())}"><input type="color" id="swOwn" value="${esc(color)}" aria-label="Свой цвет"></label></div><span class="small muted" id="swName">${esc(colorName(color))}</span></div>
   <div class="f"><label for="bP">Номер</label><input id="bP" type="text" maxlength="12" autocomplete="off" autocapitalize="characters" placeholder="1234 АВ 77" value="${esc(b.plate)}"></div>
   <div class="f"><label for="bK">Пробег сейчас, км</label><input id="bK" type="number" inputmode="numeric" min="0" step="1" placeholder="например 12000" value="${b.km!=null?b.km:''}"></div>
   <div class="f2"><div class="f"><label for="bTd">Последнее ТО: дата</label><input id="bTd" type="date" value="${esc(b.lastTo.date)}"></div>
   <div class="f"><label for="bTk">Пробег на ТО, км</label><input id="bTk" type="number" inputmode="numeric" min="0" step="1" value="${b.lastTo.km!=null?b.lastTo.km:''}"></div></div>
   <div class="row"><button class="btn" id="bSkip">${first?'Пропустить':'Отмена'}</button><button class="btn primary" id="bSave">${first?'Готово':'Сохранить'}</button></div>`,
   {kind:'bike',size:first?'':'tall',label:first?'Это твой?':'Мой байк',onClose:()=>{if(!saved){E.setPaint(S().bike.color);E.setPlate(S().bike.plate);}if(first&&!S().onboarded)store.set(s=>s.onboarded=true);}});
  const pick=c=>{color=c;E.setPaint(c);sh.querySelectorAll('.sw').forEach(x=>x.setAttribute('aria-pressed',x.dataset.c?x.dataset.c.toLowerCase()===c.toLowerCase():PALETTE.every(p=>p[0].toLowerCase()!==c.toLowerCase())));sh.querySelector('#swName').textContent=colorName(c);haptic('sel');};
  sh.querySelectorAll('.sw[data-c]').forEach(x=>x.onclick=()=>pick(x.dataset.c));
  sh.querySelector('#swOwn').oninput=e=>pick(e.target.value);
  const pl=sh.querySelector('#bP');pl.oninput=()=>E.setPlate(pl.value);
  sh.querySelector('#bSkip').onclick=()=>closeSheet();
  sh.querySelector('#bSave').onclick=()=>{const num=id=>{const v=sh.querySelector(id).value;return v===''?null:Math.max(0,Math.round(+v));};
    const km=num('#bK'),tk=num('#bTk'),wasKm=S().bike.km,wasAdded=S().bikeAdded;
    store.set(s=>{s.bike.color=color;s.bike.plate=pl.value.trim().toUpperCase();s.bike.km=km;s.bike.lastTo={date:sh.querySelector('#bTd').value,km:tk};s.onboarded=true;
      if(km!=null&&!s.pro.trialStart)s.pro.trialStart=Date.now();s.bikeAdded=true;});
    if(!wasAdded)track('bike_added',{color:colorName(color),plate:S().bike.plate?1:0});
    if(km!=null&&km!==wasKm)track('mileage_set',{km});
    saved=true;haptic('ok');closeSheet();renderHeader();E.setPlate(S().bike.plate);E.setPaint(S().bike.color);
    if(view==='cabinet')renderCabinet();if(view==='service')renderService();
    toast(km!=null&&wasKm==null&&S().pro.trialStart&&Date.now()-S().pro.trialStart<5000?'Сохранили. Триал Pro на 14 дней включён':'Сохранили');};}

/* ================= Pro ================= */
function openPro(reason){const pro=isPro(),w=S().pro.wanted,P=CFG.price||{};
  const why={op:'Эта операция в Pro. Бесплатно открыта первая: «Проверить уровень масла».',history:`Бесплатно до ${FREE_HISTORY} записей в истории.`,cat:'Подсветка схемы на мотоцикле в Pro. Сами схемы и номера бесплатно.',due:'Полный план «что пора сделать» в Pro.'}[reason]||'';
  const yes='<td>да</td>',no='<td class="muted">-</td>';
  const b=openSheet(`<div class="pro-hero"><h3>Гараж Pro</h3><p>${esc(proLabel())}</p></div>
   ${why?`<p>${esc(why)}</p>`:''}
   <table class="cmp"><tr><td></td><td class="muted small">Free</td><td class="small">Pro</td></tr>
    <tr><td>3D, разделы, кнопки, лампы приборки</td>${yes}${yes}</tr>
    <tr><td>Схемы и номера каталога BMW</td>${yes}${yes}</tr>
    <tr><td>Операции по шагам на 3D</td><td class="small">одна</td>${yes}</tr>
    <tr><td>Подсветка схемы на мотоцикле</td>${no}${yes}</tr>
    <tr><td>Что пора сделать по пробегу и дате</td><td class="small">1 пункт</td>${yes}</tr>
    <tr><td>История ТО</td><td class="small">3 записи</td><td class="small">без лимита</td></tr></table>
   <div class="prices"><div class="price"><b>${esc(P.month||'299 ₽/мес')}</b><span>помесячно</span></div><div class="price"><b>${esc(P.year||'1 990 ₽/год')}</b><span>выгоднее на 45%</span></div></div>
   <p id="proMsg" class="card" ${w?'':'hidden'}>Записали. Оплата откроется скоро, продлим тебе триал до запуска.</p>
   <button class="btn primary block" id="proWant" ${w?'disabled':''}>${w?'Ты в списке':'Хочу Pro'}</button>
   <p class="small muted" style="margin-top:10px">Сейчас кнопка денег не берёт.</p>`,{kind:'pro',size:'tall',label:'Гараж Pro'});
  b.querySelector('#proWant').onclick=e=>{store.set(s=>{s.pro.wanted=true;if(!s.pro.trialStart)s.pro.trialStart=Date.now();});track('pro_wanted',{reason:reason||''});haptic('ok');
    b.querySelector('#proMsg').hidden=false;e.target.disabled=true;e.target.textContent='Ты в списке';
    if(view==='service')renderService();if(view==='cabinet')renderCabinet();if(view==='catalog')catList();};}

/* ================= card «мой байк» 1080x1350 ================= */
function rrect(x,X,Y,w,h,r){x.beginPath();x.moveTo(X+r,Y);x.arcTo(X+w,Y,X+w,Y+h,r);x.arcTo(X+w,Y+h,X,Y+h,r);x.arcTo(X,Y+h,X,Y,r);x.arcTo(X,Y,X+w,Y,r);x.closePath();}
function drawCard(){const W=1080,Hh=1350,c=document.createElement('canvas');c.width=W;c.height=Hh;const x=c.getContext('2d'),b=S().bike;
  const F='"Golos Text",system-ui,-apple-system,"Segoe UI",Arial,sans-serif',FD='"Unbounded","Golos Text",Arial,sans-serif';
  let shot=null;try{shot=E.snapshot(1080,1080,'overall');}catch(e){console.warn('snapshot',e);}
  x.fillStyle='#121417';x.fillRect(0,0,W,Hh);
  if(shot)x.drawImage(shot,0,60,1080,1000,0,150,1080,1000);
  const g=x.createLinearGradient(0,880,0,1350);g.addColorStop(0,'rgba(18,20,23,0)');g.addColorStop(.35,'rgba(18,20,23,.92)');g.addColorStop(1,'#121417');x.fillStyle=g;x.fillRect(0,880,W,470);
  x.fillStyle='#121417';x.fillRect(0,0,W,150);
  /* logo */
  x.fillStyle='#F2B705';rrect(x,60,44,64,64,16);x.fill();x.strokeStyle='#15181B';x.lineWidth=6;x.lineJoin='round';x.beginPath();x.moveTo(72,80);x.lineTo(92,64);x.lineTo(112,80);x.lineTo(112,98);x.lineTo(72,98);x.closePath();x.stroke();
  x.fillStyle='#F3F4F5';x.font='700 44px '+FD;x.textBaseline='middle';x.fillText('Гараж',144,78);
  x.fillStyle='#9AA1A9';x.font='500 30px '+F;x.textAlign='right';x.fillText('BMW R nineT Scrambler',1020,78);x.textAlign='left';
  /* plate */
  let y=1080;
  if(b.plate){x.font='700 56px '+F;const tw=Math.max(220,x.measureText(b.plate).width+60);x.fillStyle='#F4F5F2';rrect(x,60,y-54,tw,108,14);x.fill();x.lineWidth=6;x.strokeStyle='#15181B';x.stroke();
    x.fillStyle='#15181B';x.fillText(b.plate.toUpperCase(),90,y+2);}
  else{x.fillStyle='#F3F4F5';x.font='700 52px '+FD;x.fillText('Мой R nineT',60,y);}
  const stat=(lbl,val,X)=>{x.fillStyle='#9AA1A9';x.font='500 28px '+F;x.fillText(lbl,X,1196);x.fillStyle='#F3F4F5';x.font='700 44px '+F;x.fillText(val,X,1248);};
  stat('Пробег',b.km!=null?nf(b.km)+' км':'-',60);
  const lt=b.lastTo,hist=S().history.slice().sort((a,c)=>(c.date||'').localeCompare(a.date||''))[0];
  const toD=hist&&hist.date&&(!lt.date||hist.date>lt.date)?hist.date:lt.date;
  stat('Последнее ТО',toD?fmtDate(toD):'-',460);
  x.fillStyle='#F2B705';x.fillRect(60,1300,960,6);
  return c;}
function makeCard(){let c;try{c=drawCard();}catch(e){console.warn(e);toast('Не получилось собрать карточку');return;}
  const url=c.toDataURL('image/png');
  const b=openSheet(`<h2>Карточка «мой байк»</h2><img class="cardimg" id="cardImg" src="${url}" alt="Карточка мотоцикла">
   <p class="small muted" id="cardHint" hidden>Зажми картинку и сохрани.</p>
   <div class="row"><button class="btn primary" id="cardGo">${inTG?'Сохранить':'Поделиться'}</button></div>`,{kind:'card',size:'tall',label:'Карточка'});
  b.querySelector('#cardGo').onclick=async()=>{
    if(inTG){let ok=false;try{if(tgv('8.0')&&TG.downloadFile){TG.downloadFile({url,file_name:'garage-r9t.png'},r=>{if(r)track('card_shared',{via:'tg_download'});});ok=true;}}catch(e){ok=false;}
      if(!ok){b.querySelector('#cardHint').hidden=false;track('card_shared',{via:'tg_hold'});}return;}
    try{const blob=await new Promise(r=>c.toBlob(r,'image/png'));const file=new File([blob],'garage-r9t.png',{type:'image/png'});
      if(navigator.canShare&&navigator.canShare({files:[file]})){await navigator.share({files:[file],title:'Мой R nineT'});track('card_shared',{via:'share'});return;}}catch(e){if(e&&e.name==='AbortError')return;}
    const a=document.createElement('a');a.href=url;a.download='garage-r9t.png';document.body.appendChild(a);a.click();a.remove();track('card_shared',{via:'download'});};}

/* ================= boot ================= */
let engineReady=null;const engineP=new Promise(r=>engineReady=r);
H.ready=ok=>engineReady(ok);
if(window.__r9tLoaded)engineReady(true);
(async function boot(){
  await store.init();
  if(inTG)track('opened_in_telegram',{platform:TG.platform||'',v:TG.version||''});
  renderHeader();setSec('bike');syncFabs();
  const ok=await engineP;
  E.setPaint(S().bike.color);E.setPlate(S().bike.plate);
  window.__garageReady=true;
  if(!S().onboarded&&ok&&view==='garage'){E.setAutoRot(true);syncFabs();setTimeout(()=>{if(view==='garage'&&!sheetKind)openBike(true);},900);}
  E.CAT.load();
})();
window.GARAGE={setView,startOp,openPro,makeCard,isPro,back,get view(){return view;},get sheet(){return sheetKind;}};
})();
