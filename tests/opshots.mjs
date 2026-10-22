// phone: service screen + each step of one operation (camera framing check)
import {createRequire} from 'node:module';const require=createRequire('/opt/node22/lib/node_modules/');
const {chromium}=require('playwright');import {serve} from './serve.mjs';
const OUT=process.argv[2],OP=process.argv[3]||'coilSwap';const srv=await serve();const base=`http://127.0.0.1:${srv.address().port}/?pro=1`;
const b=await chromium.launch({args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
const ctx=await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});const pg=await ctx.newPage();const errs=[];
pg.on('pageerror',e=>errs.push(e.message));pg.on('console',x=>{if(x.type()==='error')errs.push(x.text());});
await pg.route(/fonts\.(googleapis|gstatic)\.com|telegram\.org/,r=>r.fulfill({status:200,body:''}));
await pg.addInitScript(()=>{localStorage.setItem('garage-state',JSON.stringify({onboarded:true,bike:{km:35000,color:'#9e1b1b'}}));localStorage.setItem('garage-hint-seen','1');});
await pg.goto(base);await pg.waitForFunction(()=>window.__garageReady&&R9T.ready,null,{timeout:120000});
const shot=async n=>{await pg.waitForTimeout(1500);await pg.screenshot({path:`${OUT}/${n}.png`,timeout:180000,animations:'disabled'});};
await pg.locator('#tabbar [data-view="service"]').tap({timeout:90000});await shot('s1');
await pg.evaluate(()=>document.getElementById('scr-service').scrollTop=520);await shot('s2');
await pg.evaluate(o=>GARAGE.startOp(o),OP);
const n=await pg.evaluate(()=>R9T.op.steps.length);
for(let i=0;i<n;i++){if(i)await pg.locator('#sNext').tap({timeout:90000});await pg.waitForTimeout(1500);await shot('op-'+(i+1));}
console.log('errors',errs);await b.close();srv.close();
