/* Convection schematic — mimics CLMIX in Base.for.
 * Each event: parcels below cloud top are drawn R < FRAC; selected parcels are
 * set to the entrained-group mean concentration (CLMIX's CLCONC/NCLOUD). */
(function () {
  var cv = document.getElementById('conv-canvas');
  if (!cv) return;
  var ctx = cv.getContext('2d');
  var W = cv.width, H = cv.height;

  var play = document.getElementById('c-play');
  var frac = document.getElementById('c-frac');
  var fracLbl = document.getElementById('c-frac-lbl');
  var stat = document.getElementById('c-stat');

  var TOP = 30, BOT = 410;          // screen y of eta=0 (top) and eta=1 (surface)
  var ETACT = 0.30;                 // cloud top eta (parcels with eta > CT are candidates)
  var ETACB = 0.88;                 // cloud base eta
  var NP = 90;

  function y2eta(y) { return (BOT - y) / (BOT - TOP); }
  function eta2y(e) { return BOT - e * (BOT - TOP); }
  function c0(eta) { return Math.exp((eta - 1) * 4.5); }   // surface-polluted profile
  // blue (clean) -> red (polluted)
  function col(c) {
    var t = Math.max(0, Math.min(1, c));
    var r = Math.round(30 + 225 * t);
    var g = Math.round(150 - 110 * t);
    var b = Math.round(255 - 205 * t);
    return 'rgb(' + r + ',' + g + ',' + b + ')';
  }

  function makeCol(cx, cw) {
    var p = [];
    for (var i = 0; i < NP; i++) {
      var eta = 0.05 + 0.93 * Math.random();
      p.push({
        x: cx - cw / 2 + 8 + (cw - 16) * Math.random(),
        eta: eta,
        c: c0(eta),
        ph: Math.random() * 6.28,
        ring: 0
      });
    }
    return { cx: cx, cw: cw, p: p };
  }

  var colA = makeCol(230, 210);   // advection only
  var colB = makeCol(520, 210);   // + convective mixing
  var running = true, t = 0, lastEvent = 0, lastMsg = 'waiting for first event';

  function cloud(cx, cw) {
    var yT = eta2y(ETACT), yB = eta2y(ETACB);
    ctx.save();
    ctx.fillStyle = 'rgba(230,237,243,0.16)';
    for (var i = 0; i < 7; i++) {
      var fx = cx - cw / 2 + cw * (i / 6);
      var fy = yB - (i % 3) * 14;
      ctx.beginPath();
      ctx.ellipse(fx, fy, 34, 22, 0, 0, 6.29);
      ctx.fill();
    }
    ctx.beginPath();
    ctx.ellipse(cx, (yT + yB) / 2, cw * 0.42, (yB - yT) * 0.42, 0, 0, 6.29);
    ctx.fill();
    ctx.restore();
    ctx.strokeStyle = 'rgba(230,237,243,0.4)';
    ctx.setLineDash([4, 5]);
    ctx.beginPath(); ctx.moveTo(cx - cw / 2, yT); ctx.lineTo(cx + cw / 2, yT); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx - cw / 2, yB); ctx.lineTo(cx + cw / 2, yB); ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = '#9da7b3';
    ctx.font = '11px ui-monospace, Menlo, monospace';
    ctx.fillText('cloud top (CT)', cx + cw / 2 + 8, yT + 4);
    ctx.fillText('cloud base (CB)', cx + cw / 2 + 8, yB + 4);
  }

  function mixingEvent(column) {
    var F = parseFloat(frac.value);
    var cand = [];
    column.p.forEach(function (p) { if (p.eta > ETACT) cand.push(p); });
    var n = Math.round(F * cand.length), sel = [];
    var idx = cand.map(function (_, i) { return i; });
    for (var i = 0; i < n && idx.length; i++) {
      var j = Math.floor(Math.random() * idx.length);
      sel.push(cand[idx.splice(j, 1)[0]]);
    }
    if (!sel.length) { lastMsg = 'event: 0 of ' + cand.length + ' parcels entrained'; return; }
    var m = 0;
    sel.forEach(function (p) { m += p.c; });
    m /= sel.length;
    sel.forEach(function (p) { p.c = m; p.ring = 1; });
    lastMsg = 'event: ' + sel.length + ' of ' + cand.length +
      ' parcels below cloud top entrained (FRAC=' + F.toFixed(2) + ')';
  }

  function frame() {
    t += 1 / 60;
    if (running && t - lastEvent > 1.4) { mixingEvent(colB); lastEvent = t; }

    ctx.fillStyle = '#0a0e13';
    ctx.fillRect(0, 0, W, H);

    [colA, colB].forEach(function (col, k) {
      // column frame + eta ticks
      ctx.strokeStyle = '#2d333b';
      ctx.strokeRect(col.cx - col.cw / 2, TOP, col.cw, BOT - TOP);
      for (var e = 0; e <= 1.001; e += 1 / 8) {
        var yy = eta2y(e);
        ctx.strokeStyle = 'rgba(45,51,59,0.5)';
        ctx.beginPath(); ctx.moveTo(col.cx - col.cw / 2, yy); ctx.lineTo(col.cx + col.cw / 2, yy); ctx.stroke();
      }
      cloud(col.cx, col.cw);
      col.p.forEach(function (p) {
        // gentle jiggle; relax toward source profile so the demo never saturates
        p.eta += 0.0012 * Math.sin(t * 1.6 + p.ph);
        p.eta = Math.max(0.04, Math.min(0.99, p.eta));
        p.c += (c0(p.eta) - p.c) * 0.0015;
        if (p.ring > 0) p.ring -= 0.025;
        var y = eta2y(p.eta);
        ctx.fillStyle = col(p.c);
        ctx.beginPath(); ctx.arc(p.x, y, 4, 0, 6.29); ctx.fill();
        if (p.ring > 0) {
          ctx.strokeStyle = 'rgba(255,255,255,' + p.ring.toFixed(2) + ')';
          ctx.lineWidth = 2;
          ctx.beginPath(); ctx.arc(p.x, y, 7, 0, 6.29); ctx.stroke();
        }
      });
      ctx.fillStyle = '#e6edf3';
      ctx.font = '13px -apple-system, Segoe UI, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(k === 0 ? 'advection only' : '+ CLMIX convective mixing', col.cx, BOT + 22);
      ctx.textAlign = 'left';
    });

    // surface-source arrows
    ctx.strokeStyle = '#d29922'; ctx.fillStyle = '#d29922';
    [colA.cx, colB.cx].forEach(function (x) {
      ctx.beginPath(); ctx.moveTo(x, H - 8); ctx.lineTo(x, BOT + 34);
      ctx.lineTo(x - 5, BOT + 42); ctx.moveTo(x, BOT + 34); ctx.lineTo(x + 5, BOT + 42);
      ctx.stroke();
    });
    ctx.font = '11px ui-monospace, Menlo, monospace';
    ctx.fillText('surface source', 655, H - 12);

    // readout + colourbar
    ctx.fillStyle = '#e6edf3';
    ctx.font = '13px -apple-system, Segoe UI, sans-serif';
    ctx.fillText('CLMIX rule', 700, 70);
    ctx.fillStyle = '#9da7b3';
    ctx.font = '12px ui-monospace, Menlo, monospace';
    ctx.fillText('draw R ~ U(0,1)', 700, 92);
    ctx.fillText('if R < FRAC : parcel joins cloud', 700, 110);
    ctx.fillText('c -> mean of entrained parcels', 700, 128);
    ctx.fillText(lastMsg, 700, 168);

    for (var i = 0; i < 80; i++) {
      ctx.fillStyle = col(i / 79);
      ctx.fillRect(700 + i * 2, 210, 2, 10);
    }
    ctx.fillStyle = '#9da7b3';
    ctx.fillText('clean', 700, 236);
    ctx.fillText('polluted', 826, 236);

    if (stat) stat.textContent = lastMsg;
    if (fracLbl) fracLbl.textContent = parseFloat(frac.value).toFixed(2);
    requestAnimationFrame(frame);
  }

  play.addEventListener('click', function () {
    running = !running;
    play.textContent = running ? 'Pause' : 'Play';
  });
  frac.addEventListener('input', function () {
    fracLbl.textContent = parseFloat(frac.value).toFixed(2);
  });

  requestAnimationFrame(frame);
})();
