/* Schematic Lagrangian parcel advection demo.
   Pure canvas, no dependencies. The wind field and continents are stylised —
   this is a teaching schematic, not model output. */
(function () {
  var cv = document.getElementById('parcel-canvas');
  if (!cv) return;
  var ctx = cv.getContext('2d');
  var W = cv.width, H = cv.height;
  var N = 900;
  var parts = [];
  var running = true;
  var showGrid = false;
  var speed = 1.0;
  var src = { lon: 5, lat: 50 }; // default source: western Europe

  // Very coarse schematic continent outlines (lon, lat vertices)
  var LAND = [
    [[-168,66],[-150,71],[-130,70],[-115,68],[-95,72],[-80,70],[-65,60],[-55,52],[-70,42],[-75,35],[-82,25],[-95,19],[-105,22],[-117,33],[-125,40],[-132,55],[-150,60],[-165,60]],
    [[-80,8],[-60,5],[-50,0],[-35,-8],[-40,-22],[-50,-32],[-60,-40],[-70,-52],[-75,-45],[-70,-30],[-75,-15],[-80,-5]],
    [[-15,15],[0,10],[10,5],[12,-2],[15,-12],[20,-33],[30,-30],[35,-15],[40,-5],[50,2],[45,10],[35,22],[20,32],[10,35],[-5,35],[-15,30]],
    [[-10,36],[0,40],[0,45],[-10,50],[-5,58],[5,60],[5,70],[20,70],[40,68],[60,70],[80,72],[100,75],[120,73],[140,72],[160,68],[180,65],[170,60],[160,55],[140,50],[130,42],[122,38],[122,30],[110,20],[105,10],[100,5],[95,15],[80,8],[72,20],[65,25],[60,30],[50,30],[45,38],[35,36],[28,41],[20,40],[10,38]],
    [[113,-22],[125,-15],[135,-12],[142,-11],[150,-22],[153,-28],[148,-38],[140,-38],[135,-35],[129,-32],[115,-33]],
    [[0,-70],[40,-71],[80,-69],[120,-71],[160,-72],[180,-72],[180,-90],[-180,-90],[-180,-72],[-140,-71],[-100,-69],[-60,-71],[-30,-72]]
  ];

  function px(lon) { return (lon + 180) / 360 * W; }
  function py(lat) { return (90 - lat) / 180 * H; }

  function init() {
    parts = [];
    for (var i = 0; i < N; i++) {
      parts.push({
        lon: Math.random() * 360 - 180,
        lat: Math.asin(Math.random() * 2 - 1) * 180 / Math.PI * 0.9, // area-uniform
        c: 0
      });
    }
  }

  // Stylised wind: tropical easterlies, mid-latitude westerly jets,
  // plus a slowly evolving sinusoidal eddy field and small diffusion.
  function wind(lon, lat, t) {
    var phi = lat * Math.PI / 180, lam = lon * Math.PI / 180;
    var u = -1.15 * Math.cos(2 * phi) + 0.25 * Math.sin(3 * lam + t * 0.15) * Math.cos(phi);
    var v = 0.45 * Math.sin(2 * lam + t * 0.25) * Math.cos(2 * phi)
          + 0.15 * Math.sin(phi * 3 + t * 0.1);
    return [u, v];
  }

  var PAL = ['#0000ff', '#0097ff', '#00d4ff', '#00ffdc', '#0cff00',
             '#99d400', '#ffd300', '#ffb500', '#ff0000'];
  function col(c) {
    var i = Math.min(PAL.length - 1, Math.floor(c * PAL.length));
    return PAL[i];
  }

  function drawLand() {
    ctx.fillStyle = '#141a20';
    ctx.strokeStyle = '#3a434d';
    ctx.lineWidth = 1;
    LAND.forEach(function (poly) {
      ctx.beginPath();
      poly.forEach(function (p, i) {
        if (i === 0) ctx.moveTo(px(p[0]), py(p[1])); else ctx.lineTo(px(p[0]), py(p[1]));
      });
      ctx.closePath();
      ctx.fill(); ctx.stroke();
    });
  }

  function drawGraticule() {
    ctx.strokeStyle = 'rgba(90,100,110,0.25)';
    ctx.lineWidth = 0.5;
    for (var lon = -150; lon <= 150; lon += 30) {
      ctx.beginPath(); ctx.moveTo(px(lon), 0); ctx.lineTo(px(lon), H); ctx.stroke();
    }
    for (var lat = -60; lat <= 60; lat += 30) {
      ctx.beginPath(); ctx.moveTo(0, py(lat)); ctx.lineTo(W, py(lat)); ctx.stroke();
    }
  }

  var t = 0;
  function step() {
    t += 0.016;
    for (var i = 0; i < N; i++) {
      var p = parts[i];
      var w = wind(p.lon, p.lat, t);
      p.lon += w[0] * 1.4 * speed + (Math.random() - 0.5) * 0.35;
      p.lat += w[1] * 0.9 * speed + (Math.random() - 0.5) * 0.25;
      if (p.lon > 180) p.lon -= 360; if (p.lon < -180) p.lon += 360;
      if (p.lat > 85) { p.lat = 85; } if (p.lat < -85) { p.lat = -85; }
      // emission near source point
      var dlon = p.lon - src.lon; if (dlon > 180) dlon -= 360; if (dlon < -180) dlon += 360;
      var dlat = p.lat - src.lat;
      var d2 = dlon * dlon + dlat * dlat;
      if (d2 < 64) p.c = Math.min(1, p.c + 0.05);
      p.c *= 0.998; // first-order loss
    }
  }

  function draw() {
    ctx.fillStyle = '#0a0e13';
    ctx.fillRect(0, 0, W, H);
    drawGraticule();
    drawLand();

    if (showGrid) {
      // Eulerian view: bin parcels onto a 72x36 grid and draw mean tracer.
      var nx = 72, ny = 36;
      var sum = new Float32Array(nx * ny), cnt = new Float32Array(nx * ny);
      for (var i = 0; i < N; i++) {
        var p = parts[i];
        var gx = Math.min(nx - 1, Math.floor((p.lon + 180) / 360 * nx));
        var gy = Math.min(ny - 1, Math.floor((90 - p.lat) / 180 * ny));
        sum[gy * nx + gx] += p.c; cnt[gy * nx + gx]++;
      }
      var cw = W / nx, ch = H / ny;
      for (var gy2 = 0; gy2 < ny; gy2++) {
        for (var gx2 = 0; gx2 < nx; gx2++) {
          var k = gy2 * nx + gx2;
          if (cnt[k] > 0 && sum[k] / cnt[k] > 0.04) {
            ctx.fillStyle = col(sum[k] / cnt[k]);
            ctx.globalAlpha = 0.55;
            ctx.fillRect(gx2 * cw, gy2 * ch, cw + 0.5, ch + 0.5);
            ctx.globalAlpha = 1;
          }
        }
      }
    }

    for (var j = 0; j < N; j++) {
      var q = parts[j];
      ctx.fillStyle = q.c > 0.02 ? col(q.c) : 'rgba(140,150,160,0.35)';
      ctx.fillRect(px(q.lon) - 1, py(q.lat) - 1, 2.2, 2.2);
    }

    // source marker
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.arc(px(src.lon), py(src.lat), 7, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(px(src.lon) - 10, py(src.lat)); ctx.lineTo(px(src.lon) + 10, py(src.lat));
    ctx.moveTo(px(src.lon), py(src.lat) - 10); ctx.lineTo(px(src.lon), py(src.lat) + 10);
    ctx.stroke();

    if (running) requestAnimationFrame(frame);
  }

  function frame() { step(); draw(); }

  cv.addEventListener('click', function (e) {
    var r = cv.getBoundingClientRect();
    src.lon = (e.clientX - r.left) / r.width * 360 - 180;
    src.lat = 90 - (e.clientY - r.top) / r.height * 180;
  });

  document.getElementById('p-play').addEventListener('click', function () {
    running = !running;
    this.textContent = running ? 'Pause' : 'Play';
    if (running) requestAnimationFrame(frame);
  });
  document.getElementById('p-reset').addEventListener('click', function () { init(); });
  document.getElementById('p-grid').addEventListener('click', function () {
    showGrid = !showGrid;
    this.classList.toggle('on', showGrid);
    if (!running) draw();
  });
  document.getElementById('p-speed').addEventListener('input', function () {
    speed = parseFloat(this.value);
  });

  init();
  requestAnimationFrame(frame);
})();
