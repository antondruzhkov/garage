// loader: silhouette while loading, «Повторить» on a broken download, retry brings the real model; the placeholder is never shown
import {createRequire} from 'node:module';const require=createRequire('/opt/node22/lib/node_modules/');
const {chromium}=require('playwright');import {serve} from './serve.mjs';
const OUT=process.argv[2];const srv=await serve();const base=`http://127.0.0.1:${srv.address().port}/`;
const b=await chromium.launch({args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
const pg=await (await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,colorScheme:'dark'})).newPage();
let fails=0;const ok=(c,m)=>{console.log(c?'  ok':'  FAIL',m);if(!c)fails++;};
await pg.route(/fonts\.(googleapis|gstatic)\.com|telegram\.org/,r=>r.fulfill({status:200,body:''}));
await pg.addInitScript(()=>{localStorage.setItem('garage-state',JSON.stringify({onboarded:true}));localStorage.setItem('garage-hint-seen','1');});
let mode='abort';await pg.route(/bike\.wasm/,async r=>{if(mode==='abort')return r.abort();if(mode==='hold'){await new Promise(z=>setTimeout(z,8000));}return r.continue();});
await pg.goto(base);await pg.waitForFunction(()=>!document.getElementById('ldRetry').hidden,null,{timeout:60000});
ok(await pg.evaluate(()=>!!document.getElementById('loader')&&!window.__r9tLoaded),'broken download: loader stays, no placeholder bike');
await pg.screenshot({path:OUT+'/loader-fail.png'});await pg.evaluate(()=>{document.getElementById('loader').style.setProperty('--p',0.5);document.getElementById('ldtxt').textContent='ЗАГРУЖАЮ МОДЕЛЬ 50%';document.getElementById('ldsub').textContent='';document.getElementById('ldRetry').hidden=true;});await pg.waitForTimeout(700);await pg.screenshot({path:OUT+'/loader-50.png'});
mode='go';await pg.evaluate(()=>{document.getElementById('ldRetry').hidden=false;});await pg.locator('#ldRetry').tap();await pg.waitForTimeout(1500);
await pg.waitForFunction(()=>window.__garageReady&&R9T.ready,null,{timeout:180000});
ok(await pg.evaluate(()=>R9T.ready),'retry loads the real model');
console.log(fails?'FAILED':'ALL OK');await b.close();srv.close();process.exit(fails?1:0);
