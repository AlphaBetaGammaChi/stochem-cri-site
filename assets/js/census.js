/* Parcel census demo — parcels advect through a stylised flow; overlaying the
 * Eulerian analysis grid shows cell counts fluctuating ~Poisson, which is why
 * sparse cells in stoch3d.dat carry sampling noise. */
(function () {
  var cv = document.getElementById('census-canvas');
  if (!cv) return;
  var ctx = cv.getContext('2d');
  var W = cv.width, H = cv.height;

  var MW = 620;                     // map width; histogram lives x>650
  var nSlider = document.getElementById('cen-n');
  var nLbl = document.getElementById('cen-n-lbl');
  var gSel = document.getElementById('cen-grid');
  var stat = document.getElementById('cen-stat');

  var parcels = [];
  function seed(n) {
    parcels = [];
    for (var i = 0; i < n; i++)
      parcels.push({ x: Math.random(), y: Math.random() });
  }
  seed(parseInt(nSlider.value, 10));

  // stylised flow: westerly jet + two gyres
  function vel(x, y, t) {
    var vx = 0.05 + 0.16 * Math.sin(Math.PI * y);
    var vy = 0.02 * Math.sin(2 * Math.PI * x + 0.7 * t);
    [[0.28, 0.35, 1], [0.7, 0.65, -1]].forEach(function (g) {
      var dx = x - g[0], dy = y - g[1];
      var r2 = dx * dx + dy * dy;
      var s = g[2] * 0.5 * Math.exp(-r2 / 0.02);
      vx += -dy * s;
      vy += dx * s;
    });
    return [vx, vy];
  }

  function fact(k) { var f = 1; for (var i = 2; i <= k; i++) f *= i; return f; }

  var t = 0;
  function frame() {
    t += 1 / 60;
    var dt = 1 / 60;
    parcels.forEach(function (p) {
      var v = vel(p.x, p.y, t);
      p.x = (p.x + v[0] * dt + 1) % 1;
      p.y = (p.y + v[1] * dt + 1) % 1;
    });

    ctx.fillStyle = '#0a0e13';
    ctx.fillRect(0, 0, W, H);

    // grid + counts
    var g = gSel.value.split('x');
    var nx = +g[0], ny = +g[1], ncell = nx * ny;
    var counts = new Array(ncell).fill(0);
    parcels.forEach(function (p) {
      var i = Math.min(nx - 1, Math.floor(p.x * nx));
      var j = Math.min(ny - 1, Math.floor(p.y * ny));
      counts[j * nx + i]++;
    });
    var mu = parcels.length / ncell;

    // shade cells by count deviation
    for (var j = 0; j < ny; j++)
      for (var i = 0; i < nx; i++) {
        var c = counts[j * nx + i];
        var dev = Math.max(-1, Math.min(1, (c - mu) / (mu + 1e-9)));
        ctx.fillStyle = dev >= 0
          ? 'rgba(63,185,80,' + (0.05 + 0.28 * dev) + ')'
          : 'rgba(210,153,34,' + (0.05 - 0.28 * dev) + ')';
        ctx.fillRect(i * MW / nx, j * H / ny, MW / nx, H / ny);
      }
    ctx.strokeStyle = 'rgba(230,237,243,0.35)';
    for (i = 0; i <= nx; i++) { ctx.beginPath(); ctx.moveTo(i * MW / nx, 0); ctx.lineTo(i * MW / nx, H); ctx.stroke(); }
    for (j = 0; j <= ny; j++) { ctx.beginPath(); ctx.moveTo(0, j * H / ny); ctx.lineTo(MW, j * H / ny); ctx.stroke(); }

    ctx.fillStyle = '#9db4d0';
    parcels.forEach(function (p) {
      ctx.fillRect(p.x * MW - 1, p.y * H - 1, 2.4, 2.4);
    });

    // histogram of counts
    var maxc = Math.max.apply(null, counts.concat([1]));
    var bins = new Array(maxc + 1).fill(0);
    counts.forEach(function (c) { bins[c]++; });
    var hx = 660, hw = 280, hb = 300, by = 390;
    var bw = hw / (maxc + 1);
    var bmax = Math.max.apply(null, bins);
    ctx.font = '12px ui-monospace, Menlo, monospace';
    for (var k = 0; k <= maxc; k++) {
      var bh = (bins[k] / bmax) * hb;
      ctx.fillStyle = '#58a6ff';
      ctx.fillRect(hx + k * bw + 1, by - bh, bw - 2, bh);
      if (bw > 16) {
        ctx.fillStyle = '#9da7b3';
        ctx.fillText(String(k), hx + k * bw + 4, by + 14);
      }
      // Poisson pmf scaled to cells
      var pk = Math.exp(-mu) * Math.pow(mu, k) / fact(k) * ncell;
      ctx.fillStyle = '#d29922';
      ctx.fillRect(hx + k * bw + bw / 2 - 1, by - (pk / bmax) * hb, 2, (pk / bmax) * hb);
    }
    ctx.strokeStyle = '#2d333b';
    ctx.beginPath(); ctx.moveTo(hx, by); ctx.lineTo(hx + hw, by); ctx.stroke();
    ctx.fillStyle = '#9da7b3';
    ctx.fillText('parcels per cell →', hx, by + 32);
    ctx.fillStyle = '#d29922';
    ctx.fillText('amber = Poisson prediction', hx, 40);

    // stats
    var sd = 0, empty = 0;
    counts.forEach(function (c) { sd += (c - mu) * (c - mu); if (!c) empty++; });
    sd = Math.sqrt(sd / ncell);
    var lines = [
      'N = ' + parcels.length + ' parcels, ' + ncell + ' cells',
      'mean/cell μ = ' + mu.toFixed(1),
      'σ/μ observed = ' + (sd / mu).toFixed(2),
      'σ/μ Poisson  = ' + (1 / Math.sqrt(mu)).toFixed(2),
      'empty cells = ' + empty + ' (' + Math.round(100 * empty / ncell) + '%)'
    ];
    ctx.fillStyle = '#e6edf3';
    lines.forEach(function (s, i) { ctx.fillText(s, hx, 75 + i * 20); });
    if (stat) stat.textContent = lines.join(' · ');

    if (nLbl) nLbl.textContent = parcels.length;
    requestAnimationFrame(frame);
  }

  nSlider.addEventListener('input', function () { seed(parseInt(nSlider.value, 10)); });
  requestAnimationFrame(frame);
})();
