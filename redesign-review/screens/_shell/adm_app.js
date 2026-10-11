/* ===================== routes ===================== */
var R=[
 {n:'Admin Home',p:'/admin',t:'Admin Dashboard',badge:'ADMIN',sub:'Live platform status · anomalies · risk · AI · system'},
 {n:'Fees & Rebates',p:'/fees',t:'Fees & Rebates',sub:'Fee schedule · broker rebate · payback programme'},
 {n:'Users',p:'/admin/users',t:'User Management',badge:'OPS',sub:'customers · plan · payments · exchange · KuCoin campaign · status'},
 {n:'Trade Monitor',p:'/admin/trades',t:'Trade Monitor',badge:'ADMIN',sub:'Live fills · flagged activity · auto-review'},
 {n:'Risk',p:'/admin/risk',t:'Risk',badge:'OPS',sub:'Margin queue · liquidation watch · exposure'},
 {n:'Deposits',p:'/admin/deposits',t:'Deposits',sub:'Inbound transfers · confirmations · credits'},
 {n:'Withdrawals',p:'/admin/withdrawals',t:'Withdrawals',sub:'Review queue · limits · two-operator approval'},
 {n:'Assets',p:'/admin/assets',t:'Assets',sub:'Venue balances · hot / warm / cold · reconciliation'},
 {n:'AI Ops',p:'/admin/ai-ops',t:'AI Ops',sub:'Model health · credit consumption · refusal rate'},
 {n:'Notices & CS',p:'/admin/notices',t:'Notices & CS',sub:'Platform notices · support queue'},
 {n:'Broadcast',p:'/admin/broadcast',t:'Broadcast',sub:'In-app and email announcements'},
 {n:'Referral',p:'/admin/referral',t:'Referral',sub:'Codes · attribution · rebate payouts'},
 {n:'Points',p:'/admin/points',t:'Points',sub:'Ledger · accrual rules · redemptions'},
 {n:'Legal',p:'/admin/legal',t:'Legal',sub:'Policy versions · acceptance records'},
 {n:'Auto trading',p:'/admin/autotrade',t:'Auto trading',sub:'Strategy runs · paper phase · safety rails'},
 {n:'Activity',p:'/admin/activity',t:'Activity',sub:'Operator sessions · sensitive reads'},
 {n:'System',p:'/admin/system',t:'System',sub:'Service health · latency · uptime'},
 {n:'Audit',p:'/admin/audit',t:'Audit log',sub:'Every write · actor · target · before / after'},
 {n:'Design ops',p:'/admin/design-ops',t:'Design ops',sub:'Token coverage · contrast budget · component inventory'},
 {n:'Leaderboard',p:'/leaderboard',t:'Leaderboard',badge:'ADMIN',sub:'Ranking rules · eligibility · payout windows'}
];
/* ===================== helpers ===================== */
var LIVE='<span class="pillst pillst--live">live</span>';
var PART='<span class="pillst pillst--part">partial</span>';
var MOCK='<span class="pillst pillst--mock">mock</span>';
function kpi(k,v,s,a,isdash){
 var acc=a?' data-a="'+a+'"':'';
 var cls=isdash?'kpi__v dash':'kpi__v';
 return '<div class="kpi"'+acc+'><div class="kpi__k">'+k+'</div><div class="'+cls+'">'+v+'</div><div class="kpi__s">'+s+'</div></div>';
}
function kpis(a){return '<div class="kpis">'+a.join('')+'</div>';}
function card(hd,n,body,extra){
 var head='<div class="card__hd"><h2>'+hd+'</h2><span class="sp"></span>';
 if(n){head=head+'<span class="n">'+n+'</span>';}
 head=head+(extra||'')+'</div>';
 return '<section class="card">'+head+body+'</section>';
}
function table(cols,rows,empty){
 var th='<tr>';
 var i;
 for(i=0;i<cols.length;i++){th=th+'<th class="'+(cols[i].l?'l':'')+'">'+cols[i].t+'</th>';}
 th=th+'</tr>';
 var head='<div class="tblwrap"><table class="tbl"><thead>'+th+'</thead>';
 if(!rows||!rows.length){return head+'</table></div><div class="empty">'+empty+'</div>';}
 var tb='';
 var r,x,j;
 for(i=0;i<rows.length;i++){
  r=rows[i];
  tb=tb+'<tr'+(r.hi?' data-hi="true"':'')+'>';
  for(j=0;j<r.c.length;j++){tb=tb+'<td class="'+(cols[j].l?'l':'')+'">'+r.c[j]+'</td>';}
  tb=tb+'</tr>';
 }
 return head+'<tbody>'+tb+'</tbody></table></div>';
}
function gate(msg,code){
 var svg='<svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M8 2.2 14.6 13.4H1.4Z"/><path d="M8 6.4v3.2M8 11.4v.1"/></svg>';
 var c=code?'<span class="code">'+code+'</span>':'';
 return '<div class="gate">'+svg+'<div class="in"><p>'+msg+c+'</p></div><button class="sbtn sbtn--sm js-retry" type="button">Retry</button></div>';
}
function st(kind,label){return '<span class="st st--'+kind+'"><span class="d"></span>'+label+'</span>';}
function toolbar(){
 var svg='<svg width="11" height="11" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.7"><circle cx="7" cy="7" r="4.6"/><path d="m10.6 10.6 3 3"/></svg>';
 var s='<div style="padding:9px 11px;border-bottom:1px solid var(--border-subtle)" class="toolbar">';
 s=s+'<div class="search">'+svg+'<input placeholder="Search name · email · ID" aria-label="Search"></div>';
 s=s+'<select class="sel"><option>All statuses</option><option>Active</option><option>Pending</option><option>Suspended</option></select>';
 s=s+'<select class="sel"><option>All exchanges</option><option>KuCoin</option><option>Bybit</option><option>None</option></select>';
 s=s+'<select class="sel"><option>Newest</option><option>Oldest</option><option>Volume 30d</option></select>';
 return s+'</div>';
}
function tabs(list){
 var s='<div style="padding:0 11px 9px" class="toolbar"><div class="ftabs">';
 var i;
 for(i=0;i<list.length;i++){
  s=s+'<button type="button" aria-pressed="'+(i===0)+'">'+list[i][0]+' <span class="n">'+list[i][1]+'</span></button>';
 }
 return s+'</div></div>';
}
function rule(k,v){return '<div class="frule"><span class="k">'+k+'</span><span>'+v+'</span><span class="sp"></span><button class="js-rmf" type="button">Remove</button></div>';}
/* ===================== system rows ===================== */
var SYS=[
 ['WebSocket Gateway','ok','OK','12ms','99.984%',''],
 ['Matching Engine','ok','OK','4ms','99.999%',''],
 ['Risk Engine','ok','OK','8ms','99.980%',''],
 ['AI Analyst Model','deg','DEGRADED','1240ms','99.640%','<span class="foot-note">response latency observed</span>'],
 ['DB · Hot Shard','ok','OK','2ms','99.998%',''],
 ['DB · Analytics','ok','OK','6ms','99.960%',''],
 ['Static CDN','ok','OK','24ms','99.999%',''],
 ['Nightly Batch','ok','OK','<span class="mono">—</span>','99.900%','<span class="foot-note">next run 03:00 UTC</span>'],
 ['KYC Provider','ok','OK','840ms','99.920%','']
];
function bodySystem(){
 var cols=[{t:'Service',l:1},{t:'Status',l:1},{t:'Latency'},{t:'Uptime'},{t:'Note',l:1}];
 var rows=[];var i;
 for(i=0;i<SYS.length;i++){
  var r=SYS[i];
  rows.push({c:[r[0],st(r[1],r[2]),'<span class="mono">'+r[3]+'</span>','<span class="mono">'+r[4]+'</span>',r[5]],hi:r[1]==='deg'});
 }
 var t=table(cols,rows,'No data');
 return card('Real-time service status','9 services · click for detail',t,LIVE);
}
/* ===================== builders ===================== */
function bodyHome(){
 var k=kpis([
  kpi('Total users','0','0 active · 0 pending · 0 suspended','brand'),
  kpi('24h volume','<span class="mono">$0.00</span>','<span class="u">▲ 8.40%</span> vs yesterday'),
  kpi('Flagged trades','0','0 tracked · Auto-review active','warn'),
  kpi('Critical risk','0','0 positions in queue')
 ]);
 var g=gate('Overview figures could not be read, so none are shown. Revenue and signal counts are never estimated here.','overview read failed');
 var lt=table([{t:'Time',l:1},{t:'User',l:1},{t:'Symbol',l:1},{t:'Side',l:1},{t:'Size'},{t:'Price'},{t:'Notional'},{t:'Flag',l:1}],[],
  'No data');
 var c1=card('Live trades','0 events in last minute · click row to inspect',lt,LIVE);
 var c2=card('Risk queue','0 positions require attention',
  '<div class="card__bd"><div class="empty">Nothing is queued. A position enters this queue only when the risk engine reads a margin ratio above the threshold — it is never pre-filled to look busy.</div></div>','');
 var grid='<div class="grid2">'+c1+c2+'</div>';
 return k+g+grid+bodySystem();
}
function bodyFees(){
 var k=kpis([
  kpi('Maker fee','0.020%','Base tier','brand'),
  kpi('Taker fee','0.060%','Base tier'),
  kpi('Broker rebate','—','Payback programme has not started',null,true),
  kpi('Rebate paid 30d','<span class="mono">$0.00</span>','0 payouts','warn')
 ]);
 var rows=[
  {c:['Base','<span class="mono">&lt; 50k</span>','<span class="mono">0.020%</span>','<span class="mono">0.060%</span>','<span class="mono">—</span>',st('ok','active')]},
  {c:['Silver','<span class="mono">50k – 250k</span>','<span class="mono">0.018%</span>','<span class="mono">0.055%</span>','<span class="mono">—</span>',st('off','not enabled')]},
  {c:['Gold','<span class="mono">250k – 1M</span>','<span class="mono">0.015%</span>','<span class="mono">0.050%</span>','<span class="mono">—</span>',st('off','not enabled')]},
  {c:['Platinum','<span class="mono">&gt; 1M</span>','<span class="mono">0.012%</span>','<span class="mono">0.045%</span>','<span class="mono">—</span>',st('off','not enabled')]}
 ];
 var t=table([{t:'Tier',l:1},{t:'30d volume',l:1},{t:'Maker'},{t:'Taker'},{t:'Rebate share'},{t:'Status',l:1}],rows,'No data');
 var c=card('Fee schedule','4 tiers',t,LIVE);
 var g=gate('The rebate column reads <b>—</b> on every tier because the payback programme has not started. The schedule itself is live and enforced on order entry.','');
 return k+c+g;
}
function bodyUsers(){
 var g=gate('Your account does not have permission to read this. Nothing is shown rather than a stand-in.','admin access denied');
 var k=kpis([
  kpi('Customers','0','0 active · 0 pending · 0 suspended','brand'),
  kpi('Paid subscribers','—','Needs a payments provider','long',true),
  kpi('Exchange connected','—','No key connected yet',null,true),
  kpi('KuCoin campaign participants','—','Campaign has not started','warn',true)
 ]);
 var cols=[{t:'ID',l:1},{t:'Customer',l:1},{t:'Plan',l:1},{t:'Points'},{t:'Payments'},{t:'Exchange',l:1},
  {t:'KuCoin campaign',l:1},{t:'Volume 30d'},{t:'Last activity'},{t:'Flags',l:1},{t:'Status',l:1}];
 var t=table(cols,[],'No data — the read was refused, so the table stays empty. It is not filled with placeholder customers.');
 var tb=toolbar()+tabs([['All',0],['Active',0],['Pending',0],['Suspended',0]])+t;
 var c=card('Users','All 0',tb,'<button class="sbtn sbtn--sm" type="button" disabled>+ Invite user · soon</button>');
 return g+k+c;
}
function bodyTrades(){
 var g=gate('Trade monitor reads the venue-side fill stream. No venue is connected, so there is nothing to stream and no sample feed is substituted.','no venue connected');
 var k=kpis([
  kpi('Events last minute','0','Live trades · 0 tracked','brand'),
  kpi('Flagged trades','0','Auto-review active','warn'),
  kpi('Auto-review actions','0','0 cleared · 0 escalated','long'),
  kpi('Notional 24h','<span class="mono">$0.00</span>','Across 0 fills')
 ]);
 var cols=[{t:'Time',l:1},{t:'User',l:1},{t:'Symbol',l:1},{t:'Side',l:1},{t:'Size'},{t:'Price'},{t:'Notional'},{t:'Flag',l:1}];
 var c=card('Live trades','0 events in last minute',table(cols,[],'No data — click a row to inspect once fills arrive.'),LIVE);
 return g+k+c;
}
function bodyRisk(){
 var k=kpis([
  kpi('Critical risk','0','0 positions in queue','warn'),
  kpi('Positions monitored','0','Across 2 chartable pairs'),
  kpi('Auto-liquidations 24h','0','Risk engine active','long'),
  kpi('Margin calls sent','—','Needs a live margin feed',null,true)
 ]);
 var c1=card('Risk queue','0 positions require attention',
  '<div class="card__bd">'+rule('queue','positions with margin ratio ≥ 80%')
  +'<div class="empty">Nothing is queued. A position enters this queue only when the risk engine reads a margin ratio above the threshold — it is never pre-filled to look busy.</div></div>',LIVE);
 var rows=[
  {c:['KuCoin','<span class="mono">0.00</span>','<span class="mono">0.00</span>','<span class="mono">—</span>',st('off','no keys')]},
  {c:['Bybit','<span class="mono">0.00</span>','<span class="mono">0.00</span>','<span class="mono">—</span>',st('off','no keys')]}
 ];
 var t=table([{t:'Venue',l:1},{t:'Open notional'},{t:'Margin used'},{t:'Margin ratio'},{t:'Status',l:1}],rows,'No data');
 var c2=card('Exposure by venue','2 venues',t,PART);
 return k+c1+c2;
}
function bodyMoney(kind){
 var cfg={
  deposits:{t:'Deposits',k:[
    kpi('Deposits 24h','0','0 credited','brand'),
    kpi('Awaiting confirmations','0','Nothing pending'),
    kpi('Value credited 24h','<span class="mono">$0.00</span>','Across 0 deposits'),
    kpi('Rejected / returned','0','0 this week','warn')],
   g:'Deposit reads come from the venue ledger. With no key connected the ledger is empty — we do not show seeded deposits in a money screen.',
   cols:['Time','User','Venue','Asset','Amount','Confirmations','Tx']},
  withdrawals:{t:'Withdrawals',k:[
    kpi('Withdrawals 24h','0','0 paid','brand'),
    kpi('Awaiting approval','0','0 of 2 operators signed'),
    kpi('Value paid 24h','<span class="mono">$0.00</span>','Across 0 withdrawals'),
    kpi('Blocked by limits','0','0 this week','warn')],
   g:'Withdrawal payout needs two operators. This role holds one signature, so the queue can be read but never self-approved.',
   cols:['Time','User','Venue','Asset','Amount','Address','Approvals','Status']},
  assets:{t:'Assets',k:[
    kpi('Hot wallet','<span class="mono">—</span>','No venue keys','brand',true),
    kpi('Warm wallet','<span class="mono">—</span>','No venue keys',null,true),
    kpi('Cold wallet','<span class="mono">—</span>','Held offline, not readable from here',null,true),
    kpi('Reconcile drift','0','0 assets out of balance','long')],
   g:'Wallet balances are read from the venue. Cold storage is deliberately not readable from the app, so its row stays a dash on purpose.',
   cols:['Venue','Wallet','Asset','Balance','Reserved','Available','Last reconcile']}
 };
 var c=cfg[kind];
 var cols=[];var i;
 for(i=0;i<c.cols.length;i++){cols.push({t:c.cols[i],l:i===0||i===1});}
 var t=table(cols,[],'No data — this screen reads the venue ledger directly. With no key connected there is nothing to show and nothing is invented to fill the space.');
 var card1=card(c.t,'0 rows',t,LIVE);
 return gate(c.g,'')+kpis(c.k)+card1;
}
function bodyAi(){
 var k=kpis([
  kpi('Model status','<span style="font-size:15px">DEGRADED</span>','Latency 1240ms · threshold 900ms','warn'),
  kpi('Questions 24h','0','0 answered'),
  kpi('Credits consumed','0','300 per question · 150 if nothing drawn','brand'),
  kpi('Refusal rate','—','Needs answered questions',null,true)
 ]);
 var rows=[
  {c:['AI Analyst','chart analysis + levels','<span class="mono">1240ms</span>',st('deg','degraded'),'<span class="foot-note">response latency observed</span>'],hi:true},
  {c:['Embedding','context retrieval','<span class="mono">38ms</span>',st('ok','ok'),'']},
  {c:['Classifier','flag triage','<span class="mono">21ms</span>',st('ok','ok'),'']}
 ];
 var t1=table([{t:'Model',l:1},{t:'Role',l:1},{t:'Latency'},{t:'Status',l:1},{t:'Note',l:1}],rows,'No data');
 var c1=card('Model health','1 degraded',t1,PART);
 var c2=card('Credit ledger','0 rows','<div class="card__bd"><div class="empty">No questions have been asked, so there is no ledger to show. Credits are charged per question and halved when nothing is drawn — the rule is enforced server-side, not by this screen.</div></div>','');
 return k+c1+c2;
}
function bodyNotices(){
 var k=kpis([
  kpi('Open tickets','0','0 unassigned','brand'),
  kpi('First reply median','—','No tickets yet',null,true),
  kpi('Published notices','3','Legal set published','long'),
  kpi('Scheduled','0','Nothing queued')
 ]);
 var t1=table([{t:'Opened',l:1},{t:'User',l:1},{t:'Subject',l:1},{t:'Age'},{t:'Assignee',l:1},{t:'Status',l:1}],[],
  'No data — tickets appear here as they are opened.');
 var c1=card('Support queue','0 open',t1,LIVE);
 var rows=[
  {c:['Terms of Service','legal','<span class="mono">v1</span>','all users',st('ok','published')]},
  {c:['Privacy Policy','legal','<span class="mono">v1</span>','all users',st('ok','published')]},
  {c:['Risk Disclosure','legal','<span class="mono">v1</span>','all users',st('ok','published')]}
 ];
 var t2=table([{t:'Notice',l:1},{t:'Kind',l:1},{t:'Published'},{t:'Audience',l:1},{t:'Status',l:1}],rows,'No data');
 var c2=card('Platform notices','3 published',t2,'');
 return k+c1+c2;
}
function bodyBroadcast(){
 var k=kpis([
  kpi('Sent 30d','0','0 announcements','brand'),
  kpi('Delivered','—','Needs a verified email domain',null,true),
  kpi('In-app reach','0','0 sessions'),
  kpi('Drafts','0','Nothing staged')
 ]);
 var ta='<textarea style="width:100%;min-height:74px;padding:9px;border:1px solid var(--border-subtle);border-radius:var(--r-md);font-family:inherit;font-size:12px;background:var(--bg-input);outline:0" placeholder="Announcement body…"></textarea>';
 var body='<div class="card__bd">'
  +'<div class="frule"><span class="k">audience</span><span>all users</span><span class="sp"></span><button class="js-rmf" type="button">Change</button></div>'
  +ta
  +'<div style="display:flex;gap:7px"><button class="sbtn sbtn--brand js-act" type="button">Send in-app</button><button class="sbtn js-act" type="button">Save draft</button></div>'
  +'<p class="foot-note" style="margin:0">Email delivery is disabled until the sending domain is verified, so the email option is not offered. In-app delivery works now.</p></div>';
 var c1=card('Compose','in-app only',body,'');
 var t=table([{t:'Sent',l:1},{t:'Subject',l:1},{t:'Channel',l:1},{t:'Audience',l:1},{t:'Read rate'}],[],
  'No data');
 var c2=card('History','0 sent',t,'');
 return k+c1+c2;
}
function bodyReferral(){
 var k=kpis([
  kpi('Codes issued','2','1 per partner venue','brand'),
  kpi('Attributed signups','0','0 converted'),
  kpi('Rebate accrued','<span class="mono">$0.00</span>','Payback not started','warn'),
  kpi('Paid out','<span class="mono">$0.00</span>','0 payouts')
 ]);
 var rows=[
  {c:['<span class="mono">CXEEBJ8L</span>','KuCoin','platform','<span class="mono">0</span>','<span class="mono">0.00</span>','<span class="mono">0.00</span>',st('ok','active')]},
  {c:['<span class="mono">Be001195</span>','Bybit','platform','<span class="mono">0</span>','<span class="mono">0.00</span>','<span class="mono">0.00</span>',st('ok','active')]}
 ];
 var t=table([{t:'Code',l:1},{t:'Venue',l:1},{t:'Owner',l:1},{t:'Signups'},{t:'Accrued'},{t:'Paid'},{t:'Status',l:1}],rows,'No data');
 var c=card('Referral codes','2 active',t,LIVE);
 var g=gate('<b>Be001195</b> is a Bybit API broker id, not a public campaign code. It is listed here for operations only and is shown to users on the Wallet card with that caveat attached.','');
 return k+c+g;
}
function bodyPoints(){
 var k=kpis([
  kpi('Points outstanding','0','Across 0 accounts','brand'),
  kpi('Accrued 30d','0','0 events'),
  kpi('Redeemed 30d','0','0 redemptions'),
  kpi('Accrual rule','—','No accrual code is deployed',null,true)
 ]);
 var t=table([{t:'Time',l:1},{t:'User',l:1},{t:'Event',l:1},{t:'Points'},{t:'Balance after'},{t:'Rule',l:1}],[],
  'No data — the points ledger is empty and there is no accrual rule in the deployed build. We show the empty ledger rather than a rule that does not exist yet.');
 var c=card('Points ledger','0 rows',t,MOCK);
 return k+c;
}
function bodyLegal(){
 var k=kpis([
  kpi('Published documents','5','Terms · Privacy · Risk · Refund · Legal','brand'),
  kpi('Acceptance records','0','0 users have accepted'),
  kpi('Placeholders open','7','Business info 5 · transfer 2','warn'),
  kpi('Next review','—','No date set',null,true)
 ]);
 var rows=[
  {c:['Terms of Service','<span class="mono">v1</span>','<span class="mono">—</span>','<span class="mono">0</span>','<span class="mono">5</span>',st('deg','placeholders')],hi:true},
  {c:['Privacy Policy','<span class="mono">v1</span>','<span class="mono">—</span>','<span class="mono">0</span>','<span class="mono">2</span>',st('deg','placeholders')],hi:true},
  {c:['Risk Disclosure','<span class="mono">v1</span>','<span class="mono">—</span>','<span class="mono">0</span>','<span class="mono">0</span>',st('ok','complete')]},
  {c:['Refund Policy','<span class="mono">v1</span>','<span class="mono">—</span>','<span class="mono">0</span>','<span class="mono">0</span>',st('ok','complete')]},
  {c:['Legal notice','<span class="mono">v1</span>','<span class="mono">—</span>','<span class="mono">0</span>','<span class="mono">0</span>',st('ok','complete')]}
 ];
 var t=table([{t:'Document',l:1},{t:'Version',l:1},{t:'Effective'},{t:'Accepted'},{t:'Open placeholders',l:1},{t:'Status',l:1}],rows,'No data');
 var c=card('Policy versions','5 documents',t,'');
 var g=gate('Seven placeholders remain before these documents can be published as final: <b>5</b> business identity fields in Terms §16 and <b>2</b> cross-border transfer details in Privacy §5. They are flagged here so they cannot ship by accident.','');
 return k+c+g;
}
function bodyAutotrade(){
 var k=kpis([
  kpi('Running strategies','0','Paper phase 1','brand'),
  kpi('Paper fills 24h','0','0 fills'),
  kpi('Rails tripped 24h','0','0 paused','long'),
  kpi('Live strategies','0','Live trading is off','warn')
 ]);
 var t=table([{t:'Strategy',l:1},{t:'Symbol',l:1},{t:'TF',l:1},{t:'Bot',l:1},{t:'Buying',l:1},{t:'Selling',l:1},{t:'Net'},{t:'Status',l:1}],[],
  'No data — a run appears here once an operator starts a strategy. Nothing is auto-started.');
 var c1=card('Strategy runs','0 running',t,MOCK);
 var body='<div class="card__bd" style="gap:7px">'
  +rule('positions per strategy','3 max')
  +rule('orders per day','50 max')
  +rule('daily loss stop','pauses the strategy')
  +rule('order routing','paper only')
  +'<p class="foot-note" style="margin:0">A strategy that trips a rail is paused and logged. It is never silently skipped, and rails cannot be raised from this console.</p></div>';
 var c2=card('Safety rails','enforced server-side',body,'');
 return k+c1+c2;
}
function bodyActivity(){
 var k=kpis([
  kpi('Operator sessions','1','This session only','brand'),
  kpi('Writes 24h','0','0 audited actions'),
  kpi('Sensitive reads','0','Reads are not logged by default','warn'),
  kpi('Blocked actions','0','0 permission refusals')
 ]);
 var rows=[
  {c:['<span class="mono">design_1791706987515@example.com</span>','super','<span class="mono">just now</span>','<span class="mono">now</span>','<span class="mono">0</span>',st('ok','active')]}
 ];
 var t1=table([{t:'Operator',l:1},{t:'Role',l:1},{t:'Started'},{t:'Last seen'},{t:'Writes'},{t:'Status',l:1}],rows,'No data');
 var c1=card('Operator sessions','1 active',t1,'');
 var c2=card('Sensitive reads','not logged','<div class="card__bd"><div class="empty">Reads are not written to the activity log — only writes are. Turning read logging on would need a retention policy first, so it is off and stated here rather than silently absent.</div></div>','');
 return k+c1+c2;
}
function bodyAudit(){
 var k=kpis([
  kpi('Entries 24h','0','0 writes'),
  kpi('Actors','0','No writes yet'),
  kpi('Reversals','0','0 undone actions','long'),
  kpi('Retention','—','No policy configured',null,true)
 ]);
 var t=table([{t:'Time',l:1},{t:'Actor',l:1},{t:'Action',l:1},{t:'Target',l:1},{t:'Before',l:1},{t:'After',l:1},{t:'Result',l:1}],[],
  'No data — every write on this console lands here with actor, target and the before/after values. Nothing has been written yet.');
 var c=card('Audit log','0 entries',t,LIVE);
 return k+c;
}
function bodyDesignOps(){
 var k=kpis([
  kpi('Tokens defined','323','16 selector blocks','brand'),
  kpi('Components inventoried','0','Not yet catalogued',null,true),
  kpi('Contrast failures','0','All audited pairs ≥ 5.3:1','long'),
  kpi('Drift since last sync','—','No baseline stored',null,true)
 ]);
 var rows1=[
  {c:['text-secondary on bg-panel','<span class="mono">9.93</span>','4.5','body copy',st('ok','pass')]},
  {c:['text-tertiary on bg-panel','<span class="mono">6.31</span>','4.5','labels, meta',st('ok','pass')]},
  {c:['brand on bg-surface','<span class="mono">6.41</span>','4.5','links, active',st('ok','pass')]},
  {c:['long / short on bg-panel','<span class="mono">5.88</span>','3.0','table cells',st('ok','pass')]},
  {c:['table header on bg-sunken','<span class="mono">5.88</span>','4.5','9.5px caps',st('ok','pass')]}
 ];
 var t1=table([{t:'Pair',l:1},{t:'Ratio'},{t:'Target'},{t:'Where',l:1},{t:'Status',l:1}],rows1,'No data');
 var c1=card('Contrast budget','audited pairs',t1,'');
 var rows2=[
  {c:['surface','<span class="mono">6</span>','all screens','<span class="mono">0</span>',st('ok','clean')]},
  {c:['text','<span class="mono">4</span>','all screens','<span class="mono">0</span>',st('ok','clean')]},
  {c:['border','<span class="mono">3</span>','all screens','<span class="mono">0</span>',st('ok','clean')]},
  {c:['brand scale','<span class="mono">10</span>','CTAs, links','<span class="mono">0</span>',st('ok','clean')]},
  {c:['chart palette','<span class="mono">21</span>','charts only','<span class="mono">0</span>',st('ok','clean')]},
  {c:['neutrals','<span class="mono">14</span>','all screens','<span class="mono">0</span>',st('ok','clean')]}
 ];
 var t2=table([{t:'Group',l:1},{t:'Tokens'},{t:'Used in',l:1},{t:'Orphans'},{t:'Status',l:1}],rows2,'No data');
 var c2=card('Token coverage','323 tokens',t2,'');
 return k+c1+c2;
}
function bodyLeaderboard(){
 var k=kpis([
  kpi('Ranked traders','0','0 eligible'),
  kpi('Ranking metric','—','No rule configured',null,true),
  kpi('Payout window','—','Not scheduled',null,true),
  kpi('Disqualified','0','0 flagged','warn')
 ]);
 var t=table([{t:'Rank'},{t:'Trader',l:1},{t:'Metric'},{t:'Volume 30d'},{t:'Eligibility',l:1},{t:'Status',l:1}],[],
  'No data — ranking needs a configured metric and at least one eligible account. Neither exists yet, so the table is empty rather than seeded with names.');
 var c=card('Ranking','0 rows',t,PART);
 var g=gate('This route is not in the public menu — it is reachable by URL for admins only. Publishing a ranking without a fixed metric and payout rule would invite disputes, so both are gated here first.','');
 return k+c+g;
}
/* ===================== render ===================== */
var BUILDERS=[bodyHome,bodyFees,bodyUsers,bodyTrades,bodyRisk,
 function(){return bodyMoney('deposits');},
 function(){return bodyMoney('withdrawals');},
 function(){return bodyMoney('assets');},
 bodyAi,bodyNotices,bodyBroadcast,bodyReferral,bodyPoints,bodyLegal,bodyAutotrade,
 bodyActivity,bodySystem,bodyAudit,bodyDesignOps,bodyLeaderboard];
var AUDIT=[];
var CUR=0;
function audit(action,target){
 AUDIT.unshift({t:new Date().toTimeString().slice(0,8),a:action,g:target});
 renderAudit();
}
function renderAudit(){
 var h=document.getElementById('admAudit');
 if(!h)return;
 if(!AUDIT.length){h.innerHTML='<p class="foot-note" style="margin:0">No writes this session.</p>';return;}
 var out='';var i;
 for(i=0;i<Math.min(7,AUDIT.length);i++){
  out=out+'<div class="auditline"><span class="t">'+AUDIT[i].t+'</span><span class="m"><b>'+AUDIT[i].a+'</b> → '+AUDIT[i].g+'</span></div>';
 }
 h.innerHTML=out;
}
function render(i){
 CUR=i;
 var items=document.querySelectorAll('.aitem');var k;
 for(k=0;k<items.length;k++){
  items[k].setAttribute('aria-selected',(+items[k].dataset.r===i)?'true':'false');
 }
 var r=R[i];
 var svg='<svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="8" cy="8" r="5.6"/><path d="M8 7.4v3.2M8 5.6v.1"/></svg>';
 var hd='<div class="hd"><div style="min-width:0">'
  +'<nav class="crumb"><a href="#/trade">Home</a><span class="sep">/</span><span>Admin</span><span class="sep">/</span><span>'+r.n+'</span></nav>'
  +'<h1>'+r.t+(r.badge?' <span class="tagadm">'+r.badge+'</span>':'')+'</h1>'
  +'<p class="sub">'+r.sub+'</p></div><span class="sp"></span>'
  +'<div class="hdacts"><span class="cmdk" id="admCmdk">'+svg+'Search or jump… <kbd>Ctrl</kbd><kbd>K</kbd></span>'
  +'<span class="foot-note" style="white-space:nowrap">Last refresh · just now</span>'
  +'<button class="sbtn js-refresh" type="button">Refresh</button></div></div>'
  +'<p class="foot-note" style="margin:-4px 0 0"><span class="mono">'+r.p+'</span></p>';
 document.getElementById('admCol').innerHTML=hd+BUILDERS[i]();
 wire();
}
function wire(){
 var acts=document.querySelectorAll('.js-act');var i;
 for(i=0;i<acts.length;i++){
  (function(b){
   b.addEventListener('click',function(){
    var t=b.textContent.trim();
    b.textContent='Done';b.style.color='var(--brand)';b.style.borderColor='var(--brand)';
    audit(t,R[CUR].t);
    setTimeout(function(){b.textContent=t;b.style.color='';b.style.borderColor='';},1400);
   });
  })(acts[i]);
 }
 var rms=document.querySelectorAll('.js-rmf');
 for(i=0;i<rms.length;i++){
  (function(b){
   b.addEventListener('click',function(){
    var row=b.closest('.frule');
    if(row){row.style.opacity='.42';}
    audit('filter removed',R[CUR].t);
   });
  })(rms[i]);
 }
 var rts=document.querySelectorAll('.js-retry');
 for(i=0;i<rts.length;i++){
  (function(b){
   b.addEventListener('click',function(){
    b.textContent='Refused again';b.style.color='oklch(44% .115 75)';
    setTimeout(function(){b.textContent='Retry';b.style.color='';},1500);
   });
  })(rts[i]);
 }
 var rfs=document.querySelectorAll('.js-refresh');
 for(i=0;i<rfs.length;i++){
  (function(b){
   b.addEventListener('click',function(){
    b.textContent='Refreshed';
    setTimeout(function(){b.textContent='Refresh';},1200);
   });
  })(rfs[i]);
 }
 var ck=document.getElementById('admCmdk');
 if(ck){ck.addEventListener('click',openCmdk);}
 var ft=document.querySelectorAll('.ftabs button');
 for(i=0;i<ft.length;i++){
  (function(b){
   b.addEventListener('click',function(){
    var sib=b.closest('.ftabs').querySelectorAll('button');var j;
    for(j=0;j<sib.length;j++){sib[j].setAttribute('aria-pressed','false');}
    b.setAttribute('aria-pressed','true');
   });
  })(ft[i]);
 }
}
/* ===================== command menu ===================== */
var cmdkSel=0;
function cmdkItems(q){
 var out=[];var i;
 for(i=0;i<R.length;i++){out.push({i:i,t:R[i].t,r:'route',s:R[i].p});}
 out.push({t:'Refresh current view',r:'action',s:'no write'});
 out.push({t:'Export current table (CSV)',r:'action',s:'read only'});
 if(!q){return out;}
 q=q.toLowerCase();
 var f=[];var x;
 for(i=0;i<out.length;i++){
  x=out[i];
  if(x.t.toLowerCase().indexOf(q)>-1||x.s.toLowerCase().indexOf(q)>-1){f.push(x);}
 }
 return f;
}
function renderCmdk(q){
 var items=cmdkItems(q);
 var h=document.getElementById('cmdkList');
 cmdkSel=0;
 if(!items.length){h.innerHTML='<div class="foot-note" style="padding:12px">Nothing matched that.</div>';return;}
 var out='';var i,x;
 for(i=0;i<items.length;i++){
  x=items[i];
  var di=(x.i!=null)?x.i:'';
  out=out+'<button class="cmdk-i" type="button" data-i="'+di+'" data-t="'+x.t+'" aria-selected="'+(i===0)+'">'
   +'<span>'+x.t+'</span><span class="sp"></span><span class="r">'+x.r+'</span>'
   +'<span class="mono" style="font-size:9.5px;color:var(--text-tertiary)">'+x.s+'</span></button>';
 }
 h.innerHTML=out;
 var bs=h.querySelectorAll('.cmdk-i');
 for(i=0;i<bs.length;i++){
  (function(b){
   b.addEventListener('click',function(){
    var di2=b.dataset.i;
    if(di2!==''){render(+di2);}else{audit(b.dataset.t,R[CUR].t);}
    closeCmdk();
   });
  })(bs[i]);
 }
}
function openCmdk(){
 document.getElementById('cmdkPop').setAttribute('data-open','true');
 var q=document.getElementById('cmdkQ');
 q.value='';renderCmdk('');q.focus();
}
function closeCmdk(){document.getElementById('cmdkPop').setAttribute('data-open','false');}
/* ===================== boot ===================== */
var its=document.querySelectorAll('.aitem');var bi;
for(bi=0;bi<its.length;bi++){
 (function(b){b.addEventListener('click',function(){render(+b.dataset.r);});})(its[bi]);
}
document.getElementById('cmdkQ').addEventListener('input',function(){renderCmdk(this.value);});
document.getElementById('cmdkPop').addEventListener('click',function(e){if(e.target===this){closeCmdk();}});
document.addEventListener('keydown',function(e){
 var pop=document.getElementById('cmdkPop');
 if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'){e.preventDefault();openCmdk();return;}
 if(e.key==='Escape'){closeCmdk();}
 if(pop.getAttribute('data-open')==='true'&&e.key==='Enter'){
  var sel=document.querySelector('.cmdk-i[aria-selected="true"]');
  if(sel){sel.click();}
  return;
 }
 if(pop.getAttribute('data-open')==='true'&&(e.key==='ArrowDown'||e.key==='ArrowUp')){
  e.preventDefault();
  var all=document.querySelectorAll('.cmdk-i');
  if(!all.length){return;}
  all[cmdkSel].setAttribute('aria-selected','false');
  cmdkSel=(cmdkSel+(e.key==='ArrowDown'?1:-1)+all.length)%all.length;
  all[cmdkSel].setAttribute('aria-selected','true');
  all[cmdkSel].scrollIntoView({block:'nearest'});
 }
});
render(0);renderAudit();
