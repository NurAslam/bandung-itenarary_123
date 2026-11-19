(function () {
  'use strict';
  var KEY = 'bandung-pilihan-minggu';
  var D, curDay = 'jum', mapObj = null, mapReady = false, layer = null, mapFilter = 'sab';
  var $ = function (id) { return document.getElementById(id); };
  var enc = encodeURIComponent;

  function el(tag, cls, txt) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (txt != null) e.textContent = txt;
    return e;
  }
  function link(cls, txt, href) {
    var a = el('a', cls, txt);
    a.href = href; a.target = '_blank'; a.rel = 'noopener noreferrer';
    return a;
  }
  function routeUrl(q) { return 'https://www.google.com/maps/dir/?api=1&destination=' + enc(q) + '&travelmode=driving'; }
  function mapsUrl(p) { return 'https://www.google.com/maps/search/?api=1&query=' + enc(p.name + ' ' + p.area); }
  function waUrl(p) { return 'https://wa.me/?text=' + enc('Aku pilih ' + p.name + ' buat Minggu ya! 🌸'); }
  function getSel() { try { return localStorage.getItem(KEY) || ''; } catch (e) { return ''; } }
  function setSel(v) { try { localStorage.setItem(KEY, v); } catch (e) {} }

  var ICONS = {
    flower: '<circle cx="12" cy="12" r="2.4"/><path d="M12 9.6c-1.6-3 0-5.6 0-5.6s1.6 2.6 0 5.6zM14.4 12c3-1.6 5.6 0 5.6 0s-2.6 1.6-5.6 0zM12 14.4c1.6 3 0 5.6 0 5.6s-1.6-2.6 0-5.6zM9.6 12c-3 1.6-5.6 0-5.6 0s2.6-1.6 5.6 0z"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 3v2.5M12 18.5V21M3 12h2.5M18.5 12H21M5.6 5.6l1.8 1.8M16.6 16.6l1.8 1.8M18.4 5.6l-1.8 1.8M7.4 16.6l-1.8 1.8"/>',
    pine: '<path d="M12 3l5 7h-3l4 6H6l4-6H7z"/><path d="M12 16v5"/>',
    cup: '<path d="M5 9h11v5a4 4 0 0 1-4 4H9a4 4 0 0 1-4-4z"/><path d="M16 10h1.5a2.5 2.5 0 0 1 0 5H16M8 4v2M12 4v2"/>',
    berry: '<path d="M12 8c-4-1-7 1-6 5 1 4 4 7 6 7s5-3 6-7c1-4-2-6-6-5z"/><path d="M12 8c0-2 1-3 3-3M9.5 12h.01M14.5 12h.01M12 15h.01"/>',
    mount: '<path d="M3 19l6-10 4 6 2-3 6 7z"/>',
    city: '<path d="M5 20V9l5-3v14M10 20V4l9 4v12M3 20h18M13 10h3M13 14h3"/>'
  };
  var PICON = { hanami: 'flower', pvj: 'sun', unos: 'cup', sinie: 'flower', gias: 'cup', bukit: 'berry', golden: 'pine', bruriram: 'flower', strobilus: 'pine', tepi: 'mount' };
  function icon(name) {
    var s = el('span', 'ico');
    s.innerHTML = '<svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (ICONS[name] || ICONS.city) + '</svg>';
    return s;
  }

  /* ---------- Rencana ---------- */
  function renderChips() {
    var box = $('dayChips'); box.textContent = '';
    D.days.forEach(function (d) {
      var b = el('button', 'chip' + (d.id === curDay ? ' on' : ''), d.label);
      b.type = 'button'; b.setAttribute('aria-pressed', d.id === curDay);
      b.title = d.full;
      b.onclick = function () { curDay = d.id; renderChips(); renderTimeline(); };
      box.appendChild(b);
    });
  }
  function renderTimeline() {
    var ol = $('timeline'); ol.textContent = '';
    var day = D.days.filter(function (d) { return d.id === curDay; })[0];
    var h = el('li', 'dayh'); h.style.cssText = 'color:#5d6468;font-size:13px;padding:0 6px'; h.textContent = day.full; ol.appendChild(h);
    day.items.forEach(function (it) {
      var li = el('li', 'item');
      li.appendChild(el('div', 'time' + (it.time.length > 7 ? ' long' : ''), it.time));
      var r = el('div');
      r.appendChild(el('h4', '', it.title));
      if (it.place) r.appendChild(el('div', 'place', it.place));
      if (it.note) r.appendChild(el('div', 'inote', it.note));
      if (it.route) r.appendChild(link('btn', 'Rute', routeUrl(it.route)));
      li.appendChild(r);
      ol.appendChild(li);
    });
  }
  function renderPick() {
    $('pickNote').textContent = D.pickNote;
    var box = $('pickGroups'); box.textContent = '';
    var sel = getSel();
    D.groups.forEach(function (g) {
      box.appendChild(el('h3', '', g.title));
      g.places.forEach(function (id) {
        var p = D.places[id];
        var c = el('div', 'card' + (sel === id ? ' sel' : ''));
        var top = el('div', 'ctop'); top.appendChild(icon(PICON[id]));
        var t = el('div');
        var h = el('h4', '', p.name);
        h.appendChild(el('span', 'tag', p.dist));
        t.appendChild(h); t.appendChild(el('div', 'area', p.area));
        top.appendChild(t); c.appendChild(top);
        c.appendChild(el('p', 'desc', p.desc));
        var row = el('div', 'row');
        row.appendChild(link('btn ghost', 'Maps', mapsUrl(p)));
        var pb = link('btn pink', sel === id ? 'Pilihanmu ✓ (ganti/kirim lagi)' : 'Aku pilih ini 💌', waUrl(p));
        pb.addEventListener('click', function () { setSel(id); setTimeout(renderPick, 0); if (mapReady) drawMap(); });
        row.appendChild(pb);
        c.appendChild(row);
        box.appendChild(c);
      });
    });
    var bar = $('chosenBar');
    if (sel && D.places[sel]) { bar.hidden = false; bar.textContent = '🌸 Pilihan Minggu: ' + D.places[sel].name + ' — ketuk “Aku pilih ini” di kartu lain untuk mengganti.'; }
    else bar.hidden = true;
  }

  /* ---------- Tabs ---------- */
  function showTab(name) {
    ['rencana', 'peta'].forEach(function (n) {
      $('tab-' + n).hidden = n !== name;
      var b = $('btn-' + n); b.classList.toggle('active', n === name); b.setAttribute('aria-selected', n === name);
    });
    window.scrollTo(0, 0);
    if (name === 'peta') openMap();
  }

  /* ---------- Peta ---------- */
  var loading = false;
  function openMap() {
    if (mapReady) { setTimeout(function () { mapObj.invalidateSize(); }, 50); return; }
    if (loading) return; loading = true;
    var s = document.createElement('script');
    s.src = 'vendor/leaflet/leaflet.js';
    s.onload = initMap;
    s.onerror = function () { loading = false; $('mapNote').textContent = 'Peta gagal dimuat.'; };
    document.head.appendChild(s);
  }
  function initMap() {
    var L = window.L;
    mapObj = L.map('map', { zoomControl: true, attributionControl: true }).setView([-6.88, 107.62], 11);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19, attribution: '© OpenStreetMap contributors'
    }).addTo(mapObj);
    layer = L.layerGroup().addTo(mapObj);
    mapReady = true; loading = false;
    renderMapChips(); drawMap();
    setTimeout(function () { mapObj.invalidateSize(); }, 50);
  }
  function renderMapChips() {
    var box = $('mapChips'); box.textContent = '';
    [['jum', 'Jum'], ['sab', 'Sab'], ['min', 'Min'], ['pilihan', 'Pilihan']].forEach(function (f) {
      var b = el('button', 'chip' + (f[0] === 'pilihan' ? ' pinkchip' : '') + (mapFilter === f[0] ? ' on' : ''), f[1]);
      b.type = 'button';
      b.onclick = function () { mapFilter = f[0]; renderMapChips(); drawMap(); };
      box.appendChild(b);
    });
  }
  function popup(p) {
    var d = el('div', 'pp');
    d.appendChild(el('b', '', p.name));
    var day = D.days.filter(function (x) { return x.id === p.day; })[0];
    d.appendChild(el('small', '', day ? day.full : ''));
    d.appendChild(link('btn', 'Rute', routeUrl(p.name + ' ' + p.area)));
    return d;
  }
  function drawMap() {
    var L = window.L, sel = getSel(), pts = [], ids = [];
    layer.clearLayers();
    Object.keys(D.places).forEach(function (id) {
      var p = D.places[id];
      if (p.lat == null) return;
      var show = mapFilter === 'pilihan' ? id === sel : p.day === mapFilter;
      if (show) ids.push(id);
    });
    if (mapFilter === 'sab') {
      var line = D.sabRoute.map(function (id) { var p = D.places[id]; return [p.lat, p.lng]; });
      L.polyline(line, { color: '#252B2C', weight: 2.5, dashArray: '6 8', opacity: .8 }).addTo(layer);
    }
    ids.forEach(function (id) {
      var p = D.places[id], isSel = id === sel;
      var size = isSel ? 22 : 16;
      var ic = L.divIcon({ className: '', html: '<div class="pin' + (p.pick ? ' pk' : '') + (isSel ? ' hi' : '') + '" style="width:' + size + 'px;height:' + size + 'px"></div>', iconSize: [size, size], iconAnchor: [size / 2, size / 2] });
      L.marker([p.lat, p.lng], { icon: ic, title: p.name, keyboard: true }).bindPopup(popup(p), { closeButton: true }).addTo(layer);
      pts.push([p.lat, p.lng]);
    });
    var note = '';
    if (mapFilter === 'pilihan' && !sel) note = 'Belum ada pilihan Minggu. Pilih dulu di tab Rencana 🌸';
    else if (mapFilter === 'pilihan' && sel && D.places[sel].lat == null) note = D.places[sel].name + ' belum punya pin (koordinat belum ketemu). Pakai tombol Maps di kartunya.';
    else if (mapFilter === 'min') note = 'Pin pink = pilihan Minggu. ' + missing() ;
    $('mapNote').textContent = note;
    if (pts.length > 1) mapObj.fitBounds(pts, { padding: [40, 40], maxZoom: 15 });
    else if (pts.length === 1) mapObj.setView(pts[0], 14);
  }
  function missing() {
    var m = Object.keys(D.places).filter(function (k) { return D.places[k].lat == null; }).map(function (k) { return D.places[k].name; });
    return m.length ? 'Belum ada pin: ' + m.join(', ') + '.' : '';
  }

  /* ---------- init ---------- */
  function init() {
    $('title').textContent = D.title;
    $('greeting').textContent = D.greeting;
    renderChips(); renderTimeline(); renderPick();
    document.querySelectorAll('.tabbtn').forEach(function (b) { b.onclick = function () { showTab(b.dataset.tab); }; });
  }
  fetch('data/itinerary.json').then(function (r) { return r.json(); }).then(function (j) { D = j; init(); })
    .catch(function () { document.querySelector('main').insertAdjacentHTML('afterbegin', '<p>Data belum bisa dimuat. Coba muat ulang.</p>'); });
})();
