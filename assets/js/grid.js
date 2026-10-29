/* Schematic zonal-mean field viewer on the STOCHEM 36-lat x 9-level
   analysis grid. Fields are analytic teaching functions — NOT model output.
   Palette matches the manuscript rainbow used for STOCHEM paper figures. */
(function () {
  var cv = document.getElementById('grid-canvas');
  if (!cv) return;
  var ctx = cv.getContext('2d');
  var W = cv.width, H = cv.height;
  var PAL = ['#0000ff', '#0097ff', '#00d4ff', '#00ffdc', '#0cff00',
             '#99d400', '#ffd300', '#ffb500', '#ff0000'];

  var NLAT = 36, NLEV = 9;
  // pressure midpoints (hPa) for the 9 eta levels, bottom -> top
  var PLEV = [975, 900, 800, 680, 550, 420, 300, 200, 120];

  // s = season slider, -1 (JJA) .. +1 (DJF)
  function field(species, lat, p, s) {
    var pl = p / 1000;             // 1 at surface -> ~0.1 at top
    var a = 1 - pl;                // altitude proxy 0..~0.9
    if (species === 'O3') {
      return 22 + 60 * a * a + 18 * Math.abs(lat) / 90 * a +
             8 * Math.sin((lat + 25 * s) * Math.PI / 180) * pl;
    }
    if (species === 'CO') {
      var nh = Math.max(0, (lat + 30 * s) / 60);
      return 55 + 120 * nh * Math.pow(pl, 1.6) + 15 * pl;
    }
    if (species === 'NOx') {
      var g = Math.exp(-Math.pow((lat - (38 - 18 * s)) / 22, 2));
      return 4 + 260 * g * Math.pow(pl, 3) +
             40 * Math.exp(-Math.pow(lat / 25, 2)) * a * a;
    }
    if (species === 'H2') {
      return 545 - 35 * (lat / 90) * pl - 10 * a;
    }
    if (species === 'CH4') {
      return 1745 + 65 * (lat / 90) * (0.35 + 0.65 * pl) - 15 * a;
    }
    return 0;
  }

  var UNITS = { O3: 'ppb', CO: 'ppb', NOx: 'ppt', H2: 'ppb', CH4: 'ppb' };
  var species = 'O3', season = 0;

  function draw() {
    ctx.fillStyle = '#0a0e13';
    ctx.fillRect(0, 0, W, H);
    var ml = 55, mr = 90, mt = 15, mb = 42;
    var pw = (W - ml - mr) / NLAT, ph = (H - mt - mb) / NLEV;

    var vmin = Infinity, vmax = -Infinity, vals = [];
    for (var j = 0; j < NLEV; j++) {
      vals[j] = [];
      for (var i = 0; i < NLAT; i++) {
        var lat = -87.5 + i * 5;
        var v = field(species, lat, PLEV[NLEV - 1 - j], season);
        vals[j][i] = v;
        if (v < vmin) vmin = v;
        if (v > vmax) vmax = v;
      }
    }

    for (var j2 = 0; j2 < NLEV; j2++) {
      for (var i2 = 0; i2 < NLAT; i2++) {
        var f = (vals[j2][i2] - vmin) / (vmax - vmin + 1e-9);
        ctx.fillStyle = PAL[Math.min(PAL.length - 1, Math.floor(f * PAL.length))];
        ctx.fillRect(ml + i2 * pw, mt + j2 * ph, pw + 0.5, ph + 0.5);
      }
    }

    // axes
    ctx.strokeStyle = '#3a434d';
    ctx.strokeRect(ml, mt, NLAT * pw, NLEV * ph);
    ctx.fillStyle = '#9da7b3';
    ctx.font = '11px -apple-system, sans-serif';
    ctx.textAlign = 'center';
    for (var lat2 = -75; lat2 <= 75; lat2 += 25) {
      var x = ml + (lat2 + 87.5) / 175 * NLAT * pw;
      ctx.fillText(lat2 + '°', x, mt + NLEV * ph + 16);
    }
    ctx.fillText('Latitude', ml + NLAT * pw / 2, mt + NLEV * ph + 34);
    ctx.textAlign = 'right';
    for (var k = 0; k < NLEV; k++) {
      var y = mt + (k + 0.5) * ph;
      ctx.fillText(String(PLEV[NLEV - 1 - k]), ml - 6, y + 4);
    }
    ctx.save();
    ctx.translate(14, mt + NLEV * ph / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.textAlign = 'center';
    ctx.fillText('Pressure (hPa)', 0, 0);
    ctx.restore();

    // colourbar
    var bx = ml + NLAT * pw + 18, bw = 16;
    for (var b = 0; b < PAL.length; b++) {
      ctx.fillStyle = PAL[b];
      var bh = NLEV * ph / PAL.length;
      ctx.fillRect(bx, mt + NLEV * ph - (b + 1) * bh, bw, bh + 0.5);
    }
    ctx.strokeRect(bx, mt, bw, NLEV * ph);
    ctx.textAlign = 'left';
    ctx.fillStyle = '#9da7b3';
    ctx.fillText(vmax.toFixed(0), bx + bw + 4, mt + 10);
    ctx.fillText(vmin.toFixed(0), bx + bw + 4, mt + NLEV * ph);
    ctx.fillText(UNITS[species], bx + bw + 4, mt + NLEV * ph / 2);
  }

  var sel = document.getElementById('g-species');
  var ssl = document.getElementById('g-season');
  var slab = document.getElementById('g-season-label');
  sel.addEventListener('change', function () { species = this.value; draw(); });
  ssl.addEventListener('input', function () {
    season = parseFloat(this.value);
    slab.textContent = season <= -0.33 ? 'JJA' : (season >= 0.33 ? 'DJF' : 'equinox');
    draw();
  });
  draw();
})();
