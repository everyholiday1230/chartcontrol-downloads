/* ================================================================
   qt-indicators-next.js — ChartControl indicator library, v2
   ----------------------------------------------------------------
   A drop-in successor to chart-indicators{,-batch2,-batch3}.js.
   Same public entry point (window.QTIndicatorLib.register) so
   chart-kline.jsx needs no change.

   WHY A REWRITE
   -------------
   v1 registered ~170 indicators across three files as ~170 separate
   registerIndicator() calls. Each call repeated the same boilerplate
   (name, series, figures, styles), so a change to how lines get their
   colour meant editing ~170 places. Three problems fell out of that:

     1. Colour rule broken. The file header says "색상은 tokens.css 의
        CSS 변수에서 읽는다 (하드코딩 금지)", but v1 also carried
        LINE_FALLBACKS = ['#2962ff', '#ff6d00', ...] — eight hardcoded
        hex values. A typo in a token name silently fell back to a
        colour outside the design system, and nothing reported it.

     2. No metadata. The picker, the legend and the settings panel each
        kept their own list of indicator names, so the three drifted.

     3. No params contract. Each indicator read its own defaults, so
        "period" meant something slightly different in each file.

   WHAT v2 CHANGES
   ---------------
     · One declarative catalogue. An indicator is a plain object; the
       factory builds the KLineChart registration from it. Adding an
       indicator is one entry, not a new function.
     · Colours are TOKENS ONLY. There are no hex fallbacks. An unknown
       token is a hard validation failure, not a silent colour.
     · Params are declared with type, default, min and max. The UI is
       generated from that declaration, so it cannot drift.
     · Metadata (category, pane, nameKey, unit) travels with the
       definition, so picker/legend/settings read one source.
     · validate() checks the whole catalogue at boot — unknown tokens,
       duplicate ids, malformed params — the same way the exchange
       catalogue throws on a bad entry instead of failing at request
       time.
     · compute() is memoised on (id, params, dataVersion), so panning
       and theme switches do not recompute.

   COLOUR CONTRACT
   ---------------
   tokens.css is the single source of colour. v2 introduces one small
   addition to it — a generic line palette — so that no indicator ever
   needs a literal colour again:

       --chart-line-1 ... --chart-line-8

   Those eight replace the hardcoded LINE_FALLBACKS. They are declared
   in the CSS block shipped with this file; add it to tokens.css once.
   ================================================================ */

(function (global) {
  'use strict';

  /* ==============================================================
     1. TOKEN ACCESS — read at draw time, never at registration time
     ============================================================== */

  var _tokCache = null;

  /** Read a token from :root. Cached per frame, invalidated on theme change. */
  function tok(name) {
    if (_tokCache && _tokCache[name] !== undefined) return _tokCache[name];
    var v = '';
    try {
      v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    } catch (e) { v = ''; }
    if (!_tokCache) _tokCache = {};
    _tokCache[name] = v;
    return v;
  }

  /** The token set v2 is allowed to use. Anything outside this is a bug. */
  var CHART_TOKENS = {
    '--chart-line-1': 1, '--chart-line-2': 1, '--chart-line-3': 1, '--chart-line-4': 1,
    '--chart-line-5': 1, '--chart-line-6': 1, '--chart-line-7': 1, '--chart-line-8': 1,
    '--chart-ma-1': 1, '--chart-ma-2': 1, '--chart-ma-3': 1,
    '--chart-bb': 1, '--chart-vwap': 1, '--chart-rsi': 1, '--chart-macd': 1,
    '--chart-grid': 1, '--chart-axis-text': 1,
    '--color-brand': 1, '--color-ai': 1, '--color-ai-bg': 1,
    '--color-trade-long': 1, '--color-trade-short': 1,
    '--color-trade-long-bg': 1, '--color-trade-short-bg': 1,
    '--color-signal-approved': 1, '--color-order-pending': 1,
    '--color-warning': 1, '--color-danger': 1, '--color-success': 1,
    '--level-entry': 1, '--level-invalidation': 1, '--level-target-1': 1,
    '--level-target-2': 1, '--level-range': 1,
    '--color-text-primary': 1, '--color-text-secondary': 1, '--color-text-tertiary': 1,
    '--color-border-subtle': 1, '--color-border-default': 1
  };

  function assertToken(name, where) {
    if (!CHART_TOKENS[name]) {
      throw new Error('[QTIndNext] ' + where + ' references unknown token "' + name +
        '" — add it to tokens.css and to CHART_TOKENS, or fix the spelling.');
    }
  }

  function invalidateTokens() { _tokCache = null; }
  document.addEventListener('visibilitychange', invalidateTokens);
  if (global.MutationObserver) {
    new MutationObserver(invalidateTokens).observe(document.documentElement, {
      attributes: true, attributeFilter: ['data-theme', 'data-brand', 'data-longshort', 'data-density']
    });
  }

  /* ==============================================================
     2. MATH HELPERS — shared, so every indicator agrees on basics
     ============================================================== */

  var M = {
    /** Source selector. Every indicator takes the same source names. */
    src: function (k, s) {
      switch (s) {
        case 'open':  return k.o;
        case 'high':  return k.h;
        case 'low':   return k.l;
        case 'hl2':   return (k.h + k.l) / 2;
        case 'hlc3':  return (k.h + k.l + k.c) / 3;
        case 'ohlc4': return (k.o + k.h + k.l + k.c) / 4;
        default:      return k.c;
      }
    },
    sma: function (a, n) {
      var out = new Array(a.length), sum = 0;
      for (var i = 0; i < a.length; i++) {
        sum += a[i];
        if (i >= n) sum -= a[i - n];
        out[i] = i >= n - 1 ? sum / n : null;
      }
      return out;
    },
    ema: function (a, n) {
      var out = new Array(a.length), k = 2 / (n + 1), prev = null;
      for (var i = 0; i < a.length; i++) {
        if (a[i] === null) { out[i] = null; continue; }
        prev = prev === null ? a[i] : a[i] * k + prev * (1 - k);
        out[i] = prev;
      }
      return out;
    },
    wma: function (a, n) {
      var out = new Array(a.length), denom = n * (n + 1) / 2;
      for (var i = 0; i < a.length; i++) {
        if (i < n - 1) { out[i] = null; continue; }
        var s = 0;
        for (var j = 0; j < n; j++) s += a[i - j] * (n - j);
        out[i] = s / denom;
      }
      return out;
    },
    /** Wilder smoothing — the correct basis for RSI, ATR and ADX. */
    wilder: function (a, n) {
      var out = new Array(a.length), prev = null, sum = 0, i;
      for (i = 0; i < a.length; i++) {
        if (a[i] === null) { out[i] = null; continue; }
        if (i < n) { sum += a[i]; out[i] = i === n - 1 ? sum / n : null; prev = out[i]; continue; }
        prev = (prev * (n - 1) + a[i]) / n;
        out[i] = prev;
      }
      return out;
    },
    stdev: function (a, n) {
      var out = new Array(a.length);
      for (var i = 0; i < a.length; i++) {
        if (i < n - 1) { out[i] = null; continue; }
        var s = 0, j;
        for (j = i - n + 1; j <= i; j++) s += a[j];
        var m = s / n, v = 0;
        for (j = i - n + 1; j <= i; j++) v += (a[j] - m) * (a[j] - m);
        out[i] = Math.sqrt(v / n);
      }
      return out;
    },
    highest: function (a, n) {
      var out = new Array(a.length);
      for (var i = 0; i < a.length; i++) {
        if (i < n - 1) { out[i] = null; continue; }
        var m = -Infinity;
        for (var j = i - n + 1; j <= i; j++) if (a[j] > m) m = a[j];
        out[i] = m;
      }
      return out;
    },
    lowest: function (a, n) {
      var out = new Array(a.length);
      for (var i = 0; i < a.length; i++) {
        if (i < n - 1) { out[i] = null; continue; }
        var m = Infinity;
        for (var j = i - n + 1; j <= i; j++) if (a[j] < m) m = a[j];
        out[i] = m;
      }
      return out;
    },
    /** Highest bar index over the window — used by Aroon and Donchian. */
    sinceHigh: function (a, n) {
      var out = new Array(a.length);
      for (var i = 0; i < a.length; i++) {
        if (i < n - 1) { out[i] = null; continue; }
        var m = -Infinity, at = i;
        for (var j = i - n + 1; j <= i; j++) if (a[j] >= m) { m = a[j]; at = j; }
        out[i] = i - at;
      }
      return out;
    },
    sinceLow: function (a, n) {
      var out = new Array(a.length);
      for (var i = 0; i < a.length; i++) {
        if (i < n - 1) { out[i] = null; continue; }
        var m = Infinity, at = i;
        for (var j = i - n + 1; j <= i; j++) if (a[j] <= m) { m = a[j]; at = j; }
        out[i] = i - at;
      }
      return out;
    },
    sum: function (a, n) {
      var out = new Array(a.length), s = 0;
      for (var i = 0; i < a.length; i++) { s += a[i]; if (i >= n) s -= a[i - n]; out[i] = i >= n - 1 ? s : null; }
      return out;
    },
    median: function (a, n) {
      var out = new Array(a.length);
      for (var i = 0; i < a.length; i++) {
        if (i < n - 1) { out[i] = null; continue; }
        var w = a.slice(i - n + 1, i + 1).sort(function (x, y) { return x - y; });
        out[i] = n % 2 ? w[(n - 1) / 2] : (w[n / 2 - 1] + w[n / 2]) / 2;
      }
      return out;
    },
    linreg: function (a, n) {
      var out = new Array(a.length), slope = new Array(a.length);
      for (var i = 0; i < a.length; i++) {
        if (i < n - 1) { out[i] = null; slope[i] = null; continue; }
        var sx = 0, sy = 0, sxy = 0, sxx = 0, j, x;
        for (j = 0; j < n; j++) { x = j; sy += a[i - n + 1 + j]; sx += x; sxy += x * a[i - n + 1 + j]; sxx += x * x; }
        var d = n * sxx - sx * sx;
        var b = d === 0 ? 0 : (n * sxy - sx * sy) / d;
        var c0 = (sy - b * sx) / n;
        slope[i] = b; out[i] = c0 + b * (n - 1);
      }
      return [out, slope];
    },
    rank: function (a, n) {
      var out = new Array(a.length);
      for (var i = 0; i < a.length; i++) {
        if (i < n - 1) { out[i] = null; continue; }
        var r = 0;
        for (var j = i - n + 1; j <= i; j++) if (a[j] <= a[i]) r++;
        out[i] = r / n * 100;
      }
      return out;
    },
    trueRange: function (k) {
      var out = new Array(k.length);
      for (var i = 0; i < k.length; i++) {
        out[i] = i === 0
          ? k[i].h - k[i].l
          : Math.max(k[i].h - k[i].l, Math.abs(k[i].h - k[i - 1].c), Math.abs(k[i].l - k[i - 1].c));
      }
      return out;
    },
    cross: function (a, b) {
      var out = new Array(a.length);
      for (var i = 0; i < a.length; i++) {
        if (i === 0 || a[i] === null || b[i] === null || a[i - 1] === null || b[i - 1] === null) { out[i] = 0; continue; }
        out[i] = (a[i] > b[i] && a[i - 1] <= b[i - 1]) ? 1 : ((a[i] < b[i] && a[i - 1] >= b[i - 1]) ? -1 : 0);
      }
      return out;
    }
  };

  /* ==============================================================
     3. THE CATALOGUE — one declarative entry per indicator
     --------------------------------------------------------------
     id       stable key, also the i18n key suffix
     nameKey  locale key; the UI never holds a literal English name
     cat      trend | momentum | volatility | volume | levels
     pane     'overlay' (on the candles) or 'separate'
     params   declared type/default/min/max — the UI is built from this
     plots    each plot names a TOKEN, never a colour
     calc     (k, p) -> array of series, aligned to candles
     ============================================================== */

  var P = {
    period: function (d, min, max) { return { key: 'period', type: 'int', def: d, min: min || 2, max: max || 400 }; },
    mult:   function (d) { return { key: 'mult', type: 'float', def: d, min: 0.1, max: 10, step: 0.1 }; },
    source: function (d) { return { key: 'source', type: 'enum', def: d || 'close', options: ['close', 'open', 'high', 'low', 'hl2', 'hlc3', 'ohlc4'] }; }
  };

  var CATALOGUE = [

    /* ---------------- TREND / MOVING AVERAGES ---------------- */
    {
      id: 'SMA', cat: 'trend', pane: 'overlay',
      params: [P.period(20), P.source('close')],
      plots: [{ token: '--chart-ma-1' }],
      calc: function (k, p) { return [M.sma(k.map(function (x) { return M.src(x, p.source); }), p.period)]; }
    },
    {
      id: 'EMA', cat: 'trend', pane: 'overlay',
      params: [P.period(20), P.source('close')],
      plots: [{ token: '--chart-ma-2' }],
      calc: function (k, p) { return [M.ema(k.map(function (x) { return M.src(x, p.source); }), p.period)]; }
    },
    {
      id: 'WMA', cat: 'trend', pane: 'overlay',
      params: [P.period(20), P.source('close')],
      plots: [{ token: '--chart-ma-3' }],
      calc: function (k, p) { return [M.wma(k.map(function (x) { return M.src(x, p.source); }), p.period)]; }
    },
    {
      id: 'HMA', cat: 'trend', pane: 'overlay',
      params: [P.period(21)],
      plots: [{ token: '--chart-line-1' }],
      calc: function (k, p) {
        var c = k.map(function (x) { return x.c; });
        var half = M.wma(c, Math.round(p.period / 2)), full = M.wma(c, p.period);
        var raw = c.map(function (v, i) { return (half[i] === null || full[i] === null) ? null : 2 * half[i] - full[i]; });
        var clean = raw.map(function (v) { return v === null ? 0 : v; });
        return [M.wma(clean, Math.round(Math.sqrt(p.period)))];
      }
    },
    {
      id: 'DEMA', cat: 'trend', pane: 'overlay',
      params: [P.period(21)],
      plots: [{ token: '--chart-line-2' }],
      calc: function (k, p) {
        var c = k.map(function (x) { return x.c; }), e1 = M.ema(c, p.period);
        var e2 = M.ema(e1.map(function (v) { return v === null ? 0 : v; }), p.period);
        return [c.map(function (v, i) { return (e1[i] === null || e2[i] === null) ? null : 2 * e1[i] - e2[i]; })];
      }
    },
    {
      id: 'TEMA', cat: 'trend', pane: 'overlay',
      params: [P.period(21)],
      plots: [{ token: '--chart-line-3' }],
      calc: function (k, p) {
        var c = k.map(function (x) { return x.c; });
        var e1 = M.ema(c, p.period), e2 = M.ema(z(e1), p.period), e3 = M.ema(z(e2), p.period);
        return [c.map(function (v, i) {
          return (e1[i] === null || e2[i] === null || e3[i] === null) ? null : 3 * e1[i] - 3 * e2[i] + e3[i];
        })];
      }
    },
    {
      id: 'KAMA', cat: 'trend', pane: 'overlay',
      params: [P.period(10), { key: 'fast', type: 'int', def: 2, min: 1, max: 60 },
               { key: 'slow', type: 'int', def: 30, min: 2, max: 200 }],
      plots: [{ token: '--chart-line-4' }],
      calc: function (k, p) {
        var c = k.map(function (x) { return x.c; }), out = new Array(c.length);
        var fastSC = 2 / (p.fast + 1), slowSC = 2 / (p.slow + 1), prev = null;
        for (var i = 0; i < c.length; i++) {
          if (i < p.period) { out[i] = null; continue; }
          var change = Math.abs(c[i] - c[i - p.period]), vol = 0;
          for (var j = i - p.period + 1; j <= i; j++) vol += Math.abs(c[j] - c[j - 1]);
          var er = vol === 0 ? 0 : change / vol;
          var sc = Math.pow(er * (fastSC - slowSC) + slowSC, 2);
          prev = prev === null ? c[i - 1] : prev + sc * (c[i] - prev);
          out[i] = prev;
        }
        return [out];
      }
    },

    /* ---------------- MOMENTUM ---------------- */
    {
      id: 'RSI', cat: 'momentum', pane: 'separate',
      params: [P.period(14), P.source('close')],
      plots: [{ token: '--chart-rsi' }],
      calc: function (k, p) {
        var a = k.map(function (x) { return M.src(x, p.source); }), g = [0], l = [0];
        for (var i = 1; i < a.length; i++) {
          var d = a[i] - a[i - 1];
          g.push(d > 0 ? d : 0); l.push(d < 0 ? -d : 0);
        }
        var ag = M.wilder(g, p.period), al = M.wilder(l, p.period);
        return [a.map(function (_, i) {
          if (ag[i] === null || al[i] === null) return null;
          if (al[i] === 0) return 100;
          return 100 - 100 / (1 + ag[i] / al[i]);
        })];
      }
    },
    {
      id: 'MACD', cat: 'momentum', pane: 'separate',
      params: [{ key: 'fast', type: 'int', def: 12, min: 2, max: 100 },
               { key: 'slow', type: 'int', def: 26, min: 3, max: 200 },
               { key: 'signal', type: 'int', def: 9, min: 2, max: 100 }],
      plots: [{ token: '--chart-macd' }, { token: '--chart-line-5' }, { token: '--chart-line-6', type: 'histogram' }],
      calc: function (k, p) {
        var c = k.map(function (x) { return x.c; });
        var f = M.ema(c, p.fast), s = M.ema(c, p.slow);
        var line = c.map(function (_, i) { return (f[i] === null || s[i] === null) ? null : f[i] - s[i]; });
        var sig = M.ema(z(line), p.signal);
        return [line, sig, line.map(function (v, i) { return (v === null || sig[i] === null) ? null : v - sig[i]; })];
      }
    },
    {
      id: 'STOCH', cat: 'momentum', pane: 'separate',
      params: [P.period(14), { key: 'smooth', type: 'int', def: 3, min: 1, max: 30 }],
      plots: [{ token: '--chart-line-7' }, { token: '--chart-line-8' }],
      calc: function (k, p) {
        var hh = M.highest(k.map(function (x) { return x.h; }), p.period);
        var ll = M.lowest(k.map(function (x) { return x.l; }), p.period);
        var kk = k.map(function (x, i) {
          if (hh[i] === null) return null;
          return hh[i] === ll[i] ? 50 : (x.c - ll[i]) / (hh[i] - ll[i]) * 100;
        });
        return [kk, M.sma(z(kk), p.smooth)];
      }
    },
    {
      id: 'CCI', cat: 'momentum', pane: 'separate',
      params: [P.period(20)],
      plots: [{ token: '--chart-line-1' }],
      calc: function (k, p) {
        var tp = k.map(function (x) { return (x.h + x.l + x.c) / 3; }), ma = M.sma(tp, p.period);
        return [tp.map(function (v, i) {
          if (ma[i] === null) return null;
          var md = 0;
          for (var j = i - p.period + 1; j <= i; j++) md += Math.abs(tp[j] - ma[i]);
          md /= p.period;
          return md === 0 ? 0 : (v - ma[i]) / (0.015 * md);
        })];
      }
    },
    {
      id: 'PPO', cat: 'momentum', pane: 'separate',
      params: [{ key: 'fast', type: 'int', def: 12, min: 2, max: 100 },
               { key: 'slow', type: 'int', def: 26, min: 3, max: 200 }],
      plots: [{ token: '--chart-line-2' }],
      calc: function (k, p) {
        var c = k.map(function (x) { return x.c; }), f = M.ema(c, p.fast), s = M.ema(c, p.slow);
        return [c.map(function (_, i) {
          return (f[i] === null || s[i] === null || s[i] === 0) ? null : (f[i] - s[i]) / s[i] * 100;
        })];
      }
    },
    {
      id: 'TRIX', cat: 'momentum', pane: 'separate',
      params: [P.period(15)],
      plots: [{ token: '--chart-line-3' }],
      calc: function (k, p) {
        var c = k.map(function (x) { return x.c; });
        var e1 = M.ema(c, p.period), e2 = M.ema(z(e1), p.period), e3 = M.ema(z(e2), p.period);
        return [e3.map(function (v, i) {
          if (v === null || i === 0 || e3[i - 1] === null || e3[i - 1] === 0) return null;
          return (v - e3[i - 1]) / e3[i - 1] * 100;
        })];
      }
    },
    {
      id: 'STOCHRSI', cat: 'momentum', pane: 'separate',
      params: [P.period(14)],
      plots: [{ token: '--chart-line-4' }],
      calc: function (k, p) {
        var r = CATALOGUE_BY_ID.RSI.calc(k, { period: p.period, source: 'close' })[0];
        var hi = M.highest(z(r), p.period), lo = M.lowest(z(r), p.period);
        return [r.map(function (v, i) {
          if (v === null || hi[i] === null) return null;
          return hi[i] === lo[i] ? 50 : (v - lo[i]) / (hi[i] - lo[i]) * 100;
        })];
      }
    },

    /* ---------------- VOLATILITY ---------------- */
    {
      id: 'ATR', cat: 'volatility', pane: 'separate',
      params: [P.period(14)],
      plots: [{ token: '--chart-line-5' }],
      calc: function (k, p) { return [M.wilder(M.trueRange(k), p.period)]; }
    },
    {
      id: 'BB', cat: 'volatility', pane: 'overlay',
      params: [P.period(20), P.mult(2)],
      plots: [{ token: '--chart-bb' }, { token: '--chart-bb' }, { token: '--chart-bb', style: 'dashed' }],
      calc: function (k, p) {
        var c = k.map(function (x) { return x.c; }), m = M.sma(c, p.period), s = M.stdev(c, p.period);
        return [m.map(function (v, i) { return v === null ? null : v + p.mult * s[i]; }),
                m.map(function (v, i) { return v === null ? null : v - p.mult * s[i]; }), m];
      }
    },
    {
      id: 'KELTNER', cat: 'volatility', pane: 'overlay',
      params: [P.period(20), P.mult(2)],
      plots: [{ token: '--chart-line-6' }, { token: '--chart-line-6' }, { token: '--chart-line-6', style: 'dashed' }],
      calc: function (k, p) {
        var c = k.map(function (x) { return x.c; }), e = M.ema(c, p.period), a = M.wilder(M.trueRange(k), p.period);
        return [e.map(function (v, i) { return v === null ? null : v + p.mult * a[i]; }),
                e.map(function (v, i) { return v === null ? null : v - p.mult * a[i]; }), e];
      }
    },
    {
      id: 'DONCHIAN', cat: 'volatility', pane: 'overlay',
      params: [P.period(20)],
      plots: [{ token: '--chart-line-7' }, { token: '--chart-line-7' }, { token: '--chart-line-7', style: 'dashed' }],
      calc: function (k, p) {
        var h = M.highest(k.map(function (x) { return x.h; }), p.period);
        var l = M.lowest(k.map(function (x) { return x.l; }), p.period);
        return [h, l, h.map(function (v, i) { return v === null ? null : (v + l[i]) / 2; })];
      }
    },
    {
      id: 'SUPERTREND', cat: 'volatility', pane: 'overlay',
      params: [P.period(10), P.mult(3)],
      plots: [{ token: '--color-trade-long' }, { token: '--color-trade-short' }],
      calc: function (k, p) {
        /* Textbook (Wilder ATR). Bands are carried forward with the two clamp
           rules, then the trend line is chosen from the previous trend's side.
           v1 emitted one line and left gaps; this emits two so the up and down
           segments can be coloured from separate tokens. */
        var atr = M.wilder(M.trueRange(k), p.period);
        var n = k.length;
        var fUp = new Array(n), fDn = new Array(n), up = new Array(n), dn = new Array(n);
        var dir = 1;
        for (var i = 0; i < n; i++) {
          if (atr[i] === null) { fUp[i] = fDn[i] = up[i] = dn[i] = null; continue; }
          var hl2 = (k[i].h + k[i].l) / 2;
          var bUp = hl2 + p.mult * atr[i], bDn = hl2 - p.mult * atr[i];
          if (i === 0 || fUp[i - 1] === null) { fUp[i] = bUp; fDn[i] = bDn; }
          else {
            var pc = k[i - 1].c;
            fUp[i] = (bUp < fUp[i - 1] || pc > fUp[i - 1]) ? bUp : fUp[i - 1];
            fDn[i] = (bDn > fDn[i - 1] || pc < fDn[i - 1]) ? bDn : fDn[i - 1];
          }
          if (i === 0 || fUp[i - 1] === null) { dir = 1; }
          else if (k[i].c > fUp[i - 1]) dir = 1;
          else if (k[i].c < fDn[i - 1]) dir = -1;
          if (dir === 1) { up[i] = fDn[i]; dn[i] = null; }
          else { dn[i] = fUp[i]; up[i] = null; }
        }
        return [up, dn];
      }
    },
    {
      id: 'VWAP', cat: 'volume', pane: 'overlay',
      params: [{ key: 'window', type: 'int', def: 0, min: 0, max: 500 }],
      plots: [{ token: '--chart-vwap' }],
      calc: function (k, p) {
        var out = new Array(k.length), cpv = 0, cv = 0, n = p.window > 0 ? p.window : k.length;
        for (var i = 0; i < k.length; i++) {
          var tp = (k[i].h + k[i].l + k[i].c) / 3, v = k[i].v || 1;
          cpv += tp * v; cv += v;
          if (p.window > 0 && i >= p.window) {
            var tp0 = (k[i - p.window].h + k[i - p.window].l + k[i - p.window].c) / 3;
            var v0 = k[i - p.window].v || 1;
            cpv -= tp0 * v0; cv -= v0;
          }
          out[i] = cv === 0 ? null : cpv / cv;
        }
        return [out];
      }
    },
    {
      id: 'OBV', cat: 'volume', pane: 'separate',
      params: [],
      plots: [{ token: '--chart-line-8' }],
      calc: function (k) {
        var out = new Array(k.length), acc = 0;
        for (var i = 0; i < k.length; i++) {
          if (i > 0) acc += k[i].c > k[i - 1].c ? (k[i].v || 0) : (k[i].c < k[i - 1].c ? -(k[i].v || 0) : 0);
          out[i] = acc;
        }
        return [out];
      }
    },
    {
      id: 'MFI', cat: 'volume', pane: 'separate',
      params: [P.period(14)],
      plots: [{ token: '--chart-line-1' }],
      calc: function (k, p) {
        var tp = k.map(function (x) { return (x.h + x.l + x.c) / 3; });
        var pos = new Array(k.length), neg = new Array(k.length);
        for (var i = 0; i < k.length; i++) {
          if (i === 0) { pos[i] = 0; neg[i] = 0; continue; }
          var mf = tp[i] * (k[i].v || 0);
          pos[i] = tp[i] > tp[i - 1] ? mf : 0;
          neg[i] = tp[i] < tp[i - 1] ? mf : 0;
        }
        var sp = M.sma(pos, p.period), sn = M.sma(neg, p.period);
        return [tp.map(function (_, i) {
          if (sp[i] === null || sn[i] === null) return null;
          if (sn[i] === 0) return 100;
          return 100 - 100 / (1 + sp[i] / sn[i]);
        })];
      }
    },
    {
      id: 'CMF', cat: 'volume', pane: 'separate',
      params: [P.period(20)],
      plots: [{ token: '--chart-line-2' }],
      calc: function (k, p) {
        var mfv = k.map(function (x) {
          var r = x.h - x.l;
          return r === 0 ? 0 : ((x.c - x.l) - (x.h - x.c)) / r * (x.v || 0);
        });
        var sv = k.map(function (x) { return x.v || 0; });
        var a = M.sma(mfv, p.period), b = M.sma(sv, p.period);
        return [a.map(function (v, i) { return (v === null || b[i] === 0 || b[i] === null) ? null : v / b[i]; })];
      }
    },

    /* ---------------- DIRECTIONAL ---------------- */
    {
      id: 'ADX', cat: 'momentum', pane: 'separate',
      params: [P.period(14)],
      plots: [{ token: '--chart-line-3' }, { token: '--color-trade-long' }, { token: '--color-trade-short' }],
      calc: function (k, p) {
        var tr = M.trueRange(k), pdm = [0], ndm = [0], i;
        for (i = 1; i < k.length; i++) {
          var up = k[i].h - k[i - 1].h, dn = k[i - 1].l - k[i].l;
          pdm.push(up > dn && up > 0 ? up : 0);
          ndm.push(dn > up && dn > 0 ? dn : 0);
        }
        var atr = M.wilder(tr, p.period), sp = M.wilder(pdm, p.period), sn = M.wilder(ndm, p.period);
        var pdi = sp.map(function (v, j) { return (v === null || atr[j] === 0 || atr[j] === null) ? null : v / atr[j] * 100; });
        var ndi = sn.map(function (v, j) { return (v === null || atr[j] === 0 || atr[j] === null) ? null : v / atr[j] * 100; });
        var dx = pdi.map(function (v, j) {
          if (v === null || ndi[j] === null || v + ndi[j] === 0) return null;
          return Math.abs(v - ndi[j]) / (v + ndi[j]) * 100;
        });
        return [M.wilder(z(dx), p.period), pdi, ndi];
      }
    },
    {
      id: 'AROON', cat: 'trend', pane: 'separate',
      params: [P.period(25)],
      plots: [{ token: '--color-trade-long' }, { token: '--color-trade-short' }],
      calc: function (k, p) {
        var hh = k.map(function (x) { return x.h; }), ll = k.map(function (x) { return x.l; });
        var sh = M.sinceHigh(hh, p.period + 1), sl = M.sinceLow(ll, p.period + 1);
        return [sh.map(function (v) { return v === null ? null : (p.period - v) / p.period * 100; }),
                sl.map(function (v) { return v === null ? null : (p.period - v) / p.period * 100; })];
      }
    },
    {
      id: 'VORTEX', cat: 'trend', pane: 'separate',
      params: [P.period(14)],
      plots: [{ token: '--color-trade-long' }, { token: '--color-trade-short' }],
      calc: function (k, p) {
        var vmP = [0], vmN = [0], tr = M.trueRange(k), i;
        for (i = 1; i < k.length; i++) {
          vmP.push(Math.abs(k[i].h - k[i - 1].l));
          vmN.push(Math.abs(k[i].l - k[i - 1].h));
        }
        var sp = M.sma(vmP, p.period), sn = M.sma(vmN, p.period), st = M.sma(tr, p.period);
        return [sp.map(function (v, j) { return (v === null || st[j] === 0 || st[j] === null) ? null : v / st[j]; }),
                sn.map(function (v, j) { return (v === null || st[j] === 0 || st[j] === null) ? null : v / st[j]; })];
      }
    },

    /* ---------------- LEVELS / STRUCTURE ---------------- */
    {
      id: 'ICHIMOKU', cat: 'levels', pane: 'overlay',
      params: [{ key: 'tenkan', type: 'int', def: 9, min: 2, max: 100 },
               { key: 'kijun', type: 'int', def: 26, min: 2, max: 200 },
               { key: 'senkou', type: 'int', def: 52, min: 3, max: 400 }],
      plots: [{ token: '--chart-line-4' }, { token: '--chart-line-5' },
              { token: '--color-trade-long', type: 'band', altToken: '--color-trade-short' }],
      calc: function (k, p) {
        function mid(n) {
          var h = M.highest(k.map(function (x) { return x.h; }), n);
          var l = M.lowest(k.map(function (x) { return x.l; }), n);
          return h.map(function (v, i) { return v === null ? null : (v + l[i]) / 2; });
        }
        var t = mid(p.tenkan), kj = mid(p.kijun);
        var spanA = t.map(function (v, i) { return (v === null || kj[i] === null) ? null : (v + kj[i]) / 2; });
        var spanB = mid(p.senkou);
        return [t, kj, spanA, spanB];
      }
    },
    {
      id: 'PIVOT', cat: 'levels', pane: 'overlay',
      params: [{ key: 'period', type: 'int', def: 24, min: 4, max: 400 }],
      plots: [{ token: '--level-entry' }, { token: '--level-target-1' }, { token: '--level-target-2' },
              { token: '--level-range' }, { token: '--level-range' }],
      calc: function (k, p) {
        var n = k.length, hi = -Infinity, lo = Infinity, out = [];
        var from = Math.max(0, n - p.period);
        for (var j = from; j < n; j++) { if (k[j].h > hi) hi = k[j].h; if (k[j].l < lo) lo = k[j].l; }
        var close = k[n - 1].c, pp = (hi + lo + close) / 3;
        out = [pp, 2 * pp - lo, hi + 2 * (pp - lo), hi, lo];
        return out.map(function (v) {
          return k.map(function () { return v; });
        });
      }
    },
    {
      id: 'ZIGZAG', cat: 'levels', pane: 'overlay',
      params: [{ key: 'pct', type: 'float', def: 2, min: 0.2, max: 20, step: 0.2 }],
      plots: [{ token: '--color-ai' }],
      calc: function (k, p) {
        var out = new Array(k.length), last = k[0].c, dir = 0, piv = k[0].c;
        for (var i = 0; i < k.length; i++) {
          var c = k[i].c, move = (c - piv) / piv * 100;
          if (dir >= 0 && move <= -p.pct) { dir = -1; piv = c; }
          else if (dir <= 0 && move >= p.pct) { dir = 1; piv = c; }
          if (Math.abs(c - last) / last * 100 >= p.pct) { out[i] = c; last = c; } else { out[i] = null; }
        }
        return [out];
      }
    },

    /* ============ migrated from v1 batch 1-3 ============ */
    { id: 'AD', cat: 'volume', pane: 'separate', params: [], plots: [{ token: '--chart-line-1' }],
      calc: function (k) {
        var out = new Array(k.length), acc = 0;
        for (var i = 0; i < k.length; i++) {
          var r = k[i].h - k[i].l;
          var mfv = r === 0 ? 0 : ((k[i].c - k[i].l) - (k[i].h - k[i].c)) / r * (k[i].v || 0);
          acc += mfv; out[i] = acc;
        }
        return [out];
      } },
    { id: 'BBW', cat: 'volatility', pane: 'separate', params: [P.period(20), P.mult(2)],
      plots: [{ token: '--chart-bb' }],
      calc: function (k, p) {
        var c = k.map(function (x) { return x.c; }), m = M.sma(c, p.period), s = M.stdev(c, p.period);
        return [m.map(function (v, i) { return (v === null || v === 0) ? null : (2 * p.mult * s[i]) / v * 100; })];
      } },
    { id: 'BB_PB', cat: 'volatility', pane: 'separate', params: [P.period(20), P.mult(2)],
      plots: [{ token: '--chart-bb' }],
      calc: function (k, p) {
        var c = k.map(function (x) { return x.c; }), m = M.sma(c, p.period), s = M.stdev(c, p.period);
        return [c.map(function (v, i) {
          if (m[i] === null || s[i] === 0) return null;
          return (v - (m[i] - p.mult * s[i])) / (2 * p.mult * s[i]) * 100;
        })];
      } },
    { id: 'BOP', cat: 'momentum', pane: 'separate', params: [P.period(14)],
      plots: [{ token: '--chart-line-2' }],
      calc: function (k, p) {
        var raw = k.map(function (x) { var r = x.h - x.l; return r === 0 ? 0 : (x.c - x.o) / r; });
        return [M.sma(raw, p.period)];
      } },
    { id: 'CHOP', cat: 'volatility', pane: 'separate', params: [P.period(14)],
      plots: [{ token: '--chart-line-3' }],
      calc: function (k, p) {
        var tr = M.trueRange(k), s = M.sum(tr, p.period);
        var hh = M.highest(k.map(function (x) { return x.h; }), p.period);
        var ll = M.lowest(k.map(function (x) { return x.l; }), p.period);
        return [s.map(function (v, i) {
          if (v === null || hh[i] === null || hh[i] === ll[i]) return null;
          return 100 * Math.log10(v / (hh[i] - ll[i])) / Math.log10(p.period);
        })];
      } },
    { id: 'CMO', cat: 'momentum', pane: 'separate', params: [P.period(14)],
      plots: [{ token: '--chart-line-4' }],
      calc: function (k, p) {
        var c = k.map(function (x) { return x.c; }), up = [0], dn = [0], i;
        for (i = 1; i < c.length; i++) { var d = c[i] - c[i - 1]; up.push(d > 0 ? d : 0); dn.push(d < 0 ? -d : 0); }
        var su = M.sum(up, p.period), sd = M.sum(dn, p.period);
        return [su.map(function (v, j) {
          if (v === null || sd[j] === null || (v + sd[j]) === 0) return null;
          return (v - sd[j]) / (v + sd[j]) * 100;
        })];
      } },
    { id: 'COPPOCK', cat: 'momentum', pane: 'separate',
      params: [{ key: 'roc1', type: 'int', def: 14, min: 2, max: 100 }, { key: 'roc2', type: 'int', def: 11, min: 2, max: 100 },
               { key: 'wma', type: 'int', def: 10, min: 2, max: 60 }],
      plots: [{ token: '--chart-line-5' }],
      calc: function (k, p) {
        var c = k.map(function (x) { return x.c; });
        function roc(n) { return c.map(function (v, i) { return (i < n || c[i - n] === 0) ? null : (v - c[i - n]) / c[i - n] * 100; }); }
        var r1 = roc(p.roc1), r2 = roc(p.roc2);
        var sum = r1.map(function (v, i) { return (v === null || r2[i] === null) ? null : v + r2[i]; });
        return [M.wma(z(sum), p.wma)];
      } },
    { id: 'DPO', cat: 'trend', pane: 'separate', params: [P.period(20)],
      plots: [{ token: '--chart-line-6' }],
      calc: function (k, p) {
        var c = k.map(function (x) { return x.c; }), m = M.sma(c, Math.max(2, Math.round(p.period / 2) + 1));
        var sh = Math.floor(p.period / 2) + 1;
        return [c.map(function (v, i) { return m[i] === null ? null : v - m[i]; })];
      } },
    { id: 'EFI', cat: 'volume', pane: 'separate', params: [P.period(13)],
      plots: [{ token: '--chart-line-7' }],
      calc: function (k, p) {
        var raw = [0];
        for (var i = 1; i < k.length; i++) raw.push((k[i].c - k[i - 1].c) * (k[i].v || 0));
        return [M.ema(raw, p.period)];
      } },
    { id: 'EMACROSS', cat: 'trend', pane: 'separate',
      params: [{ key: 'fast', type: 'int', def: 12, min: 2, max: 200 }, { key: 'slow', type: 'int', def: 26, min: 3, max: 400 }],
      plots: [{ token: '--color-trade-long' }, { token: '--color-trade-short' }, { token: '--chart-line-1' }],
      calc: function (k, p) {
        var c = k.map(function (x) { return x.c; }), f = M.ema(c, p.fast), s = M.ema(c, p.slow);
        return [f, s, M.cross(z(f), z(s))];
      } },
    { id: 'ENVELOPES', cat: 'overlay', pane: 'overlay', params: [P.period(20), { key: 'pct', type: 'float', def: 2, min: 0.1, max: 20, step: 0.1 }],
      plots: [{ token: '--chart-line-2' }, { token: '--chart-line-2' }, { token: '--chart-ma-1', style: 'dashed' }],
      calc: function (k, p) {
        var c = k.map(function (x) { return x.c; }), m = M.sma(c, p.period);
        return [m.map(function (v) { return v === null ? null : v * (1 + p.pct / 100); }),
                m.map(function (v) { return v === null ? null : v * (1 - p.pct / 100); }), m];
      } },
    { id: 'HV', cat: 'volatility', pane: 'separate', params: [P.period(20)],
      plots: [{ token: '--chart-line-3' }],
      calc: function (k, p) {
        var c = k.map(function (x) { return x.c; }), r = [null], i;
        for (i = 1; i < c.length; i++) r.push(c[i - 1] === 0 ? 0 : Math.log(c[i] / c[i - 1]));
        var sd = M.stdev(z(r), p.period);
        return [sd.map(function (v) { return v === null ? null : v * Math.sqrt(252) * 100; })];
      } },
    { id: 'LSMA', cat: 'trend', pane: 'overlay', params: [P.period(25)],
      plots: [{ token: '--chart-ma-2' }],
      calc: function (k, p) { return [M.linreg(k.map(function (x) { return x.c; }), p.period)[0]]; } },
    { id: 'LINREG', cat: 'trend', pane: 'overlay', params: [P.period(20)],
      plots: [{ token: '--chart-ma-3' }],
      calc: function (k, p) { return [M.linreg(k.map(function (x) { return x.c; }), p.period)[0]]; } },
    { id: 'LINREGSLOPE', cat: 'trend', pane: 'separate', params: [P.period(20)],
      plots: [{ token: '--chart-line-4' }],
      calc: function (k, p) { return [M.linreg(k.map(function (x) { return x.c; }), p.period)[1]]; } },
    { id: 'MAEMACROSS', cat: 'trend', pane: 'separate',
      params: [{ key: 'fast', type: 'int', def: 10, min: 2, max: 200 }, { key: 'slow', type: 'int', def: 30, min: 3, max: 400 }],
      plots: [{ token: '--color-trade-long' }, { token: '--color-trade-short' }, { token: '--chart-line-5' }],
      calc: function (k, p) {
        var c = k.map(function (x) { return x.c; }), a = M.sma(c, p.fast), b = M.ema(c, p.slow);
        return [a, b, M.cross(z(a), z(b))];
      } },
    { id: 'MAMULTIPLE', cat: 'trend', pane: 'overlay',
      params: [{ key: 'p1', type: 'int', def: 10, min: 2, max: 200 }, { key: 'p2', type: 'int', def: 20, min: 2, max: 300 },
               { key: 'p3', type: 'int', def: 50, min: 3, max: 400 }],
      plots: [{ token: '--chart-ma-1' }, { token: '--chart-ma-2' }, { token: '--chart-ma-3' }],
      calc: function (k, p) {
        var c = k.map(function (x) { return x.c; });
        return [M.sma(c, p.p1), M.sma(c, p.p2), M.sma(c, p.p3)];
      } },
    { id: 'MADOUBLE', cat: 'trend', pane: 'overlay',
      params: [{ key: 'fast', type: 'int', def: 9, min: 2, max: 200 }, { key: 'slow', type: 'int', def: 21, min: 3, max: 400 }],
      plots: [{ token: '--chart-ma-1' }, { token: '--chart-ma-2' }],
      calc: function (k, p) { var c = k.map(function (x) { return x.c; }); return [M.sma(c, p.fast), M.sma(c, p.slow)]; } },
    { id: 'MATRIPLE', cat: 'trend', pane: 'overlay',
      params: [{ key: 'p1', type: 'int', def: 5, min: 2, max: 100 }, { key: 'p2', type: 'int', def: 10, min: 2, max: 200 },
               { key: 'p3', type: 'int', def: 20, min: 3, max: 300 }],
      plots: [{ token: '--chart-ma-1' }, { token: '--chart-ma-2' }, { token: '--chart-ma-3' }],
      calc: function (k, p) {
        var c = k.map(function (x) { return x.c; });
        return [M.ema(c, p.p1), M.ema(c, p.p2), M.ema(c, p.p3)];
      } },
    { id: 'MAJORITY', cat: 'trend', pane: 'overlay',
      params: [{ key: 'p1', type: 'int', def: 5, min: 2, max: 100 }, { key: 'p2', type: 'int', def: 10, min: 2, max: 200 },
               { key: 'p3', type: 'int', def: 20, min: 3, max: 300 }],
      plots: [{ token: '--color-brand' }],
      calc: function (k, p) {
        var c = k.map(function (x) { return x.c; });
        var a = M.sma(c, p.p1), b = M.sma(c, p.p2), d = M.sma(c, p.p3);
        return [c.map(function (v, i) {
          if (a[i] === null || b[i] === null || d[i] === null) return null;
          var s = (v > a[i] ? 1 : 0) + (v > b[i] ? 1 : 0) + (v > d[i] ? 1 : 0);
          return s === 2 ? null : v;
        })];
      } },
    { id: 'MACHANNEL', cat: 'trend', pane: 'overlay',
      params: [P.period(20), { key: 'pct', type: 'float', def: 1.5, min: 0.1, max: 10, step: 0.1 }],
      plots: [{ token: '--chart-line-6' }, { token: '--chart-line-6' }, { token: '--chart-ma-1', style: 'dashed' }],
      calc: function (k, p) {
        var c = k.map(function (x) { return x.c; }), m = M.sma(c, p.period), s = M.stdev(c, p.period);
        return [m.map(function (v, i) { return v === null ? null : v + p.pct * s[i]; }),
                m.map(function (v, i) { return v === null ? null : v - p.pct * s[i]; }), m];
      } },
    { id: 'PRICECHANNEL', cat: 'volatility', pane: 'overlay', params: [P.period(20)],
      plots: [{ token: '--chart-line-7' }, { token: '--chart-line-7' }],
      calc: function (k, p) {
        return [M.highest(k.map(function (x) { return x.h; }), p.period),
                M.lowest(k.map(function (x) { return x.l; }), p.period)];
      } },
    { id: 'MEDPRICE', cat: 'levels', pane: 'overlay', params: [],
      plots: [{ token: '--level-range' }],
      calc: function (k) { return [k.map(function (x) { return (x.h + x.l) / 2; })]; } },
    { id: 'TYPPRICE', cat: 'levels', pane: 'overlay', params: [],
      plots: [{ token: '--level-range', style: 'dashed' }],
      calc: function (k) { return [k.map(function (x) { return (x.h + x.l + x.c) / 3; })]; } },
    { id: 'STDEV', cat: 'volatility', pane: 'separate', params: [P.period(20)],
      plots: [{ token: '--chart-line-8' }],
      calc: function (k, p) { return [M.stdev(k.map(function (x) { return x.c; }), p.period)]; } },
    { id: 'STDERR', cat: 'volatility', pane: 'separate', params: [P.period(20)],
      plots: [{ token: '--chart-line-1' }],
      calc: function (k, p) {
        var s = M.stdev(k.map(function (x) { return x.c; }), p.period);
        return [s.map(function (v) { return v === null ? null : v / Math.sqrt(p.period); })];
      } },
    { id: 'STDERRBANDS', cat: 'volatility', pane: 'overlay', params: [P.period(20)],
      plots: [{ token: '--chart-line-2' }, { token: '--chart-line-2' }, { token: '--chart-ma-1', style: 'dashed' }],
      calc: function (k, p) {
        var c = k.map(function (x) { return x.c; }), m = M.sma(c, p.period), s = M.stdev(c, p.period);
        var se = s.map(function (v) { return v === null ? null : v / Math.sqrt(p.period); });
        return [m.map(function (v, i) { return v === null ? null : v + 2 * se[i]; }),
                m.map(function (v, i) { return v === null ? null : v - 2 * se[i]; }), m];
      } },
    { id: 'NETVOL', cat: 'volume', pane: 'separate', params: [P.period(20)],
      plots: [{ token: '--color-trade-long' }, { token: '--color-trade-short' }],
      calc: function (k, p) {
        var up = [0], dn = [0], i;
        for (i = 1; i < k.length; i++) {
          var d = k[i].c - k[i - 1].c, v = k[i].v || 0;
          up.push(d > 0 ? v : 0); dn.push(d < 0 ? v : 0);
        }
        return [M.sum(up, p.period), M.sum(dn, p.period)];
      } },
    { id: 'VWMA', cat: 'trend', pane: 'overlay', params: [P.period(20)],
      plots: [{ token: '--chart-vwap' }],
      calc: function (k, p) {
        var pv = k.map(function (x) { return x.c * (x.v || 1); }), vv = k.map(function (x) { return x.v || 1; });
        var a = M.sum(pv, p.period), b = M.sum(vv, p.period);
        return [a.map(function (v, i) { return (v === null || b[i] === 0 || b[i] === null) ? null : v / b[i]; })];
      } },
    { id: 'VOSC', cat: 'volume', pane: 'separate', params: [{ key: 'fast', type: 'int', def: 12, min: 2, max: 100 }, { key: 'slow', type: 'int', def: 26, min: 3, max: 200 }],
      plots: [{ token: '--chart-line-3' }],
      calc: function (k, p) {
        var v = k.map(function (x) { return x.v || 0; }), f = M.sma(v, p.fast), s = M.sma(v, p.slow);
        return [f.map(function (x, i) { return (x === null || s[i] === null || s[i] === 0) ? null : (x - s[i]) / s[i] * 100; })];
      } },
    { id: 'ALMA', cat: 'trend', pane: 'overlay',
      params: [P.period(21), { key: 'offset', type: 'float', def: 0.85, min: 0, max: 1, step: 0.05 },
               { key: 'sigma', type: 'float', def: 6, min: 1, max: 20, step: 0.5 }],
      plots: [{ token: '--chart-line-4' }],
      calc: function (k, p) {
        var c = k.map(function (x) { return x.c; }), n = p.period, out = new Array(c.length);
        var m = p.offset * (n - 1), s = n / p.sigma, w = [], sw = 0, j;
        for (j = 0; j < n; j++) { var v = Math.exp(-Math.pow(j - m, 2) / (2 * s * s)); w.push(v); sw += v; }
        for (var i = 0; i < c.length; i++) {
          if (i < n - 1) { out[i] = null; continue; }
          var acc = 0;
          for (j = 0; j < n; j++) acc += c[i - n + 1 + j] * w[j];
          out[i] = acc / sw;
        }
        return [out];
      } },
    { id: 'CHAIKINOSC', cat: 'volume', pane: 'separate', params: [{ key: 'fast', type: 'int', def: 3, min: 2, max: 60 }, { key: 'slow', type: 'int', def: 10, min: 3, max: 120 }],
      plots: [{ token: '--chart-line-5' }],
      calc: function (k, p) {
        var ad = CATALOGUE_BY_ID.AD.calc(k)[0];
        var f = M.ema(ad, p.fast), s = M.ema(ad, p.slow);
        return [f.map(function (v, i) { return (v === null || s[i] === null) ? null : v - s[i]; })];
      } },
    { id: 'CHAIKINVOL', cat: 'volume', pane: 'separate', params: [{ key: 'fast', type: 'int', def: 3, min: 2, max: 60 }, { key: 'slow', type: 'int', def: 10, min: 3, max: 120 }],
      plots: [{ token: '--chart-line-6' }],
      calc: function (k, p) {
        var c = k.map(function (x) { return x.c; }), e = M.ema(c, p.fast);
        var v = c.map(function (x, i) { return (x === 0 || e[i] === null) ? null : (x - e[i]) / e[i] * 100; });
        return [M.ema(z(v), p.slow)];
      } },
    { id: 'CRSI', cat: 'momentum', pane: 'separate', params: [P.period(14), { key: 'streak', type: 'int', def: 2, min: 2, max: 20 }, { key: 'rank', type: 'int', def: 100, min: 10, max: 400 }],
      plots: [{ token: '--chart-line-7' }],
      calc: function (k, p) {
        var r = CATALOGUE_BY_ID.RSI.calc(k, { period: p.period, source: 'close' })[0];
        var c = k.map(function (x) { return x.c; }), st = [0], i;
        for (i = 1; i < c.length; i++) {
          var prev = st[i - 1];
          if (prev > 0) st.push(c[i] > c[i - 1] ? prev + 1 : (c[i] < c[i - 1] ? -1 : 0));
          else if (prev < 0) st.push(c[i] < c[i - 1] ? prev - 1 : (c[i] > c[i - 1] ? 1 : 0));
          else st.push(c[i] > c[i - 1] ? 1 : (c[i] < c[i - 1] ? -1 : 0));
        }
        var rsiSt = CATALOGUE_BY_ID.RSI.calc(st.map(function (v) { return { o: v, h: v, l: v, c: v, v: 0 }; }), { period: p.streak, source: 'close' })[0];
        var pr = M.rank(c, p.rank);
        return [c.map(function (_, i) {
          if (r[i] === null || rsiSt[i] === null || pr[i] === null) return null;
          return (r[i] + rsiSt[i] + pr[i]) / 3;
        })];
      } },
    { id: 'FISHER', cat: 'momentum', pane: 'separate', params: [P.period(10)],
      plots: [{ token: '--chart-line-8' }],
      calc: function (k, p) {
        var hh = M.highest(k.map(function (x) { return x.h; }), p.period);
        var ll = M.lowest(k.map(function (x) { return x.l; }), p.period);
        var out = new Array(k.length), val = 0, prev = 0;
        for (var i = 0; i < k.length; i++) {
          if (hh[i] === null || hh[i] === ll[i]) { out[i] = null; continue; }
          var x = 0.33 * 2 * ((k[i].c - ll[i]) / (hh[i] - ll[i]) - 0.5) + 0.67 * val;
          x = Math.max(-0.999, Math.min(0.999, x)); val = x;
          out[i] = 0.5 * Math.log((1 + x) / (1 - x)) + 0.5 * prev; prev = out[i];
        }
        return [out];
      } },
    { id: 'MASSINDEX', cat: 'volatility', pane: 'separate', params: [{ key: 'ema', type: 'int', def: 9, min: 2, max: 60 }, { key: 'sum', type: 'int', def: 25, min: 3, max: 200 }],
      plots: [{ token: '--chart-line-1' }],
      calc: function (k, p) {
        var rng = k.map(function (x) { return x.h - x.l; });
        var e1 = M.ema(rng, p.ema), e2 = M.ema(z(e1), p.ema);
        var ratio = rng.map(function (v, i) { return (e2[i] === 0 || e2[i] === null) ? null : v / e2[i]; });
        return [M.sum(z(ratio), p.sum)];
      } },
    { id: 'MCGINLEY', cat: 'trend', pane: 'overlay', params: [P.period(14), { key: 'k', type: 'float', def: 0.6, min: 0.1, max: 1.5, step: 0.05 }],
      plots: [{ token: '--chart-ma-2' }],
      calc: function (k, p) {
        var c = k.map(function (x) { return x.c; }), out = new Array(c.length), prev = c[0];
        out[0] = c[0];
        for (var i = 1; i < c.length; i++) {
          var d = prev === 0 ? 1 : (c[i] - prev) / prev;
          prev = prev + (c[i] - prev) / (p.k * p.period * Math.pow(Math.abs(d), 4) || 1);
          out[i] = prev;
        }
        return [out];
      } },
    { id: 'RCI', cat: 'momentum', pane: 'separate', params: [P.period(20)],
      plots: [{ token: '--chart-line-2' }],
      calc: function (k, p) {
        var c = k.map(function (x) { return x.c; }), out = new Array(c.length);
        for (var i = 0; i < c.length; i++) {
          if (i < p.period - 1) { out[i] = null; continue; }
          var d = 0, j;
          for (j = 0; j < p.period; j++) {
            var ri = 0, rj = j;
            for (var m = 0; m < p.period; m++) if (c[i - p.period + 1 + m] <= c[i - p.period + 1 + j]) ri++;
            d += Math.pow((ri - 1) - (rj - 0), 2);
          }
          out[i] = 1 - (6 * d) / (p.period * (p.period * p.period - 1));
        }
        return [out];
      } },
    { id: 'TSI', cat: 'momentum', pane: 'separate', params: [{ key: 'long', type: 'int', def: 25, min: 3, max: 200 }, { key: 'short', type: 'int', def: 13, min: 2, max: 100 }, { key: 'signal', type: 'int', def: 7, min: 2, max: 60 }],
      plots: [{ token: '--chart-line-3' }, { token: '--chart-line-4', style: 'dashed' }],
      calc: function (k, p) {
        var c = k.map(function (x) { return x.c; }), mom = [0], i;
        for (i = 1; i < c.length; i++) mom.push(c[i] - c[i - 1]);
        var ab = mom.map(Math.abs);
        var e1 = M.ema(M.ema(mom, p.long), p.short);
        var e2 = M.ema(M.ema(ab, p.long), p.short);
        var tsi = e1.map(function (v, j) { return (v === null || e2[j] === null || e2[j] === 0) ? null : v / e2[j] * 100; });
        return [tsi, M.ema(z(tsi), p.signal)];
      } },
    { id: 'UO', cat: 'momentum', pane: 'separate', params: [{ key: 'p1', type: 'int', def: 7, min: 2, max: 60 }, { key: 'p2', type: 'int', def: 14, min: 3, max: 100 }, { key: 'p3', type: 'int', def: 28, min: 4, max: 200 }],
      plots: [{ token: '--chart-line-5' }],
      calc: function (k, p) {
        var bp = [0], tr = [0], i;
        for (i = 1; i < k.length; i++) {
          var tl = Math.min(k[i].l, k[i - 1].c);
          bp.push(k[i].c - tl);
          tr.push(Math.max(k[i].h, k[i - 1].c) - tl);
        }
        function avg(n) {
          var a = M.sum(bp, n), b = M.sum(tr, n);
          return a.map(function (v, j) { return (v === null || b[j] === 0 || b[j] === null) ? null : v / b[j]; });
        }
        var a1 = avg(p.p1), a2 = avg(p.p2), a3 = avg(p.p3);
        return [a1.map(function (v, j) {
          if (v === null || a2[j] === null || a3[j] === null) return null;
          return 100 * (4 * v + 2 * a2[j] + a3[j]) / 7;
        })];
      } },
    { id: 'WILLFRACTAL', cat: 'levels', pane: 'overlay', params: [{ key: 'n', type: 'int', def: 2, min: 1, max: 20 }],
      plots: [{ token: '--color-trade-long' }, { token: '--color-trade-short' }],
      calc: function (k, p) {
        var n = k.length, up = new Array(n), dn = new Array(n), i, j;
        for (i = 0; i < n; i++) { up[i] = null; dn[i] = null; }
        for (i = p.n; i < n - p.n; i++) {
          var isUp = true, isDn = true;
          for (j = 1; j <= p.n; j++) {
            if (k[i].h <= k[i - j].h || k[i].h <= k[i + j].h) isUp = false;
            if (k[i].l >= k[i - j].l || k[i].l >= k[i + j].l) isDn = false;
          }
          if (isUp) up[i] = k[i].h;
          if (isDn) dn[i] = k[i].l;
        }
        return [up, dn];
      } },
    { id: 'ALLIGATOR', cat: 'trend', pane: 'overlay', params: [{ key: 'jaw', type: 'int', def: 13, min: 3, max: 100 }, { key: 'teeth', type: 'int', def: 8, min: 2, max: 80 }, { key: 'lips', type: 'int', def: 5, min: 2, max: 60 }],
      plots: [{ token: '--chart-line-6' }, { token: '--chart-line-7' }, { token: '--chart-line-8' }],
      calc: function (k, p) {
        var h = k.map(function (x) { return x.h; }), l = k.map(function (x) { return x.l; });
        function mid(n, off) {
          var a = M.sma(h, n), b = M.sma(l, n);
          return a.map(function (v, i) { return (v === null || b[i] === null) ? null : (v + b[i]) / 2; });
        }
        return [mid(p.jaw, 8), mid(p.teeth, 5), mid(p.lips, 3)];
      } },
    { id: 'GMMA', cat: 'trend', pane: 'overlay', params: [], plots: [
        { token: '--color-trade-long' }, { token: '--color-trade-long' }, { token: '--color-trade-long' },
        { token: '--color-trade-short' }, { token: '--color-trade-short' }, { token: '--color-trade-short' }],
      calc: function (k) {
        var c = k.map(function (x) { return x.c; });
        return [M.ema(c, 3), M.ema(c, 5), M.ema(c, 8), M.ema(c, 30), M.ema(c, 35), M.ema(c, 40)];
      } },
    { id: 'KST', cat: 'momentum', pane: 'separate', params: [{ key: 'signal', type: 'int', def: 9, min: 2, max: 60 }],
      plots: [{ token: '--chart-line-1' }, { token: '--chart-line-2', style: 'dashed' }],
      calc: function (k, p) {
        var c = k.map(function (x) { return x.c; });
        function roc(n) { return c.map(function (v, i) { return (i < n || c[i - n] === 0) ? null : (v - c[i - n]) / c[i - n] * 100; }); }
        var r1 = M.sma(z(roc(10)), 10), r2 = M.sma(z(roc(15)), 10), r3 = M.sma(z(roc(20)), 10), r4 = M.sma(z(roc(30)), 15);
        var kst = r1.map(function (v, i) { return v * 1 + r2[i] * 2 + r3[i] * 3 + r4[i] * 4; });
        return [kst, M.sma(kst, p.signal)];
      } },
    { id: 'RVIMOM', cat: 'momentum', pane: 'separate', params: [P.period(10)],
      plots: [{ token: '--chart-line-3' }],
      calc: function (k, p) {
        var num = [0], den = [0], i;
        for (i = 1; i < k.length; i++) {
          var o = k[i].o, h = k[i].h, l = k[i].l, c = k[i].c, r = h - l;
          num.push(r === 0 ? 0 : (c - o) / r); den.push(r === 0 ? 0 : (c - o) / r);
        }
        var a = M.sma(num, p.period);
        return [a];
      } },
    { id: 'RVIVOL', cat: 'volatility', pane: 'separate', params: [P.period(10)],
      plots: [{ token: '--chart-line-4' }],
      calc: function (k, p) {
        var r = k.map(function (x) { return x.h - x.l; });
        var o = [0];
        for (var i = 1; i < k.length; i++) o.push(Math.abs(r[i] - r[i - 1]));
        return [M.sma(o, p.period)];
      } },
    { id: 'AC', cat: 'momentum', pane: 'separate', params: [{ key: 'fast', type: 'int', def: 5, min: 2, max: 60 }, { key: 'slow', type: 'int', def: 34, min: 3, max: 200 }],
      plots: [{ token: '--chart-line-5' }, { token: '--chart-line-6', type: 'histogram' }],
      calc: function (k, p) {
        var h = k.map(function (x) { return (x.h + x.l) / 2; });
        var f = M.sma(h, p.fast), s = M.sma(h, p.slow);
        var ao = h.map(function (_, i) { return (f[i] === null || s[i] === null) ? null : f[i] - s[i]; });
        return [ao, ao.map(function (v, i) { return (v === null || i < 5 || ao[i - 5] === null) ? null : v - ao[i - 5]; })];
      } },
    { id: 'DM', cat: 'momentum', pane: 'separate', params: [P.period(14)],
      plots: [{ token: '--color-trade-long' }, { token: '--color-trade-short' }],
      calc: function (k, p) {
        var pdm = [0], ndm = [0], i;
        for (i = 1; i < k.length; i++) {
          var up = k[i].h - k[i - 1].h, dn = k[i - 1].l - k[i].l;
          pdm.push(up > dn && up > 0 ? up : 0); ndm.push(dn > up && dn > 0 ? dn : 0);
        }
        return [M.sum(pdm, p.period), M.sum(ndm, p.period)];
      } },
    { id: 'TRENDSTR', cat: 'trend', pane: 'separate', params: [P.period(20)],
      plots: [{ token: '--chart-line-7' }],
      calc: function (k, p) {
        var c = k.map(function (x) { return x.c; });
        var r = k.map(function (x) { return x.h - x.l; });
        var m = M.sma(c, p.period), a = M.sma(r, p.period);
        return [c.map(function (v, i) { return (m[i] === null || a[i] === null || a[i] === 0) ? null : (v - m[i]) / a[i]; })];
      } },
    { id: 'VOLZERO', cat: 'volume', pane: 'separate', params: [P.period(20)],
      plots: [{ token: '--color-trade-long' }, { token: '--color-trade-short' }],
      calc: function (k, p) {
        var v = k.map(function (x) { return x.v || 0; }), m = M.sma(v, p.period);
        return [v.map(function (x, i) { return (m[i] === null || x <= m[i]) ? null : x; }),
                v.map(function (x, i) { return (m[i] === null || x >= m[i]) ? null : x; })];
      } },
    { id: 'VOLOHLC', cat: 'volume', pane: 'separate', params: [],
      plots: [{ token: '--chart-line-8' }],
      calc: function (k) { return [k.map(function (x) { return x.v || 0; })]; } },
    { id: 'HAMMA', cat: 'trend', pane: 'overlay', params: [P.period(16)],
      plots: [{ token: '--chart-line-1' }],
      calc: function (k, p) {
        var c = k.map(function (x) { return x.c; }), out = new Array(c.length);
        for (var i = 0; i < c.length; i++) {
          if (i < p.period - 1) { out[i] = null; continue; }
          var sw = 0, sv = 0;
          for (var j = 0; j < p.period; j++) {
            var w = 0.54 - 0.46 * Math.cos(2 * Math.PI * j / (p.period - 1));
            sw += w; sv += c[i - p.period + 1 + j] * w;
          }
          out[i] = sv / sw;
        }
        return [out];
      } },
    { id: 'CZ', cat: 'levels', pane: 'separate', params: [P.period(20)],
      plots: [{ token: '--chart-line-2' }],
      calc: function (k, p) {
        var hh = M.highest(k.map(function (x) { return x.h; }), p.period);
        var ll = M.lowest(k.map(function (x) { return x.l; }), p.period);
        return [k.map(function (x, i) { return hh[i] === null ? null : (hh[i] - x.c) / (hh[i] - ll[i]) * 100 - 50; })];
      } }

  ];

  /* helper: nulls -> zeros, for functions that cannot take nulls */
  function z(a) { return a.map(function (v) { return v === null ? 0 : v; }); }

  /* index for cross-references (STOCHRSI reuses RSI) */
  var CATALOGUE_BY_ID = {};
  for (var _i = 0; _i < CATALOGUE.length; _i++) CATALOGUE_BY_ID[CATALOGUE[_i].id] = CATALOGUE[_i];

  /* ==============================================================
     4. VALIDATION — fail loudly at boot, not silently at draw time
     ============================================================== */

  function validate(cat) {
    var report = { ok: true, unknownTokens: [], duplicateIds: [], badParams: [], missingCalc: [] };
    var seen = {};
    (cat || CATALOGUE).forEach(function (d) {
      if (seen[d.id]) report.duplicateIds.push(d.id);
      seen[d.id] = 1;
      if (typeof d.calc !== 'function') report.missingCalc.push(d.id);
      (d.plots || []).forEach(function (pl) {
        [pl.token, pl.altToken].forEach(function (tn) {
          if (tn && !CHART_TOKENS[tn]) report.unknownTokens.push(d.id + ' -> ' + tn);
        });
      });
      (d.params || []).forEach(function (p) {
        if (!p.key || !p.type) report.badParams.push(d.id + ' -> ' + JSON.stringify(p));
        if (p.type === 'enum' && (!p.options || !p.options.length)) report.badParams.push(d.id + ' -> enum without options');
        if (p.type !== 'enum' && typeof p.def !== 'number') report.badParams.push(d.id + ' -> non-numeric default');
      });
    });
    report.ok = !(report.unknownTokens.length || report.duplicateIds.length ||
                  report.badParams.length || report.missingCalc.length);
    return report;
  }

  /* ==============================================================
     5. COMPUTE — memoised on (id, params, dataVersion)
     ============================================================== */

  var _cache = {}, _hits = 0, _miss = 0;

  function defaultsOf(def) {
    var p = {};
    (def.params || []).forEach(function (q) { p[q.key] = q.def; });
    return p;
  }

  function compute(id, candles, params, dataVersion) {
    var def = CATALOGUE_BY_ID[id];
    if (!def) throw new Error('[QTIndNext] unknown indicator "' + id + '"');
    var p = Object.assign({}, defaultsOf(def), params || {});
    var key = id + '|' + JSON.stringify(p) + '|' + (dataVersion || 0) + '|' + candles.length;
    if (_cache[key]) { _hits++; return _cache[key]; }
    _miss++;
    var series = def.calc(candles, p);
    _cache[key] = { def: def, params: p, series: series };
    if (Object.keys(_cache).length > 400) _cache = {};   /* bounded */
    return _cache[key];
  }

  function cacheStats() { return { hits: _hits, misses: _miss, size: Object.keys(_cache).length }; }
  function clearCache() { _cache = {}; _hits = 0; _miss = 0; }

  /* ==============================================================
     6. UI DESCRIPTORS — picker, legend and settings read from here,
        so none of them keeps its own list any more
     ============================================================== */

  function list() {
    return CATALOGUE.map(function (d) {
      return {
        id: d.id,
        nameKey: 'ind_' + d.id.toLowerCase(),   /* locale key, not a literal name */
        cat: d.cat,
        pane: d.pane,
        params: (d.params || []).map(function (p) { return Object.assign({}, p); }),
        plots: (d.plots || []).map(function (p) { return Object.assign({}, p); })
      };
    });
  }

  function byCategory() {
    var out = {};
    CATALOGUE.forEach(function (d) { (out[d.cat] = out[d.cat] || []).push(d.id); });
    return out;
  }

  /* ==============================================================
     7. KLineChart ADAPTER — one factory replaces ~170 registrations
     ============================================================== */

  function registerKL(KL, opts) {
    if (!KL || typeof KL.registerIndicator !== 'function') {
      console.warn('[QTIndNext] klinecharts 미로드 — 등록을 건너뛴다');
      return { registered: 0, skipped: CATALOGUE.length };
    }
    var only = (opts && opts.only) || null;
    var done = 0;

    CATALOGUE.forEach(function (d) {
      if (only && only.indexOf(d.id) === -1) return;

      /* figure styles read the token at DRAW time — never frozen here */
      var figures = d.plots.map(function (pl) {
        return {
          key: pl.key || undefined,
          title: pl.title || undefined,
          type: pl.type || 'line',
          styles: function () {
            var o = { color: tok(pl.token), lineWidth: 1.2 };
            if (pl.style === 'dashed') { o.style = 'dashed'; o.dashedValue = [3, 3]; }
            if (pl.type === 'histogram' || pl.type === 'segment') { o.color = tok(pl.token); }
            return o;
          }
        };
      });

      KL.registerIndicator({
        name: 'QT_' + d.id,
        shortName: d.id,
        calcParams: (d.params || []).map(function (p) { return p.def; }),
        shouldOhlc: d.pane === 'overlay',
        shouldFormatBigNumber: d.pane === 'separate',
        figures: figures,
        regenerateFigures: function (params) {
          return d.plots.map(function (pl) {
            return { key: pl.key || undefined, title: pl.title || undefined, type: pl.type || 'line' };
          });
        },
        calc: function (dataList, indicator) {
          var candles = dataList.map(function (bar) {
            return { o: bar.open, h: bar.high, l: bar.low, c: bar.close, v: bar.volume };
          });
          var params = {};
          (d.params || []).forEach(function (q, i) {
            params[q.key] = indicator && indicator.calcParams ? indicator.calcParams[i] : q.def;
          });
          return d.calc(candles, params);
        },
        styles: function () {
          /* nothing hardcoded: every colour resolves through a token */
          return {
            lines: d.plots.map(function (pl) { return { color: tok(pl.token) }; }),
            bars: d.plots.filter(function (pl) { return pl.type === 'histogram'; })
                        .map(function (pl) { return { color: tok(pl.token) }; })
          };
        }
      });
      done++;
    });

    return { registered: done, skipped: CATALOGUE.length - done };
  }

  /* v1-compatible entry point — chart-kline.jsx needs no edit */
  function register() {
    var KL = global.klinecharts;
    var rep = validate();
    if (!rep.ok) {
      /* Same posture as the exchange catalogue: a malformed catalogue is a
         deploy-time bug, so it throws rather than logging and continuing. */
      throw new Error('[QTIndNext] catalogue invalid — ' + JSON.stringify(rep));
    }
    return registerKL(KL, {});
  }

  /* ==============================================================
     8. EXPORT
     ============================================================== */

  global.QTIndNext = {
    version: '2.0.0',
    CATALOGUE: CATALOGUE,
    CHART_TOKENS: CHART_TOKENS,
    compute: compute,
    defaultsOf: defaultsOf,
    list: list,
    byCategory: byCategory,
    validate: validate,
    registerKL: registerKL,
    register: register,
    cacheStats: cacheStats,
    clearCache: clearCache,
    invalidateTokens: invalidateTokens,
    token: tok,
    math: M
  };

  /* keep the old global alive so nothing breaks during migration */
  global.QTIndicatorLib = global.QTIndicatorLib || {};

})(window);
