
function mulberry(a){return function(){a|=0;a=a+0x6D2B79F5|0;var t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
var N=500, KEYS=[[0,62800],[60,64200],[140,61500],[220,66000],[300,63200],[380,64800],[440,62100],[499,64294]];
var PX=(function(){var r=mulberry(20261011),a=[],v=0;
  for(var i=0;i<N;i++){var kk=KEYS[KEYS.length-1][1];
    for(var j=0;j<KEYS.length-1;j++){if(i>=KEYS[j][0]&&i<=KEYS[j+1][0]){var u=(i-KEYS[j][0])/(KEYS[j+1][0]-KEYS[j][0]);u=u*u*(3-2*u);kk=KEYS[j][1]+(KEYS[j+1][1]-KEYS[j][1])*u;}}
    v=(i===0)?kk:v*0.72+kk*0.28+(r()-0.5)*260; a.push(v);} return a;})();
function SMA(a,p){var o=[],s=0;for(var i=0;i<a.length;i++){s+=a[i];if(i>=p)s-=a[i-p];o.push(i>=p-1?s/p:null);}return o;}
function EMA(a,p){var k=2/(p+1),o=[],e=null;for(var i=0;i<a.length;i++){e=(e==null)?a[i]:a[i]*k+e*(1-k);o.push(e);}return o;}
function RSI(a,p){var o=new Array(a.length).fill(null),g=0,l=0;
  for(var i=1;i<a.length;i++){var d=a[i]-a[i-1],up=Math.max(d,0),dn=Math.max(-d,0);
    if(i<=p){g+=up/p;l+=dn/p;if(i===p)o[i]=l?100-100/(1+g/l):100;}
    else{g=(g*(p-1)+up)/p;l=(l*(p-1)+dn)/p;o[i]=l?100-100/(1+g/l):100;}}return o;}
function SD(a,p){var o=[];for(var i=0;i<a.length;i++){if(i<p-1){o.push(null);continue;}
  var s=0;for(var j=i-p+1;j<=i;j++)s+=a[j];var m=s/p,sd=0;for(var j2=i-p+1;j2<=i;j2++)sd+=(a[j2]-m)*(a[j2]-m);o.push(Math.sqrt(sd/p));}return o;}
var E20=EMA(PX,20),E50=EMA(PX,50),R14=RSI(PX,14),S20=SMA(PX,20),D20=SD(PX,20),V20=SMA(PX.map(function(x,i){return Math.abs(x-PX[Math.max(0,i-1)])*7+120;}),20);
var MACD=(function(){var a=EMA(PX,12),b=EMA(PX,26),d=a.map(function(v,i){return v-b[i];});return {d:d,s:EMA(d,9)};})();
function HH(a,p,i){var m=-1e9;for(var j=Math.max(0,i-p+1);j<=i;j++)m=Math.max(m,a[j]);return m;}
function LL(a,p,i){var m=1e9;for(var j=Math.max(0,i-p+1);j<=i;j++)m=Math.min(m,a[j]);return m;}
function crossUp(a,i,lv){return a[i-1]!=null&&a[i]!=null&&a[i-1]<=lv&&a[i]>lv;}
function crossDn(a,i,lv){return a[i-1]!=null&&a[i]!=null&&a[i-1]>=lv&&a[i]<lv;}
var RULES={
  rsi40up:function(i){return crossUp(R14,i,40)&&E20[i]>E50[i];},
  rsi60dn:function(i){return crossDn(R14,i,60)&&E20[i]<E50[i];},
  brkUp:function(i){return PX[i]>HH(PX,20,i-1);},
  brkDn:function(i){return PX[i]<LL(PX,20,i-1);},
  emaUp:function(i){return E20[i-1]<=E50[i-1]&&E20[i]>E50[i];},
  emaDn:function(i){return E20[i-1]>=E50[i-1]&&E20[i]<E50[i];},
  rsi30up:function(i){return crossUp(R14,i,30);},
  rsi70dn:function(i){return crossDn(R14,i,70);},
  macdUp:function(i){return MACD.d[i-1]<=MACD.s[i-1]&&MACD.d[i]>MACD.s[i]&&PX[i]>E50[i];},
  macdDn:function(i){return MACD.d[i-1]>=MACD.s[i-1]&&MACD.d[i]<MACD.s[i]&&PX[i]<E50[i];},
  bbUp:function(i){return S20[i-1]!=null&&PX[i-1]<S20[i-1]-2*D20[i-1]&&PX[i]>S20[i]-2*D20[i];},
  bbDn:function(i){return S20[i-1]!=null&&PX[i-1]>S20[i-1]+2*D20[i-1]&&PX[i]<S20[i]+2*D20[i];},
  volUp:function(i){return V20[i]&&Math.abs(PX[i]-PX[i-1])>V20[i]*0.9&&PX[i]>E20[i];},
  divUp:function(i){return PX[i]<LL(PX,10,i-1)&&R14[i]>R14[i-5];},
  divDn:function(i){return PX[i]>HH(PX,10,i-1)&&R14[i]<R14[i-5];}
};
/* Honest backtest: mark-to-market equity, realised trades for the ratios. */
function runBT(key,dir,stopPct,rw){
  var stop=stopPct/100, tp=stop*rw, eq=100, pos=null, closed=0, wins=0, losses=0, gp=0, gl=0, fees=0;
  var curve=[], peak=100, mdd=0, rs=[], rule=RULES[key];
  for(var i=21;i<N;i++){
    var ch=null;
    if(pos){
      ch=(dir>0)?PX[i]/pos.p-1:pos.p/PX[i]-1;
      if(ch<=-stop||ch>=tp){
        var rr=(ch<=-stop)?-stop:tp, pnl=eq*rr;
        eq+=pnl; closed++; fees+=eq*0.0006*2;
        if(pnl>0){wins++;gp+=pnl;} else {losses++;gl+=Math.abs(pnl);}
        rs.push(rr); pos=null; ch=null;
      }
    } else if(rule&&rule(i-1)){ pos={p:PX[i]}; }
    var mtm=eq*(1+(pos?((dir>0)?PX[i]/pos.p-1:pos.p/PX[i]-1):0));
    curve.push(mtm);
    if(mtm>peak)peak=mtm; var dd=(peak-mtm)/peak; if(dd>mdd)mdd=dd;
  }
  var net=curve.length?curve[curve.length-1]/100-1:0;
  var mean=0; for(var k=0;k<rs.length;k++)mean+=rs[k]; mean=rs.length?mean/rs.length:0;
  var sd=0; for(var k2=0;k2<rs.length;k2++)sd+=(rs[k2]-mean)*(rs[k2]-mean); sd=rs.length>1?Math.sqrt(sd/(rs.length-1)):0;
  return {net:net,mdd:mdd,closed:closed,wins:wins,losses:losses,wr:closed?wins/closed:0,
    pf:gl?gp/gl:(gp>0?99:0),gp:gp,gl:gl,fees:fees,exp:closed?(net*100)/closed:0,
    sharpe:sd?mean/sd:0,curve:curve,stop:stopPct,rw:rw,dir:dir};
}
function spark(curve,w,h,color){
  if(!curve||curve.length<2)return '';
  var lo=Math.min.apply(null,curve),hi=Math.max.apply(null,curve); if(hi-lo<0.01){hi+=0.5;lo-=0.5;}
  var pts=curve.map(function(v,i){return (i/(curve.length-1)*w).toFixed(1)+','+(h-(v-lo)/(hi-lo)*(h-2)-1).toFixed(1);}).join(' ');
  return '<svg class="spk" viewBox="0 0 '+w+' '+h+'" preserveAspectRatio="none" aria-hidden="true">'
    +'<polyline points="'+pts+'" fill="none" stroke="'+color+'" stroke-width="1.4" vector-effect="non-scaling-stroke"/></svg>';
}
function sg(v,d){d=d==null?2:d;return (v>=0?'+':'\u2212')+Math.abs(v).toFixed(d);}
function fmtN(v,d){return v.toLocaleString('en-US',{minimumFractionDigits:d==null?2:d,maximumFractionDigits:d==null?2:d});}
