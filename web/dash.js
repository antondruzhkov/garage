/* ===== Приборка (по инструкции владельца BMW Motorrad R nineT Scrambler, 02/2019) + музыка ===== */
(function(){
"use strict";
const NS='http://www.w3.org/2000/svg';
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const MANUAL='https://manuals.bmw-motorrad.com/manuals/BA-Extern/IN/BA-INTERNET-COM/PDF/R_0J33_RM_0219_07.pdf';

/* ---------- icons (24x24, stroke) ---------- */
const IC={
  hb:'<path d="M13 5c4 0 7 3 7 7s-3 7-7 7c-1.5 0-2-1-2-7s.5-7 2-7z"/><path d="M8 7H2M8 10H2M8 13H2M8 16H2"/>',
  gw:'<path d="M12 3l10 18H2z"/><path d="M12 10v5"/><circle cx="12" cy="18" r=".6"/>',
  n:'<text x="12" y="17.5" text-anchor="middle" font-size="16" font-weight="700" stroke="none" fill="currentColor" font-family="Arial,sans-serif">N</text>',
  asc:'<text x="12" y="15" text-anchor="middle" font-size="8.5" font-weight="700" stroke="none" fill="currentColor" font-family="Arial,sans-serif">ASC</text><path d="M3 19c3-2 6-2 9 0s6 2 9 0"/>',
  turn:'<path d="M2 12l5-5v3h4v4H7v3z"/><path d="M22 12l-5-5v3h-4v4h4v3z"/>',
  abs:'<circle cx="12" cy="12" r="7"/><path d="M4 6a10 10 0 0 0 0 12M20 6a10 10 0 0 1 0 12"/><text x="12" y="14.6" text-anchor="middle" font-size="6.5" font-weight="700" stroke="none" fill="currentColor" font-family="Arial,sans-serif">ABS</text>',
  key:'<circle cx="7" cy="12" r="4"/><path d="M11 12h11M18 12v4M21 12v3"/>',
  temp:'<path d="M12 3v11"/><circle cx="12" cy="17" r="3"/><path d="M15 6h3M15 9h3M15 12h3"/><path d="M3 20c2-1 3-1 4 0M17 20c2-1 3-1 4 0"/>',
  eng:'<path d="M5 9h3V7h6l2 2h2v3h2V9h2v8h-2v-3h-2v3h-3l-2 2H8v-3H5z"/><path d="M2 11v5"/>',
  bat:'<rect x="3" y="7" width="18" height="12" rx="1"/><path d="M7 7V5h3v2M14 7V5h3v2M6.5 13h3M15 13h3M16.5 11.5v3"/>',
  bulb:'<path d="M9 17h6M10 20h4"/><path d="M12 3a6 6 0 0 0-3.5 10.9V16h7v-2.1A6 6 0 0 0 12 3z"/>',
  fuel:'<rect x="4" y="4" width="10" height="16" rx="1"/><path d="M6 8h6M14 9h3l2 2v6a1.5 1.5 0 0 0 3 0V8l-3-3"/>',
  serv:'<path d="M14.5 6.5a4 4 0 0 0 5 5L21 13l-8 8-2-2 7-7-1.5-1.5a4 4 0 0 0-5-5l2.5 2.5-2 2z"/><path d="M3 21l6-6"/>',
  dwab:'<rect x="3" y="9" width="18" height="11" rx="1"/><path d="M8 9V7h3v2M13 9V7h3v2"/><text x="12" y="17.3" text-anchor="middle" font-size="6" font-weight="700" stroke="none" fill="currentColor" font-family="Arial,sans-serif">DWA</text>'
};
const icon=(k,sz)=>`<svg viewBox="0 0 24 24" width="${sz||22}" height="${sz||22}" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${IC[k]}</svg>`;

/* lamp order per manual: 1 high beam, 2 general warning, 3 neutral, 4 ASC, 5 turn, 6 ABS */
const LAMPS=[['hb','#4FA3FF','Дальний свет'],['gw','#FFB020','Общая предупредительная'],['n','#3FD07A','Нейтраль'],['asc','#FFB020','ASC'],['turn','#3FD07A','Поворотники'],['abs','#FFB020','ABS']];

/* ---------- signals straight from the rider's manual ---------- */
const SIG=[
 {g:'gw',id:'ews',t:'Ключ: иммобилайзер EWS',L:{gw:'on'},sym:'key',sev:'stop',
  what:'Горит общая лампа, на дисплее ключ. Ключ не опознан или нарушена связь ключа с электроникой двигателя. Мотор не заведётся.',
  todo:['Сними с кольца другие ключи.','Если ключ неисправен, его меняют у дилера BMW Motorrad.']},
 {g:'gw',id:'temp',t:'Перегрев двигателя',L:{gw:'blink'},sym:'temp',sev:'soon',
  what:'Мигает общая лампа, на дисплее термометр. Температура масла в двигателе слишком высокая. Мотор воздушно-масляный, отдельной охлаждайки у него нет.',
  todo:['Если можно, едь дальше на частичной нагрузке, без газа в пол: мотор остынет на ходу.','Если повторяется часто, сразу в сервис.'],w:'Езда с перегретым двигателем может его повредить.'},
 {g:'gw',id:'emerg',t:'Двигатель в аварийном режиме',L:{gw:'on'},sym:'eng',sev:'soon',
  what:'Горит общая лампа, на дисплее значок двигателя. Блок управления нашёл неисправность и перевёл мотор в аварийный режим. Полной мощности может не быть. В редких случаях мотор глохнет и не заводится.',
  todo:['Ехать можно, но без резких разгонов и обгонов.','Как можно скорее в сервис: там читают ошибку диагностикой.']},
 {g:'gw',id:'engw',t:'Предупреждение двигателя',L:{gw:'blink'},sym:'eng',sev:'stop',
  what:'Мигает общая лампа, на дисплее значок двигателя. Неисправность, которая может привести к тяжёлому повреждению. Мотор уже в аварийном режиме.',
  todo:['Едь медленно: без разгонов, обгонов, высоких оборотов и нагрузки.','По инструкции лучше вызвать эвакуатор и везти в сервис.','Ехать дальше технически можно, но BMW это не рекомендует.']},
 {g:'gw',id:'volt',t:'Низкое напряжение бортсети',L:{gw:'on'},sym:'bat',sev:'stop',
  what:'Горит общая лампа, на дисплее аккумулятор. Аккумулятор неисправен, напряжение в сети слишком низкое.',
  todo:['По инструкции дальше не ехать.','Как можно скорее устранить в сервисе.']},
 {g:'gw',id:'bulb',t:'Перегорела лампа',L:{gw:'on'},sym:'bulb',sev:'soon',
  what:'Горит общая лампа, на дисплее лампочка. Вышла из строя одна или несколько ламп.',
  todo:['Обойди мотоцикл и найди, что не светит.','Замени как можно скорее: фара H4 12 В 60/55 Вт, габарит W5W 12 В 5 Вт, поворотники RY10W 12 В 10 Вт.','BMW советует возить с собой комплект запасных ламп.']},
 {g:'gw',id:'fuel',t:'Резерв топлива',L:{gw:'on'},sym:'fuel',lab:'TRIP R',val:'12',unit:'km',sev:'soon',
  what:'Горит общая лампа, на дисплее топливо и TRIP R. В баке осталось около 3,5 л из 17. TRIP R считает, сколько ты проехал на резерве.',
  todo:['Заправься, не катай бак до пустого.','Запас хода на резерве зависит от манеры езды, TRIP R только помогает прикинуть.','Бензин по инструкции: рекомендуется 98, допускается 95.']},
 {g:'gw',id:'serv',t:'Пора на ТО',L:{gw:'on'},sym:'serv',lab:'SERV',val:'',unit:'',sev:'info',
  what:'Горит общая лампа, на дисплее ключ-гаечка. Срок ТО прошёл. За месяц до срока или примерно за 1000 км заранее значок появляется с датой или остатком пробега. Сразу после проверки при включении на секунду может мелькнуть SERV T или SERV D.',
  todo:['Записаться на ТО.','Если отключали аккумулятор, дату сервиса иногда нужно выставить заново.']},
 {g:'gw',id:'dwab',t:'Сел аккумулятор сигнализации',L:{},sym:'dwab',sev:'info',
  what:'Значок DWA с батарейкой ненадолго появляется после проверки при включении. Аккумулятор сигнализации больше не держит заряд. Если отключить основной аккумулятор, сигнализация работать не будет.',
  todo:['Обратиться в сервис, лучше к дилеру BMW Motorrad.'],opt:true},

 {g:'abs',id:'absd',t:'ABS: самодиагностика не завершена',L:{abs:'blink'},sev:'info',
  what:'Мигает лампа ABS. После включения зажигания ABS проверяет себя. Датчики колёс он проверяет только на ходу, от 5 км/ч. Пока лампа мигает, ABS не работает.',
  todo:['Тронься и медленно разгонись больше 5 км/ч: лампа погаснет.']},
 {g:'abs',id:'absoff',t:'ABS выключен',L:{abs:'on'},sev:'soon',
  what:'Горит лампа ABS. ABS выключил ты сам кнопкой на левом пульте.',
  todo:['Включить обратно: зажигание включено, зажми кнопку ABS/ASC, пока лампы ABS и ASC не поменяют поведение, отпусти в течение 2 секунд. Лампа погаснет или замигает, если диагностика ещё не прошла.']},
 {g:'abs',id:'abserr',t:'Ошибка ABS',L:{abs:'on'},sev:'soon',
  what:'Горит лампа ABS, хотя ты его не выключал. Блок ABS нашёл неисправность, ABS не работает.',
  todo:['Ехать можно, но тормози с расчётом, что колёса могут заблокироваться.','Как можно скорее в сервис.'],w:'Горит постоянно и при выключенном ABS, и при ошибке. Если сам не выключал, это ошибка.'},

 {g:'asc',id:'ascint',t:'ASC работает: колесо проскальзывает',L:{asc:'fast'},sev:'info',
  what:'Лампа ASC быстро мигает. Система заметила, что заднее колесо теряет сцепление, и убрала момент двигателя. Мигает чуть дольше, чем длится вмешательство, чтобы ты успел заметить.',
  todo:['Это штатная работа системы.']},
 {g:'asc',id:'ascd',t:'ASC: самодиагностика не завершена',L:{asc:'slow'},sev:'info',
  what:'Лампа ASC медленно мигает. ASC проверяет себя и заработает только после 5 км/ч.',
  todo:['Тронься и медленно разгонись больше 5 км/ч.']},
 {g:'asc',id:'ascoff',t:'ASC выключен',L:{asc:'on'},sev:'info',
  what:'Горит лампа ASC. ASC выключил ты сам.',
  todo:['Включить: зажми кнопку ABS/ASC, пока лампа ASC не поменяет поведение, отпусти в течение 2 секунд.','Ещё способ: выключить и включить зажигание и проехать больше 5 км/ч.']},
 {g:'asc',id:'ascerr',t:'Ошибка ASC',L:{asc:'on'},sev:'soon',
  what:'Горит лампа ASC, хотя ты его не выключал. Блок нашёл неисправность, ASC не работает.',
  todo:['Ехать можно с учётом того, что ASC не работает.','Как можно скорее в сервис.','После смены шин на другой тип (например, дорожные на внедорожные) ASC нужно перепрограммировать у дилера.']},

 {g:'norm',id:'hb',t:'Дальний свет',L:{hb:'on'},sev:'ok',what:'Синяя лампа: включён дальний или ты моргаешь светом.',todo:['Переключатель дальнего на левом пульте.']},
 {g:'norm',id:'n',t:'Нейтраль',L:{n:'on'},sev:'ok',what:'Зелёная N: коробка в нейтрали. Заводить можно в нейтрали или с выжатым сцеплением.',todo:['Мотор заводится только когда аварийный выключатель на правом пульте в рабочем положении.']},
 {g:'norm',id:'turn',t:'Поворотники и аварийка',L:{turn:'blink'},sev:'ok',what:'Зелёная лампа мигает вместе с поворотниками. Аварийку включают кнопкой на левом пульте, после этого зажигание можно выключить.',todo:['Аварийка сильно сажает аккумулятор: держи её включённой только сколько нужно.','Выключить аварийку: включить зажигание и нажать кнопку ещё раз.']},
];
const GROUPS=[['gw','Общая лампа + значок на дисплее'],['abs','ABS'],['asc','ASC: контроль пробуксовки'],['norm','Обычные индикаторы']];
const SEV={stop:['Не ехать или вызвать эвакуатор','warn'],soon:['В сервис как можно скорее','flag'],info:['Информация','info'],ok:['Норма','ok']};

/* ---------- SVG instrument ---------- */
const dash=document.getElementById('dash');
function dial(){
  const a=v=>(-135+v/220*270)*Math.PI/180, P=(r,v)=>[300+r*Math.sin(a(v)),300-r*Math.cos(a(v))];
  let ticks='',nums='';
  for(let v=0;v<=220;v+=5){const big=v%20===0,mid=v%10===0;const [x1,y1]=P(258,v),[x2,y2]=P(big?228:mid?238:246,v);
    ticks+=`<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="#E9EDF1" stroke-width="${big?4:mid?2.4:1.4}" stroke-linecap="round"/>`;
    if(big){const [x,y]=P(200,v);nums+=`<text x="${x.toFixed(1)}" y="${(y+9).toFixed(1)}" text-anchor="middle" font-size="26" font-weight="600" fill="#E9EDF1" font-family="Arial,Helvetica,sans-serif">${v}</text>`;}}
  const lamps=LAMPS.map(([k,c],i)=>`<g class="lamp" id="lp-${k}" data-c="${c}" transform="translate(${(300+(i-2.5)*44-12).toFixed(1)},193)"><circle r="20" cx="12" cy="12" fill="#0B0D10" stroke="#2A2F35"/><g class="lg" color="#39404A"><svg x="0" y="0" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${IC[k]}</svg></g></g>`).join('');
  return `<svg viewBox="0 0 600 600" class="clock" role="img" aria-label="Приборная панель R nineT Scrambler">
  <defs><radialGradient id="fc" cx="50%" cy="42%" r="62%"><stop offset="0" stop-color="#23272C"/><stop offset="1" stop-color="#0C0E11"/></radialGradient>
  <linearGradient id="bz" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#F4F6F8"/><stop offset=".5" stop-color="#8E959C"/><stop offset="1" stop-color="#DADFE4"/></linearGradient>
  <linearGradient id="lcd" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1A1F24"/><stop offset="1" stop-color="#0E1216"/></linearGradient></defs>
  <circle cx="300" cy="300" r="296" fill="url(#bz)"/><circle cx="300" cy="300" r="280" fill="#050607"/><circle cx="300" cy="300" r="274" fill="url(#fc)"/>
  ${ticks}${nums}
  <text x="300" y="356" text-anchor="middle" font-size="17" fill="#9AA3AC" font-family="Arial,sans-serif" letter-spacing="1">km/h</text>
  ${lamps}
  <g id="lcdg"><rect x="178" y="372" width="244" height="104" rx="10" fill="url(#lcd)" stroke="#2C333A" stroke-width="2"/>
   <g id="lsym" transform="translate(190,388)" color="#FFB020"></g>
   <text id="llab" x="410" y="402" text-anchor="end" font-size="17" fill="#C9E8FF" font-family="Menlo,Consolas,monospace" letter-spacing="1">ODO</text>
   <text id="lval" x="378" y="458" text-anchor="end" font-size="44" fill="#E8F6FF" font-family="Menlo,Consolas,monospace" font-weight="700">-----</text>
   <text id="lunit" x="410" y="458" text-anchor="end" font-size="17" fill="#C9E8FF" font-family="Menlo,Consolas,monospace">km</text></g>
  <circle id="dwaled" cx="300" cy="518" r="6" fill="#2A0C0C" stroke="#3A3F45"/>
  <text x="300" y="545" text-anchor="middle" font-size="11" fill="#5E6670" font-family="Arial,sans-serif" letter-spacing="2">DWA</text>
  <g id="needle" transform="rotate(-135 300 300)"><path d="M296 312 L300 66 L304 312 Z" fill="#FF3B2F"/><circle cx="300" cy="300" r="26" fill="#15181B" stroke="#3B4248" stroke-width="3"/><circle cx="300" cy="300" r="9" fill="#3B4248"/></g>
  <text x="300" y="585" text-anchor="middle" font-size="12" fill="#3A4047" font-family="Arial,sans-serif" letter-spacing="3">BMW MOTORRAD</text>
  </svg>`;}
dash.innerHTML=`<div class="dwrap">${dial()}<div class="dcap" id="dcap">Нажми сигнал справа</div></div>`;

const $=id=>document.getElementById(id);
let needle=0,needleTgt=0,timers=[];
function clearT(){timers.forEach(clearTimeout);timers=[];}
function setLamp(k,mode){const g=$('lp-'+k);if(!g)return;const c=g.dataset.c,on=mode&&mode!=='off';
  const lg=g.querySelector('.lg');lg.setAttribute('color',on?c:'#39404A');g.querySelector('circle').setAttribute('fill',on?c+'22':'#0B0D10');
  g.classList.remove('b1','b2','b3');if(mode==='blink')g.classList.add('b1');if(mode==='fast')g.classList.add('b2');if(mode==='slow')g.classList.add('b3');
  lg.style.filter=on?`drop-shadow(0 0 6px ${c})`:'none';}
function setLcd(o){o=o||{};$('lsym').innerHTML=o.sym?`<svg width="46" height="46" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${IC[o.sym]}</svg>`:'';
  $('lsym').classList.toggle('b1',!!o.symBlink);
  $('llab').textContent=o.lab!=null?o.lab:'ODO';$('lval').textContent=o.val!=null?o.val:odo();$('lunit').textContent=o.unit!=null?o.unit:'km';}
function state(L,lcd){LAMPS.forEach(([k])=>setLamp(k,(L||{})[k]||'off'));setLcd(lcd);}
function dwa(n){clearT();const led=$('dwaled');let i=0;
  const seq=()=>{for(let k=0;k<n;k++){timers.push(setTimeout(()=>led.setAttribute('fill','#FF2A1E'),k*420));timers.push(setTimeout(()=>led.setAttribute('fill','#2A0C0C'),k*420+220));}timers.push(setTimeout(seq,n*420+1400));};seq();}
function needleLoop(){needle+=(needleTgt-needle)*.08;$('needle').setAttribute('transform',`rotate(${(-135+needle/220*270).toFixed(2)} 300 300)`);requestAnimationFrame(needleLoop);}
requestAnimationFrame(needleLoop);

function preRide(){clearT();$('dwaled').setAttribute('fill','#2A0C0C');cap('Проверка при включении зажигания');
  state({hb:'on',gw:'on',n:'on',asc:'on',turn:'on',abs:'on'},{sym:'eng',lab:'88888',val:'88888',unit:'km'});needleTgt=0;
  timers.push(setTimeout(()=>{state({gw:'blink',n:'on',asc:'slow',abs:'blink'},{lab:'',val:'',unit:''});needleTgt=220;cap('Фаза 2: общая лампа мигает, стрелка уходит на максимум');},1600));
  timers.push(setTimeout(()=>{needleTgt=0;state({n:'on',asc:'slow',abs:'blink'},{});cap('Фаза 3: стрелка на ноль, лампы гаснут. ABS и ASC мигают до 5 км/ч');},3400));}
function cap(t){$('dcap').textContent=t;}

/* ---------- side panel ---------- */
let sel=null;
function detail(s){if(!s)return `<div class="pick"><small>как пользоваться</small><b>Выбери сигнал ниже</b><p class="lead" style="margin:6px 0 0">Приборка покажет его так, как ты увидишь на своей: какая лампа горит или мигает и какой значок на дисплее. Под сигналом раскроется, что это значит и что делать.</p></div>`;
  const sv=SEV[s.sev];return `<div class="pick sig"><small>${esc(GROUPS.find(g=>g[0]===s.g)[1])}</small><b>${esc(s.t)}</b>
  <span class="sev ${sv[1]}">${sv[0]}</span><p style="margin:8px 0 6px">${esc(s.what)}</p>
  <div class="need"><b>Что делать</b><ul>${s.todo.map(x=>`<li>${esc(x)}</li>`).join('')}</ul></div>
  ${s.w?`<div class="warn">${esc(s.w)}</div>`:''}${s.opt?'<p class="src" style="margin-top:6px">Только если стоит сигнализация DWA (опция).</p>':''}</div>`;}
function show(id){clearT();$('dwaled').setAttribute('fill','#2A0C0C');needleTgt=0;const s=SIG.find(x=>x.id===id);sel=id;
  state(s.L,{sym:s.sym,lab:s.lab,val:s.lab==='SERV'?'':s.val,unit:s.unit});cap(s.t);
  document.querySelectorAll('.sigdet').forEach(x=>x.remove());document.querySelectorAll('.sigbtn').forEach(b=>b.setAttribute('aria-pressed',b.dataset.id===id));
  const btn=document.querySelector(`.sigbtn[data-id="${id}"]`);if(btn){const li=document.createElement('li');li.className='sigdet';li.innerHTML=detail(s);btn.parentNode.after(li);}
  if(window.matchMedia('(max-width:860px)').matches)dash.scrollIntoView({behavior:'smooth',block:'start'});}
function row(s){const lampK=Object.keys(s.L)[0];const k=s.sym||lampK||'gw';const lc=(LAMPS.find(l=>l[0]===(lampK||'gw'))||LAMPS[1])[1];
  const mode=lampK?s.L[lampK]:'';const ml={on:'горит',blink:'мигает',fast:'мигает часто',slow:'мигает медленно'}[mode]||'значок';
  return `<li><button class="sigbtn" data-id="${s.id}" aria-pressed="false"><span class="sico" style="color:${s.g==='norm'?lc:(s.sym?'#C98A00':lc)}">${icon(k,22)}</span><span><b>${esc(s.t)}</b><em>${esc((lampK?LAMPS.find(l=>l[0]===lampK)[2]+': ':'')+ml)}</em></span></button></li>`;}
function panelHTML(){return `<h2>Приборка: что значит каждая лампочка</h2>
  <p class="lead">Всё на этой вкладке взято из официальной инструкции владельца BMW Motorrad именно для R nineT Scrambler, издание 02/2019. Нажми на сигнал: приборка покажет его так, как ты увидишь на своей.</p>
  ${detail(null)}
  <h3>При каждом включении зажигания</h3>
  <p style="font-size:14px">Сначала загорается всё, потом мигает общая лампа и стрелка проходит до максимума, потом всё гаснет. Если стрелка не двинулась, какая-то лампа не загорелась или на дисплее нет сегментов, приборку надо проверить в сервисе.</p>
  <button class="chipbtn" id="preride">Показать проверку при включении</button>
  ${GROUPS.map(([g,n])=>`<h3>${esc(n)}</h3><ul class="ctr sigs">${SIG.filter(s=>s.g===g).map(row).join('')}</ul>`).join('')}
  <h3>Сигнализация DWA (если стоит)</h3>
  <p style="font-size:14px">Если сигнализация срабатывала, пока тебя не было, после включения зажигания красный светодиод минуту мигает кодом: сколько вспышек, такая причина.</p>
  <ul class="ctr">${[['1','Датчик движения 1'],['2','Датчик движения 2'],['3','Зажигание включали чужим ключом'],['4','Сигнализацию отключали от аккумулятора мотоцикла'],['5','Датчик движения 3']].map(([n,t])=>`<li><button class="dwabtn" data-n="${n}"><i style="background:#FF2A1E;border-radius:50%"></i><span><b>${n} ${n==='1'?'вспышка':(+n<5?'вспышки':'вспышек')}</b><em>${t}</em></span></button></li>`).join('')}</ul>
  <p class="src">Поставить на охрану: включить зажигание, в SETUP выбрать DWA ON, выключить зажигание. Через 30 секунд поворотники мигнут два раза. Снять: включить зажигание своим ключом.</p>
  <h3>Кнопки на руле</h3>
  <dl class="specs">
   <dt>Левый пульт</dt><dd>дальний и моргание, аварийка, кнопка ABS/ASC, поворотники, сигнал, качелька MENU</dd>
   <dt>Правый пульт</dt><dd>подогрев ручек (если есть), аварийный выключатель двигателя, стартер</dd></dl>
  <p style="font-size:14px;margin-top:10px"><b>Выключить ASC:</b> зажигание включено, зажми кнопку, пока лампа ASC не поменяется, отпусти за 2 секунды. <b>Выключить ABS:</b> держи дольше, пока не поменяются лампы ABS и ASC, отпусти за 2 секунды. Включаются так же. Можно на ходу.</p>
  <div class="warn">Аварийным выключателем на ходу не пользуйся: заднее колесо может заблокироваться. Заводится мотор только когда выключатель в рабочем положении.</div>
  <h3>Бортовой компьютер</h3>
  <p style="font-size:14px">Качелька MENU на левом пульте, коротко нажимать на стоящем мотоцикле с включённым зажиганием. Сброс трипа: выбрать его и держать кнопку.</p>
  <dl class="specs"><dt>ODO</dt><dd>общий пробег</dd><dt>TRIP 1, TRIP 2</dt><dd>два счётчика поездки</dd><dt>TRIP A</dt><dd>сам сбрасывается, если прошло больше 5 часов и сменилась дата</dd><dt>TRIP R</dt><dd>пробег на резерве, только когда горит резерв</dd><dt>ENGTMP</dt><dd>температура двигателя</dd><dt>CLOCK</dt><dd>часы</dd><dt>SETUP</dt><dd>DWA вкл/выкл, часы, дата, яркость 1-5</dd></dl>
  <h3>Цифры из инструкции</h3>
  <dl class="specs">
   <dt>Давление в шинах</dt><dd>2,5 бар перёд · 2,9 бар зад (на холодных)</dd>
   <dt>Бак / резерв</dt><dd>17 л / около 3,5 л</dd>
   <dt>Бензин</dt><dd>рекомендуется 98, допускается 95</dd>
   <dt>Масло: долив</dt><dd>между MIN и MAX макс. 0,5 л, проверять на тёплом</dd>
   <dt>Тормозная жидкость</dt><dd>DOT4, перёд и зад</dd>
   <dt>Колодки</dt><dd>менять при 1,0 мм</dd>
   <dt>Лампы</dt><dd>H4 60/55 Вт · W5W · RY10W</dd>
   <dt>Ось переднего колеса</dt><dd>50 Н·м, зажим оси 19 Н·м</dd>
   <dt>Передний суппорт</dt><dd>38 Н·м</dd>
   <dt>Болты заднего колеса</dt><dd>60 Н·м, крест-накрест</dd>
   <dt>Датчик скорости колеса</dt><dd>8 Н·м</dd>
   <dt>Обкаточное ТО</dt><dd>на 500-1200 км</dd>
   <dt>Каждую третью заправку</dt><dd>уровень масла, колодки, уровень тормозной жидкости</dd></dl>
  <h3>А ремонтная книга дилеров?</h3>
  <p style="font-size:14px">Дилеры работают в системе BMW ISTA: там ремонтные инструкции, все моменты затяжки и чтение ошибок. Она закрытая, в открытом доступе её нет. Публично BMW выкладывает только инструкцию владельца. Полная ремонтная книга для обычного человека: Haynes по R nineT 2014-2018, Scrambler в ней есть.</p>
  <ul class="src"><li><a href="${MANUAL}" target="_blank" rel="noopener">Инструкция владельца R nineT Scrambler, BMW Motorrad, PDF</a></li>
  <li><a href="https://uk.haynes.com/products/bmw-r-ninet-2014-2018-haynes-repair-manual" target="_blank" rel="noopener">Haynes: ремонтное руководство R nineT 2014-2018</a></li></ul>`;}
function panel(el){el.innerHTML=panelHTML();
  el.querySelectorAll('.sigbtn').forEach(b=>b.onclick=()=>show(b.dataset.id));
  el.querySelectorAll('.dwabtn').forEach(b=>b.onclick=()=>{state({}, {});needleTgt=0;cap(`DWA: ${b.dataset.n} вспыш. → ${b.querySelector('em').textContent}`);dwa(+b.dataset.n);});
  $('preride').onclick=preRide;
  if(sel)show(sel);else state({n:'on'},{});}
function onShow(){if(!sel){preRide();}}
/* ODO shows the owner's own mileage (set by the app), placeholder dashes until it is known */
function odo(){const k=window.GARAGE_ODO;return k!=null&&isFinite(k)?String(Math.min(999999,Math.max(0,Math.round(k)))):'-----';}
function setOdo(){const l=$('llab'),v=$('lval');if(l&&v&&l.textContent==='ODO')v.textContent=odo();}
window.DASH={panel,onShow,setOdo};

/* ================= music: generative lo-fi, WebAudio ================= */
let AC=null,master=null,playing=false,sched=null,nextT=0,step=0,crackle=null;
const BPM=82,SIXT=60/BPM/4;
const mtof=m=>440*Math.pow(2,(m-69)/12);
const CH=[{b:38,v:[53,57,60,64,65]},{b:43,v:[53,57,59,64]},{b:36,v:[52,55,59,62]},{b:45,v:[52,55,60,64,67]}]; // Dm9 G13 Cmaj9 Am9
const PENT=[62,65,67,69,72,74,77,79,81];
let noiseBuf=null,delay=null,fb=null;
function initAudio(){AC=new (window.AudioContext||window.webkitAudioContext)();
  master=AC.createGain();master.gain.value=0;const lp=AC.createBiquadFilter();lp.type='lowpass';lp.frequency.value=5200;
  const comp=AC.createDynamicsCompressor();comp.threshold.value=-18;comp.ratio.value=3;
  master.connect(lp);lp.connect(comp);comp.connect(AC.destination);
  delay=AC.createDelay(2);delay.delayTime.value=SIXT*3;fb=AC.createGain();fb.gain.value=.38;const dl=AC.createBiquadFilter();dl.type='lowpass';dl.frequency.value=2200;
  delay.connect(dl);dl.connect(fb);fb.connect(delay);dl.connect(master);
  noiseBuf=AC.createBuffer(1,AC.sampleRate*2,AC.sampleRate);const d=noiseBuf.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;
  /* vinyl crackle */
  const cb=AC.createBuffer(1,AC.sampleRate*4,AC.sampleRate),cd=cb.getChannelData(0);for(let i=0;i<cd.length;i++){cd[i]=(Math.random()<.0009?(Math.random()*2-1)*.9:0)+(Math.random()*2-1)*.012;}
  crackle=AC.createBufferSource();crackle.buffer=cb;crackle.loop=true;const cg=AC.createGain();cg.gain.value=.22;const ch=AC.createBiquadFilter();ch.type='highpass';ch.frequency.value=900;
  crackle.connect(ch);ch.connect(cg);cg.connect(master);crackle.start();}
function keys(t,m,vel,dur,send){const o=AC.createOscillator(),md=AC.createOscillator(),mg=AC.createGain(),g=AC.createGain();
  const f=mtof(m);o.frequency.value=f;md.frequency.value=f*1.0;mg.gain.setValueAtTime(f*1.6,t);mg.gain.exponentialRampToValueAtTime(f*.08,t+.9);
  md.connect(mg);mg.connect(o.frequency);o.type='sine';
  g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(vel,t+.012);g.gain.exponentialRampToValueAtTime(vel*.35,t+.5);g.gain.exponentialRampToValueAtTime(.0008,t+dur);
  const pan=AC.createStereoPanner?AC.createStereoPanner():null;o.connect(g);if(pan){pan.pan.value=(Math.random()-.5)*.5;g.connect(pan);pan.connect(master);}else g.connect(master);
  if(send){const s=AC.createGain();s.gain.value=send;g.connect(s);s.connect(delay);}
  o.start(t);md.start(t);o.stop(t+dur+.05);md.stop(t+dur+.05);}
function bass(t,m,dur){const o=AC.createOscillator(),g=AC.createGain(),f=AC.createBiquadFilter();o.type='triangle';o.frequency.value=mtof(m);f.type='lowpass';f.frequency.value=420;
  g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.42,t+.02);g.gain.setTargetAtTime(.0001,t+dur*.7,.12);o.connect(f);f.connect(g);g.connect(master);o.start(t);o.stop(t+dur+.4);}
function kick(t,v){const o=AC.createOscillator(),g=AC.createGain();o.frequency.setValueAtTime(110,t);o.frequency.exponentialRampToValueAtTime(42,t+.12);
  g.gain.setValueAtTime(v,t);g.gain.exponentialRampToValueAtTime(.001,t+.42);o.connect(g);g.connect(master);o.start(t);o.stop(t+.45);}
function noise(t,type,freq,q,v,len){const s=AC.createBufferSource();s.buffer=noiseBuf;const f=AC.createBiquadFilter();f.type=type;f.frequency.value=freq;f.Q.value=q;const g=AC.createGain();
  g.gain.setValueAtTime(v,t);g.gain.exponentialRampToValueAtTime(.0008,t+len);s.connect(f);f.connect(g);g.connect(master);s.start(t,Math.random()*1.5);s.stop(t+len+.02);}
function pad(t,ns,dur){ns.forEach((m,i)=>{[-7,7].forEach(dt=>{const o=AC.createOscillator(),g=AC.createGain(),f=AC.createBiquadFilter();o.type='sawtooth';o.frequency.value=mtof(m+12*(i<2?0:0));o.detune.value=dt;
  f.type='lowpass';f.frequency.setValueAtTime(500,t);f.frequency.linearRampToValueAtTime(900,t+dur*.5);f.frequency.linearRampToValueAtTime(500,t+dur);
  g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.012,t+dur*.4);g.gain.linearRampToValueAtTime(0,t+dur);o.connect(f);f.connect(g);g.connect(master);o.start(t);o.stop(t+dur+.05);});});}
function tick(t,s){const bar=Math.floor(s/16)%4,pos=s%16,c=CH[bar],sw=(pos%2)?SIXT*.32:0,T=t+sw,section=Math.floor(s/64)%4;
  if(pos===0){pad(T,c.v,SIXT*16);c.v.forEach((m,i)=>keys(T+i*.012,m,.075,2.6,.12));}
  if(pos===7||pos===10){c.v.slice(1,4).forEach((m,i)=>keys(T+i*.01,m,.05,1.2,.18));}
  if(pos===0)bass(T,c.b,SIXT*6);if(pos===6)bass(T,c.b+12,SIXT*2);if(pos===10)bass(T,c.b,SIXT*4);if(pos===14&&bar===3)bass(T,c.b+7,SIXT*2);
  if(section>0){if(pos===0||pos===9)kick(T,pos?0.55:0.8);if(pos===4||pos===12){noise(T,'bandpass',1900,1.2,.22,.16);noise(T,'lowpass',260,1,.12,.08);}
    if(pos%2===0)noise(T,'highpass',7500,.7,(pos%4?0.035:0.06)*(0.7+Math.random()*.5),.05);}
  if(section>=2&&pos%2===0&&Math.random()<(pos%4?0.18:0.34)){const m=PENT[Math.floor(Math.random()*PENT.length)];keys(T,m,.045,1.4,.45);}}
function schedule(){while(nextT<AC.currentTime+.15){tick(nextT,step);nextT+=SIXT;step++;}}
function music(on){if(on){if(!AC)initAudio();AC.resume();if(!sched){nextT=AC.currentTime+.08;sched=setInterval(schedule,25);}
    master.gain.cancelScheduledValues(AC.currentTime);master.gain.setTargetAtTime(.55,AC.currentTime,.6);}
  else if(AC){master.gain.cancelScheduledValues(AC.currentTime);master.gain.setTargetAtTime(0,AC.currentTime,.25);
    setTimeout(()=>{if(!playing&&sched){clearInterval(sched);sched=null;AC.suspend();}},1200);}}
const mb=document.getElementById('music');
if(mb)mb.onclick=()=>{playing=!playing;mb.setAttribute('aria-pressed',playing);mb.querySelector('span').textContent=playing?'Музыка: вкл':'Музыка';music(playing);};
})();

