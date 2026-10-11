
/* ===================== routes ===================== */
var ROUTES=['Portfolio','Analytics','Wallet','Settings'];
var SUBS={Portfolio:'Assets · Equity curve · Allocation · Open positions',
 Analytics:'Trade journal · Performance · Behavioral patterns',
 Wallet:'Supported exchanges · API key management · assets · deposits and withdrawals',
 Settings:'Profile · security · notifications · API keys · accessibility'};
var CUR=0;
function setRoute(i){
 CUR=i;
 document.querySelectorAll('#pfRoutes button').forEach(function(b,k){b.setAttribute('aria-pressed',k===i?'true':'false');});
 document.getElementById('pfTitle').textContent=ROUTES[i];
 document.getElementById('pfCrumb').textContent=ROUTES[i];
 document.getElementById('pfSub').textContent=SUBS[ROUTES[i]];
 document.getElementById('vPortfolio').hidden=(i!==0);
 document.getElementById('vAnalytics').hidden=(i!==1);
 document.getElementById('vWallet').hidden=(i!==2);
 document.getElementById('vSettings').hidden=(i!==3);
 document.getElementById('pfSubnav').style.display=(i===0)?'':'none';
 if(i===0){drawEq();drawDonut();}
 if(i===1){drawPnl();}
}
/* ===================== canvas helpers ===================== */
function ctx2(id){
 var cv=document.getElementById(id),dpr=Math.min(2,window.devicePixelRatio||1);
 var W=cv.clientWidth||cv.parentNode.clientWidth||600,H=cv.clientHeight||140;
 cv.width=Math.round(W*dpr);cv.height=Math.round(H*dpr);
 var c=cv.getContext('2d');c.setTransform(dpr,0,0,dpr,0,0);c.clearRect(0,0,W,H);
 return {c:c,W:W,H:H};
}
function css(v){return getComputedStyle(document.documentElement).getPropertyValue(v).trim();}
/* --- equity curve: dotted grid when empty, real polyline when sample --- */
var SAMPLE=false;
function drawEq(){
 var g=ctx2('pfEq'),c=g.c,W=g.W,H=g.H;
 var grid=css('--chart-grid')||'rgba(0,0,0,.08)';
 c.lineWidth=1;c.strokeStyle=grid;
 for(var r=0;r<=4;r++){var y=12+(r/4)*(H-30);c.beginPath();
  if(r===4){c.setLineDash([]);c.moveTo(6,y);c.lineTo(W-6,y);}
  else{c.setLineDash([2,4]);c.moveTo(6,y);c.lineTo(W-6,y);}
  c.stroke();}
 c.setLineDash([]);
 c.font='9px '+css('--font-mono');c.fillStyle=css('--text-disabled')||'#999';
 c.fillText('+',4,12);c.fillText('0',4,H/2+3);c.fillText('−',4,H-20);
 if(!SAMPLE){document.getElementById('pfEqWrap').setAttribute('data-sample','false');return;}
 document.getElementById('pfEqWrap').setAttribute('data-sample','true');
 /* deterministic sample series, clearly labelled SAMPLE in the UI */
 var a=[],v=10000,x=7;
 for(var i=0;i<61;i++){x=x*1664525+1013904223;v+=(((x>>>16)%1000)/1000-0.48)*70;a.push(v);}
 var lo=Math.min.apply(null,a),hi=Math.max.apply(null,a);
 var X=function(i){return 8+(i/(a.length-1))*(W-16);},Y=function(v){return 12+(hi-v)/(hi-lo)*(H-34);};
 c.beginPath();for(var i2=0;i2<a.length;i2++){var px=X(i2),py=Y(a[i2]);i2?c.lineTo(px,py):c.moveTo(px,py);}
 c.strokeStyle=css('--brand')||'#c700be';c.lineWidth=1.8;c.lineJoin='round';c.stroke();
 c.lineTo(X(a.length-1),H-16);c.lineTo(8,H-16);c.closePath();
 c.fillStyle='rgba(199,0,190,0.09)';c.fill();
 c.fillStyle=css('--text-tertiary')||'#777';c.font='9px '+css('--font-mono');
 c.fillText('SAMPLE — not your account',8,11);
}
/* --- allocation donut: empty ring with a dash --- */
function drawDonut(){
 var cv=document.getElementById('pfDonut'),c=cv.getContext('2d');
 var dpr=Math.min(2,window.devicePixelRatio||1);cv.width=132*dpr;cv.height=132*dpr;
 c.setTransform(dpr,0,0,dpr,0,0);c.clearRect(0,0,132,132);
 c.beginPath();c.arc(66,66,52,0,Math.PI*2);c.lineWidth=13;
 c.strokeStyle=css('--bg-sunken')||'#eee';c.stroke();
 c.beginPath();c.arc(66,66,52,-Math.PI/2,Math.PI*1.5);c.lineWidth=13;
 c.strokeStyle=css('--border-subtle')||'#e6e6e6';c.setLineDash([3,5]);c.stroke();c.setLineDash([]);
 c.fillStyle=css('--text-disabled')||'#aaa';c.font='600 11px '+css('--font-ui');
}
/* --- daily pnl: real date axis, flat zero line (no synthetic bars) --- */
function drawPnl(){
 var g=ctx2('pfPnl'),c=g.c,W=g.W,H=g.H;
 var grid=css('--chart-grid')||'rgba(0,0,0,.08)';
 c.strokeStyle=grid;c.lineWidth=1;
 for(var r=0;r<=4;r++){var y=10+(r/4)*(H-30);c.beginPath();c.moveTo(6,y);c.lineTo(W-6,y);c.stroke();}
 var mid=10+2*(H-30)/4;
 c.strokeStyle=css('--border-strong')||'#bbb';c.setLineDash([4,3]);c.lineWidth=1.2;
 c.beginPath();c.moveTo(6,mid);c.lineTo(W-6,mid);c.stroke();c.setLineDash([]);
 c.fillStyle=css('--text-tertiary')||'#777';c.font='9px '+css('--font-mono');
 c.fillText('+PnL',6,9);c.fillText('−PnL',6,H-6);
 /* today's date drives the axis label */
 var t=new Date(),lbl=[];for(var k=6;k>=0;k--){var d=new Date(t.getTime()-k*5*864e5);lbl.push((d.getMonth()+1)+'/'+d.getDate());}
 c.fillStyle=css('--text-disabled')||'#aaa';
 var step=(W-16)/(lbl.length-1);
 lbl.forEach(function(s,i){c.fillText(s,8+i*step-(i===0?0:(i===lbl.length-1?16:8)),H-6);});
}
/* ===================== settings sections ===================== */
function tgrow(label,on,note){
 return '<div class="tgrow"><span>'+label+'</span><span class="sp"></span>'
  +'<button class="sw2 js-tg" type="button" aria-pressed="'+on+'" aria-label="'+label+'"><i></i></button></div>'
  +(note?'<p class="foot-note" style="margin:0">'+note+'</p>':'');
}
function stBody(k){
 if(k===0)return ''
  +'<div class="idbox"><span class="av">D</span><span class="in">'
  +'<span class="em">design_1791706987515@example.com</span>'
  +'<span class="id">842d2873-45cb-47ba-a122-9db5e8dc94e1</span></span>'
  +'<span class="sp"></span><span class="badgew">⚠ Email not verified</span></div>'
  +'<div class="fld"><label for="stEmail">Email</label>'
  +'<input id="stEmail" value="design_1791706987515@example.com" readonly></div>'
  +'<p class="foot-note" style="margin:0">Your email is your sign-in identity, so it cannot be changed here — that would need re-verification.<br>We store only what sign-in requires. No name, country or timezone is kept, so there is nothing else to edit.</p>'
  +'<div style="display:flex;gap:7px"><button class="sbtn" type="button">Change password</button><button class="sbtn" type="button">Sign out</button></div>';
 if(k===1)return ''
  +'<div class="ck" data-ok="true"><svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2"><path d="m3 8.4 3.2 3.4L13 5.2"/></svg><span>Password sign-in active</span><span class="sp"></span><span class="st">on</span></div>'
  +tgrow('Two-factor authentication',false,'Not enrolled. Withdrawal rights stay off until this is on — the API keys we store are read-only by default anyway.')
  +tgrow('Alert me on new device sign-in',true,'Uses the notification bell in the top bar.')
  +'<p class="foot-note" style="margin:0">Sessions are revoked by changing the password. We do not keep a device list, so we do not show you one.</p>';
 if(k===2)return ''
  +tgrow('Order fills',true,'Fires when one of your orders is filled.')
  +tgrow('Liquidation risk',true,'Fires when a position approaches its liquidation price.')
  +tgrow('Strategy signals',false,'Fires when a saved strategy condition turns true.')
  +tgrow('Product email',false,'Occasional release notes. Off by default.')
  +'<p class="foot-note" style="margin:0">In-app notifications work now. Email delivery needs a verified address — yours is still unverified, so nothing will be emailed yet.</p>';
 if(k===3)return ''
  +'<div class="ck" data-ok="false"><svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.7"><circle cx="8" cy="8" r="5.4"/><path d="M5.8 5.8l4.4 4.4M10.2 5.8l-4.4 4.4"/></svg><span>No API key connected</span><span class="sp"></span><span class="st">none</span></div>'
  +'<p class="foot-note" style="margin:0">Keys are added per venue on the <b>Wallet</b> tab. Required fields differ by venue: KuCoin needs <span class="reql">apiKey · apiSecret · passphrase</span>, Bybit needs <span class="reql">apiKey · apiSecret</span>.</p>'
  +'<div style="display:flex;gap:7px"><button class="sbtn sbtn--brand" type="button" id="stGoWallet">Open Wallet</button></div>'
  +'<p class="foot-note" style="margin:0">Request read + trade scopes only. Never enable withdrawal on a key you paste into any terminal, including this one.</p>';
 if(k===4)return ''
  +tgrow('Compact density',false,'Tighter rows and paddings. Matches the terminal density switch.')
  +tgrow('Show 24h change as absolute',false,'Displays the price delta instead of the percentage.')
  +tgrow('Confirm every order',true,'Adds one confirmation step before an order leaves the browser.')
  +'<p class="foot-note" style="margin:0">Theme follows the switch in the bottom bar. No preference is stored server-side.</p>';
 if(k===5)return ''
  +tgrow('High contrast',false,'Raises borders and text contrast to the WCAG AAA target.')
  +tgrow('Colour-blind safe palette',false,'Switches long/short from teal/magenta to blue/orange.')
  +tgrow('Reduce motion',false,'Stops spinners and chart animation.')
  +'<p class="foot-note" style="margin:0">These three map to the same switches the product ships as <span class="reql">data-a11y-high-contrast</span> and <span class="reql">data-a11y-color-blind</span>.</p>';
 return ''
  +'<div class="ck" data-ok="false"><svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.7"><circle cx="8" cy="8" r="5.4"/><path d="M5.8 5.8l4.4 4.4M10.2 5.8l-4.4 4.4"/></svg><span>Email not verified</span><span class="sp"></span><span class="st">action</span></div>'
  +'<p class="foot-note" style="margin:0">Verification is the only account action available from here. Closing an account is handled by support so that open positions and balances are settled first — we will not let a button strand funds.</p>'
  +'<div style="display:flex;gap:7px"><button class="sbtn" type="button">Resend verification email</button><button class="sbtn" type="button">Contact support</button></div>';
}
function setSec(k){
 document.querySelectorAll('#stNav button').forEach(function(b,i){b.setAttribute('aria-pressed',i===k?'true':'false');});
 var names=['Profile details','Security','Notifications','API keys','Preferences','Accessibility','Account'];
 document.getElementById('stSecT').textContent=names[k];
 document.getElementById('stSecN').textContent=(k===0?'read-only':'settings');
 document.getElementById('stBody').innerHTML=stBody(k);
 document.querySelectorAll('.js-tg').forEach(function(b){b.addEventListener('click',function(){
  b.setAttribute('aria-pressed',b.getAttribute('aria-pressed')==='true'?'false':'true');});});
 var gw=document.getElementById('stGoWallet');if(gw)gw.addEventListener('click',function(){setRoute(2);});
}
/* ===================== wiring ===================== */
document.querySelectorAll('#pfRoutes button').forEach(function(b,i){b.addEventListener('click',function(){setRoute(i);});});
document.querySelectorAll('#pfSubnav button').forEach(function(b,i){b.addEventListener('click',function(){
 document.querySelectorAll('#pfSubnav button').forEach(function(x){x.setAttribute('aria-pressed','false');});
 b.setAttribute('aria-pressed','true');
 var which=['bal','eq','alloc','pos'][i];
 document.querySelectorAll('#vPortfolio .card, #vPortfolio .kpis, #vPortfolio .note').forEach(function(el){el.style.display='';});
 var hide=[];
 if(which==='bal')hide=['eq','alloc','pos'];
 if(which==='eq')hide=['bal','alloc','pos'];
 if(which==='alloc')hide=['bal','eq','pos'];
 if(which==='pos')hide=['bal','eq','alloc'];
 var map={bal:'Balances',eq:'Equity curve',alloc:'Allocation',pos:'Open positions'};
 var cards=document.querySelectorAll('#vPortfolio section.card');
 cards.forEach(function(cd){var t=(cd.querySelector('h2')||{}).textContent||'';cd.style.display='';});
 cards.forEach(function(cd){
  var t=(cd.querySelector('h2')||{}).textContent||'';
  Object.keys(map).forEach(function(k){ if(hide.indexOf(k)>-1 && t.indexOf(map[k].split(' ')[0])>-1) cd.style.display='none';});
 });
 if(which==='eq')drawEq(); if(which==='alloc')drawDonut();
});});
document.querySelectorAll('#pfEqRng button').forEach(function(b){b.addEventListener('click',function(){
 document.querySelectorAll('#pfEqRng button').forEach(function(x){x.removeAttribute('aria-pressed');});
 b.setAttribute('aria-pressed','true');
 document.getElementById('pfEqRange').textContent=(b.dataset.r==='0'?'all':b.dataset.r);
 var d=document.getElementById('pfEqNote');
 d.textContent='Not enough history to draw a curve yet (0 day(s) recorded). A point is saved each day your balance is read.';
 drawEq();});});
document.getElementById('pfEqSample').addEventListener('click',function(){
 SAMPLE=!SAMPLE;
 this.textContent=SAMPLE?'Hide sample':'Preview with sample data';
 document.getElementById('pfEqSrc').textContent=SAMPLE?'source: deterministic sample series — NOT your account':'source: daily balance read · 0 days stored';
 drawEq();});
document.querySelectorAll('.js-copy').forEach(function(b){b.addEventListener('click',function(){
 try{navigator.clipboard.writeText(b.dataset.v);}catch(e){}
 b.textContent='Copied';setTimeout(function(){b.textContent='Copy';},1300);});});
document.querySelectorAll('.js-connect').forEach(function(b){b.addEventListener('click',function(){
 document.getElementById('ck2').setAttribute('data-ok','true');
 document.getElementById('ck2').querySelector('.st').textContent='done';
 document.getElementById('rfDone').textContent='1 / 4';
 document.getElementById('pfRefresh').click();});});
document.querySelectorAll('.js-signup').forEach(function(b){b.addEventListener('click',function(){
 b.textContent='Opens the venue ↗';setTimeout(function(){b.textContent='Sign up';},1400);});});
document.getElementById('pfRefresh').addEventListener('click',function(){
 var l=document.getElementById('pfEqSrc');
 l.textContent='refreshed · '+new Date().toTimeString().slice(0,8)+' · 0 balances read';
 document.getElementById('pfConn').innerHTML='<span class="d"></span>No exchange connected';});
document.getElementById('pfAddEx').addEventListener('click',function(){setRoute(2);});
document.getElementById('anAddEx').addEventListener('click',function(){setRoute(2);});
function goWalletTab(i){
 document.getElementById('wlTab1').setAttribute('aria-pressed',i===0?'true':'false');
 document.getElementById('wlTab2').setAttribute('aria-pressed',i===1?'true':'false');
 document.getElementById('wlConn').hidden=(i!==0);document.getElementById('wlBal').hidden=(i===0);
}
document.getElementById('wlTab1').addEventListener('click',function(){goWalletTab(0);});
document.getElementById('wlTab2').addEventListener('click',function(){goWalletTab(1);});
document.getElementById('anNew').addEventListener('click',function(){
 document.getElementById('anJEmpty').textContent='Journal entry is opened from here — nothing is written until you save it.';
 document.getElementById('anJEmpty').scrollIntoView({block:'center',behavior:'smooth'});});
document.getElementById('anNew2').addEventListener('click',function(){document.getElementById('anNew').click();});
document.querySelectorAll('#stNav button').forEach(function(b,i){b.addEventListener('click',function(){setSec(i);});});
window.addEventListener('resize',function(){drawEq();drawDonut();drawPnl();});
/* boot */
setRoute(0);setSec(0);
setTimeout(function(){drawEq();drawDonut();drawPnl();},260);
