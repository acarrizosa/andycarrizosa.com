/* Ideal points app, shared by every chamber: one scatterplot of the ideal points by
   session or by year, and the cutting line and votes of any bill you search for.
   Each chamber's page loads data/ideals.js (window.LEGISLAB_DATA, with the labels in
   meta) and, on demand, data/bills/VIEW_PERIOD.js (window.LEGISLAB_BILLS[view/period]),
   both made by app/make_app_data.R. Everything runs in the browser. The page is always
   light, with the light palette of legislab.org, and the figure itself is white. */
(function () {
  'use strict';

  var DATA = window.LEGISLAB_DATA;
  if (!DATA || !window.Plotly) {
    document.getElementById('plot').textContent = 'No se pudo cargar el gráfico (faltan data/ideals.js o Plotly).';
    return;
  }
  var META = DATA.meta || {};

  // ---- text in both languages. The chamber's own words (title, deputy/senator, source) come from meta
  var I18N = {
    es: {
      skip: 'Saltar al contenido',
      view: 'Vista', bySession: 'Por sesión', byYear: 'Por año', period: 'Período',
      prev: 'Anterior', next: 'Siguiente',
      ci: 'Intervalos de credibilidad (95%)', winrate: 'Tamaño = tasa de victoria',
      key: 'Partidos',
      hint: 'Pase el cursor sobre un punto para ver el nombre. Haga clic en un partido de la leyenda del gráfico para ocultarlo o mostrarlo.',
      table: 'Ver tabla de datos',
      thParty: 'Partido', thVote: 'Voto', thX: 'Dim. 1', thXci: 'IC 95% dim. 1', thY: 'Dim. 2', thYci: 'IC 95% dim. 2', thWin: 'Tasa de victoria', thVotes: 'Votos',
      axis1: 'Dimensión 1', axis2: 'Dimensión 2',
      session: 'Sesión', year: 'Año',
      hoverWin: 'Tasa de victoria', hoverVotes: 'votos', hoverCi: 'IC 95%', hoverVote: 'Voto',
      noParty: 'Sin partido registrado',
      plotAria: 'Diagrama de dispersión de puntos ideales',
      searchLabel: 'Buscar un proyecto',
      searchPlaceholder: 'Buscar un proyecto por título, fecha o número de voto…',
      loading: 'Cargando los proyectos del período…',
      loadError: 'No se pudieron cargar los proyectos de este período.',
      noResults: 'Ningún proyecto coincide.',
      moreResults: 'Hay más resultados: escriba más para acotar la búsqueda.',
      loadingOthers: 'Buscando el número en los otros períodos…',
      otherPeriod: 'Es de otro período, {period}. Al elegirlo se cambia a ese período.',
      numberHint: 'En {site} el número de un voto es el de la dirección de su página, no el de su PDF. Los votos casi unánimes no están aquí: el modelo los deja fuera y no tienen línea de corte.',
      untitled: '(sin título)',
      voteYes: 'A favor', voteNo: 'En contra', voteNa: 'Sin voto',
      symYes: 'a favor', symNo: 'en contra', symNa: 'sin voto',
      symLine: 'línea de corte del modelo; el lado sombreado es donde predice voto a favor',
      clear: 'Quitar', inFavor: 'a favor', against: 'en contra', angle: 'ángulo', result: 'Resultado', seeVote: 'ver este voto en',
      updated: 'Actualizado con los votos hasta el', updatedPeriod: 'último voto del período',
      months: ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']
    },
    en: {
      skip: 'Skip to content',
      view: 'View', bySession: 'By session', byYear: 'By year', period: 'Period',
      prev: 'Previous', next: 'Next',
      ci: 'Credible intervals (95%)', winrate: 'Size = win rate',
      key: 'Parties',
      hint: 'Hover over a point to see the name. Click a party in the chart legend to hide or show it.',
      table: 'Show data table',
      thParty: 'Party', thVote: 'Vote', thX: 'Dim. 1', thXci: '95% CI dim. 1', thY: 'Dim. 2', thYci: '95% CI dim. 2', thWin: 'Win rate', thVotes: 'Votes',
      axis1: 'Dimension 1', axis2: 'Dimension 2',
      session: 'Session', year: 'Year',
      hoverWin: 'Win rate', hoverVotes: 'votes', hoverCi: '95% CI', hoverVote: 'Vote',
      noParty: 'No party recorded',
      plotAria: 'Scatterplot of ideal points',
      searchLabel: 'Search for a bill',
      searchPlaceholder: 'Search for a bill by title, date or vote number…',
      loading: 'Loading the bills of this period…',
      loadError: 'The bills of this period could not be loaded.',
      noResults: 'No bill matches.',
      moreResults: 'There are more results: type more to narrow the search.',
      loadingOthers: 'Looking for the number in the other periods…',
      otherPeriod: 'It is from another period, {period}. Picking it switches to that period.',
      numberHint: 'In {site} the number of a vote is the one in the address of its page, not the one of its PDF. Nearly unanimous votes are not here: the model leaves them out and they have no cutting line.',
      untitled: '(no title)',
      voteYes: 'Yes', voteNo: 'No', voteNa: 'No vote',
      symYes: 'voted yes', symNo: 'voted no', symNa: 'no vote',
      symLine: 'the model’s cutting line; the shaded side is where it predicts a yes vote',
      clear: 'Clear', inFavor: 'yes', against: 'no', angle: 'angle', result: 'Result', seeVote: 'see this vote in',
      updated: 'Updated with votes through', updatedPeriod: 'last vote of the period',
      months: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
    }
  };

  // ---- state -----------------------------------------------------------------------
  var state = { view: 'session', period: null, ci: false, winrate: false, lang: 'es', bill: null };

  var $ = function (sel) { return document.querySelector(sel); };
  var plotEl = $('#plot');
  var periodEl = $('#period');
  var prevEl = $('#prev');
  var nextEl = $('#next');
  var ciEl = $('#ci');
  var winEl = $('#winrate');
  var searchEl = $('#bill-search');
  var resultsEl = $('#bill-results');
  var billInfoEl = $('#bill-info');
  var billClearEl = $('#bill-clear');

  var partyIndex = {};
  DATA.parties.forEach(function (p, i) { partyIndex[p.code] = i; });

  function t(key) { return I18N[state.lang][key] || key; }
  function m(key) { var v = META[key]; return v && typeof v === 'object' ? (v[state.lang] || v.es || '') : (v || ''); }
  function legislator(which) { var l = (META.legislator || {})[state.lang] || {}; return l[which] || ''; }
  function periods() { return DATA.views[state.view].periods; }
  function rows() { return DATA.views[state.view].data[state.period] || []; }
  function periodLabel(p) { return p.replace('-', '–'); }
  function voteName(b) { return b.v.replace(/^v_/, ''); }   // the votes of the Senate are v_ and their number in silpy
  function partyName(p) { return p.code === 'na' ? t('noParty') : (p.name || p.code); }
  function longDate(iso) {   // 2026-11-05 -> 5 de noviembre de 2026 / 5 November 2026
    if (!iso) return '';
    var y = iso.slice(0, 4), mo = parseInt(iso.slice(5, 7), 10) - 1, d = parseInt(iso.slice(8, 10), 10);
    var month = I18N[state.lang].months[mo] || '';
    return state.lang === 'es' ? d + ' de ' + month + ' de ' + y : d + ' ' + month + ' ' + y;
  }
  function periodLast() { var l = DATA.views[state.view].last; return l ? l[state.period] : ''; }

  // ---- colors of the figure: white with dark ink, the same on the page and in the png.
  // Only the font comes from the site
  function theme() {
    var cs = getComputedStyle(document.documentElement);
    var display = cs.getPropertyValue('--display').trim() || 'Archivo, "Helvetica Neue", Arial, sans-serif';
    return { paper: '#ffffff', ink: '#17201b', gray: '#58635c', line: '#d7ded9', display: display };
  }
  function hexToRgba(hex, a) {
    var n = parseInt(hex.slice(1), 16);
    return 'rgba(' + (n >> 16 & 255) + ',' + (n >> 8 & 255) + ',' + (n & 255) + ',' + a + ')';
  }

  // ---- bills of a period: loaded on demand by adding a <script> tag ------------------
  var billsPending = {};
  function billsKey(view, period) { return view + '/' + period; }
  function billsOf(view, period) { return (window.LEGISLAB_BILLS || {})[billsKey(view, period)] || null; }
  function loadBills(view, period, cb) {
    var key = billsKey(view, period);
    if (billsOf(view, period)) { cb(null, billsOf(view, period)); return; }
    if (billsPending[key]) { billsPending[key].push(cb); return; }
    billsPending[key] = [cb];
    var s = document.createElement('script');
    s.src = 'data/bills/' + view + '_' + period + '.js';
    s.charset = 'utf-8';
    var done = function (err) {
      var cbs = billsPending[key]; delete billsPending[key];
      cbs.forEach(function (f) { f(err, billsOf(view, period)); });
    };
    s.onload = function () { done(billsOf(view, period) ? null : new Error('empty')); };
    s.onerror = function () { done(new Error('load')); };
    document.head.appendChild(s);
  }
  function currentBill() {
    if (!state.bill) return null;
    var bills = billsOf(state.view, state.period);
    if (!bills) return null;
    for (var i = 0; i < bills.length; i++) if (bills[i].v === state.bill) return bills[i];
    return null;
  }
  // which session or year a date (yyyy-mm-dd) falls in. Periods run from July 1 to June 30,
  // and the sessions are the ones in the data
  function periodOfDate(view, date) {
    var y = parseInt(date.slice(0, 4), 10), mo = parseInt(date.slice(5, 7), 10);
    var start = mo >= 7 ? y : y - 1;
    if (view === 'year') return start + '-' + (start + 1);
    var found = null;
    DATA.views.session.periods.forEach(function (p) {
      var a = parseInt(p.slice(0, 4), 10), b = parseInt(p.slice(5, 9), 10);
      if (start >= a && start < b) found = p;
    });
    return found;
  }

  // ---- url hash: #view=year&period=2010-2011&bill=s12 so a view can be linked to -------
  function readHash() {
    var h = location.hash.replace(/^#/, '');
    if (!h) return;
    h.split('&').forEach(function (kv) {
      var k = kv.split('=')[0], v = decodeURIComponent(kv.split('=')[1] || '');
      if (k === 'view' && DATA.views[v]) state.view = v;
      if (k === 'period') state.period = v;
      if (k === 'ci') state.ci = v === '1';
      if (k === 'winrate') state.winrate = v === '1';
      if (k === 'lang' && I18N[v]) state.lang = v;
      if (k === 'bill' && /^[A-Za-z0-9_.-]+$/.test(v)) state.bill = v;
    });
  }
  function writeHash() {
    var h = 'view=' + state.view + '&period=' + encodeURIComponent(state.period) +
      (state.ci ? '&ci=1' : '') + (state.winrate ? '&winrate=1' : '') +
      (state.bill ? '&bill=' + encodeURIComponent(state.bill) : '') + (state.lang !== 'es' ? '&lang=' + state.lang : '');
    if (history.replaceState) history.replaceState(null, '', '#' + h); else location.hash = h;
  }

  // ---- controls ---------------------------------------------------------------------
  function fillPeriods() {
    var ps = periods();
    if (ps.indexOf(state.period) < 0) state.period = ps[ps.length - 1];
    periodEl.textContent = '';
    ps.forEach(function (p) {
      var o = document.createElement('option');
      o.value = p;
      o.textContent = periodLabel(p);
      if (p === state.period) o.selected = true;
      periodEl.appendChild(o);
    });
    var i = ps.indexOf(state.period);
    prevEl.disabled = i <= 0;
    nextEl.disabled = i >= ps.length - 1;
  }

  function applyLanguage() {
    document.documentElement.lang = state.lang;
    document.querySelectorAll('[data-i18n]').forEach(function (el) { el.textContent = t(el.getAttribute('data-i18n')); });
    document.querySelectorAll('.lang button').forEach(function (b) {
      var on = b.getAttribute('data-lang') === state.lang;
      b.classList.toggle('is-active', on);
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
    $('#app-title').textContent = m('title');
    $('#app-subtitle').textContent = m('subtitle');
    $('#th-name').textContent = legislator('column');
    $('#source').textContent = m('source');
    $('#updated').textContent = t('updated') + ' ' + longDate(DATA.lastVote) + '.';
    $('#year').textContent = String(new Date().getFullYear());
    prevEl.setAttribute('aria-label', t('prev')); prevEl.title = t('prev');
    nextEl.setAttribute('aria-label', t('next')); nextEl.title = t('next');
    plotEl.setAttribute('aria-label', t('plotAria'));
    searchEl.placeholder = t('searchPlaceholder');
    document.title = m('title') + ' · LegisLab';
  }

  // ---- the plot ---------------------------------------------------------------------
  var MAX_DIAM = 26;   // px, diameter of the point with the highest win rate
  var BASE_DIAM = 10;  // px, when win rate is off
  var VOTE_DIAM = 14;  // px, the + and − when a bill is selected
  var NA_SCALE = 0.45; // the dot of a legislator with no vote, relative to the others (area)

  // bounding box of the points (and their intervals when shown), with a margin
  function bbox() {
    var data = rows(), xs = [], ys = [];
    data.forEach(function (r) {
      xs.push(state.ci ? r.xl : r.x); xs.push(state.ci ? r.xu : r.x);
      ys.push(state.ci ? r.yl : r.y); ys.push(state.ci ? r.yu : r.y);
    });
    var x0 = Math.min.apply(null, xs), x1 = Math.max.apply(null, xs);
    var y0 = Math.min.apply(null, ys), y1 = Math.max.apply(null, ys);
    var px = (x1 - x0 || 1) * 0.06, py = (y1 - y0 || 1) * 0.06;
    return { x0: x0 - px, x1: x1 + px, y0: y0 - py, y1: y1 + py };
  }

  // the cutting line of a bill clipped to the box, and the part of the box where the model predicts yes
  function cutline(bill, box) {
    var pts = [];
    if (bill.s === null || bill.s === undefined) {           // vertical line
      pts = [{ x: bill.xi, y: box.y0 }, { x: bill.xi, y: box.y1 }];
    } else {
      var cand = [
        { x: box.x0, y: bill.i + bill.s * box.x0 }, { x: box.x1, y: bill.i + bill.s * box.x1 }
      ];
      if (bill.s !== 0) cand.push({ x: (box.y0 - bill.i) / bill.s, y: box.y0 }, { x: (box.y1 - bill.i) / bill.s, y: box.y1 });
      var ex = (box.x1 - box.x0) * 1e-6, ey = (box.y1 - box.y0) * 1e-6;
      pts = cand.filter(function (p) { return p.x >= box.x0 - ex && p.x <= box.x1 + ex && p.y >= box.y0 - ey && p.y <= box.y1 + ey; });
      pts.sort(function (a, b) { return a.x - b.x || a.y - b.y; });
      if (pts.length > 2) pts = [pts[0], pts[pts.length - 1]];
    }
    // yes side: b1*x + b2*y - d > 0
    var yes = function (p) { return bill.b1 * p.x + bill.b2 * p.y - bill.d > 0; };
    var corners = [{ x: box.x0, y: box.y0 }, { x: box.x1, y: box.y0 }, { x: box.x1, y: box.y1 }, { x: box.x0, y: box.y1 }];
    var poly = corners.filter(yes).concat(pts);
    if (poly.length >= 3) {
      var cx = 0, cy = 0;
      poly.forEach(function (p) { cx += p.x / poly.length; cy += p.y / poly.length; });
      poly.sort(function (a, b) { return Math.atan2(a.y - cy, a.x - cx) - Math.atan2(b.y - cy, b.x - cx); });
    } else poly = [];
    return { line: pts, yesSide: poly };
  }

  function buildTraces(th) {
    var data = rows();
    var bill = currentBill();
    var box = bbox();
    var byParty = {};
    data.forEach(function (r, idx) { r._i = idx; (byParty[r.p] = byParty[r.p] || []).push(r); });

    var maxW = 0;
    data.forEach(function (r) { if (r.w > maxW) maxW = r.w; });

    var dim = '<span style="color:' + th.gray + '">';
    var hover = '<b>%{customdata[0]}</b><br>%{customdata[1]}' +
      (bill ? '<br><b>' + t('hoverVote') + ': %{customdata[6]}</b>' : '') +
      '<br>' + t('axis1') + ': %{x:.2f}' + (state.ci ? ' ' + dim + '(' + t('hoverCi') + ' %{customdata[3]})</span>' : '') +
      '<br>' + t('axis2') + ': %{y:.2f}' + (state.ci ? ' ' + dim + '(' + t('hoverCi') + ' %{customdata[4]})</span>' : '') +
      '<br>' + t('hoverWin') + ': %{customdata[2]}%' +
      '<br>' + dim + '%{customdata[5]} ' + t('hoverVotes') + '</span><extra></extra>';

    var voteOf = function (r) { return bill ? bill.votes.charAt(r._i) : ''; };
    var voteLabel = { y: t('voteYes'), n: t('voteNo'), '.': t('voteNa') };
    var voteSymbol = { y: 'cross-thin', n: 'line-ew', '.': 'circle' };

    var traces = [];

    if (bill) {
      var cl = cutline(bill, box);
      if (cl.yesSide.length) {
        traces.push({
          type: 'scatter', mode: 'lines', fill: 'toself', fillcolor: hexToRgba(th.ink, 0.05),
          x: cl.yesSide.map(function (p) { return p.x; }).concat([cl.yesSide[0].x]),
          y: cl.yesSide.map(function (p) { return p.y; }).concat([cl.yesSide[0].y]),
          line: { width: 0 }, hoverinfo: 'skip', showlegend: false, name: 'yes side'
        });
      }
      if (cl.line.length === 2) {
        traces.push({
          type: 'scatter', mode: 'lines',
          x: cl.line.map(function (p) { return p.x; }), y: cl.line.map(function (p) { return p.y; }),
          line: { color: th.ink, width: 1.5 }, hoverinfo: 'skip', showlegend: false, name: 'cutline'
        });
      }
    }

    DATA.parties.filter(function (p) { return byParty[p.code]; }).forEach(function (p) {
      var rs = byParty[p.code];
      var trace = {
        type: 'scatter', mode: 'markers',
        name: p.code + (p.code === 'na' ? ' (' + t('noParty') + ')' : ''),
        legendgroup: p.code,
        x: rs.map(function (r) { return r.x; }),
        y: rs.map(function (r) { return r.y; }),
        customdata: rs.map(function (r) {
          return [r.n, partyName(p), r.w.toFixed(1),
            r.xl.toFixed(2) + ' – ' + r.xu.toFixed(2),
            r.yl.toFixed(2) + ' – ' + r.yu.toFixed(2),
            r.v, voteLabel[voteOf(r)] || ''];
        }),
        hovertemplate: hover,
        hoverlabel: { bgcolor: th.paper, bordercolor: p.color, font: { color: th.ink, size: 13, family: th.display }, align: 'left' },
        marker: { color: p.color, opacity: 0.9, line: { color: th.paper, width: 1.5 } }
      };
      // size: by win rate (area) or constant. With a bill, legislators with no vote get a small dot
      var scale = function (r) { return bill && voteOf(r) === '.' ? NA_SCALE : 1; };
      if (state.winrate) {
        trace.marker.size = rs.map(function (r) { return r.w * scale(r); });
        trace.marker.sizemode = 'area';
        trace.marker.sizeref = 2 * maxW / (MAX_DIAM * MAX_DIAM);
        trace.marker.sizemin = 3;
      } else if (bill) {
        trace.marker.size = rs.map(function (r) { return VOTE_DIAM * Math.sqrt(scale(r)); });
      } else {
        trace.marker.size = BASE_DIAM;
      }
      // with a bill: + for yes, − for no, dot for NA. The thin symbols are drawn with marker.line
      if (bill) {
        trace.marker.symbol = rs.map(function (r) { return voteSymbol[voteOf(r)] || 'circle'; });
        trace.marker.line = { color: p.color, width: 2.5 };
        trace.marker.opacity = 0.95;
      }
      if (state.ci) {
        var ciStyle = { type: 'data', symmetric: false, color: hexToRgba(p.color, 0.35), thickness: 1, width: 0 };
        trace.error_x = Object.assign({
          array: rs.map(function (r) { return r.xu - r.x; }),
          arrayminus: rs.map(function (r) { return r.x - r.xl; })
        }, ciStyle);
        trace.error_y = Object.assign({
          array: rs.map(function (r) { return r.yu - r.y; }),
          arrayminus: rs.map(function (r) { return r.y - r.yl; })
        }, ciStyle);
      }
      if (bill) {
        // the legend shows the first symbol of a trace, so with a bill it would show a + or a −.
        // This empty trace carries the legend entry with a plain dot; clicking it hides the whole party.
        trace.showlegend = false;
        traces.push({
          type: 'scatter', mode: 'markers', name: trace.name, legendgroup: p.code,
          x: [null], y: [null], marker: { color: p.color, size: BASE_DIAM, symbol: 'circle' },
          hoverinfo: 'skip', showlegend: true
        });
      }
      traces.push(trace);
    });
    return traces;
  }

  function buildLayout(th) {
    var narrow = plotEl.clientWidth < 700;
    var bill = currentBill();
    var box = bbox();
    var axis = {
      zeroline: true, zerolinecolor: th.line, zerolinewidth: 1.5,
      gridcolor: hexToRgba(th.line, 0.6), gridwidth: 1, showline: false,
      ticks: 'outside', tickcolor: th.line, ticklen: 4, tickfont: { color: th.gray, size: 12 },
      title: { font: { color: th.gray, size: 13 }, standoff: 10 }
    };
    var xaxis = JSON.parse(JSON.stringify(axis)); xaxis.title.text = t('axis1');
    var yaxis = JSON.parse(JSON.stringify(axis)); yaxis.title.text = t('axis2');
    if (bill) {   // fixed to the box so the shaded side reaches the edges
      xaxis.range = [box.x0, box.x1]; yaxis.range = [box.y0, box.y1];
    } else {
      xaxis.autorange = true; yaxis.autorange = true;
    }
    var small = '<span style="color:' + th.gray + ';font-size:13px">';
    var titleText = (state.view === 'session' ? t('session') : t('year')) + ' ' + periodLabel(state.period) +
      '  ' + small + rows().length + ' ' + legislator('many') + '</span>';
    if (bill) titleText += '  ' + small + '· ' + bill.f + ' · ' + voteName(bill) + '</span>';
    return {
      title: { text: titleText, x: 0, xanchor: 'left', font: { size: 16, color: th.ink } },
      paper_bgcolor: th.paper, plot_bgcolor: th.paper,
      font: { family: th.display, color: th.ink },
      margin: { l: 56, r: narrow ? 16 : 24, t: 48, b: narrow ? 110 : 82 },
      xaxis: xaxis, yaxis: yaxis,
      // the date of the last vote, under the x axis title, so it's in the png too. On narrow
      // screens the horizontal legend is there, so only the line under the chart says it
      annotations: narrow ? [] : [{
        text: t('updated') + ' ' + longDate(DATA.lastVote) +
          (periodLast() && periodLast() !== DATA.lastVote ? ' · ' + t('updatedPeriod') + ': ' + longDate(periodLast()) : ''),
        xref: 'paper', yref: 'paper', x: 1, y: 0, xanchor: 'right', yanchor: 'top', yshift: -64,
        showarrow: false, font: { size: 11, color: th.gray }
      }],
      hovermode: 'closest',
      legend: narrow
        ? { orientation: 'h', x: 0, y: -0.22, yanchor: 'top', itemsizing: 'constant', font: { size: 12, color: th.ink } }
        : { orientation: 'v', x: 1.01, y: 1, xanchor: 'left', itemsizing: 'constant', font: { size: 12, color: th.ink } },
      uirevision: state.view + (bill ? '/' + state.period + '/' + bill.v : ''),   // keeps legend choices and zoom while the same thing is shown
      dragmode: 'pan'
    };
  }

  var CONFIG = {
    responsive: true, displaylogo: false, scrollZoom: false, showTips: false,
    modeBarButtonsToRemove: ['select2d', 'lasso2d', 'autoScale2d', 'toggleSpikelines', 'hoverCompareCartesian', 'hoverClosestCartesian'],
    toImageButtonOptions: { format: 'png', filename: META.pngName || 'puntos_ideales', scale: 2 }
  };

  // ---- bill search ------------------------------------------------------------------
  var MAX_RESULTS = 40;
  var activeResult = -1;

  function normalize(s) {
    return String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  }
  function billHaystack(b) {
    if (!b._h) b._h = normalize(b.t + ' ' + b.f + ' ' + b.v + ' ' + b.r + ' ' + (b.e || '') + ' ' + b.f.split('-').reverse().join('/') + ' ' + b.f.split('-').reverse().join('-'));
    return b._h;
  }
  // the words that were typed. The address of the page of a vote in silpy counts as its number
  var linkEnd = META.voteLink ? normalize(META.voteLink.url).match(/[^\/]*\/?$/)[0] : '';   // votacion/
  function queryWords(q) {
    return normalize(q).split(/\s+/).filter(Boolean).map(function (w) {
      var at = linkEnd ? w.indexOf(linkEnd) : -1;
      var n = at < 0 ? null : w.slice(at + linkEnd.length).match(/^\d+/);
      return n ? n[0] : w;
    });
  }
  // the number in silpy counts from its start and with 5 digits or more, so that years and numbers of
  // laws don't bring it up. The number in the name of a document of silpy (VOTACION-103548.pdf) is
  // another one, that isn't in the data
  function hasWord(b, w) {
    return billHaystack(b).indexOf(w) >= 0 || (!!b.q && /^\d{5,}$/.test(w) && b.q.indexOf(w) === 0);
  }
  function searchBills(bills, q) {
    var words = queryWords(q);
    var out = [];
    for (var i = 0; i < bills.length && out.length <= MAX_RESULTS; i++) {
      var ok = true;
      for (var j = 0; j < words.length; j++) if (!hasWord(bills[i], words[j])) { ok = false; break; }
      if (ok) out.push(bills[i]);
    }
    return out;
  }
  // the number in silpy, if that is all that was typed. They have 6 digits, and the ones of the bills 7
  function onlyNumber(q) {
    var words = queryWords(q);
    return META.voteLink && words.length === 1 && /^\d{6}$/.test(words[0]) ? words[0] : '';
  }
  // a number in silpy is of one vote, in one period. When it isn't in the period on the screen this looks for
  // it in the others, from the last one back, and stops when the periods with numbers end (silpy starts in 2018)
  function findNumber(number, cb) {
    var view = state.view, ps = periods().slice().reverse(), any = false, failed = null;
    function look(i) {
      if (i >= ps.length) { cb(failed, null); return; }
      loadBills(view, ps[i], function (err, bills) {
        var has = false, hit = null;
        if (err) failed = err;
        (bills || []).forEach(function (b) { if (b.q) has = true; if (b.q === number) hit = b; });
        if (hit) cb(null, hit, ps[i]);
        else if (any && bills && !has) cb(failed, null);
        else { any = any || has; look(i + 1); }
      });
    }
    look(0);
  }
  function resultNote(text) {
    resultsEl.textContent = '';
    var li = document.createElement('li'); li.className = 'r-note'; li.textContent = text;
    resultsEl.appendChild(li);
    resultsEl.hidden = false;
    searchEl.setAttribute('aria-expanded', 'true');
  }
  function showResults() {
    var q = searchEl.value;
    var bills = billsOf(state.view, state.period);
    if (!bills) {
      resultNote(t('loading'));
      loadBills(state.view, state.period, function (err) {
        if (err) resultNote(t('loadError')); else if (document.activeElement === searchEl) showResults();
      });
      return;
    }
    var found = searchBills(bills, q);
    if (found.length) { listResults(found, state.period); return; }
    activeResult = -1;
    var number = onlyNumber(q);
    if (!number) { resultNote(noResults(q)); return; }
    resultNote(t('loadingOthers'));
    findNumber(number, function (err, bill, period) {
      if (searchEl.value !== q || document.activeElement !== searchEl) return;   // something else was typed, or the box was left
      if (bill) listResults([bill], period); else resultNote(err ? t('loadError') : noResults(q));
    });
  }
  function noResults(q) {
    var number = onlyNumber(q) || (META.voteLink && /votacion-\d/.test(normalize(q)));   // or the name of its document
    return t('noResults') + (number ? ' ' + t('numberHint').replace('{site}', META.voteLink.name) : '');
  }
  function listResults(found, period) {
    resultsEl.textContent = '';
    activeResult = -1;
    found.slice(0, MAX_RESULTS).forEach(function (b, i) {
      var li = document.createElement('li');
      li.setAttribute('role', 'option'); li.setAttribute('data-vote', b.v); li.setAttribute('data-period', period); li.id = 'bill-opt-' + i;
      var d = document.createElement('span'); d.className = 'r-date'; d.textContent = b.f;
      var tt = document.createElement('span'); tt.className = 'r-title'; tt.textContent = b.t || (t('untitled') + ' ' + voteName(b));
      var c = document.createElement('span'); c.className = 'r-count'; c.textContent = b.ye + ' – ' + b.na;
      li.appendChild(d); li.appendChild(tt); li.appendChild(c);
      li.addEventListener('mousedown', function (e) { e.preventDefault(); selectBill(b.v, period); });
      resultsEl.appendChild(li);
    });
    if (found.length > MAX_RESULTS || period !== state.period) {
      var more = document.createElement('li'); more.className = 'r-note';
      more.textContent = period !== state.period ? t('otherPeriod').replace('{period}', periodLabel(period)) : t('moreResults');
      resultsEl.appendChild(more);
    }
    resultsEl.hidden = false;
    searchEl.setAttribute('aria-expanded', 'true');
  }
  function hideResults() {
    resultsEl.hidden = true;
    resultsEl.textContent = '';
    activeResult = -1;
    searchEl.setAttribute('aria-expanded', 'false');
    searchEl.removeAttribute('aria-activedescendant');
  }
  function moveActive(delta) {
    var opts = resultsEl.querySelectorAll('li[role=option]');
    if (!opts.length) return;
    activeResult = (activeResult + delta + opts.length) % opts.length;
    opts.forEach(function (o, i) { o.setAttribute('aria-selected', i === activeResult ? 'true' : 'false'); });
    searchEl.setAttribute('aria-activedescendant', opts[activeResult].id);
    opts[activeResult].scrollIntoView({ block: 'nearest' });
  }
  function selectBill(v, period) {
    state.period = period;
    state.bill = v;
    hideResults();
    searchEl.blur();
    render();
  }
  function clearBill() {
    state.bill = null;
    searchEl.value = '';
    render();
  }

  function renderBillInfo() {
    var bill = currentBill();
    billInfoEl.hidden = !bill;
    document.querySelectorAll('.col-vote').forEach(function (el) { el.hidden = !bill; });
    if (!bill) return;
    $('#bill-title').textContent = bill.t || (t('untitled') + ' ' + voteName(bill));
    var meta = bill.f + ' · ' + voteName(bill) + ' · ' + bill.ye + ' ' + t('inFavor') + ', ' + bill.na + ' ' + t('against');
    if (bill.r) meta += ' · ' + t('result') + ': ' + bill.r;
    meta += ' · ' + t('angle') + ' ' + bill.a + '°';
    $('#bill-meta').textContent = meta;
    if (bill.q && META.voteLink) {   // the page of this vote in silpy
      var link = document.createElement('a');
      link.href = META.voteLink.url + encodeURIComponent(bill.q);
      link.target = '_blank'; link.rel = 'noopener';
      link.textContent = t('seeVote') + ' ' + META.voteLink.name;
      $('#bill-meta').appendChild(document.createTextNode(' · '));
      $('#bill-meta').appendChild(link);
    }
  }

  // ---- key and table ----------------------------------------------------------------
  function renderKey() {
    var list = $('#key-list');
    list.textContent = '';
    var counts = {};
    rows().forEach(function (r) { counts[r.p] = (counts[r.p] || 0) + 1; });
    DATA.parties.forEach(function (p) {
      if (!counts[p.code]) return;
      var li = document.createElement('li');
      var sw = document.createElement('span'); sw.className = 'swatch'; sw.style.background = p.color;
      var code = document.createElement('span'); code.className = 'code'; code.textContent = p.code;
      var name = document.createElement('span'); name.textContent = partyName(p);
      var n = document.createElement('span'); n.className = 'count'; n.textContent = counts[p.code];
      li.appendChild(sw); li.appendChild(code); li.appendChild(name); li.appendChild(n);
      list.appendChild(li);
    });
  }

  function renderTable() {
    var tbody = $('#table tbody');
    var bill = currentBill();
    var voteLabel = { y: t('voteYes'), n: t('voteNo'), '.': t('voteNa') };
    tbody.textContent = '';
    rows().forEach(function (r, idx) {
      var p = DATA.parties[partyIndex[r.p]];
      var tr = document.createElement('tr');
      var tdName = document.createElement('td'); tdName.textContent = r.n;
      var tdParty = document.createElement('td');
      var sw = document.createElement('span'); sw.className = 'swatch'; sw.style.background = p.color;
      tdParty.appendChild(sw); tdParty.appendChild(document.createTextNode(p.code === 'na' ? t('noParty') : p.code));
      tr.appendChild(tdName); tr.appendChild(tdParty);
      if (bill) { var tdVote = document.createElement('td'); tdVote.className = 'col-vote'; tdVote.textContent = voteLabel[bill.votes.charAt(idx)] || ''; tr.appendChild(tdVote); }
      [r.x.toFixed(2), r.xl.toFixed(2) + ' – ' + r.xu.toFixed(2), r.y.toFixed(2), r.yl.toFixed(2) + ' – ' + r.yu.toFixed(2), r.w.toFixed(1) + '%', String(r.v)]
        .forEach(function (v) { var td = document.createElement('td'); td.className = 'num'; td.textContent = v; tr.appendChild(td); });
      tbody.appendChild(tr);
    });
  }

  // ---- render everything ----------------------------------------------------------
  function render() {
    fillPeriods();
    applyLanguage();
    // a bill was asked for (from the url or by changing the view) but its file isn't here yet
    if (state.bill && !billsOf(state.view, state.period)) {
      loadBills(state.view, state.period, function () {
        if (!currentBill()) state.bill = null;
        render();
      });
    } else if (state.bill && !currentBill()) {
      state.bill = null;
    }
    var th = theme();
    Plotly.react(plotEl, buildTraces(th), buildLayout(th), CONFIG);
    renderBillInfo();
    renderKey();
    renderTable();
    writeHash();
  }

  // the same bill in the other view (its year, or its session), if it's there
  function switchView(view) {
    var bill = currentBill();
    state.view = view;
    if (bill) {
      state.period = periodOfDate(view, bill.f);
      if (periods().indexOf(state.period) < 0) { state.period = null; state.bill = null; }
    } else {
      state.period = null; state.bill = null;
    }
    render();
  }

  // ---- events ----------------------------------------------------------------------
  document.querySelectorAll('input[name=view]').forEach(function (el) {
    el.addEventListener('change', function () { switchView(el.value); });
  });
  periodEl.addEventListener('change', function () { state.period = periodEl.value; state.bill = null; searchEl.value = ''; render(); });
  prevEl.addEventListener('click', function () { var ps = periods(), i = ps.indexOf(state.period); if (i > 0) { state.period = ps[i - 1]; state.bill = null; searchEl.value = ''; render(); } });
  nextEl.addEventListener('click', function () { var ps = periods(), i = ps.indexOf(state.period); if (i < ps.length - 1) { state.period = ps[i + 1]; state.bill = null; searchEl.value = ''; render(); } });
  ciEl.addEventListener('change', function () { state.ci = ciEl.checked; render(); });
  winEl.addEventListener('change', function () { state.winrate = winEl.checked; render(); });
  document.querySelectorAll('.lang button').forEach(function (b) {
    b.addEventListener('click', function () { state.lang = b.getAttribute('data-lang'); render(); });
  });
  billClearEl.addEventListener('click', clearBill);

  var searchTimer;
  searchEl.addEventListener('input', function () { clearTimeout(searchTimer); searchTimer = setTimeout(showResults, 120); });
  searchEl.addEventListener('focus', showResults);
  searchEl.addEventListener('blur', function () { setTimeout(hideResults, 150); });
  searchEl.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowDown') { e.preventDefault(); if (resultsEl.hidden) showResults(); else moveActive(1); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); moveActive(-1); }
    else if (e.key === 'Enter') {
      var opts = resultsEl.querySelectorAll('li[role=option]');
      var pick = activeResult >= 0 ? opts[activeResult] : opts[0];
      if (pick) { e.preventDefault(); selectBill(pick.getAttribute('data-vote'), pick.getAttribute('data-period')); }
    }
    else if (e.key === 'Escape') { hideResults(); if (!searchEl.value) searchEl.blur(); }
  });

  document.addEventListener('keydown', function (e) {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;
    if (e.key === 'ArrowLeft') prevEl.click();
    if (e.key === 'ArrowRight') nextEl.click();
  });
  var resizeTimer;
  window.addEventListener('resize', function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () { Plotly.relayout(plotEl, buildLayout(theme())); }, 150);
  });

  // ---- start ----------------------------------------------------------------------
  readHash();
  document.querySelector('input[name=view][value=' + state.view + ']').checked = true;
  ciEl.checked = state.ci;
  winEl.checked = state.winrate;
  render();
})();
