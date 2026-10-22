// screenshot of the Кастом screen (phone and desktop)
import {createRequire} from 'node:module';const require=createRequire('/opt/node22/lib/node_modules/');
const {chromium}=require('playwright');import {serve} from './serve.mjs';
const OUT=process.argv[2];const srv=await serve();const base=`http://127.0.0.1:${srv.address().port}/`;
const b=await chromium.launch({args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
for(const [n,W,H,m] of [['phone',390,844,true],['desktop',1440,900,false]]){
  const ctx=await b.newContext({viewport:{width:W,height:H},isMobile:m,hasTouch:m});const pg=await ctx.newPage();const errs=[];
  pg.on('pageerror',e=>errs.push(e.message));pg.on('console',x=>{if(x.type()==='error')errs.push(x.text());});
  await pg.route(/fonts\.(googleapis|gstatic)\.com|telegram\.org/,r=>r.fulfill({status:200,body:''}));
  await pg.addInitScript(()=>localStorage.setItem('garage-state',JSON.stringify({onboarded:true,bike:{color:'#9e1b1b'}})));
  await pg.goto(base);await pg.waitForFunction(()=>window.__garageReady&&R9T.ready,null,{timeout:120000});
  await pg.locator('#tabbar [data-view="custom"]').click({timeout:90000});
  await pg.waitForFunction(()=>document.querySelectorAll('.cimg img').length===3,null,{timeout:60000});
  await pg.waitForTimeout(800);await pg.screenshot({path:`${OUT}/custom-${n}.png`,timeout:180000,animations:'disabled'});
  await pg.locator('#tabbar [data-view="garage"]').click({timeout:90000});await pg.waitForTimeout(1500);
  await pg.screenshot({path:`${OUT}/garage-after-${n}.png`,timeout:180000,animations:'disabled'});
  console.log(n,'errors',errs);await ctx.close();}
await b.close();srv.close();
