// Прогон перед push: iPhone 390x844 и десктоп 1440x900, плюс эмуляция Telegram.
// node tests/e2e.mjs <папка для скриншотов> [phone|desktop|tg|all]
import {createRequire} from 'node:module';
import fs from 'node:fs';
import {serve} from './serve.mjs';
const require=createRequire('/opt/node22/lib/node_modules/');
const {chromium}=require('playwright');

const OUT=process.argv[2]||'shots';const ONLY=process.argv[3]||'all';
fs.mkdirSync(OUT,{recursive:true});
const srv=await serve();const BASE=`http://127.0.0.1:${srv.address().port}/`;
const browser=await chromium.launch({args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
let fails=0;
const ok=(c,m)=>{if(!c){fails++;console.log('  FAIL',m);}else console.log('  ok',m);};

/* Telegram.WebApp stub: initData, CloudStorage (kept in localStorage '__tgcloud' so it survives reload), BackButton, haptics */
const TG_STUB=()=>{const calls=window.__tgcalls=[];const log=n=>(...a)=>calls.push([n,...a]);
  const db=()=>JSON.parse(localStorage.getItem('__tgcloud')||'{}'),put=o=>localStorage.setItem('__tgcloud',JSON.stringify(o));
  const bb={isVisible:false,_cb:null,show(){bb.isVisible=true;calls.push(['bb.show']);},hide(){bb.isVisible=false;calls.push(['bb.hide']);},onClick(f){bb._cb=f;}};
  window.Telegram={WebApp:{initData:'query_id=AAE&user=%7B%22id%22%3A1%2C%22first_name%22%3A%22%D0%90%D0%BD%D1%82%D0%BE%D0%BD%22%7D&auth_date=1&hash=x',
    initDataUnsafe:{user:{id:1,first_name:'Антон'}},version:'8.0',platform:'ios',colorScheme:'dark',
    themeParams:{bg_color:'#1c1c1d',secondary_bg_color:'#000000',text_color:'#ffffff',hint_color:'#98989e',section_separator_color:'#38383a'},
    isVersionAtLeast:v=>parseFloat(v)<=8.0,ready:log('ready'),expand:log('expand'),disableVerticalSwipes:log('disableVerticalSwipes'),
    setHeaderColor:log('setHeaderColor'),setBackgroundColor:log('setBackgroundColor'),setBottomBarColor:log('setBottomBarColor'),onEvent:log('onEvent'),
    BackButton:bb,HapticFeedback:{impactOccurred:log('haptic'),notificationOccurred:log('haptic'),selectionChanged:log('haptic')},
    downloadFile(p){const u=new URL(p.url);if(u.protocol!=='https:')throw new Error('WebAppDownloadFileParamInvalid');calls.push(['downloadFile']);},
    CloudStorage:{setItem(k,v,cb){if(String(v).length>4096)return cb&&cb('VALUE_TOO_LONG');const o=db();o[k]=String(v);put(o);setTimeout(()=>cb&&cb(null,true),5);},
      getItem(k,cb){setTimeout(()=>cb(null,db()[k]||''),5);},getItems(ks,cb){const o=db();setTimeout(()=>cb(null,Object.fromEntries(ks.map(k=>[k,o[k]||'']))),5);},
      removeItems(ks,cb){const o=db();ks.forEach(k=>delete o[k]);put(o);setTimeout(()=>cb&&cb(null,true),5);}}}};};

async function run(name,ctxOpts,o){
  console.log(`\n== ${name}`);
  const ctx=await browser.newContext(ctxOpts);const pg=await ctx.newPage();const errs=[];
  pg.on('console',m=>{if(m.type()==='error')errs.push(m.text());});pg.on('pageerror',e=>errs.push('PAGEERR '+e.message));
  await pg.route(/fonts\.(googleapis|gstatic)\.com|telegram\.org|mc\.yandex/,r=>r.fulfill({status:200,contentType:'text/css',body:''}));
  if(o.tg)await pg.addInitScript(TG_STUB);
  const mob=!!ctxOpts.isMobile;const P=n=>`${OUT}/${name}-${n}.png`;
  const shot=async n=>{await pg.waitForTimeout(o.settle||900);await pg.screenshot({path:P(n)});};
  const tap=async sel=>{const el=pg.locator(sel).first();await el.scrollIntoViewIfNeeded();if(mob)await el.tap();else await el.click();await pg.waitForTimeout(250);};
  const t0=Date.now();await pg.goto(BASE+(o.q||''));
  await pg.waitForFunction(()=>window.__garageReady&&window.R9T&&R9T.ready,null,{timeout:180000});
  console.log('  model ready',Date.now()-t0,'ms');
  // overflow check: nothing wider than the screen
  const ov=await pg.evaluate(()=>document.documentElement.scrollWidth-innerWidth);ok(ov<=0,'no horizontal overflow');

  // first run
  await pg.waitForFunction(()=>GARAGE.sheet==='bike',null,{timeout:8000});ok(true,'first-run sheet «Это твой?» opened');
  ok(await pg.evaluate(()=>R9T.autoRot),'bike rotates on first run');
  await shot('01-first-run');
  await tap('.sw[data-c="#9e1b1b"]');
  await pg.fill('#bP','1234 АВ 77');await pg.fill('#bK','12000');await pg.fill('#bTd','2026-04-10');await pg.fill('#bTk','5000');
  await tap('#bSave');
  ok(await pg.evaluate(()=>store.state.bike.plate==='1234 АВ 77'&&store.state.bike.km===12000),'bike saved');
  ok(await pg.evaluate(()=>{let c=null;R9T.P.tank.g.traverse(m=>{if(m.material&&m.material.userData&&m.material.userData.k==='paint'&&m.userData.scan)c=m.material.color.getHexString();});return c;})==='9e1b1b','tank repainted red');
  ok(await pg.evaluate(()=>!!store.state.pro.trialStart&&GARAGE.isPro()),'trial started after mileage');
  await shot('02-garage');
  // plate visible from behind
  await pg.evaluate(()=>{R9T.setAutoRot(false);window.__r9t.goViewRaw({p:[-1500,900,500],t:[-200,620,0]});});
  await shot('03-plate');
  ok(await pg.evaluate(()=>{let v=false;R9T.P.tail.g.traverse(m=>{if(m.geometry&&m.geometry.type==='PlaneGeometry'&&m.material.map&&m.visible)v=true;});return v;}),'plate texture on the bike');
  // sections
  for(const s of ['engine','drive','brakes','elec','dash','bike']){await tap(`#secs [data-sec="${s}"]`);ok(await pg.evaluate(x=>R9T.tab===x,s),'section '+s);await shot('04-sec-'+s);}
  // info sheet with r9t panel
  if(mob){await tap('#secs [data-sec="engine"]');await tap('#infoBtn');ok(await pg.evaluate(()=>GARAGE.sheet==='info'&&!!document.querySelector('#sbody #panel h2')),'section info in sheet');await shot('05-engine-info');await tap('#sheetX');await tap('#secs [data-sec="bike"]');}
  // buttons
  await tap('#fabEx');ok(await pg.evaluate(()=>R9T.explode>0.9),'explode button');await shot('06-exploded');await tap('#fabEx');ok(await pg.evaluate(()=>R9T.explode<0.01),'assemble button');
  await tap('#fabXray');ok(await pg.evaluate(()=>R9T.xray),'xray button');await tap('#fabXray');
  // tap a part: find a pixel that hits the tank
  await pg.evaluate(()=>R9T.homeView());await pg.waitForTimeout(1300);
  const pt=await pg.evaluate(()=>{const c=document.getElementById('gl').getBoundingClientRect();for(let y=c.top+40;y<c.bottom-40;y+=12)for(let x=c.left+30;x<c.right-80;x+=12){const id=R9T.pickAt(x,y);if(id==='tank')return [x,y];}return null;});
  ok(!!pt,'found the tank on screen');
  if(pt){if(mob)await pg.touchscreen.tap(pt[0],pt[1]);else await pg.mouse.click(pt[0],pt[1]);await pg.waitForTimeout(700);
    ok(await pg.evaluate(()=>GARAGE.sheet==='part'),'tap opens part sheet');await shot('07-part');
    // double tap resets
    if(mob){await pg.touchscreen.tap(pt[0],pt[1]);await pg.waitForTimeout(120);await pg.touchscreen.tap(pt[0],pt[1]);}else await pg.mouse.dblclick(pt[0],pt[1]);
    await pg.waitForTimeout(700);ok(await pg.evaluate(()=>GARAGE.sheet!=='part'),'double tap closes sheet and resets view');}
  // page does not scroll or zoom under 3D
  ok(await pg.evaluate(()=>getComputedStyle(document.getElementById('gl')).touchAction==='none'),'touch-action none on canvas');
  // service
  await tap('#tabbar [data-view="service"]');await shot('08-service');
  ok(await pg.locator('#scr-service .due .item').count()>=5,'what is due list');
  await tap('#scr-service [data-op="oilChange"]');ok(await pg.evaluate(()=>R9T.tab==='service'&&R9T.op&&R9T.op.id==='oilChange'),'operation opened on 3D');
  await shot('09-op-step1');
  const n=await pg.evaluate(()=>R9T.op.steps.length);for(let i=1;i<n;i++)await tap('#sNext');
  ok(await pg.locator('#sDone').count()===1,'last step has «Сделал»');await shot('10-op-last');
  ok(await pg.locator('.disc').first().innerText().then(t=>t.includes('Совет, не замена сервиса BMW')),'disclaimer in operation');
  await tap('#sDone');ok(await pg.evaluate(()=>store.state.history.some(h=>h.opId==='oilChange')),'«Сделал» wrote history');
  await shot('11-service-after');
  // catalog
  await tap('#tabbar [data-view="catalog"]');await pg.waitForSelector('#catq');await pg.fill('#catq','11 42 7 673 541');await pg.waitForTimeout(500);
  ok(await pg.locator('#catl .diag').count()>=1,'search by BMW number');await shot('12-catalog');
  await tap('#catl [data-show]');ok(await pg.evaluate(()=>R9T.tab==='cat'&&GARAGE.view==='garage'),'show on bike');await pg.waitForTimeout(1200);await shot('13-cat-show');
  await tap('#catOff');
  // custom
  await tap('#tabbar [data-view="custom"]');await shot('14-custom');await tap('#wantCustom');ok(await pg.evaluate(()=>store.state.customWanted&&Array.isArray(store.state.custom)),'custom wanted + custom:[] in store');
  // cabinet + history form + card + pro
  await tap('#tabbar [data-view="cabinet"]');await shot('15-cabinet');
  await tap('#addH');await tap('[data-it="brakefluid"]');await pg.fill('#hP','Дилер BMW');await tap('#hSave');
  ok(await pg.evaluate(()=>store.state.history.length===2),'manual history record');
  await tap('#mkCard');await pg.waitForSelector('#cardImg');ok(await pg.evaluate(()=>{const i=document.getElementById('cardImg');return i.naturalWidth===1080&&i.naturalHeight===1350;}),'card 1080x1350');await shot('16-card');
  if(o.tg){await tap('#cardGo');ok(await pg.evaluate(()=>!document.getElementById('cardHint').hidden),'TG: hold-to-save hint when downloadFile cannot take data URL');}
  await tap('#sheetX');
  await tap('#proMore');await shot('17-pro');await tap('#proWant');ok(await pg.evaluate(()=>!document.getElementById('proMsg').hidden),'Хочу Pro message');await tap('#sheetX');
  const ev=await pg.evaluate(()=>window.__garageEvents||[]);
  for(const e of ['bike_added','mileage_set','service_logged','op_opened','op_done','cat_show','pro_wanted','card_shared','custom_wanted'].concat(o.tg?['opened_in_telegram']:[]))
    if(!(e==='card_shared'&&!o.tg))ok(ev.includes(e),'event '+e);
  if(o.tg){const calls=await pg.evaluate(()=>window.__tgcalls.map(c=>c[0]));
    for(const c of ['ready','expand','disableVerticalSwipes','haptic','bb.show'])ok(calls.includes(c),'TG '+c);
    ok(await pg.evaluate(()=>store.kind==='telegram'&&!!localStorage.getItem('__tgcloud')),'TG CloudStorage used');
    ok(await pg.evaluate(()=>Object.values(JSON.parse(localStorage.getItem('__tgcloud'))).every(v=>v.length<=4096)),'cloud values <= 4096');
    ok(await pg.evaluate(()=>document.querySelector('#scr-cabinet h1').textContent.includes('Антон')),'TG user name in cabinet');
    await pg.evaluate(()=>localStorage.removeItem('garage-state'));}
  // reload: data in place
  await pg.reload();await pg.waitForFunction(()=>window.__garageReady,null,{timeout:180000});
  ok(await pg.evaluate(()=>store.state.bike.plate==='1234 АВ 77'&&store.state.history.length===2&&store.state.onboarded),'data survives reload');
  ok(await pg.evaluate(()=>GARAGE.sheet!=='bike'),'no first-run sheet after reload');
  await shot('18-reloaded');
  ok(errs.length===0,'console clean'+(errs.length?': '+errs.join(' | '):''));
  await ctx.close();}

const phone={viewport:{width:390,height:844},deviceScaleFactor:+(process.env.DPR||1),isMobile:true,hasTouch:true,userAgent:'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'};
if(ONLY==='all'||ONLY==='phone')await run('phone',phone,{});
if(ONLY==='all'||ONLY==='desktop')await run('desktop',{viewport:{width:1440,height:900}},{});
if(ONLY==='all'||ONLY==='tg')await run('tg',phone,{tg:true});
await browser.close();srv.close();
console.log(fails?`\n${fails} FAILED`:'\nALL OK');process.exit(fails?1:0);
