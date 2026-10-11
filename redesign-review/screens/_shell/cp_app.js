
/* ================= tool-call cards + feedback wiring ================= */
function wireTools(root){
  $$('.tc',root).forEach(function(tc){
    var hd=tc.querySelector('.tc__hd'), chev=tc.querySelector('.tc__chev');
    hd.addEventListener('click',function(){
      var open=tc.getAttribute('data-open')==='true';
      tc.setAttribute('data-open',open?'false':'true');
      if(chev)chev.style.transform=open?'':'rotate(180deg)';
    });
  });
  $$('.js-up',root).forEach(function(b){b.addEventListener('click',function(){
    var on=b.getAttribute('aria-pressed')==='true';
    b.setAttribute('aria-pressed',on?'false':'true');
    var d=$('.js-down',root); if(d&&!on)d.setAttribute('aria-pressed','false');
    if(!on){var f=$('#aiFbk',root); if(f)f.setAttribute('data-open','false');}
  });});
  $$('.js-down',root).forEach(function(b){b.addEventListener('click',function(){
    var on=b.getAttribute('aria-pressed')==='true';
    b.setAttribute('aria-pressed',on?'false':'true');
    var u=$('.js-up',root); if(u&&!on)u.setAttribute('aria-pressed','false');
    var f=$('#aiFbk',root); if(f)f.setAttribute('data-open',(!on)?'true':'false');
  });});
  $$('#aiFbk button:not(.js-fbsend)',root).forEach(function(b){b.addEventListener('click',function(){
    b.setAttribute('aria-pressed',b.getAttribute('aria-pressed')==='true'?'false':'true');
  });});
  var fs=$('.js-fbsend',root); if(fs)fs.addEventListener('click',function(){
    fs.textContent='Sent'; fs.style.color='var(--brand)'; fs.style.borderColor='var(--brand)';
    setTimeout(function(){fs.textContent='Send feedback';fs.style.color='';fs.style.borderColor='';},1400);
  });
  var cp=$('.js-copy',root); if(cp)cp.addEventListener('click',function(){
    var t=$('.prose',root); if(!t)return;
    try{navigator.clipboard.writeText(t.textContent.trim());}catch(e){}
    var old=cp.innerHTML; cp.innerHTML='<svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2"><path d="m3 8.4 3.2 3.4L13 5.2"/></svg>';
    setTimeout(function(){cp.innerHTML=old;},1200);
  });
  var ap=$('.js-approve',root); if(ap)ap.addEventListener('click',approve);
  $$('.js-eye',root).forEach(function(b){b.addEventListener('click',function(){
    var on=b.getAttribute('aria-pressed')==='true';
    b.setAttribute('aria-pressed',on?'false':'true');
    b.style.opacity=on?'.38':'1';
    var r=b.closest('.wlrow'); if(r)r.style.opacity=on?'.45':'1';
  });});
}

/* ================= checkpoint: approve → draw ================= */
var approved=false;
function approve(){
  if(approved)return; approved=true;
  var cp=$('#aiCp');
  var row=$('#aiLrowDraw');
  if(row){
    row.className='lrow'; row.setAttribute('data-st','done');
    row.querySelector('.g').className='g g--done';
    row.querySelector('.g').innerHTML='<svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2"><path d="m3 8.4 3.2 3.4L13 5.2"/></svg>';
    row.querySelector('.nm').textContent='Drew 3 layers on BTCUSDT 1h';
    row.querySelector('.st').textContent='done';
  }
  if(cp)cp.outerHTML='<div class="ledger" style="border-color:color-mix(in oklab,var(--long) 26%,transparent)">'
    +'<div class="lrow"><span class="g g--done"><svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2"><path d="m3 8.4 3.2 3.4L13 5.2"/></svg></span>'
    +'<span class="nm">Entry · Invalidation · Target added to your chart as editable layers</span><span class="st">300 credits</span></div></div>';
  var dn=$('#aiDrawnN'); if(dn)dn.textContent='3';
  var lvl=$('.res__hd .fmt'); if(lvl)lvl.textContent='3 layers · drawn';
  var m=$('.cmp__meta .cost'); if(m)m.innerHTML=m.innerHTML.replace('300 credits per question','300 credits per question');
}

/* ================= artifact version history ================= */
function setVersion(v){
  $$('#aiVhead .vpill').forEach(function(b){b.setAttribute('aria-pressed',b.textContent===v?'true':'false');});
  var host=$('#aiLayers'); if(!host)return;
  var sets={
    v1:[['Entry','64,294.0','var(--long)'],['Invalidation','63,180.0','var(--short)']],
    v2:[['Entry','64,294.0','var(--long)'],['Invalidation','63,180.0','var(--short)'],['Target','65,980.0','var(--ai)']],
    v3:[['Entry','64,294.0','var(--long)'],['Invalidation','63,180.0','var(--short)'],['Target','65,980.0','var(--ai)'],['Trail stop (1.5 ATR)','63,924.5','var(--warning)']]
  };
  var s=sets[v]||sets.v2;
  host.innerHTML=s.map(function(x){
    return '<div class="wlrow"><i class="sw" style="width:9px;height:2.5px;border-radius:2px;background:'+x[2]+';flex:0 0 auto"></i>'
      +'<span>'+x[0]+'</span><span style="flex:1 1 auto"></span><span class="n">'+x[1]+'</span>'
      +'<button class="act js-eye" type="button" aria-pressed="true" aria-label="Toggle '+x[0]+'"><svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M1.6 8S3.9 3.9 8 3.9 14.4 8 14.4 8 12.1 12.1 8 12.1 1.6 8 1.6 8Z"/><circle cx="8" cy="8" r="1.9"/></svg></button></div>';
  }).join('');
  $('#aiLayerN').textContent=String(s.length);
  wireTools(document);
}

/* ================= tab contents ================= */
function tplStrategies(){
  return '<div class="msg msg--ai"><div class="msg__av">CC</div><div class="msg__in">'
  +'<div class="msg__who"><span class="nm">My AI strategies</span><span class="ts">saved</span><span class="tagai">2 saved</span></div>'
  +'<div class="prose">Strategies you saved from a conversation. Each one can be <b>drawn on the chart</b> as layers or opened in Auto trading as a rule draft — nothing runs until you start it there.</div>'
  +'<div class="tools">'
  +'<div class="tc" data-open="true"><div class="tc__hd"><svg class="tc__ic" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M2.6 11.4 6 7.6l2.6 2.4L13.4 4"/><path d="M9.8 4h3.6v3.6"/></svg><span class="tc__nm">BTC 1h pullback — RSI reset + EMA hold</span><span class="tc__ms">1h</span><svg class="tc__chev" width="11" height="11" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" style="transform:rotate(180deg)"><path d="m4 6.5 4 4 4-4"/></svg></div>'
  +'<div class="tc__bd">IF  rsi(14) <b>crosses above 40</b>  AND  close <b>is above</b> ema(20)\nTHEN LONG BTCUSDT · stop <b>2.0%</b> · target <b>2R</b> · risk <b>1%</b>\nsaved 14:04 · backtestable <b>yes</b></div></div>'
  +'<div class="tc" data-open="false"><div class="tc__hd"><svg class="tc__ic" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M2.6 11.4 6 7.6l2.6 2.4L13.4 4"/><path d="M9.8 4h3.6v3.6"/></svg><span class="tc__nm">ETH 4h range fade — lower band touch</span><span class="tc__ms">4h</span><svg class="tc__chev" width="11" height="11" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8"><path d="m4 6.5 4 4 4-4"/></svg></div>'
  +'<div class="tc__bd">IF  close <b>crosses below</b> lower band(20,2)  AND  volume <b>is above</b> 1.2x mean\nTHEN LONG ETHUSDT · stop <b>1.6%</b> · target <b>1.8R</b> · risk <b>0.5%</b>\nsaved yesterday · backtestable <b>yes</b></div></div>'
  +'</div>'
  +'<div class="cp"><div class="cp__hd"><svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.7"><circle cx="8" cy="8" r="5.6"/><path d="M8 5.4v3.2l2 1.2"/></svg><span>Open one in Auto trading?</span></div>'
  +'<div class="cp__bd">A saved strategy becomes a rule draft there — you still backtest it and press start yourself.</div>'
  +'<div class="cp__acts"><button class="sbtn sbtn--brand sbtn--sm" type="button">Open in Auto trading</button><button class="sbtn sbtn--sm" type="button">Draw on chart</button></div></div>'
  +'</div></div>';
}
function tplPosition(){
  return '<div class="msg msg--ai"><div class="msg__av">CC</div><div class="msg__in">'
  +'<div class="msg__who"><span class="nm">Position review</span><span class="ts">live</span><span class="tagai">No position</span></div>'
  +'<div class="ledger"><div class="lrow"><span class="g g--pend"><svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.7"><circle cx="8" cy="8" r="5.4"/></svg></span>'
  +'<span class="nm">Looked for an open position on this account</span><span class="st">0 found</span></div></div>'
  +'<div class="prose">There is <b>no open position</b> right now, so there is nothing to review. Once you have one, this tab reads it back to you: size, entry, current R, distance to your invalidation and what the chart says about holding or cutting.</div>'
  +'<div class="cp" style="border-color:var(--border-subtle);background:var(--bg-panel)"><div class="cp__hd"><svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.7" style="color:var(--text-tertiary)"><path d="M8 2.2 14.6 13.4H1.4Z"/><path d="M8 6.4v3.2M8 11.4v.1"/></svg><span>Nothing to review yet</span></div>'
  +'<div class="cp__bd">Open a position on the Trade screen — paper or live — then come back. This tab never suggests an entry; it only reviews what you already hold.</div></div>'
  +'</div></div>';
}
function tplScanner(){
  return '<div class="msg msg--ai"><div class="msg__av">CC</div><div class="msg__in">'
  +'<div class="msg__who"><span class="nm">Market scanner</span><span class="ts">14:06</span><span class="tagai">2 of 21 live</span></div>'
  +'<div class="prose">Only pairs you can actually chart are scanned — <b>2 of 21</b> are live on this account right now. Rows show what the same indicator set says, not a recommendation.</div>'
  +'<div class="res"><div class="res__hd"><svg class="ic" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M2.4 13.6V8.4M6.4 13.6V4.2M10.4 13.6V9.8M14.4 13.6V2.6"/></svg><span class="tt">Scanner output</span><span class="sp"></span><span class="fmt">1h · default-21</span></div>'
  +'<div class="res__bd">'
  +'<div class="lv"><span class="k">BTCUSDT</span><span class="v up">trend up · RSI 46.2 · vol 1.42&times;</span></div>'
  +'<div class="lv"><span class="k">ETHUSDT</span><span class="v">range · RSI 51.8 · vol 0.88&times;</span></div>'
  +'<div class="code">scanned 2 of 21 pairs · 19 not chartable on this account yet\nindicator_set=default-21 · timeframe=1h · candles=500</div>'
  +'</div></div>'
  +'<div class="cp"><div class="cp__hd"><svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.7"><circle cx="8" cy="8" r="5.6"/><path d="M8 5.4v3.2l2 1.2"/></svg><span>Scan on a schedule?</span></div>'
  +'<div class="cp__bd">A scheduled scan is a Workflow, not a chat message — this screen only scans when you ask it to.</div>'
  +'<div class="cp__acts"><button class="sbtn sbtn--brand sbtn--sm" type="button">Scan now</button><button class="sbtn sbtn--sm" type="button">Change universe</button></div></div>'
  +'</div></div>';
}

/* ================= tabs ================= */
var THREAD0=null;
function setTab(i){
  var th=$('#aiThread'); if(!THREAD0)THREAD0=$('#aiThread').innerHTML;
  $$('#aiTabs button').forEach(function(b,k){b.setAttribute('aria-pressed',k===i?'true':'false');});
  if(i===0){th.innerHTML=THREAD0;}
  else if(i===1)th.innerHTML=tplStrategies();
  else if(i===2)th.innerHTML=tplPosition();
  else th.innerHTML=tplScanner();
  wireTools(th);
  if(i===0)replayLedger();
}

/* ================= live step ledger (setproduct: live step ledger) ================= */
function replayLedger(){
  var rows=$$('#aiLedger .lrow');
  rows.forEach(function(r){ if(r.id!=='lrowDraw'){ r.classList.remove('is-run'); } });
  var draw=$('#aiLrowDraw');
  if(draw&&!approved){
    draw.querySelector('.g').className='g g--run';
    draw.querySelector('.g').innerHTML='<svg class="spin" width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M8 2.2a5.8 5.8 0 1 0 5.8 5.8" stroke-linecap="round"/></svg>';
  }
  var running=$$('#aiLedger .lrow[data-st="pend"]');
  running.forEach(function(r){ r.classList.add('is-run'); });
}

/* ================= composer ================= */
function autoGrow(ta){ ta.style.height='auto'; ta.style.height=Math.min(88,ta.scrollHeight)+'px'; }
function addMsg(role,html){
  var th=$('#aiThread');
  var el=document.createElement('div'); el.className='msg msg--'+(role==='you'?'you':'ai');
  el.innerHTML='<div class="msg__av">'+(role==='you'?'YOU':'CC')+'</div><div class="msg__in">'+html+'</div>';
  th.appendChild(el); th.scrollTop=th.scrollHeight; return el;
}
function send(){
  var ta=$('#aiCmd'), v=ta.value.trim(); if(!v)return;
  ta.value=''; autoGrow(ta); $('#aiSend').disabled=true;
  var t=new Date(), hh=String(t.getHours()).padStart(2,'0'), mm=String(t.getMinutes()).padStart(2,'0'), ss=String(t.getSeconds()).padStart(2,'0');
  addMsg('you','<div class="msg__who"><span class="nm">You</span><span class="ts">'+hh+':'+mm+':'+ss+'</span></div><div class="you-bub">'+v.replace(/[<>&]/g,function(c){return {'<':'&lt;','>':'&gt;','&':'&amp;'}[c];})+'</div>');
  var el=addMsg('ai','<div class="msg__who"><span class="nm">CCAI</span><span class="ts">'+hh+':'+mm+':'+ss+'</span><span class="tagai">Working</span></div>'
    +'<div class="ledger"><div class="lrow is-run" data-st="pend"><span class="g g--run"><svg class="spin" width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M8 2.2a5.8 5.8 0 1 0 5.8 5.8" stroke-linecap="round"/></svg></span><span class="nm">Reading the pinned context — BTCUSDT · 1h</span><span class="st">running</span></div></div>');
  setTimeout(function(){
    var L=$('#aiThread .msg:last-child .ledger');
    L.innerHTML='<div class="lrow" data-st="done"><span class="g g--done"><svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2"><path d="m3 8.4 3.2 3.4L13 5.2"/></svg></span><span class="nm">Read the pinned context — BTCUSDT · 1h · 500 candles</span><span class="st">done</span></div>'
      +'<div class="lrow" data-st="done"><span class="g g--done"><svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2"><path d="m3 8.4 3.2 3.4L13 5.2"/></svg></span><span class="nm">Computed indicators and re-scanned structure</span><span class="st">done</span></div>'
      +'<div class="lrow" data-st="done"><span class="g g--done"><svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2"><path d="m3 8.4 3.2 3.4L13 5.2"/></svg></span><span class="nm">Wrote the answer</span><span class="st">done</span></div>';
    var last=$('#aiThread .msg:last-child .msg__in');
    last.insertAdjacentHTML('beforeend',
      '<div class="tools"><div class="tc" data-open="false"><div class="tc__hd"><svg class="tc__ic" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M2.6 11.4 6 7.6l2.6 2.4L13.4 4"/><path d="M9.8 4h3.6v3.6"/></svg><span class="tc__nm">compute_indicators</span><span class="tc__ms">118 ms</span><svg class="tc__chev" width="11" height="11" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8"><path d="m4 6.5 4 4 4-4"/></svg></div><div class="tc__bd">rsi14 <b>46.2</b> · ema20 <b>64112.4</b> · ema50 <b>63780.9</b> · atr14 <b>512.7</b></div></div></div>'
      +'<div class="prose">Same picture as the last answer: structure is intact while <b>63,180</b> holds. The entry zone is <b>64,294</b> and the first real resistance is <b>65,980</b> — R/R <b>1.51</b> at a 2% stop.</div>'
      +'<div class="srcs"><div class="src"><span class="n">1</span><span class="t">BTCUSDT 1h candle series — 500 candles</span><span class="d">live</span></div>'
      +'<div class="src"><span class="n">2</span><span class="t">Indicator set recomputed for this question</span><span class="d">now</span></div></div>'
      +'<div class="cp"><div class="cp__hd"><svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M8 2.2 14.6 13.4H1.4Z"/><path d="M8 6.4v3.2M8 11.4v.1"/></svg><span>Redraw the levels at 64,294?</span></div>'
      +'<div class="cp__bd">The chart still carries the previous 3 layers. Approving replaces the Entry layer and leaves the rest alone.</div>'
      +'<div class="cp__acts"><button class="sbtn sbtn--brand sbtn--sm js-approve" type="button">Approve &amp; update</button><button class="sbtn sbtn--sm" type="button">Keep as is</button>'
      +'<span class="capnote"><svg width="11" height="11" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="8" cy="8" r="5.6"/><path d="M8 5v3.4l2.2 1.4"/></svg>300 credits charged · <b>150</b> if nothing is drawn</span></div></div>'
      +'<div class="acts"><button class="act js-copy" type="button" aria-label="Copy"><svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="5.4" y="5.4" width="8.2" height="8.2" rx="1.4"/><path d="M10.6 5.4V3.8a1.4 1.4 0 0 0-1.4-1.4H3.8a1.4 1.4 0 0 0-1.4 1.4v5.4a1.4 1.4 0 0 0 1.4 1.4h1.6"/></svg></button>'
      +'<button class="act js-up" type="button" aria-pressed="false" aria-label="Helpful"><svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M5.2 7.4 8 2.6l.6.3c.7.4 1 1.3.8 2.1L9 7h3.4a1.4 1.4 0 0 1 1.4 1.7l-.9 4A1.4 1.4 0 0 1 11.5 14H5.2M5.2 7.4H2.4v6.6h2.8V7.4Z"/></svg></button>'
      +'<button class="act js-down" type="button" aria-pressed="false" aria-label="Not helpful"><svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M10.8 8.6 8 13.4l-.6-.3c-.7-.4-1-1.3-.8-2.1L7 9H3.6a1.4 1.4 0 0 1-1.4-1.7l.9-4A1.4 1.4 0 0 1 4.5 2h6.3M10.8 8.6h2.8V2h-2.8v6.6Z"/></svg></button></div>'
      +'<div class="fbk"><span class="lbl">What was off?</span><button type="button" aria-pressed="false">Wrong level</button><button type="button" aria-pressed="false">Too verbose</button><button type="button" aria-pressed="false">Missed context</button><button type="button" aria-pressed="false">Too cautious</button><span style="flex:1 1 auto"></span><button type="button" class="js-fbsend">Send feedback</button></div>');
    var w=$('#aiThread .msg:last-child .msg__who .tagai'); if(w)w.textContent='Analysis';
    wireTools(document);
    $('#aiThread').scrollTop=$('#aiThread').scrollHeight;
  },1100);
}

/* ================= boot ================= */
$$('#aiTabs button').forEach(function(b,i){b.addEventListener('click',function(){setTab(i);});});
$$('#aiQs button').forEach(function(b){b.addEventListener('click',function(){
  var ta=$('#aiCmd'); ta.value=b.textContent.trim(); autoGrow(ta); ta.focus(); $('#aiSend').disabled=false;});});
$('#aiCmd').addEventListener('input',function(){autoGrow(this);$('#aiSend').disabled=!this.value.trim();});
$('#aiCmd').addEventListener('keydown',function(e){
  if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();send();}});
$('#aiSend').addEventListener('click',send);
$('#aiNewChat').addEventListener('click',function(){
  $$('.sitem').forEach(function(s){s.setAttribute('aria-selected','false');});
  $('#aiThread').innerHTML='<div class="msg msg--ai"><div class="msg__av">CC</div><div class="msg__in">'
   +'<div class="msg__who"><span class="nm">CCAI</span><span class="ts">new</span></div>'
   +'<div class="prose">New analysis. The chart context is pinned on the right — <b>BTCUSDT · 1h · 500 candles</b>. Ask for a read, a setup draft, a trendline, or a support/resistance scan.</div></div></div>';
  wireTools(document);
});
$$('.sitem').forEach(function(s){s.addEventListener('click',function(){
  $$('.sitem').forEach(function(x){x.setAttribute('aria-selected','false');});
  s.setAttribute('aria-selected','true');
  var tt=s.querySelector('.tt'); $('.thr__hd .ttl').textContent=tt?tt.textContent:'Conversation';
  setTab(0);
});});
$$('#aiVhead .vpill').forEach(function(b){b.addEventListener('click',function(){setVersion(b.textContent);});});
wireTools(document);
replayLedger();
window.addEventListener('resize',function(){});
