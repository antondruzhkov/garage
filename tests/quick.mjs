// quick look: a few phone/desktop screens without the full scenario
import {createRequire} from 'node:module';const require=createRequire('/opt/node22/lib/node_modules/');
const {chromium}=require('playwright');import {serve} from './serve.mjs';
const OUT=process.argv[2],W=+(process.argv[3]||390),Hh=+(process.argv[4]||844);
const srv=await serve();const base=`http://127.0.0.1:${srv.address().port}/`;
const b=await chromium.launch({args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
const mob=W<900;const ctx=await b.newContext({viewport:{width:W,height:Hh},isMobile:mob,hasTouch:mob});
const pg=await ctx.newPage();const errs=[];pg.on('pageerror',e=>errs.push(e.message));pg.on('console',m=>{if(m.type()==='error')errs.push(m.text());});
await pg.route(/fonts\.(googleapis|gstatic)\.com|telegram\.org/,r=>r.fulfill({status:200,body:''}));
await pg.addInitScript(()=>{if(!localStorage.getItem('garage-state'))localStorage.setItem('garage-state',JSON.stringify({onboarded:true,bike:{km:12000,plate:'1234 АВ 77',color:'#9e1b1b',lastTo:{date:'2026-04-10',km:5000}}}));});
await pg.goto(base);await pg.waitForFunction(()=>window.__garageReady,null,{timeout:120000});
const shot=async n=>{await pg.waitForTimeout(1200);await pg.screenshot({path:`${OUT}/${n}.png`,timeout:180000,animations:'disabled'});};
const click=async s=>{await pg.locator(s).first().click({timeout:90000});await pg.waitForTimeout(300);};
await shot('a-garage');
if(mob){await click('#secNext');await shot('b-engine');await click('#secTitle');await shot('c-list');await click('[data-s="bike"]');}
if(mob)await click('#fabInfo');await click('#panel [data-sys="fuel"]');await shot('d-contour');await click('#ctrOff');
await click('#fabEx');await shot('e-explode');await click('#fabEx');
if(mob){await click('#secPrev');}else await click('#secs [data-sec="dash"]');await shot('f-dash');
await click('#tabbar [data-view="service"]');await shot('g-service-over-dash');
console.log('errors:',errs);await b.close();srv.close();
