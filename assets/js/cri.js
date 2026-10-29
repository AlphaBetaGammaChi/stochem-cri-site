/* CRI lumping cascade — schematic animation of how near-explicit MCM
   VOC degradation is compressed into lumped CRI intermediates.
   Tokens flow left -> right: emitted VOCs -> lumped RO2 families ->
   lumped carbonyls -> outputs (O3 chemistry, PAN, SOA, CO2).
   Pure canvas, no dependencies. Teaching schematic, not model output. */
(function () {
  var cv = document.getElementById('cri-canvas');
  if (!cv) return;
  var ctx = cv.getContext('2d');
  var W = cv.width, H = cv.height;
  var running = true;

  // stage x-positions (columns)
  var X = { voc: 78, ro2: 300, carb: 560, out: 830 };

  // VOC -> RO2 family mapping (CRI families from INOPERVM10.SOA2 CNAMES)
  var VOCS = [
    { n: 'CH₄',        f: 'small', c: '#7fc97f' },
    { n: 'C₂H₆',       f: 'small', c: '#7fc97f' },
    { n: 'C₃H₈',       f: 'rn',    c: '#66a3d2' },
    { n: 'n-C₄H₁₀',    f: 'rn',    c: '#66a3d2' },
    { n: 'n-C₅H₁₂',    f: 'rn',    c: '#66a3d2' },
    { n: 'C₂H₄',       f: 'ru',    c: '#5cb87a' },
    { n: 'C₃H₆',       f: 'ru',    c: '#5cb87a' },
    { n: 'isoprene',   f: 'ru',    c: '#5cb87a' },
    { n: 'toluene',    f: 'ra',    c: '#d9a35b' },
    { n: 'xylene',     f: 'ra',    c: '#d9a35b' },
    { n: 'α-pinene',   f: 'rtx',   c: '#b088c9' },
    { n: 'limonene',   f: 'rtx',   c: '#b088c9' }
  ];
  var FAM = {
    small: { lbl: 'CH₃O₂ / C₂H₅O₂', c: '#66c2a5' },
    rn:    { lbl: 'RN·O₂ (alkane RO₂)',   c: '#66a3d2' },
    ru:    { lbl: 'RU·O₂ (unsaturated RO₂)', c: '#5cb87a' },
    ra:    { lbl: 'RA·O₂ (aromatic RO₂)',  c: '#d9a35b' },
    rtx:   { lbl: 'RTX·O₂ (terpene RO₂)',  c: '#b088c9' }
  };
  var CARBS = ['CARB#', 'UCARB', 'UDCARB', 'CH₃CO₃ → PAN'];
  var OUTS  = ['HO₂ → O₃ production', 'PAN / RO₂NO₂ reservoirs',
               'RCOOH → P·SOA', 'CO₂ + smaller fragments'];

  var tokens = [];   // {stage, x, y, ty, voc, fam, carb, out, c}
  var spawnT = 0;
  var counts = { voc: 0, ro2: 0, carb: 0, out: 0 };

  function lane(i, n, y0, y1) { return y0 + (y1 - y0) * (i + 0.5) / n; }

  function spawn() {
    var v = VOCS[Math.floor(Math.random() * VOCS.length)];
    var y0 = 40 + Math.random() * 300;
    tokens.push({ stage: 0, x: X.voc, y: y0, ty: y0, voc: v.n, fam: v.f,
                  c: v.c, carb: CARBS[Math.floor(Math.random() * CARBS.length)],
                  out: Math.floor(Math.random() * OUTS.length) });
    counts.voc++;
  }

  function stageBox(x, w, title, subtitle) {
    ctx.fillStyle = '#161b22';
    ctx.strokeStyle = '#2d333b';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect ? ctx.roundRect(x - w / 2, 20, w, H - 60, 10)
                  : ctx.rect(x - w / 2, 20, w, H - 60);
    ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#e6edf3';
    ctx.font = '600 13px -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(title, x, 40);
    ctx.fillStyle = '#9da7b3';
    ctx.font = '10.5px -apple-system, sans-serif';
    ctx.fillText(subtitle, x, 56);
  }

  function draw() {
    ctx.fillStyle = '#0a0e13';
    ctx.fillRect(0, 0, W, H);

    stageBox(X.voc, 130, 'emitted VOCs', 'methane + ~120 NMHCs');
    stageBox(X.ro2, 190, 'generic RO₂', 'lumped by reactive-bond index');
    stageBox(X.carb, 190, 'lumped carbonyls', 'CARB / UCARB / UDCARB');
    stageBox(X.out, 180, 'outcomes', 'O₃, PAN, SOA, CO₂');

    // arrows between stages
    ctx.strokeStyle = '#3a434d';
    ctx.lineWidth = 2;
    [[X.voc + 65, X.ro2 - 95], [X.ro2 + 95, X.carb - 95], [X.carb + 95, X.out - 90]]
      .forEach(function (a) {
        ctx.beginPath();
        ctx.moveTo(a[0], 200); ctx.lineTo(a[1], 200);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(a[1], 200); ctx.lineTo(a[1] - 7, 195);
        ctx.lineTo(a[1] - 7, 205); ctx.closePath();
        ctx.fillStyle = '#3a434d'; ctx.fill();
      });

    // RO2 family legend inside middle box
    ctx.font = '10px -apple-system, sans-serif';
    ctx.textAlign = 'left';
    var fi = 0;
    for (var k in FAM) {
      ctx.fillStyle = FAM[k].c;
      ctx.fillRect(X.ro2 - 82, 68 + fi * 15, 8, 8);
      ctx.fillStyle = '#9da7b3';
      ctx.fillText(FAM[k].lbl, X.ro2 - 70, 76 + fi * 15);
      fi++;
    }
    // carbonyl + output labels
    CARBS.forEach(function (s, i) {
      ctx.fillStyle = '#d9a35b';
      ctx.fillRect(X.carb - 82, 68 + i * 15, 8, 8);
      ctx.fillStyle = '#9da7b3';
      ctx.fillText(s, X.carb - 70, 76 + i * 15);
    });
    OUTS.forEach(function (s, i) {
      ctx.fillStyle = '#9da7b3';
      ctx.textAlign = 'center';
      ctx.fillText(s, X.out, 90 + i * 22);
      ctx.textAlign = 'left';
    });

    // tokens
    tokens.forEach(function (t) {
      var label = t.stage === 0 ? t.voc
                : t.stage === 1 ? FAM[t.fam].lbl.split(' ')[0]
                : t.stage === 2 ? t.carb
                : null;
      ctx.fillStyle = t.c;
      ctx.beginPath();
      ctx.arc(t.x, t.y, 4.5, 0, Math.PI * 2);
      ctx.fill();
      if (label) {
        ctx.font = '9.5px -apple-system, sans-serif';
        ctx.fillStyle = 'rgba(230,237,243,0.75)';
        ctx.textAlign = 'center';
        ctx.fillText(label, t.x, t.y - 8);
      }
    });

    // funnel counter
    ctx.fillStyle = '#e6edf3';
    ctx.font = '600 13px -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('MCM v3.1: ~13,000 species · ~50,000 reactions', 240, H - 18);
    ctx.fillStyle = '#3fb950';
    ctx.fillText('→  CRI v2-R5: ~200 species · ~700 reactions', 700, H - 18);
  }

  var TGT = { 1: 300, 2: 560, 3: 830 };
  function step() {
    spawnT--;
    if (spawnT <= 0 && tokens.length < 70) { spawn(); spawnT = 14; }
    for (var i = tokens.length - 1; i >= 0; i--) {
      var t = tokens[i];
      var next = t.stage + 1;
      if (next <= 3) {
        var tx = TGT[next];
        var dx = tx - t.x;
        if (dx > 2) {
          t.x += Math.min(3.2, dx * 0.06);
          // ease y toward a lane in the next column
          var lanes = { 1: 130, 2: 200, 3: 300 };
          t.y += ((lanes[next] + Math.sin(i * 1.7) * 60) - t.y) * 0.04;
        } else {
          t.stage = next;
          t.c = next === 1 ? FAM[t.fam].c
              : next === 2 ? '#d9a35b' : '#8b949e';
          if (next === 1) counts.ro2++;
          else if (next === 2) counts.carb++;
          else { counts.out++; tokens.splice(i, 1); }
        }
      }
    }
  }

  function frame() { if (running) step(); draw(); requestAnimationFrame(frame); }

  document.getElementById('cri-play').addEventListener('click', function () {
    running = !running;
    this.textContent = running ? 'Pause' : 'Play';
  });
  document.getElementById('cri-reset').addEventListener('click', function () {
    tokens = []; counts = { voc: 0, ro2: 0, carb: 0, out: 0 };
  });

  for (var p = 0; p < 18; p++) spawn();
  frame();
})();
