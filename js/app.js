(function () {
  'use strict';
  var KEY = 'bandung-pilihan-minggu';
  var D, curDay = 'jum', mapObj = null, mapReady = false, layer = null, mapFilter = 'semua';
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
  function mapsUrl(p) { if (p.maps) return p.maps; return 'https://www.google.com/maps/search/?api=1&query=' + enc(p.name + ' ' + p.area); }
  function getSel() {
    var v = '';
    try { v = localStorage.getItem(KEY) || ''; } catch (e) {}
    return (D && D.places[v] && D.places[v].pick) ? v : '';
  }
  function setSel(v) { try { if (v) localStorage.setItem(KEY, v); else localStorage.removeItem(KEY); } catch (e) {} }
  function choose(id) {
    setSel(id); renderTimeline(); renderPick();
    if (mapReady) { drawMap(); }
  }

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

  /* ---------- Galeri ---------- */
  function gallery(p) {
    var n = p.photos.length, wrap = el('div', 'gal');
    var track = el('div', 'gtrack');
    p.photos.forEach(function (src, i) {
      var b = el('button', 'gslide'); b.type = 'button';
      b.setAttribute('aria-label', p.name + ' \u2014 foto ' + (i + 1) + ' (buka besar)');
      var im = el('img'); im.src = src; im.alt = p.name + ' \u2014 foto ' + (i + 1); im.decoding = 'async'; im.draggable = false;
      if (i > 0) im.loading = 'lazy';
      b.appendChild(im);
      b.onclick = function () { openLightbox(p, i, b); };
      track.appendChild(b);
    });
    wrap.appendChild(track);
    if (n > 1) {
      var dots = el('div', 'gdots'); dots.setAttribute('aria-hidden', 'true');
      for (var i = 0; i < n; i++) dots.appendChild(el('i', i === 0 ? 'on' : ''));
      wrap.appendChild(dots);
      var raf = 0;
      track.addEventListener('scroll', function () {
        if (raf) return;
        raf = requestAnimationFrame(function () {
          raf = 0;
          var k = Math.round(track.scrollLeft / track.clientWidth);
          for (var j = 0; j < dots.children.length; j++) dots.children[j].classList.toggle('on', j === k);
        });
      }, { passive: true });
    }
    return wrap;
  }
  var lb = null;
  function openLightbox(p, idx, opener) {
    if (lb) return;
    var ov = el('div', 'lb'); ov.setAttribute('role', 'dialog'); ov.setAttribute('aria-modal', 'true'); ov.setAttribute('aria-label', p.name + ' \u2014 foto');
    var track = el('div', 'lbtrack');
    p.photos.forEach(function (src, i) {
      var s = el('div', 'lbslide');
      var im = el('img'); im.src = src; im.alt = p.name + ' \u2014 foto ' + (i + 1); im.draggable = false;
      s.appendChild(im); track.appendChild(s);
    });
    var close = el('button', 'lbclose', '\u2715'); close.type = 'button'; close.setAttribute('aria-label', 'Tutup');
    var cnt = el('div', 'lbcount', (idx + 1) + ' / ' + p.photos.length); if (p.photos.length < 2) cnt.hidden = true;
    ov.appendChild(track); ov.appendChild(close); ov.appendChild(cnt);
    document.body.appendChild(ov);
    document.body.classList.add('noscroll');
    track.scrollLeft = idx * track.clientWidth;
    track.addEventListener('scroll', function () { cnt.textContent = (Math.round(track.scrollLeft / track.clientWidth) + 1) + ' / ' + p.photos.length; }, { passive: true });
    function shut() {
      document.removeEventListener('keydown', key, true);
      ov.remove(); document.body.classList.remove('noscroll'); lb = null;
      if (opener && opener.isConnected) { opener.focus(); }
    }
    function key(e) {
      if (e.key === 'Escape') { e.preventDefault(); shut(); }
      else if (e.key === 'Tab') { e.preventDefault(); close.focus(); }
      else if (e.key === 'ArrowRight') track.scrollBy({ left: track.clientWidth, behavior: 'smooth' });
      else if (e.key === 'ArrowLeft') track.scrollBy({ left: -track.clientWidth, behavior: 'smooth' });
    }
    document.addEventListener('keydown', key, true);
    close.onclick = shut;
    ov.addEventListener('click', function (e) { if (e.target === ov || e.target.classList.contains('lbslide')) shut(); });
    var y0 = null, x0 = 0;
    ov.addEventListener('touchstart', function (e) { y0 = e.touches[0].clientY; x0 = e.touches[0].clientX; }, { passive: true });
    ov.addEventListener('touchend', function (e) {
      if (y0 == null) return;
      var dy = e.changedTouches[0].clientY - y0, dx = e.changedTouches[0].clientX - x0; y0 = null;
      if (dy > 90 && Math.abs(dy) > Math.abs(dx) * 1.5) shut();
    }, { passive: true });
    lb = ov; close.focus();
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
    var sel = getSel(), sp = sel ? D.places[sel] : null;
    day.items.forEach(function (it) {
      var li = el('li', 'item');
      var title = it.title, place = it.place, note = it.note, route = it.route;
      if (it.pickSlot && sp) {
        title = 'Jalan-jalan pilihan Wulan: ' + sp.name; place = sp.area; note = '';
        route = sp.name + ' ' + sp.area;
      }
      var rhref = (it.pickSlot && sp && sp.maps) ? sp.maps : (route ? routeUrl(route) : '');
      li.appendChild(el('div', 'time' + (it.time.length > 7 ? ' long' : ''), it.time));
      var r = el('div');
      r.appendChild(el('h4', '', title));
      if (place) r.appendChild(el('div', 'place', place));
      if (note) r.appendChild(el('div', 'inote', note));
      if (route) r.appendChild(link('btn', 'Rute', rhref));
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
        var ph = el('div', 'photo' + (p.photos && p.photos.length ? '' : ' nophoto'));
        if (p.photos && p.photos.length) { ph.appendChild(gallery(p)); }
        else { ph.appendChild(icon(PICON[id])); }
        if (sel === id) ph.appendChild(el('span', 'badge', '✓ Pilihan Wulan'));
        c.appendChild(ph);
        var cb = el('div', 'cbody'); c.appendChild(cb);
        var top = el('div', 'ctop');
        var t = el('div');
        var h = el('h4', '', p.name);
        h.appendChild(el('span', 'tag', p.dist));
        t.appendChild(h); t.appendChild(el('div', 'area', p.area));
        top.appendChild(t); cb.appendChild(top);
        cb.appendChild(el('p', 'desc', p.desc));
        var row = el('div', 'row');
        row.appendChild(link('btn ghost', 'Maps', mapsUrl(p)));
        var pb;
        if (sel === id) {
          pb = el('button', 'btn ghost', 'Batal pilih'); pb.type = 'button';
          pb.onclick = function () { choose(''); };
        } else {
          pb = el('button', 'btn pink', 'Aku pilih ini'); pb.type = 'button';
          pb.onclick = function () { choose(id); };
        }
        row.appendChild(pb);
        cb.appendChild(row);
        box.appendChild(c);
      });
    });
    var bar = $('chosenBar'); bar.textContent = '';
    bar.hidden = false;
    if (sel) {
      bar.className = 'chosen on';
      bar.appendChild(el('span', 'ctext', 'Minggu ini kita ke: ' + D.places[sel].name));
      var cb2 = el('button', 'btn ghost sm', 'Batal'); cb2.type = 'button';
      cb2.onclick = function () { choose(''); };
      bar.appendChild(cb2);
    } else {
      bar.className = 'chosen';
      bar.appendChild(el('span', 'ctext', 'Belum ada pilihan. Pilih satu tempat di bawah ya'));
    }
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
    [['semua', 'Semua'], ['jum', 'Jum'], ['sab', 'Sab'], ['min', 'Min'], ['pilihan', 'Pilihan']].forEach(function (f) {
      var b = el('button', 'chip' + (f[0] === 'pilihan' ? ' pinkchip' : '') + (mapFilter === f[0] ? ' on' : ''), f[1]);
      b.type = 'button'; b.setAttribute('aria-pressed', mapFilter === f[0]);
      b.onclick = function () { mapFilter = f[0]; renderMapChips(); drawMap(); };
      box.appendChild(b);
    });
  }
  function popup(p) {
    var d = el('div', 'pp');
    if (p.photos && p.photos.length) { var im = el('img', 'ppimg'); im.src = p.photos[0]; im.alt = p.name; im.loading = 'lazy'; d.appendChild(im); }
    d.appendChild(el('b', '', (p.emoji ? p.emoji + ' ' : '') + p.name));
    var day = D.days.filter(function (x) { return x.id === p.day; })[0];
    d.appendChild(el('small', '', p.dayLabel || (day ? day.full : '')));
    d.appendChild(link('btn', 'Rute', p.maps || routeUrl(p.name + ' ' + p.area)));
    return d;
  }
  function drawMap() {
    var L = window.L, sel = getSel(), pts = [], ids = [];
    layer.clearLayers();
    Object.keys(D.places).forEach(function (id) {
      var p = D.places[id];
      if (p.lat == null) return;
      var show = (mapFilter === 'semua' || p.always) ? true : mapFilter === 'pilihan' ? id === sel : p.day === mapFilter;
      if (show) ids.push(id);
    });
    var RC = { jum: '#3B82C4', sab: '#3FA66B', min: '#E8607E' };
    Object.keys(D.routes || {}).forEach(function (dy) {
      if (!(mapFilter === 'semua' || mapFilter === dy || (dy === 'min' && mapFilter === 'pilihan'))) return;
      var line = [];
      D.routes[dy].forEach(function (id) {
        if (id === '$pick') id = sel;
        var p = id && D.places[id];
        if (p && p.lat != null) { var q = line[line.length - 1]; if (!q || q[0] !== p.lat || q[1] !== p.lng) line.push([p.lat, p.lng]); }
      });
      if (line.length > 1) L.polyline(line, { color: RC[dy], weight: 3, dashArray: '6 8', opacity: .85 }).addTo(layer);
    });
    ids.forEach(function (id) {
      var p = D.places[id], isSel = id === sel;
      var size = isSel ? 44 : 32;
      var html = '<div class="pin d-' + p.day + (isSel ? ' hi' : '') + '" style="width:' + size + 'px;height:' + size + 'px;font-size:' + (isSel ? 22 : 16) + 'px"><span>' + (p.emoji || '📍') + '</span>' + (isSel ? '<i class="ck">✓</i>' : '') + '</div>';
      var ic = L.divIcon({ className: 'pinwrap', html: html, iconSize: [size, size], iconAnchor: [size / 2, size / 2], popupAnchor: [0, -size / 2] });
      L.marker([p.lat, p.lng], { icon: ic, title: p.name, keyboard: true, zIndexOffset: isSel ? 1000 : 0 }).bindPopup(popup(p), { closeButton: true }).addTo(layer);
      pts.push([p.lat, p.lng]);
    });
    var note = '';
    if (mapFilter === 'pilihan' && !sel) note = 'Belum ada pilihan Minggu. Pilih dulu di tab Rencana';
    else if (sel && D.places[sel].lat == null && (mapFilter === 'pilihan' || mapFilter === 'min' || mapFilter === 'semua')) note = D.places[sel].name + ' belum punya pin (koordinat belum ketemu). Pakai tombol Maps di kartunya.';
    else if (mapFilter === 'min' || mapFilter === 'semua') note = missing();
    $('mapNote').textContent = note;
    if (pts.length > 1) mapObj.fitBounds(pts, { padding: [40, 40], maxZoom: 15 });
    else if (pts.length === 1) mapObj.setView(pts[0], 14);
  }
  function missing() {
    var m = Object.keys(D.places).filter(function (k) { return D.places[k].lat == null && !D.places[k].always; }).map(function (k) { return D.places[k].name; });
    return m.length ? 'Belum ada pin: ' + m.join(', ') + '.' : '';
  }

  /* ---------- init ---------- */
  function init() {
    $('title').textContent = D.title;
    $('greeting').textContent = D.greeting;
    renderChips(); renderTimeline(); renderPick();
    document.querySelectorAll('.tabbtn').forEach(function (b) { b.onclick = function () { showTab(b.dataset.tab); }; });
  }
  fetch('data/itinerary.json?v=1910').then(function (r) { return r.json(); }).then(function (j) { D = j; init(); })
    .catch(function () { document.querySelector('main').insertAdjacentHTML('afterbegin', '<p>Data belum bisa dimuat. Coba muat ulang.</p>'); });
})();
