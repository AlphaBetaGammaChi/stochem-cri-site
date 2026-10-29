/* "Follow one parcel" — a single air parcel leaving a fading trajectory
   trail through the same stylised wind field as parcels.js, with a live
   readout of its position and tracer history. Schematic, no dependencies. */
(function () {
  var cv = document.getElementById('traj-canvas');
  if (!cv) return;
  var ctx = cv.getContext('2d');
  var W = cv.width, H = cv.height;
  var running = true, showAll = false;

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

  function wind(lon, lat, t) {
    var phi = lat * Math.PI / 180, lam = lon * Math.PI / 180;
    var u = -1.15 * Math.cos(2 * phi) + 0.25 * Math.sin(3 * lam + t * 0.15) * Math.cos(phi);
    var v = 0.45 * Math.sin(2 * lam + t * 0.25) * Math.cos(2 * phi)
          + 0.15 * Math.sin(phi * 3 + t * 0.1);
    return [u, v];
  }

  var t = 0, p, trail = [], hist = [], extras = [];
  var SRC = { lon: 5, lat: 50 };          // tracer source over W. Europe
  var MAXTRAIL = 900, MAXHIST = 600;

  function reset() {
    p = { lon: -60, lat: 20, c: 0 };
    trail = []; hist = [];
    extras = [];
    for (var i = 0; i < 40; i++) {
      extras.push({ lon: Math.random() * 360 - 180,
                    lat: Math.asin(Math.random() * 2 - 1) * 81 });
    }
  }

  function advect(o, jit) {
    var w = wind(o.lon, o.lat, t);
    o.lon += w[0] * 1.4 + jit * (Math.random() - 0.5) * 0.35;
    o.lat += w[1] * 0.9 + jit * (Math.random() - 0.5) * 0.25;
    if (o.lon > 180) o.lon -= 360; if (o.lon < -180) o.lon += 360;
    o.lat = Math.max(-85, Math.min(85, o.lat));
  }

  function step() {
    t += 0.016;
    advect(p, 1.0);
    var dlon = p.lon - SRC.lon; if (dlon > 180) dlon -= 360; if (dlon < -180) dlon += 360;
    var dlat = p.lat - SRC.lat;
    if (dlon * dlon + dlat * dlat < 64) p.c = Math.min(1, p.c + 0.05);
    p.c *= 0.998;
    trail.push([p.lon, p.lat]);
    if (trail.length > MAXTRAIL) trail.shift();
    hist.push(p.c);
    if (hist.length > MAXHIST) hist.shift();
    extras.forEach(function (e) { advect(e, 1.0); });
  }

  function drawLand() {
    ctx.fillStyle = '#141a20';
    ctx.strokeStyle = '#3a434d';
    ctx.lineWidth = 1;
    LAND.forEach(function (poly) {
      ctx.beginPath();
      poly.forEach(function (q, i) {
        if (i === 0) ctx.moveTo(px(q[0]), py(q[1])); else ctx.lineTo(px(q[0]), py(q[1]));
      });
      ctx.closePath(); ctx.fill(); ctx.stroke();
    });
  }

  function draw() {
    ctx.fillStyle = '#0a0e13';
    ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = 'rgba(90,100,110,0.25)';
    ctx.lineWidth = 0.5;
    for (var lon = -150; lon <= 150; lon += 30) {
      ctx.beginPath(); ctx.moveTo(px(lon), 0); ctx.lineTo(px(lon), H); ctx.stroke();
    }
    for (var lat = -60; lat <= 60; lat += 30) {
      ctx.beginPath(); ctx.moveTo(0, py(lat)); ctx.lineTo(W, py(lat)); ctx.stroke();
    }
    drawLand();

    // source marker
    ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1.4;
    ctx.beginPath(); ctx.arc(px(SRC.lon), py(SRC.lat), 6, 0, Math.PI * 2); ctx.stroke();

    // background parcels (Eulerian-ish contrast)
    if (showAll) {
      ctx.fillStyle = 'rgba(140,150,160,0.4)';
      extras.forEach(function (e) { ctx.fillRect(px(e.lon) - 1, py(e.lat) - 1, 2, 2); });
    }

    // trajectory trail (oldest faint -> newest bright)
    var n = trail.length;
    for (var i = 1; i < n; i++) {
      var a = i / n;
      if (Math.abs(trail[i][0] - trail[i - 1][0]) > 180) continue; // dateline wrap
      ctx.strokeStyle = 'rgba(88,166,255,' + (0.04 + 0.6 * a).toFixed(2) + ')';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(px(trail[i - 1][0]), py(trail[i - 1][1]));
      ctx.lineTo(px(trail[i][0]), py(trail[i][1]));
      ctx.stroke();
    }

    // the parcel
    ctx.fillStyle = '#3fb950';
    ctx.beginPath(); ctx.arc(px(p.lon), py(p.lat), 5, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#0a0e13'; ctx.stroke();

    // readout box
    ctx.fillStyle = 'rgba(22,27,34,0.9)';
    ctx.fillRect(10, H - 108, 250, 96);
    ctx.strokeStyle = '#2d333b'; ctx.strokeRect(10, H - 108, 250, 96);
    ctx.fillStyle = '#9da7b3';
    ctx.font = '11px ui-monospace, Menlo, monospace';
    ctx.textAlign = 'left';
    ctx.fillText('parcel 1 of 50,048', 20, H - 88);
    ctx.fillText('lon  ' + p.lon.toFixed(1).padStart(6) + '°', 20, H - 72);
    ctx.fillText('lat  ' + p.lat.toFixed(1).padStart(6) + '°', 20, H - 56);
    ctx.fillText('tracer  ' + p.c.toFixed(3), 20, H - 40);

    // tracer history sparkline
    var hx = 20, hy = H - 34, hw = 230, hh = 18;
    ctx.strokeStyle = '#2d333b'; ctx.strokeRect(hx, hy, hw, hh);
    if (hist.length > 1) {
      ctx.strokeStyle = '#3fb950'; ctx.lineWidth = 1.2;
      ctx.beginPath();
      for (var j = 0; j < hist.length; j++) {
        var x = hx + j / MAXHIST * hw;
        var y = hy + hh - hist[j] * hh;
        if (j === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
  }

  function frame() { if (running) step(); draw(); requestAnimationFrame(frame); }

  document.getElementById('t-play').addEventListener('click', function () {
    running = !running; this.textContent = running ? 'Pause' : 'Play';
  });
  document.getElementById('t-reset').addEventListener('click', reset);
  document.getElementById('t-all').addEventListener('click', function () {
    showAll = !showAll; this.classList.toggle('on', showAll);
  });

  reset();
  frame();
})();
