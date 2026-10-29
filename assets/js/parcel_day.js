/* "A day in the life of one parcel" — animated schematic diurnal cycles of
   photolysis, OH, NO2 and O3 as a parcel passes over/away from a source.
   Analytic teaching curves, not model output. Pure canvas. */
(function () {
  var cv = document.getElementById('day-canvas');
  if (!cv) return;
  var ctx = cv.getContext('2d');
  var W = cv.width, H = cv.height;
  var running = true;

  var ML = 58, MR = 20, MT = 26, MB = 46;
  var PW = W - ML - MR, PH = H - MT - MB;
  var DAYS = 2;                 // show two diurnal cycles
  var TT = DAYS * 24;

  // bell centred at local noon, width ~3.5 h; zero at night
  function jbell(h) {
    var d = Math.abs(((h + 12) % 24) - 12);   // 0 at noon
    return Math.max(0, Math.cos(d / 12 * Math.PI / 2)) ** 1.4;
  }

  var SERIES = [
    { name: 'J(NO₂) ×10³ (s⁻¹)', c: '#d29922', min: 0, max: 10,
      f: function (h) { return 8.5 * jbell(h); } },
    { name: 'OH (10⁶ cm⁻³)', c: '#3fb950', min: 0, max: 3,
      f: function (h) { return 2.4 * Math.pow(jbell(h), 1.7); } },
    { name: 'NO₂ (ppb)', c: '#58a6ff', min: 0, max: 40,
      f: function (h) {
        var rush = 22 * Math.exp(-Math.pow(((h % 24) - 8) / 2.2, 2));
        var chem = 9 * jbell(h) * 0.4 + 4;
        return 6 + rush + chem - 5 * jbell(h);
      } },
    { name: 'O₃ (ppb)', c: '#ff7b72', min: 0, max: 80,
      f: function (h) {
        var build = 30 * jbell(h) * Math.min(1, Math.max(0, ((h % 24) - 7) / 6));
        return 28 + build;
      } }
  ];

  var t = 0;
  function xt(h) { return ML + h / TT * PW; }
  function yt(v, s) { return MT + PH - (v - s.min) / (s.max - s.min) * PH; }

  function draw() {
    ctx.fillStyle = '#0a0e13';
    ctx.fillRect(0, 0, W, H);

    // night shading
    for (var d = 0; d < DAYS; d++) {
      ctx.fillStyle = 'rgba(88,110,140,0.10)';
      ctx.fillRect(xt(d * 24), MT, xt(d * 24 + 6) - xt(d * 24), PH);
      ctx.fillRect(xt(d * 24 + 19), MT, xt(d * 24 + 24) - xt(d * 24 + 19), PH);
      ctx.fillStyle = 'rgba(157,167,179,0.5)';
      ctx.font = '10px -apple-system, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('night', xt(d * 24 + 3), MT + 12);
    }

    // axes
    ctx.strokeStyle = '#3a434d';
    ctx.strokeRect(ML, MT, PW, PH);
    ctx.fillStyle = '#9da7b3';
    ctx.font = '11px -apple-system, sans-serif';
    ctx.textAlign = 'center';
    for (var h = 0; h <= TT; h += 6) {
      ctx.fillText((h % 24) + 'h', xt(h), MT + PH + 16);
    }
    ctx.fillText('local time (2-day loop)', ML + PW / 2, MT + PH + 34);

    // series curves (normalised to own scale)
    SERIES.forEach(function (s) {
      ctx.strokeStyle = s.c;
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      for (var h2 = 0; h2 <= TT + 0.01; h2 += 0.2) {
        var x = xt(h2), y = yt(s.f(h2), s);
        if (h2 === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();
    });

    // cursor
    var cx = xt(t % TT);
    ctx.strokeStyle = 'rgba(230,237,243,0.45)';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(cx, MT); ctx.lineTo(cx, MT + PH); ctx.stroke();

    // legend + cursor values
    ctx.textAlign = 'left';
    ctx.font = '11px -apple-system, sans-serif';
    SERIES.forEach(function (s, i) {
      ctx.fillStyle = s.c;
      ctx.fillRect(ML + 8 + i * 165, MT - 18, 10, 3);
      ctx.fillStyle = '#c9d1d9';
      ctx.fillText(s.name + '  ' + s.f(t % TT).toFixed(1),
                   ML + 22 + i * 165, MT - 13);
    });

    SERIES.forEach(function (s) {
      ctx.fillStyle = s.c;
      ctx.beginPath();
      ctx.arc(cx, yt(s.f(t % TT), s), 3.5, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  function frame() {
    if (running) { t += 0.06; }
    draw();
    requestAnimationFrame(frame);
  }

  document.getElementById('day-play').addEventListener('click', function () {
    running = !running;
    this.textContent = running ? 'Pause' : 'Play';
  });
  frame();
})();
