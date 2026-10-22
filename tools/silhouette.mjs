// Builds the loader silhouette from the real 3D model:
// 1) here: the bike from the right side, each group of parts in its own flat colour -> scratch PNG
// 2) tools/silhouette_line.py: one outline per group (wheels, tank, seat, engine, exhaust, fork), no small details
//    -> web/assets/silhouette-line.png (alpha mask for the loader)
// node tools/silhouette.mjs <out.png>
import {createRequire} from 'node:module';import fs from 'node:fs';
const require=createRequire('/opt/node22/lib/node_modules/');const {chromium}=require('playwright');
import {serve} from '../tests/serve.mjs';
const OUT=process.argv[2]||'silhouette-groups.png';
const srv=await serve();const base=`http://127.0.0.1:${srv.address().port}/`;
const b=await chromium.launch({args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
const pg=await (await b.newContext({viewport:{width:1200,height:800}})).newPage();
await pg.route(/fonts\.(googleapis|gstatic)\.com|telegram\.org/,r=>r.fulfill({status:200,body:''}));
await pg.addInitScript(()=>{localStorage.setItem('garage-state',JSON.stringify({onboarded:true}));localStorage.setItem('garage-hint-seen','1');});
await pg.goto(base);await pg.waitForFunction(()=>window.__garageReady&&R9T.ready,null,{timeout:180000});
await pg.evaluate(()=>R9T.setAutoRot(false));await pg.waitForTimeout(3000);
const url=await pg.evaluate(()=>{const G={};
  const put=(c,ids)=>ids.forEach(id=>G[id]=c);
  put(0xff0000,['wheelF','wheelR','brakeF','brakeR']);put(0x00ff00,['tank','fuelCap']);put(0x0000ff,['seat','tail']);
  put(0xffff00,['crankcase','cylL','cylR','headL','headR','coverL','coverR','capL','capR','gearbox','beltcover','throttle','airbox']);
  put(0xff00ff,['headers','collector','silencers']);put(0x00ffff,['fork','triple','fender','light','bars','resF','clutchMaster']);
  return R9T.partShot([],1600,1000,{all:true,groups:G,bg:'#ffffff',dir:[0,0,1],fov:12}).toDataURL('image/png');});
fs.writeFileSync(OUT,Buffer.from(url.split(',')[1],'base64'));console.log('saved',OUT);await b.close();srv.close();
