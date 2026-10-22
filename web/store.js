/* store: одно состояние приложения, две реализации.
   В Telegram: WebApp.CloudStorage (значение до 4096 символов, поэтому JSON режется на ключи g0..gN, счётчик в gn).
   В браузере: localStorage. Фото заказ-нарядов только в localStorage (в Telegram не храним). Все чтения и записи в try/catch. */
(function(){
"use strict";
const LS_KEY='garage-state',CHUNK=4000,PH='garage-photo-';
const DEF=()=>({v:1,onboarded:false,createdAt:Date.now(),
  bike:{model:'scrambler',color:'#5a5e5f',plate:'',km:null,lastTo:{date:'',km:null}},
  history:[],pro:{trialStart:null,wanted:false},custom:[],customWanted:false});
function merge(a,b){if(!b||typeof b!=='object')return a;Object.keys(b).forEach(k=>{if(a[k]&&typeof a[k]==='object'&&!Array.isArray(a[k])&&b[k]&&typeof b[k]==='object'&&!Array.isArray(b[k]))a[k]=merge(a[k],b[k]);else a[k]=b[k];});return a;}

function tgCloud(){try{const W=window.Telegram&&Telegram.WebApp;if(W&&W.initData&&W.CloudStorage&&(!W.isVersionAtLeast||W.isVersionAtLeast('6.9')))return W.CloudStorage;}catch(e){}return null;}
const withTimeout=(p,ms,fb)=>Promise.race([p,new Promise(r=>setTimeout(()=>r(fb),ms))]);
function cGet(cs,keys){return new Promise(res=>{try{cs.getItems(keys,(err,v)=>res(err?null:v));}catch(e){res(null);}});}
function cSet(cs,k,v){return new Promise(res=>{try{cs.setItem(k,v,(err,ok)=>res(!err&&ok!==false));}catch(e){res(false);}});}
function cDel(cs,keys){return new Promise(res=>{try{cs.removeItems(keys,()=>res(true));}catch(e){res(false);}});}

const Cloud={kind:'telegram',
  async load(){const cs=tgCloud();const n=await withTimeout(cGet(cs,['gn']),4000,null);const cnt=n&&+n.gn;Cloud._n=cnt||0;if(!cnt)return null;
    const keys=[...Array(cnt).keys()].map(i=>'g'+i);const v=await withTimeout(cGet(cs,keys),6000,null);if(!v)return null;
    try{return JSON.parse(keys.map(k=>v[k]||'').join(''));}catch(e){return null;}},
  async save(obj){const cs=tgCloud();const s=JSON.stringify(obj);const parts=[];for(let i=0;i<s.length;i+=CHUNK)parts.push(s.slice(i,i+CHUNK));
    const ok=await Promise.all(parts.map((p,i)=>cSet(cs,'g'+i,p)));if(ok.some(x=>!x))return false;
    const old=Cloud._n||0;await cSet(cs,'gn',String(parts.length));if(old>parts.length)await cDel(cs,[...Array(old-parts.length).keys()].map(i=>'g'+(parts.length+i)));
    Cloud._n=parts.length;return true;}};
const Local={kind:'local',
  async load(){try{const s=localStorage.getItem(LS_KEY);return s?JSON.parse(s):null;}catch(e){return null;}},
  async save(obj){try{localStorage.setItem(LS_KEY,JSON.stringify(obj));return true;}catch(e){return false;}}};

let impl=Local,state=DEF(),timer=null,saving=Promise.resolve();
const store={
  get state(){return state;},
  get kind(){return impl.kind;},
  get photosAllowed(){return impl===Local;},
  async init(){impl=tgCloud()?Cloud:Local;let s=null;try{s=await impl.load();}catch(e){s=null;}
    /* inside Telegram with an empty cloud: take what the browser had on this device */
    if(!s&&impl===Cloud){try{s=await Local.load();}catch(e){}}
    state=merge(DEF(),s||{});if(!Array.isArray(state.custom))state.custom=[];if(!Array.isArray(state.history))state.history=[];return state;},
  set(fn){try{fn(state);}catch(e){console.warn('store',e);}clearTimeout(timer);timer=setTimeout(()=>store.flush(),250);},
  flush(){clearTimeout(timer);const snap=JSON.parse(JSON.stringify(state));saving=saving.then(()=>impl.save(snap)).catch(e=>{console.warn('store save',e);return false;});
    if(impl===Cloud)Local.save(snap);return saving;},
  reset(){state=DEF();return store.flush();},
  /* photo previews: localStorage only */
  putPhoto(id,dataUrl){if(impl!==Local)return false;try{localStorage.setItem(PH+id,dataUrl);return true;}catch(e){return false;}},
  getPhoto(id){try{return localStorage.getItem(PH+id);}catch(e){return null;}},
  delPhoto(id){try{localStorage.removeItem(PH+id);}catch(e){}}
};
window.addEventListener('pagehide',()=>{try{store.flush();}catch(e){}});
window.store=store;
})();
