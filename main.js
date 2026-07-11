/* ============================================================
   Michalis Katapodis — web logika (vanilla JS, bez závislostí)
   ============================================================ */
(function () {
  'use strict';

  /* ---------- Rok v patičce ---------- */
  var yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------- Mobilní menu ---------- */
  var toggle = document.querySelector('.nav__toggle');
  var links = document.querySelector('.nav__links');
  if (toggle && links) {
    toggle.addEventListener('click', function () {
      var open = links.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', String(open));
    });
    links.addEventListener('click', function (e) {
      if (e.target.tagName === 'A') {
        links.classList.remove('is-open');
        toggle.setAttribute('aria-expanded', 'false');
      }
    });
  }

  /* ---------- E-mail (jednoduchá ochrana proti scraperům) ---------- */
  var mailUser = 'michalis.katapodis';
  var mailHost = '3it.cz';
  var mail = mailUser + '@' + mailHost;
  document.querySelectorAll('[data-email]').forEach(function (el) {
    el.setAttribute('href', 'mailto:' + mail);
  });

  /* ---------- Média: články (chronologicky, seskupené po letech) ---------- */
  var articles = [
    { d: '2025-03-11', t: 'Kam kráčí česká e-commerce podle Petry Dolejšové', s: '3IT.cz', u: 'https://www.3it.cz/kam-kraci-ceska-e-commerce-podle-petry-dolejsove' },
    { d: '2025-02-12', t: 'Co přinesl 3IT rok 2024', s: '3IT.cz', u: 'https://www.3it.cz/co-prinesl-3it-rok-2024' },
    { d: '2024-11-12', t: 'Kam kráčí česká e-commerce podle Honzy Kvasničky', s: '3IT.cz', u: 'https://www.3it.cz/kam-kraci-ceska-e-commerce-podle-honzy-kvasnicky' },
    { d: '2024-09-30', t: 'Kam kráčí česká e-commerce podle Jirky Kratochvíla', s: '3IT.cz', u: 'https://www.3it.cz/kam-kraci-ceska-e-commerce-podle-jirky-kratochvila' },
    { d: '2024-07-12', t: 'Kam kráčí česká e-commerce podle Marka Kršky', s: '3IT.cz', u: 'https://www.3it.cz/kam-kraci-ceska-e-commerce-podle-marka-krsky' },
    { d: '2022-10-20', t: 'Hrdinové podnikání', s: '3IT.cz', u: 'https://www.3it.cz/hrdinove-podnikani' },
    { d: '2022-06-24', t: 'Refaktor: jak a proč s ním pracujeme?', s: '3IT.cz', u: 'https://www.3it.cz/refaktor-jak-a-proc-s-nim-pracujeme' },
    { d: '2021-09-30', t: 'Propojení e-shopu s ERP systémy Solitea Money', s: '3IT.cz', u: 'https://www.3it.cz/propojeni-e-shopu-s-erp-systemy-solitea-money/' },
    { d: '2020-10-09', t: 'E-commerce nůžky se otevřely', s: 'MladýPodnikatel', u: 'https://mladypodnikatel.cz/e-commerce-nuzky-se-otevrely-t39700' },
    { d: '2019-12-09', t: 'Našli jsme svatý grál pro naše vývojáře i klienty', s: '3IT.cz', u: 'https://www.3it.cz/nasli-jsme-svaty-gral-pro-nase-vyvojare-i-klienty/' },
    { d: '2019-07-02', t: 'Automatizované sklady v dnešní eCommerce', s: '3IT.cz', u: 'https://www.3it.cz/automatizovane-sklady-v-dnesni-ecommerce/' },
    { d: '2014-09-15', t: 'Vyplatí se dnes ještě zakládat e-shop?', s: 'MladýPodnikatel', u: 'https://mladypodnikatel.cz/vyplati-se-zakladat-e-shop-t14118' },
    // bez ověřeného data (v originále chybné 10. 10. 2000) — datum skryto
    { d: null, t: 'Businessman a řemeslník: dva přístupy v podnikání', s: 'MladýPodnikatel', u: 'https://mladypodnikatel.cz/businessman-remeslnik-pristupy-podnikani-t31802' },
    { d: null, t: 'Nikdy nedovolte, abyste byli z velké části závislí na jednom klientovi', s: 'MladýPodnikatel', u: 'https://mladypodnikatel.cz/michalis-katapodis-nikdy-nedovolte-abyste-byli-z-velke-casti-zavisli-na-jednom-klientovi-t11459' },
    { d: null, t: 'Jaké jsou nejdůležitější vlastnosti online podnikatelů?', s: 'MladýPodnikatel', u: 'https://mladypodnikatel.cz/vlastnosti-online-podnikatelu-t29040' },
    { d: null, t: '7 důvodů, proč se nejčastěji zpožďují e-commerce projekty', s: '3IT.cz', u: 'https://www.3it.cz/7-duvodu-proc-se-nejcasteji-zpozduji-e-commerce-projekty/' },
    { d: null, t: 'Sdílení zkušeností a opatření našich klientů s COVID-19', s: '3IT.cz', u: 'https://www.3it.cz/sdileni-zkusenosti-a-opatreni-nasich-klientu-covid-19/' },
    { d: null, t: 'Od Belbina ke Gallupu: jak jsme objevili superschopnosti našeho týmu', s: '3IT.cz', u: 'https://www.3it.cz/od-belbina-ke-gallupu-jak-jsme-objevili-superschopnosti-naseho-tymu' }
  ];

  function czDate(iso) {
    var p = iso.split('-');
    return parseInt(p[2], 10) + '. ' + parseInt(p[1], 10) + '. ' + p[0];
  }

  function articleNode(a) {
    var li = document.createElement('li');
    li.className = 'tl-item';
    var srcClass = a.s === '3IT.cz' ? ' tl-item__src--3it' : '';
    var meta = '<span class="tl-item__src' + srcClass + '">' + a.s + '</span>';
    if (a.d) meta = '<span>' + czDate(a.d) + '</span>' + meta;
    li.innerHTML =
      '<div class="tl-item__body">' +
        '<a class="tl-item__title" href="' + a.u + '" target="_blank" rel="noopener">' + a.t + '</a>' +
        '<div class="tl-item__meta">' + meta + '</div>' +
      '</div>' +
      '<span class="tl-item__arrow" aria-hidden="true">→</span>';
    return li;
  }

  var timeline = document.getElementById('timeline');
  if (timeline) {
    var dated = articles.filter(function (a) { return a.d; })
      .sort(function (x, y) { return y.d < x.d ? -1 : 1; });
    var undated = articles.filter(function (a) { return !a.d; });

    var currentYear = null;
    dated.forEach(function (a) {
      var y = a.d.slice(0, 4);
      if (y !== currentYear) {
        currentYear = y;
        var h = document.createElement('li');
        h.className = 'timeline__year';
        h.textContent = y;
        timeline.appendChild(h);
      }
      timeline.appendChild(articleNode(a));
    });
    if (undated.length) {
      var h2 = document.createElement('li');
      h2.className = 'timeline__year';
      h2.textContent = 'Starší články';
      timeline.appendChild(h2);
      undated.forEach(function (a) { timeline.appendChild(articleNode(a)); });
    }
  }

  /* ---------- Lazy YouTube embed ---------- */
  document.querySelectorAll('.video').forEach(function (box) {
    var id = box.getAttribute('data-yt');
    var poster = box.getAttribute('data-poster');
    if (poster) {
      var probe = new Image();
      probe.onload = function () { box.style.backgroundImage = "url('" + poster + "')"; };
      probe.src = poster;
    }
    var btn = box.querySelector('.video__play');
    if (!btn || !id) return;
    btn.addEventListener('click', function () {
      var iframe = document.createElement('iframe');
      iframe.src = 'https://www.youtube-nocookie.com/embed/' + id + '?autoplay=1&rel=0';
      iframe.title = box.querySelector('.video__title').textContent;
      iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
      iframe.allowFullscreen = true;
      box.innerHTML = '';
      box.appendChild(iframe);
    });
  });

  /* ---------- Galerie z cest: automaticky načte images/travel/1.jpg, 2.jpg, … ---------- */
  var track = document.getElementById('galleryTrack');
  var gallery = document.getElementById('gallery');
  var galleryEmpty = document.getElementById('galleryEmpty');
  if (track) {
    var MAX = 30;
    var pending = MAX;
    var found = 0;
    for (var i = 1; i <= MAX; i++) {
      (function (n) {
        var img = new Image();
        img.onload = function () {
          img.className = 'g-loaded';
          img.dataset.n = n;
          track.appendChild(img);
          found++;
          done();
        };
        img.onerror = done;
        img.alt = 'Michalis Katapodis — cestování ' + n;
        img.loading = 'lazy';
        img.src = 'images/travel/' + n + '.jpg';
      })(i);
    }
    function done() {
      if (--pending > 0) return;
      // seřadit podle čísla (onload může doběhnout v jiném pořadí)
      Array.prototype.slice.call(track.children)
        .sort(function (a, b) { return (+a.dataset.n) - (+b.dataset.n); })
        .forEach(function (n) { track.appendChild(n); });
      if (found > 0) {
        gallery.hidden = false;
        if (galleryEmpty) galleryEmpty.hidden = true;
        setupGalleryNav();
      }
    }
    function setupGalleryNav() {
      var prev = gallery.querySelector('.gallery__nav--prev');
      var next = gallery.querySelector('.gallery__nav--next');
      var step = function () { return Math.max(track.clientWidth * 0.8, 260); };
      if (prev) prev.addEventListener('click', function () { track.scrollBy({ left: -step(), behavior: 'smooth' }); });
      if (next) next.addEventListener('click', function () { track.scrollBy({ left: step(), behavior: 'smooth' }); });
    }
  }
})();
