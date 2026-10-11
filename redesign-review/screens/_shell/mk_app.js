
/* ===================== data (values observed on the real Markets page) ===================== */
var PAIRS=[
 {sym:'BTC/USDT',live:true, price:64294.00,chg:-5.45,lo:63189.6,hi:65133.7,vol:408450000,fav:true, up:false},
 {sym:'ETH/USDT',live:true, price:3618.96, chg:+6.44,lo:null,   hi:null,   vol:22100000, fav:true, up:true},
 {sym:'SOL/USDT',live:false,fav:false},{sym:'BNB/USDT',live:false,fav:false},
 {sym:'XRP/USDT',live:false,fav:false},{sym:'DOGE/USDT',live:false,fav:false},
 {sym:'AVAX/USDT',live:false,fav:false},{sym:'ADA/USDT',live:false,fav:false},
 {sym:'LINK/USDT',live:false,fav:false},{sym:'MATIC/USDT',live:false,fav:false},
 {sym:'NEAR/USDT',live:false,fav:false},{sym:'ARB/USDT',live:false,fav:false},
 {sym:'INJ/USDT',live:false,fav:false},{sym:'LTC/USDT',live:false,fav:false},
 {sym:'OP/USDT',live:false,fav:false},{sym:'SUI/USDT',live:false,fav:false}
];
var COLSETS={overview:['price','chg','range','vol','tr'],performance:['chg','tr'],volume:['vol','range']};
var state={sort:{k:'sym',dir:1},colset:'overview',tab:'all',q:'',fav:false,
  filters:{live:false,up:false,vol:false,fav:false},view:'table',refresh:10,auto:false,
  tpl:'My live pairs',hist:[],hi:-1,scanned:false,cond:'up',ai:''};
var COND={
 up:{txt:'Trend up (<code>EMA20</code> above <code>EMA50</code>) but RSI cooled below <code>45</code> — a dip inside an uptrend.',
     why:['EMA20 above EMA50 sets the regime','RSI14 below 45 on the last closed bar','close still above EMA20'],
     expl:[['trend = EMA20 vs EMA50','EMA20 is above EMA50 on the 1h — the regime filter passes for an uptrend.'],
           ['rsi14 < 45','RSI cooled without breaking 40, which is the pullback this condition is looking for.'],
           ['volume × vs 20-bar mean','Used as context only — this condition does not require a volume expansion.']]},
 brk:{txt:'<code>close</code> breaks the highest high of the last <code>20</code> bars with <code>volume</code> above <code>2×</code> the 20-bar average.',
     why:['close > highest high(20)','volume × ≥ 2.0','not already overbought'],
     expl:[['close > highest high(20)','A new 20-bar extreme is required — not a wick, the close.'],
           ['volume × ≥ 2.0','Expansion confirms participation rather than a thin drift.'],
           ['rsi14 < 70','Excluded so the scan does not return a breakout that is already extended.']]},
 os:{txt:'<code>rsi14</code> below <code>30</code> then back above it — a bounce attempt.',
     why:['rsi14 crossed back above 30','price above the prior bar low'],
     expl:[['rsi14 crossed back above 30','The condition fires on the recovery, not on the oversold reading itself.'],
           ['price above prior bar low','Filters out a bar that is still making lower lows.']]},
 gold:{txt:'<code>EMA20</code> crossed above <code>EMA50</code> within the window.',
     why:['EMA20 > EMA50 now','EMA20 ≤ EMA50 before the window'],
     expl:[['EMA20 > EMA50 now','Current state of the two averages on the last closed bar.'],
           ['cross inside the window','The pair had to be below before the window, so a long-standing uptrend does not match.']]},
 rally:{txt:'Trend down (<code>EMA20</code> below <code>EMA50</code>) with <code>rsi14</code> above <code>55</code> — a rally into a downtrend.',
     why:['EMA20 below EMA50','rsi14 above 55','close below EMA50'],
     expl:[['EMA20 below EMA50','Regime filter for a downtrend.'],
           ['rsi14 above 55','The bounce being scanned for.'],
           ['close below EMA50','Keeps it a rally inside the trend, not a trend change.']]},
 bd:{txt:'<code>close</code> breaks the lowest low of the last <code>20</code> bars with <code>volume</code> above <code>1.5×</code>.',
     why:['close < lowest low(20)','volume × ≥ 1.5'],
     expl:[['close < lowest low(20)','New 20-bar low on the close.'],
           ['volume × ≥ 1.5','Participation on the break.']]},
 ob:{txt:'<code>rsi14</code> above <code>70</code> — overbought, listed for context and short candidates.',
     why:['rsi14 > 70'],
     expl:[['rsi14 > 70','A single-condition scan. Shown so you can see how few rows survive on a 2-pair universe.']]},
 rsi30:{txt:'<code>rsi14</code> below <code>30</code> — oversold.',
     why:['rsi14 < 30'],
     expl:[['rsi14 < 30','A single-condition scan. A 0-row result here is normal, not an error.']]},
 vol:{txt:'<code>volume</code> above <code>2×</code> the 20-bar average.',
     why:['volume × ≥ 2.0'],
     expl:[['volume × ≥ 2.0','Compared against the mean of the previous 20 bars on the last closed candle.']]}
};
/* per-symbol indicator readings — only the 2 pairs with a live feed can be scanned */
var IND={
 'BTC/USDT':{last:64294.00,rsi:46.2,emaFast:64112.4,emaSlow:63780.9,volx:1.42,atr:0.80,rng:22},
 'ETH/USDT':{last:3618.96, rsi:51.8,emaFast:3588.1, emaSlow:3601.7, volx:0.88,atr:1.10,rng:64}
};
function match(sym,c){
 var d=IND[sym]; if(!d)return false;
 var up=d.emaFast>d.emaSlow;
 if(c==='up')return up&&d.rsi<45;
 if(c==='brk')return d.volx>=2.0;
 if(c==='os')return d.rsi>30&&d.rsi<42;
 if(c==='gold')return up;
 if(c==='rally')return !up&&d.rsi>55;
 if(c==='bd')return !up&&d.volx>=1.5;
 if(c==='ob')return d.rsi>70;
 if(c==='rsi30')return d.rsi<30;
 if(c==='vol')return d.volx>=2.0;
 return false;
}
/* deterministic sparkline data */
function spark(seed,n,up){
 var a=[],x=seed,v=seed*0.1;
 for(var i=0;i<n;i++){x=x*1664525+1013904223;v+=(((x>>>16)%1000)/1000-0.5)*(seed*0.012);a.push(v);}
 if(up&&a[n-1]<a[0])a.reverse(); if(!up&&a[n-1]>a[0])a.reverse();
 return a;
}
function fmt(v,d){return v.toLocaleString('en-US',{minimumFractionDigits:d,maximumFractionDigits:d});}
function sg(v){return (v>=0?'+':'−')+Math.abs(v).toFixed(2)+'%';}

/* ===================== render table ===================== */
function rows(){
 var r=PAIRS.slice();
 var f=state.filters;
 if(state.q){var q=state.q.toLowerCase();r=r.filter(function(p){return p.sym.toLowerCase().indexOf(q)>-1;});}
 if(state.tab==='fav'||f.fav)r=r.filter(function(p){return p.fav;});
 if(state.tab==='gain')r=r.filter(function(p){return p.live&&p.chg>0;});
 if(state.tab==='los')r=r.filter(function(p){return p.live&&p.chg<0;});
 if(state.tab==='new')r=r.filter(function(p){return p.live;});
 if(f.live)r=r.filter(function(p){return p.live;});
 if(f.up)r=r.filter(function(p){return p.live&&p.chg>0;});
 if(f.vol)r=r.filter(function(p){return p.live&&p.vol>100000000;});
 var k=state.sort.k,d=state.sort.dir;
 r.sort(function(a,b){
  var av,bv;
  if(k==='sym'){av=a.sym;bv=b.sym;return av<bv?-d:av>bv?d:0;}
  if(k==='tr'){av=(a.live?a.vol:0);bv=(b.live?b.vol:0);}
  else{av=a[k]==null?-1e18:a[k];bv=b[k]==null?-1e18:b[k];}
  return (av-bv)*d;});
 return r;
}
var SPARKS={};
function drawSpk(cv,sym,up){
 var ctx=cv.getContext('2d'),dpr=Math.min(2,window.devicePixelRatio||1);
 var W=cv.clientWidth||82,H=cv.clientHeight||24;
 cv.width=W*dpr;cv.height=H*dpr;ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,W,H);
 if(!SPARKS[sym])SPARKS[sym]=spark(sym.length*97+13,40,up);
 var a=SPARKS[sym],lo=Math.min.apply(null,a),hi=Math.max.apply(null,a);if(hi-lo<1e-9){hi+=1;lo-=1;}
 var col=up?'oklch(52% .11 175)':'oklch(56% .2 355)';
 ctx.beginPath();
 for(var i=0;i<a.length;i++){var x=1+(i/(a.length-1))*(W-2),y=2+(hi-a[i])/(hi-lo)*(H-4);i?ctx.lineTo(x,y):ctx.moveTo(x,y);}
 ctx.strokeStyle=col;ctx.lineWidth=1.4;ctx.lineJoin='round';ctx.stroke();
}
function render(){
 var body=document.getElementById('mkBody'),r=rows(),cs=COLSETS[state.colset];
 document.querySelectorAll('#mkTable thead th[data-k]').forEach(function(th){
  th.style.display=(th.dataset.k==='sym'||cs.indexOf(th.dataset.k)>-1)?'':'none';
  if(th.dataset.k==='sym')return;
  if(th.dataset.k===state.sort.k)th.setAttribute('aria-sort',state.sort.dir>0?'ascending':'descending');
  else th.removeAttribute('aria-sort');});
 body.innerHTML=r.map(function(p){
  var cells='';
  if(cs.indexOf('price')>-1)cells+='<td>'+(p.live?'<span class="num">'+fmt(p.price,2)+'</span>':'<span class="dash">—</span>')+'</td>';
  if(cs.indexOf('chg')>-1)cells+='<td>'+(p.live?'<span class="num '+(p.chg>0?'up':'dn')+'">'+(p.chg>0?'▲ ':'▼ ')+Math.abs(p.chg).toFixed(2)+'%</span>':'<span class="dash">—</span>')+'</td>';
  if(cs.indexOf('range')>-1)cells+='<td>'+(p.lo!=null?'<span class="rng"><span class="lo">'+fmt(p.lo,1)+'</span> – <span class="hi">'+fmt(p.hi,1)+'</span></span>':'<span class="dash">—</span>')+'</td>';
  if(cs.indexOf('vol')>-1)cells+='<td>'+(p.live?'<span class="num">'+(p.vol/1e6).toFixed(2)+'M</span>':'<span class="dash">—</span>')+'</td>';
  if(cs.indexOf('tr')>-1)cells+='<td>'+(p.live?'<canvas class="spk" data-sym="'+p.sym+'" data-up="'+p.up+'"></canvas>':'<span class="dash">—</span>')+'</td>';
  return '<tr data-dead="'+(p.live?'false':'true')+'">'
   +'<td class="l"><button class="fav js-fav" type="button" data-sym="'+p.sym+'" aria-pressed="'+p.fav+'" aria-label="Favorite '+p.sym+'">'
   +'<svg width="12" height="12" viewBox="0 0 16 16" fill="'+(p.fav?'currentColor':'none')+'" stroke="currentColor" stroke-width="1.5"><path d="M8 1.9 9.7 6l4.4.3-3.3 2.9 1 4.3L8 11.2 4.2 13.5l1-4.3L1.9 6.3 6.3 6z"/></svg></button></td>'
   +'<td class="l"><span class="pairc"><span class="sym">'+p.sym+'</span>'+(p.live?'<span class="tagp">Perp</span>':'')
   +(!p.live?'<span class="dead"><svg width="10" height="10" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.7"><circle cx="8" cy="8" r="5.6"/><path d="M5.6 5.6l4.8 4.8"/></svg>Not listed on the exchange</span>':'')
   +'</span></td>'+cells
   +'<td><button class="btnTrade" type="button" '+(p.live?'':'disabled')+'>Trade</button></td></tr>';}).join('');
 document.querySelectorAll('#mkBody canvas.spk').forEach(function(cv){drawSpk(cv,cv.dataset.sym,cv.dataset.up==='true');});
 document.getElementById('mkCount').innerHTML='Showing <b>'+r.length+'</b> of <b>21</b> pairs';
 document.getElementById('mkFavN').textContent=PAIRS.filter(function(p){return p.fav;}).length;
 document.getElementById('mkTplCols').textContent=({overview:'Overview',performance:'Performance',volume:'Volume & range'})[state.colset];
 document.getElementById('mkColCur').textContent=({overview:'Overview',performance:'Performance',volume:'Volume & range'})[state.colset];
 document.getElementById('mkTplSort').textContent=({sym:'Pair',price:'Price',chg:'24h change',vol:'Volume',range:'Range',tr:'Trend'}[state.sort.k]||state.sort.k)+' '+(state.sort.dir>0?'↑':'↓');
 document.getElementById('mkTplView').textContent=state.view==='table'?'Table':'Heatmap';
 document.getElementById('mkTplName').textContent=state.tpl;
 document.getElementById('mkTplAuto').textContent=state.auto?'on':'off';
 document.getElementById('mkAutoK').textContent=state.auto?'on':'off';
 document.getElementById('mkFilterN').textContent=Object.keys(state.filters).filter(function(k){return state.filters[k];}).length;
 document.getElementById('mkRefreshLbl').textContent=state.refresh?('Auto refresh · '+state.refresh+'s'):'Auto refresh · off';
 document.getElementById('mkView').querySelectorAll('button').forEach(function(b,i){b.setAttribute('aria-pressed',(i===0)===(state.view==='table')?'true':'false');});
 document.getElementById('mkHeatCard').hidden=state.view!=='heat';
 document.getElementById('mkTable').parentNode.parentNode.hidden=state.view!=='table';
 wire();
}
function wire(){
 document.querySelectorAll('.js-fav').forEach(function(b){b.addEventListener('click',function(){
  var s=b.dataset.sym,p=PAIRS.filter(function(x){return x.sym===s;})[0];p.fav=!p.fav;
  push();render();});});
}

/* ===================== heatmap ===================== */
function renderHeat(){
 var host=document.getElementById('mkHeat');
 var r=PAIRS.filter(function(p){return p.live;});
 host.innerHTML=r.map(function(p){
  var size=p.vol>100000000?2:1;
  var bg=p.chg>0?'color-mix(in oklab,oklch(52% .11 175) 16%,var(--bg-panel))':'color-mix(in oklab,oklch(56% .2 355) 16%,var(--bg-panel))';
  return '<div class="heatc" style="background:'+bg+';grid-column:span '+size+'">'
   +'<span class="s">'+p.sym+'</span>'
   +'<span class="p" style="color:'+(p.chg>0?'oklch(42% .11 175)':'oklch(45% .18 355)')+'">'+(p.chg>0?'▲ ':'▼ ')+Math.abs(p.chg).toFixed(2)+'%</span>'
   +'<span class="r">'+fmt(p.price,2)+' · '+(p.vol/1e6).toFixed(2)+'M</span></div>';}).join('')
 +'<div class="heatc" style="grid-column:span 2;background:repeating-linear-gradient(-45deg,color-mix(in oklab,var(--warning) 7%,transparent) 0 1px,transparent 1px 8px)">'
 +'<span class="s" style="color:var(--text-tertiary)">19 unlisted symbols</span>'
 +'<span class="r">no book — cannot be tiled</span></div>';
}

/* ===================== scanner ===================== */
function renderScanner(){
 var c=COND[state.cond];
 document.getElementById('scFormula').innerHTML=c.txt;
 document.getElementById('scConds').textContent=c.why.length+' conditions';
 document.getElementById('scExplain').innerHTML=c.expl.map(function(e){
  return '<div class="explrow"><span class="q">'+e[0]+'</span><span class="a">'+e[1]+'</span></div>';}).join('');
 document.getElementById('mkExplBd').innerHTML=c.expl.map(function(e){
  return '<div class="explrow"><span class="q">'+e[0]+'</span><span class="a">'+e[1]+'</span></div>';}).join('');
 document.getElementById('mkExplN').textContent=String(c.expl.length);
 document.getElementById('scMeta').textContent=state.scanned?('last closed bar · '+document.getElementById('scTf').value):'not run yet';
 if(!state.scanned){document.getElementById('scTblWrap').hidden=true;document.getElementById('scEmpty').hidden=false;return;}
 document.getElementById('scEmpty').hidden=true;document.getElementById('scTblWrap').hidden=false;
 var hits=[];
 Object.keys(IND).forEach(function(s){
  var d=IND[s],ok=match(s,state.cond),up=d.emaFast>d.emaSlow;
  hits.push('<tr data-dead="'+(ok?'false':'true')+'"><td class="l"><span class="sym">'+s+'</span></td>'
   +'<td><span class="num">'+fmt(d.last,2)+'</span></td>'
   +'<td><span class="num">'+d.rsi.toFixed(1)+'</span></td>'
   +'<td><span class="num" style="color:'+(up?'oklch(42% .11 175)':'oklch(45% .18 355)')+'">'+(up?'EMA20 > EMA50':'EMA20 < EMA50')+'</span></td>'
   +'<td><span class="num">'+d.volx.toFixed(2)+'×</span></td>'
   +'<td><span class="num">'+d.atr.toFixed(2)+'%</span></td>'
   +'<td><span class="bar2"><i style="width:'+d.rng+'%"></i></span> <span class="mono" style="font-size:10px">'+d.rng+'</span></td>'
   +'<td><span class="mtch '+(ok?'mtch--yes':'mtch--no')+'"><span class="d"></span>'+(ok?'Match':'No')+'</span></td></tr>');});
 document.getElementById('scBody').innerHTML=hits.join('');
}
function runScan(){
 state.scanned=true;renderScanner();
 var n=Object.keys(IND).filter(function(s){return match(s,state.cond);}).length;
 document.getElementById('scMeta').textContent='last closed bar · '+document.getElementById('scTf').value+' · '+n+' match'+(n===1?'':'es')+' of 2 chartable';
}
/* ===================== history / autosave ===================== */
function snap(){return JSON.stringify({s:state.sort,c:state.colset,t:state.tab,q:state.q,f:state.filters,v:state.view,r:state.refresh,tp:state.tpl});}
function push(){state.hist=state.hist.slice(0,state.hi+1);state.hist.push(snap());state.hi=state.hist.length-1;if(state.hist.length>100)state.hist.shift();
 if(state.auto){clearTimeout(window.__as);window.__as=setTimeout(function(){
  document.getElementById('mkRefreshLbl').textContent='Autosaved · '+new Date().toTimeString().slice(0,8);},2000);}}
function undo(){if(state.hi<=0)return;state.hi--;apply(state.hist[state.hi]);}
function redo(){if(state.hi>=state.hist.length-1)return;state.hi++;apply(state.hist[state.hi]);}
function apply(s){var o=JSON.parse(s);state.sort=o.s;state.colset=o.c;state.tab=o.t;state.q=o.q;state.filters=o.f;state.view=o.v;state.refresh=o.r;state.tpl=o.tp;
 document.getElementById('mkSearch').value=state.q;renderFilters();render();}

/* ===================== filters rail ===================== */
var FNAME={live:'Chartable only',up:'24h change > 0',vol:'Volume > 100M',fav:'Favorites'};
function renderFilters(){
 var host=document.getElementById('mkFilterList'),on=Object.keys(state.filters).filter(function(k){return state.filters[k];});
 host.innerHTML=on.length?on.map(function(k){
  return '<div class="lay"><span class="k">'+FNAME[k]+'</span><span class="sp"></span>'
   +'<button class="sbtn sbtn--sm js-rmf" type="button" data-f="'+k+'" aria-label="Remove filter">Remove</button></div>';}).join('')
  :'<p class="foot-note" style="margin:0">No filters applied — the table shows every symbol the venue lists.</p>';
 host.querySelectorAll('.js-rmf').forEach(function(b){b.addEventListener('click',function(){
  state.filters[b.dataset.f]=false;push();renderFilters();render();});});
}
/* ===================== boot ===================== */
document.querySelectorAll('#mkRoutes button').forEach(function(b,i){b.addEventListener('click',function(){
 document.querySelectorAll('#mkRoutes button').forEach(function(x){x.setAttribute('aria-pressed','false');});
 b.setAttribute('aria-pressed','true');
 document.getElementById('vMarkets').hidden=(i!==0);document.getElementById('vScanner').hidden=(i===0);
 document.getElementById('mkTitle').textContent=i===0?'Markets':'Market scanner';
 document.getElementById('mkCrumb').textContent=i===0?'Markets':'Market scanner';
 document.getElementById('mkSub').innerHTML=i===0
  ?'2 of 21 pairs live · Perpetual · USDT-margined · <span class="warn">19 not listed</span>'
  :'Run a signal condition across the top coins by volume and see where it is true right now.';
 renderScanner();});});
document.querySelectorAll('#mkView button').forEach(function(b,i){b.addEventListener('click',function(){
 state.view=i===0?'table':'heat';push();if(state.view==='heat')renderHeat();render();});});
document.querySelectorAll('#mkTable thead th.srt').forEach(function(th){th.addEventListener('click',function(){
 if(state.sort.k===th.dataset.k){state.sort.dir*=-1;}else{state.sort.k=th.dataset.k;state.sort.dir=(th.dataset.k==='sym'?1:-1);}
 push();render();});});
document.querySelectorAll('#mkFtabs button').forEach(function(b,i){b.addEventListener('click',function(){
 document.querySelectorAll('#mkFtabs button').forEach(function(x){x.setAttribute('aria-pressed','false');});
 b.setAttribute('aria-pressed','true');
 state.tab=['all','fav','gain','los','new'][i];push();render();});});
document.getElementById('mkSearch').addEventListener('input',function(){state.q=this.value;render();});
document.querySelectorAll('.js-colset').forEach(function(b){b.addEventListener('click',function(){
 state.colset=b.dataset.c;push();render();closeDD();});});
document.querySelectorAll('.js-refresh').forEach(function(b){b.addEventListener('click',function(){
 state.refresh=parseInt(b.dataset.r,10);push();render();closeDD();});});
document.querySelectorAll('.js-screen').forEach(function(b){b.addEventListener('click',function(){
 var s=b.dataset.s;
 state.tpl=b.textContent.replace(/\s+\d+$/,'').trim();
 if(s==='live'){state.filters={live:true,up:false,vol:false,fav:false};state.tab='all';state.colset='overview';state.sort={k:'sym',dir:1};}
 if(s==='gain'){state.filters={live:false,up:true,vol:false,fav:false};state.tab='all';state.colset='performance';state.sort={k:'chg',dir:-1};}
 if(s==='fav'){state.filters={live:false,up:false,vol:false,fav:true};state.tab='all';state.colset='overview';}
 if(s==='all'){state.filters={live:false,up:false,vol:false,fav:false};state.tab='all';state.colset='overview';}
 if(s==='dead'){state.filters={live:false,up:false,vol:false,fav:false};state.tab='all';state.colset='overview';state.sort={k:'sym',dir:1};}
 document.getElementById('ddCur').textContent=state.tpl;
 document.getElementById('mkTplName').textContent=state.tpl;
 push();renderFilters();render();closeDD();});});
document.getElementById('mkSaveScreen').addEventListener('click',function(){
 document.getElementById('ddCur').textContent='Saved · '+state.tpl;
 document.getElementById('mkRefreshLbl').textContent='Screen saved — filters, columns, sorting and view';closeDD();});
document.getElementById('mkCopyScreen').addEventListener('click',function(){
 state.tpl=state.tpl+' copy';document.getElementById('ddCur').textContent=state.tpl;
 document.getElementById('mkTplName').textContent=state.tpl;push();closeDD();});
document.getElementById('mkExport').addEventListener('click',function(){
 var r=rows(),cs=COLSETS[state.colset];
 var lines=['symbol,pair_type,listed,price,change_24h,low_24h,high_24h,volume_24h'];
 r.forEach(function(p){lines.push([p.sym,'perp',p.live?'yes':'no',p.live?p.price:'',p.live?p.chg:'',p.lo||'',p.hi||'',p.live?p.vol:''].join(','));});
 var blob=new Blob([lines.join('\n')],{type:'text/csv'});
 var a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='screen-'+state.tpl.replace(/\s+/g,'-')+'.csv';a.click();
 document.getElementById('mkRefreshLbl').textContent='Exported '+r.length+' rows · '+cs.length+' value columns';closeDD();});
document.getElementById('mkAuto').addEventListener('click',function(){
 state.auto=!state.auto;this.setAttribute('aria-pressed',String(state.auto));push();render();closeDD();});
document.getElementById('mkFilters').addEventListener('click',function(){
 document.getElementById('mkFilterList').scrollIntoView({block:'nearest',behavior:'smooth'});});
document.getElementById('mkClearF').addEventListener('click',function(){
 state.filters={live:false,up:false,vol:false,fav:false};push();renderFilters();render();});
document.querySelectorAll('#mkFilterAdd .pill').forEach(function(b){b.addEventListener('click',function(){
 var k=b.dataset.f;state.filters[k]=!state.filters[k];push();renderFilters();render();});});
document.getElementById('mkUndo').addEventListener('click',undo);
document.getElementById('mkRedo').addEventListener('click',redo);
document.addEventListener('keydown',function(e){
 if((e.ctrlKey||e.metaKey)&&e.key==='z'){e.preventDefault();undo();}
 if((e.ctrlKey||e.metaKey)&&e.key==='y'){e.preventDefault();redo();}});
document.querySelectorAll('#scPills .pill').forEach(function(b){b.addEventListener('click',function(){
 document.querySelectorAll('#scPills .pill').forEach(function(x){x.setAttribute('aria-pressed','false');});
 b.setAttribute('aria-pressed','true');state.cond=b.dataset.p;state.scanned=false;
 document.getElementById('scTblWrap').hidden=true;document.getElementById('scEmpty').hidden=false;
 renderScanner();});});
document.getElementById('scRun').addEventListener('click',runScan);
document.getElementById('scEdit').addEventListener('click',function(){
 document.getElementById('mkFilterList').scrollIntoView({block:'nearest'});});
document.getElementById('scAi').addEventListener('click',function(){
 document.querySelectorAll('#mkRoutes button')[1].click();
 document.getElementById('mkExplain').setAttribute('data-open','true');
 document.getElementById('mkAiQ').value='uptrend dips on 1h';applyAi('uptrend dips on 1h');});
document.getElementById('mkExplainHd').addEventListener('click',function(){
 var e=document.getElementById('mkExplain');e.setAttribute('data-open',e.getAttribute('data-open')==='true'?'false':'true');});
function applyAi(q){
 var t=(q||'').toLowerCase(),out=[];
 if(t.indexOf('uptrend')>-1||t.indexOf('dip')>-1){out.push(['trend = EMA20 vs EMA50','Mapped “uptrend” to the regime filter EMA20 above EMA50 on the 1h.']);
  out.push(['rsi14 < 45','Mapped “dip” to RSI cooled below 45 without breaking 40.']);state.cond='up';}
 if(t.indexOf('volume')>-1||t.indexOf('highest')>-1){out.push(['sort = volume_24h desc','Mapped “highest volume” to a descending sort on the 24h volume column.']);
  out.push(['columns = Volume & range','Added the volume column set because the question was about volume.']);state.colset='volume';state.sort={k:'vol',dir:-1};}
 if(t.indexOf('gainer')>-1){out.push(['24h change > 0','Mapped “gainers” to a positive 24h change filter.']);state.filters.up=true;state.colset='performance';}
 if(!out.length){out.push(['no filter mapped','Nothing in that sentence matched a filter. Name a metric (RSI, EMA, volume, 24h change) or a market and try again.']);}
 document.getElementById('mkExplBd').innerHTML=out.map(function(e){
  return '<div class="explrow"><span class="q">'+e[0]+'</span><span class="a">'+e[1]+'</span></div>';}).join('');
 document.getElementById('mkExplN').textContent=String(out.length);
 document.getElementById('mkExplain').setAttribute('data-open','true');
 document.getElementById('scPills').querySelectorAll('.pill').forEach(function(x){
  x.setAttribute('aria-pressed',x.dataset.p===state.cond?'true':'false');});
 renderScanner();renderFilters();render();
}
document.getElementById('mkAiQ').addEventListener('keydown',function(e){if(e.key==='Enter'){applyAi(this.value);}});
document.querySelectorAll('#mkAiTpl .pill').forEach(function(b){b.addEventListener('click',function(){
 document.getElementById('mkAiQ').value=b.textContent.trim();applyAi(b.textContent);});});
function closeDD(){document.querySelectorAll('.dd').forEach(function(d){d.setAttribute('data-open','false');});}
document.querySelectorAll('.dd__btn').forEach(function(b){b.addEventListener('click',function(e){
 e.stopPropagation();var d=b.closest('.dd'),o=d.getAttribute('data-open')==='true';closeDD();
 d.setAttribute('data-open',o?'false':'true');});});
document.addEventListener('click',closeDD);
/* boot */
push();renderFilters();renderHeat();renderScanner();render();
setInterval(function(){
 if(state.refresh>0&&!document.hidden){
  var l=document.getElementById('mkRefreshLbl');
  if(state.view==='heat')renderHeat();
  l.textContent='Refreshed · '+new Date().toTimeString().slice(0,8);}
},state.refresh*1000);
