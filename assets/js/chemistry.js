/* Interactive HOx-NOx-O3-VOC photochemical cycle explorer.
   Pure SVG, no dependencies. Reaction list is a simplified teaching subset of
   the CRI mechanism. Photolysis edges dim in "night" mode. */
(function () {
  var svg = document.getElementById('chem-svg');
  if (!svg) return;

  var nodes = [
    { id: 'O3',   x: 120, y: 300, label: 'O₃' },
    { id: 'O1D',  x: 250, y: 180, label: 'O(¹D)' },
    { id: 'OH',   x: 400, y: 300, label: 'OH' },
    { id: 'HO2',  x: 540, y: 200, label: 'HO₂' },
    { id: 'NO',   x: 700, y: 300, label: 'NO' },
    { id: 'NO2',  x: 700, y: 120, label: 'NO₂' },
    { id: 'CO',   x: 260, y: 430, label: 'CO' },
    { id: 'VOC',  x: 420, y: 470, label: 'VOC / CH₄' },
    { id: 'RO2',  x: 560, y: 400, label: 'RO₂' },
    { id: 'PAN',  x: 830, y: 200, label: 'PAN' },
    { id: 'RONO2',x: 830, y: 400, label: 'RO₂NO₂' },
    { id: 'HNO3', x: 830, y: 50,  label: 'HNO₃' },
    { id: 'H2O2', x: 400, y: 120, label: 'H₂O₂' }
  ];
  var byId = {};
  nodes.forEach(function (n) { byId[n.id] = n; });

  // a -> b, label, photo = photolysis-driven channel, night = night-active
  var edges = [
    { a: 'O3',  b: 'O1D', label: 'O₃ + hν → O(¹D) + O₂', photo: true },
    { a: 'O1D', b: 'OH',  label: 'O(¹D) + H₂O → 2OH' },
    { a: 'OH',  b: 'HO2', label: 'OH + CO → HO₂ + CO₂' },
    { a: 'OH',  b: 'RO2', label: 'OH + VOC/CH₄ → RO₂ + H₂O' },
    { a: 'HO2', b: 'OH',  label: 'HO₂ + NO → OH + NO₂' },
    { a: 'RO2', b: 'HO2', label: 'RO₂ + NO → HO₂ + NO₂ + carbonyl' },
    { a: 'NO2', b: 'O3',  label: 'NO₂ + hν → NO + O(³P) → O₃', photo: true },
    { a: 'NO',  b: 'NO2', label: 'NO + O₃ → NO₂ + O₂', night: true },
    { a: 'HO2', b: 'H2O2',label: 'HO₂ + HO₂ → H₂O₂ + O₂' },
    { a: 'H2O2',b: 'OH',  label: 'H₂O₂ + hν → 2OH', photo: true },
    { a: 'OH',  b: 'HNO3',label: 'OH + NO₂ + M → HNO₃', night: true },
    { a: 'RO2', b: 'PAN', label: 'RCO₃ + NO₂ ⇌ PAN', night: true },
    { a: 'RO2', b: 'RONO2',label: 'RO₂ + NO₂ ⇌ RO₂NO₂ (cold UT)', night: true },
    { a: 'CO',  b: 'OH',  label: 'CO + OH → CO₂ + HO₂' },
    { a: 'VOC', b: 'RO2', label: 'emitted & oxidised by OH' },
    { a: 'NO2', b: 'NO',  label: 'NO₂ + hν → NO + O(³P)', photo: true }
  ];

  var NS = 'http://www.w3.org/2000/svg';
  var night = false;
  var selected = null;

  function el(name, attrs) {
    var e = document.createElementNS(NS, name);
    for (var k in attrs) e.setAttribute(k, attrs[k]);
    return e;
  }

  function edgeKey(e) { return e.a + '>' + e.b; }

  function build() {
    while (svg.firstChild) svg.removeChild(svg.firstChild);

    edges.forEach(function (e, i) {
      var A = byId[e.a], B = byId[e.b];
      var g = el('g', { 'data-edge': i });
      var line = el('line', {
        x1: A.x, y1: A.y, x2: B.x, y2: B.y,
        stroke: e.photo ? '#d29922' : (e.night ? '#8b949e' : '#58a6ff'),
        'stroke-width': 1.4, 'stroke-dasharray': e.photo ? '6 4' : 'none',
        opacity: 0.7
      });
      g.appendChild(line);
      var mx = (A.x + B.x) / 2, my = (A.y + B.y) / 2;
      var lbl = el('text', {
        x: mx, y: my - 5, 'font-size': '10', fill: '#9da7b3',
        'text-anchor': 'middle'
      });
      lbl.textContent = e.label.split(' ')[0] + ' …';
      g.appendChild(lbl);
      svg.appendChild(g);
    });

    nodes.forEach(function (n) {
      var g = el('g', { 'data-node': n.id, cursor: 'pointer' });
      g.appendChild(el('circle', {
        cx: n.x, cy: n.y, r: 26,
        fill: '#161b22', stroke: '#3a434d', 'stroke-width': 1.6
      }));
      var t = el('text', {
        x: n.x, y: n.y + 5, 'text-anchor': 'middle',
        'font-size': '14', fill: '#e6edf3', 'font-weight': '600'
      });
      t.textContent = n.label;
      g.appendChild(t);
      g.addEventListener('click', function () { select(n.id); });
      svg.appendChild(g);
    });
    refresh();
  }

  function refresh() {
    Array.prototype.forEach.call(svg.querySelectorAll('[data-edge]'), function (g) {
      var e = edges[+g.getAttribute('data-edge')];
      var lit = !night || !e.photo;
      var near = !selected || e.a === selected || e.b === selected;
      g.setAttribute('opacity', lit ? (near ? 1 : 0.18) : 0.08);
    });
    Array.prototype.forEach.call(svg.querySelectorAll('[data-node]'), function (g) {
      var id = g.getAttribute('data-node');
      var near = !selected || id === selected ||
        edges.some(function (e) { return (e.a === selected && e.b === id) || (e.b === selected && e.a === id); });
      g.setAttribute('opacity', near ? 1 : 0.25);
      g.querySelector('circle').setAttribute('stroke', id === selected ? '#3fb950' : '#3a434d');
    });
  }

  var ROLE = {
    O3: 'The target product. Built by NO₂ photolysis after peroxy radicals convert NO→NO₂; destroyed by photolysis, reaction with NO (titration) and deposition.',
    O1D: 'Excited oxygen atom from O₃ photolysis (λ < 320 nm). Mostly quenched to O(³P); ~1% reacts with H₂O to make OH — the primary radical source.',
    OH: 'The atmosphere\u2019s detergent. Initiates oxidation of CO, CH₄ and all VOCs; recycled from HO₂/RO₂ via NO. Global mean ~10⁶ molecules cm⁻³.',
    HO2: 'Hydroperoxy radical. Converts NO→NO₂ (ozone production) and self-reacts to H₂O₂. In low-NOx air it terminates via HO₂+HO₂ or HO₂+O₃.',
    NO: 'Fresh NOx from combustion, soils, lightning and aircraft. Titrates O₃ but seeds O₃ production once peroxy radicals are present.',
    NO2: 'Photolyses to NO + O(³P) which immediately makes O₃. Also the gateway to HNO₃ (sink), PAN and RO₂NO₂ reservoirs.',
    CO: 'The dominant OH sink in clean air; a ~2-month integrator of combustion emissions. Oxidation yields HO₂ → O₃ production.',
    VOC: 'CH₄ plus ~120 lumped NMHCs in CRI. Oxidation chains through RO₂ to carbonyls, regenerating HO₂ and fueling O₃ formation.',
    RO2: 'Organic peroxy radicals — the lumped CRI intermediates. Dominated by CH₃O₂ (~83% globally). Convert NO→NO₂; key to POCP.',
    PAN: 'Peroxyacetyl nitrate: thermally unstable acyl NOx reservoir that transports pollution on multi-week scales.',
    RONO2: 'Non-acyl peroxy nitrates (45 species in STOCHEM-CRI): stable only in the cold upper troposphere — a previously overlooked NOx reservoir.',
    HNO3: 'Terminal NOx sink formed from OH+NO₂; removed by dry/wet deposition within days.',
    H2O2: 'Hydrogen peroxide — HOx reservoir and wet-deposited sink; photolysis partially closes the HOx cycle.'
  };

  function select(id) {
    selected = (selected === id) ? null : id;
    var info = document.getElementById('chem-info');
    if (!selected) {
      info.innerHTML = '<em>Click a species to list its key reactions.</em>';
    } else {
      var n = byId[selected];
      var html = '<h3>' + n.label + '</h3><p>' + ROLE[id] + '</p><ul>';
      edges.forEach(function (e) {
        if (e.a === id || e.b === id) {
          html += '<li><code>' + e.label + '</code>' +
            (e.photo ? ' <span style="color:#d29922">(daylight only)</span>' : '') + '</li>';
        }
      });
      info.innerHTML = html + '</ul>';
    }
    refresh();
  }

  document.getElementById('chem-night').addEventListener('click', function () {
    night = !night;
    this.textContent = night ? 'Switch to day' : 'Switch to night';
    this.classList.toggle('on', night);
    refresh();
  });

  build();
  document.getElementById('chem-info').innerHTML =
    '<em>Click a species to list its key reactions.</em>';
})();
